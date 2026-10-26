'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { logout } from '@/store/slices/authSlice';
import {
  setOrderType,
  setTableNumber,
  setCustomerName,
  setOrderNotes,
  addItemToCart,
  decrementItemFromCart,
  removeItemFromCart,
  updateItemNotes,
  clearCart,
  OrderModalType,
} from '@/store/slices/cartSlice';
import { pushReadyAlert, dismissReadyAlert } from '@/store/slices/kdsSlice';
import {
  useGetCategoriesQuery,
  useGetProductsQuery,
  useGetCurrentShiftQuery,
  useCreateOrderMutation,
  useGetOrdersQuery,
  useGetTablesSummaryQuery,
  useUpdateOrderStatusMutation,
} from '@/store/services/api';
import { io } from 'socket.io-client';
import { toast } from 'sonner';
import {
  Search,
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  UtensilsCrossed,
  Wine,
  Send,
  BellRing,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Wifi,
  WifiOff,
  MonitorPlay,
  CreditCard,
  Users,
  LogOut,
  MessageSquarePlus,
  Sparkles,
  ChefHat,
  Smartphone,
  MapPin,
  Package,
} from 'lucide-react';

const QUICK_NOTES_FOOD = [
  'Sin cebolla china',
  'Poco ají',
  'Bien frito',
  'Sin sillao',
  'Parte pecho',
  'Para llevar',
];

const QUICK_NOTES_BEVERAGE = [
  'Helada',
  'Sin helar',
  'Tiempo',
  'Con vasos',
  'Con cañita',
];

export default function ComanderoMobilePage() {
  const router = useRouter();
  const dispatch = useDispatch();

  const { user, tenantId } = useSelector((state: RootState) => state.auth);
  const effectiveTenantId = tenantId || 'chifa-mariana';
  const cart = useSelector((state: RootState) => state.cart);
  const readyAlerts = useSelector((state: RootState) => state.kds.readyAlerts);

  // Estado local UI del Comandero Móvil
  const [activeView, setActiveView] = useState<'MENU' | 'ACTIVE_ORDERS'>('MENU');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | 'ALL' | 'FOOD' | 'BEVERAGE'>('ALL');
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isTablePickerOpen, setIsTablePickerOpen] = useState(false);
  const [editingNoteProductId, setEditingNoteProductId] = useState<string | null>(null);
  const [isConnectedWs, setIsConnectedWs] = useState(false);

  // Queries RTK Query
  const { data: shiftData, isLoading: isShiftLoading } = useGetCurrentShiftQuery(undefined, {
    pollingInterval: 15000,
  });
  const { data: categories, isLoading: isCatLoading } = useGetCategoriesQuery();
  const {
    data: products,
    isLoading: isProdLoading,
    refetch: refetchProducts,
  } = useGetProductsQuery();
  const {
    data: activeOrders,
    isLoading: isOrdersLoading,
    refetch: refetchOrders,
  } = useGetOrdersQuery({ activeOnly: true }, { pollingInterval: 10000 });
  const { data: tablesSummary, refetch: refetchTables } = useGetTablesSummaryQuery(undefined, {
    pollingInterval: 10000,
  });

  const [createOrder, { isLoading: isSubmittingOrder }] = useCreateOrderMutation();
  const [updateOrderStatus] = useUpdateOrderStatusMutation();

  const isShiftOpen = shiftData?.isShiftOpen ?? false;

  // Conexión WebSocket en tiempo real para notificaciones de Cocina y Caja
  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000/kds';
    const s = io(socketUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    s.on('connect', () => {
      setIsConnectedWs(true);
      s.emit('join_waiters', { tenantId: effectiveTenantId });
    });

    s.on('disconnect', () => {
      setIsConnectedWs(false);
    });

    s.on('order:created', () => {
      refetchOrders();
      refetchTables();
      refetchProducts();
    });

    s.on('order:status_updated', (payload: any) => {
      refetchOrders();
      refetchTables();

      if (payload?.status === 'READY') {
        dispatch(
          pushReadyAlert({
            orderId: payload.orderId,
            orderNumber: payload.orderNumber,
            tableNumber: payload.tableNumber || 'Salón',
            status: 'READY',
            stationName: payload.stationName || 'Cocina',
            totalAmount: payload.totalAmount,
            timestamp: new Date().toISOString(),
          }),
        );

        // Chime sonoro + vibración háptica en celular de la mesera
        try {
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([150, 80, 150]);
          }
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
          osc.frequency.setValueAtTime(987.77, audioCtx.currentTime + 0.12); // B5
          gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.45);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.45);
        } catch {
          // Ignorar si navegador móvil restringe audio sin interacción previa
        }

        toast.success(
          `¡Pedido LISTO en ${payload.stationName || 'Cocina'} para ${payload.tableNumber || 'Salón'}!`,
        );
      }
    });

    return () => {
      s.disconnect();
    };
  }, [effectiveTenantId, dispatch, refetchOrders, refetchTables, refetchProducts]);

  // Filtrado instantáneo en memoria (< 16ms)
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    const q = searchQuery.trim().toLowerCase();

    return products.filter((p) => {
      if (!p.isActive) return false;

      if (selectedCategoryId === 'FOOD' && p.isBeverage) return false;
      if (selectedCategoryId === 'BEVERAGE' && !p.isBeverage) return false;
      if (
        typeof selectedCategoryId === 'number' &&
        Number(p.categoryId) !== selectedCategoryId
      ) {
        return false;
      }

      if (!q) return true;
      const matchName = p.name?.toLowerCase().includes(q);
      const matchDesc = p.description?.toLowerCase().includes(q);
      const matchCat = p.category?.name?.toLowerCase().includes(q);
      return matchName || matchDesc || matchCat;
    });
  }, [products, searchQuery, selectedCategoryId]);

  // Totales atómicos del carrito
  const totalCartItems = useMemo(
    () => cart.items.reduce((acc, item) => acc + item.quantity, 0),
    [cart.items],
  );

  const totalCartAmount = useMemo(
    () =>
      Number(
        cart.items
          .reduce((acc, item) => acc + Number(item.price) * item.quantity, 0)
          .toFixed(2),
      ),
    [cart.items],
  );

  // Resumen de estaciones KDS a las que se enrutarán los ítems del carrito
  const kdsRoutingPreview = useMemo(() => {
    const map = new Map<string, { name: string; color: string; count: number }>();
    for (const item of cart.items) {
      const key = item.kdsStationId || 'DIRECT';
      const name = item.kdsStationName || 'Despacho Directo / Barra';
      const color = item.kdsStationColor || '#757681';
      const existing = map.get(key);
      if (existing) {
        existing.count += item.quantity;
      } else {
        map.set(key, { name, color, count: item.quantity });
      }
    }
    return Array.from(map.values());
  }, [cart.items]);

  const handleAddProduct = (product: any) => {
    if (product.isBeverage && Number(product.currentStock) <= 0) {
      toast.error(`'${product.name}' está AGOTADO en almacén.`);
      return;
    }

    const inCart = cart.items.find((i) => i.productId === product.id);
    if (
      product.isBeverage &&
      inCart &&
      inCart.quantity >= Number(product.currentStock)
    ) {
      toast.warning(
        `Stock máximo alcanzado para '${product.name}' (${product.currentStock} disponibles).`,
      );
      return;
    }

    dispatch(
      addItemToCart({
        productId: product.id,
        name: product.name,
        price: Number(product.price),
        kdsStationId: product.kdsStation?.id || product.kdsStationId || null,
        kdsStationName: product.kdsStation?.name || null,
        kdsStationColor: product.kdsStation?.colorHex || null,
        isBeverage: Boolean(product.isBeverage),
        maxStock: product.isBeverage ? Number(product.currentStock) : 9999,
      }),
    );
  };

  const handleToggleQuickNote = (productId: string, currentNotes: string, chip: string) => {
    const parts = currentNotes
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const exists = parts.includes(chip);
    const nextNotes = exists
      ? parts.filter((p) => p !== chip).join(', ')
      : [...parts, chip].join(', ');
    dispatch(updateItemNotes({ productId, notes: nextNotes }));
  };

  const handleDispatchOrder = async () => {
    if (cart.items.length === 0) {
      toast.error('Agrega al menos un plato o bebida a la comanda.');
      return;
    }

    if (!isShiftOpen) {
      toast.error(
        'Operación bloqueada (412): La caja está cerrada. Solicita abrir turno en Caja.',
      );
      return;
    }

    try {
      const response = await createOrder({
        orderType: cart.orderType,
        tableNumber: cart.tableNumber,
        customerName: cart.customerName.trim() || undefined,
        notes: cart.orderNotes.trim() || undefined,
        items: cart.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          notes: item.notes.trim() || undefined,
        })),
      }).unwrap();

      const kdsCount = response?.dispatch?.kdsStationsNotified?.length ?? 0;
      toast.success(
        `¡Comanda ${response?.order?.orderNumber || ''} despachada a ${kdsCount} pantalla(s) KDS y Caja!`,
      );

      dispatch(clearCart());
      setIsCartDrawerOpen(false);
      setEditingNoteProductId(null);
      refetchOrders();
      refetchTables();
      refetchProducts();
    } catch (err: any) {
      if (err?.status === 412) {
        toast.error(
          err?.data?.message ||
            'Operación bloqueada (412): La caja no tiene un turno abierto.',
        );
      } else {
        toast.error(err?.data?.message || 'Error al despachar la comanda.');
      }
    }
  };

  const handleMarkServed = async (orderId: string, tableNumber: string) => {
    try {
      await updateOrderStatus({ id: orderId, status: 'SERVED' }).unwrap();
      dispatch(dismissReadyAlert(orderId));
      toast.success(`Pedido de ${tableNumber} marcado como ENTREGADO en mesa.`);
      refetchOrders();
      refetchTables();
    } catch (err: any) {
      toast.error(err?.data?.message || 'No se pudo actualizar el estado del pedido.');
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    router.push('/login');
    toast.success('Sesión cerrada');
  };

  const tablesList = tablesSummary?.tables ||
    Array.from({ length: 12 }, (_, idx) => ({
      tableNumber: `Mesa ${idx + 1}`,
      state: 'FREE' as const,
      activeOrdersCount: 0,
      accumulatedTotal: 0,
      latestOrder: null,
    }));

  return (
    <div className="min-h-screen bg-[#0B0F17] text-[#F8FAFC] flex flex-col font-sans pb-28 select-none">
      {/* HEADER SUPERIOR COMPACTO & TÁCTIL (Executive Precision Dark) */}
      <header className="sticky top-0 z-30 bg-[#131823]/95 backdrop-blur-md border-b border-[#20293A] px-3 sm:px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#2563EB]/20 border border-[#2563EB]/40 flex items-center justify-center text-[#2563EB] shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-[#F8FAFC] truncate">
                  Comandero Móvil
                </h1>
                {/* Estado de Turno */}
                {isShiftOpen ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                    TURNO ACTIVO
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#D97706]/15 text-[#D97706] border border-[#D97706]/30 shrink-0">
                    <AlertTriangle className="w-3 h-3" />
                    CAJA CERRADA
                  </span>
                )}
              </div>
              <p className="text-xs text-[#94A3B8] truncate">
                Mesera: <span className="text-[#F8FAFC] font-medium">{user?.fullName || 'Salón'}</span>{' '}
                &bull; <span className="font-mono text-[#757681]">{effectiveTenantId}</span>
              </p>
            </div>
          </div>

          {/* Indicador WS y Accesos Rápidos */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-mono ${
                isConnectedWs
                  ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]'
                  : 'bg-[#D97706]/10 border-[#D97706]/30 text-[#D97706]'
              }`}
              title="Sincronización WebSocket con Cocina y Caja"
            >
              {isConnectedWs ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isConnectedWs ? 'SYNC' : 'OFFLINE'}</span>
            </div>

            <Link
              href="/caja/turno"
              className="min-h-[40px] px-2.5 py-1.5 rounded-xl bg-[#1A2234] hover:bg-[#20293A] border border-[#20293A] text-xs text-[#94A3B8] hover:text-[#F8FAFC] flex items-center gap-1.5 transition active:scale-[0.97]"
              title="Ir a Caja y Turnos"
            >
              <CreditCard className="w-4 h-4 text-[#10B981]" />
              <span className="hidden md:inline">Caja</span>
            </Link>

            {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
              <Link
                href="/admin/carta"
                className="min-h-[40px] px-2.5 py-1.5 rounded-xl bg-[#1A2234] hover:bg-[#20293A] border border-[#20293A] text-xs text-[#94A3B8] hover:text-[#F8FAFC] hidden sm:flex items-center gap-1.5 transition active:scale-[0.97]"
              >
                <UtensilsCrossed className="w-4 h-4 text-[#D97706]" />
                <span className="hidden md:inline">Carta</span>
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="min-h-[40px] min-w-[40px] p-2 rounded-xl bg-[#1A2234] hover:bg-red-500/20 border border-[#20293A] text-[#94A3B8] hover:text-red-400 flex items-center justify-center transition active:scale-[0.97]"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-5xl w-full mx-auto flex-1 px-3 sm:px-6 pt-3 space-y-4">
        {/* BANNER DE BLOQUEO SI NO HAY TURNO ABIERTO (412 Precondition Failed) */}
        {!isShiftLoading && !isShiftOpen && (
          <div className="p-3.5 rounded-2xl bg-[#D97706]/15 border border-[#D97706]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold text-[#F8FAFC]">
                  Toma de pedidos bloqueada (Caja Cerrada - HTTP 412)
                </p>
                <p className="text-[#94A3B8] mt-0.5">
                  Ningún pedido puede enviarse a cocina sin un turno abierto formalmente en Caja.
                </p>
              </div>
            </div>
            <Link
              href="/caja/turno"
              className="min-h-[44px] w-full sm:w-auto px-4 py-2 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-[0.97] shrink-0"
            >
              <CreditCard className="w-4 h-4" />
              Abrir Turno en Caja
            </Link>
          </div>
        )}

        {/* ALERTAS EN VIVO DE PEDIDOS LISTOS EN COCINA */}
        {readyAlerts.length > 0 && (
          <div className="space-y-2">
            {readyAlerts.map((alert) => (
              <div
                key={alert.orderId}
                className="p-3.5 rounded-2xl bg-[#10B981]/15 border-2 border-[#10B981] flex items-center justify-between gap-3 shadow-lg shadow-[#10B981]/10 animate-pulse"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#10B981] text-[#0B0F17] flex items-center justify-center shrink-0">
                    <BellRing className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#F8FAFC] truncate">
                      ¡{alert.tableNumber} LISTA PARA SERVIR!
                    </p>
                    <p className="text-xs text-[#10B981] font-mono truncate">
                      Estación: {alert.stationName || 'Cocina'} &bull;{' '}
                      {alert.orderNumber || `#${alert.orderId.slice(0, 6)}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleMarkServed(alert.orderId, alert.tableNumber)}
                    className="min-h-[48px] px-4 py-2 rounded-xl bg-[#10B981] hover:bg-[#059669] text-[#0B0F17] font-bold text-xs flex items-center gap-1.5 transition active:scale-[0.97]"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Entregado
                  </button>
                  <button
                    onClick={() => dispatch(dismissReadyAlert(alert.orderId))}
                    className="min-h-[48px] min-w-[48px] rounded-xl bg-[#131823] text-[#94A3B8] hover:text-white flex items-center justify-center"
                    aria-label="Cerrar alerta"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TABS PRINCIPALES: TOMAR PEDIDO vs PEDIDOS EN SALÓN (Min 48px Touch Targets) */}
        <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-[#131823] border border-[#20293A]">
          <button
            type="button"
            onClick={() => setActiveView('MENU')}
            className={`min-h-[48px] rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.97] ${
              activeView === 'MENU'
                ? 'bg-[#2563EB] text-white shadow-lg shadow-[#2563EB]/25'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>Carta & Mesas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('ACTIVE_ORDERS')}
            className={`min-h-[48px] rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.97] ${
              activeView === 'ACTIVE_ORDERS'
                ? 'bg-[#2563EB] text-white shadow-lg shadow-[#2563EB]/25'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            <ChefHat className="w-4 h-4" />
            <span>Salón en Vivo</span>
            {activeOrders && activeOrders.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-[#10B981] text-[#0B0F17]">
                {activeOrders.length}
              </span>
            )}
          </button>
        </div>

        {activeView === 'MENU' ? (
          <>
            {/* SELECTOR DE MODALIDAD Y MESA (Ergonomía Táctil 48px) */}
            <section className="bg-[#131823] border border-[#20293A] rounded-2xl p-3.5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                {/* Modalidad: Salón, Para Llevar, Delivery */}
                <div className="flex items-center gap-1.5">
                  {(
                    [
                      { id: 'DINE_IN', label: 'Salón', icon: MapPin },
                      { id: 'TAKEAWAY', label: 'Para Llevar', icon: Package },
                      { id: 'DELIVERY', label: 'Delivery', icon: ShoppingBag },
                    ] as const
                  ).map((mode) => {
                    const Icon = mode.icon;
                    const active = cart.orderType === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => dispatch(setOrderType(mode.id as OrderModalType))}
                        className={`min-h-[48px] px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all active:scale-[0.97] ${
                          active
                            ? 'bg-[#1A2234] border-[#2563EB] text-[#F8FAFC] shadow-sm'
                            : 'bg-[#0B0F17] border-[#20293A] text-[#94A3B8] hover:text-[#F8FAFC]'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${active ? 'text-[#2563EB]' : 'text-[#757681]'}`} />
                        {mode.label}
                      </button>
                    );
                  })}
                </div>

                {/* Botón de selección rápida de mesa o indicador actual */}
                {cart.orderType === 'DINE_IN' && (
                  <button
                    type="button"
                    onClick={() => setIsTablePickerOpen((prev) => !prev)}
                    className="min-h-[48px] px-4 py-2 rounded-xl bg-[#2563EB]/15 border border-[#2563EB]/40 text-[#F8FAFC] font-mono font-bold text-xs flex items-center gap-2 transition active:scale-[0.97]"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                    <span>{cart.tableNumber}</span>
                    <span className="text-[11px] text-[#94A3B8] font-sans font-normal underline">
                      {isTablePickerOpen ? 'Ocultar mesas' : 'Cambiar mesa'}
                    </span>
                  </button>
                )}
              </div>

              {/* Píldoras Horizontales Rápidas de Mesas 1..12 */}
              {cart.orderType === 'DINE_IN' && (
                <div
                  className={
                    isTablePickerOpen
                      ? 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 pt-1'
                      : 'flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar'
                  }
                >
                  {tablesList.map((t) => {
                    const isSelected = cart.tableNumber === t.tableNumber;
                    const isReady = t.state === 'READY_TO_SERVE';
                    const isOccupied = t.state === 'OCCUPIED';

                    return (
                      <button
                        key={t.tableNumber}
                        type="button"
                        onClick={() => {
                          dispatch(setTableNumber(t.tableNumber));
                          if (isTablePickerOpen) setIsTablePickerOpen(false);
                        }}
                        className={`min-h-[48px] min-w-[92px] px-3 py-2 rounded-xl border text-left flex flex-col justify-between shrink-0 transition-all active:scale-[0.97] ${
                          isSelected
                            ? 'bg-[#2563EB] border-[#2563EB] text-white shadow-md shadow-[#2563EB]/25'
                            : isReady
                            ? 'bg-[#10B981]/15 border-[#10B981] text-[#F8FAFC]'
                            : isOccupied
                            ? 'bg-[#D97706]/15 border-[#D97706]/50 text-[#F8FAFC]'
                            : 'bg-[#0B0F17] border-[#20293A] text-[#94A3B8] hover:border-[#757681]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 w-full">
                          <span className="font-mono font-bold text-xs">{t.tableNumber}</span>
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isSelected
                                ? 'bg-white'
                                : isReady
                                ? 'bg-[#10B981] animate-ping'
                                : isOccupied
                                ? 'bg-[#D97706]'
                                : 'bg-[#757681]/40'
                            }`}
                          />
                        </div>
                        <span
                          className={`text-[10px] font-mono ${
                            isSelected ? 'text-white/90' : 'text-[#757681]'
                          }`}
                        >
                          {t.accumulatedTotal > 0
                            ? `S/ ${t.accumulatedTotal.toFixed(2)}`
                            : 'Libre'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Si es Para Llevar o Delivery, permitir nombre del cliente */}
              {cart.orderType !== 'DINE_IN' && (
                <div className="pt-1">
                  <input
                    type="text"
                    placeholder={
                      cart.orderType === 'TAKEAWAY'
                        ? 'Nombre del cliente para llevar (ej. Sr. Carlos)...'
                        : 'Nombre y dirección / teléfono de Delivery...'
                    }
                    value={cart.customerName}
                    onChange={(e) => dispatch(setCustomerName(e.target.value))}
                    className="w-full min-h-[48px] bg-[#0B0F17] border border-[#20293A] rounded-xl px-3.5 py-2.5 text-sm text-[#F8FAFC] placeholder-[#757681] focus:outline-none focus:border-[#2563EB]"
                  />
                </div>
              )}
            </section>

            {/* BUSCADOR INSTANTÁNEO + FILTROS DE CATEGORÍA (Min 48px) */}
            <section className="space-y-3">
              <div className="relative">
                <Search className="w-5 h-5 text-[#757681] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar plato o bebida al instante (ej. Chaufa, Aeropuerto, Inca Kola)..."
                  className="w-full min-h-[52px] bg-[#131823] border border-[#20293A] focus:border-[#2563EB] rounded-2xl pl-12 pr-12 py-3 text-sm text-[#F8FAFC] placeholder-[#757681] focus:outline-none shadow-inner transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="min-h-[44px] min-w-[44px] absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center text-[#94A3B8] hover:text-white rounded-xl"
                    aria-label="Limpiar búsqueda"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Píldoras de Categorías Táctiles */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                <button
                  type="button"
                  onClick={() => setSelectedCategoryId('ALL')}
                  className={`min-h-[48px] px-4 py-2 rounded-xl text-xs font-bold shrink-0 border transition-all active:scale-[0.97] ${
                    selectedCategoryId === 'ALL'
                      ? 'bg-[#2563EB] border-[#2563EB] text-white shadow-md shadow-[#2563EB]/20'
                      : 'bg-[#131823] border-[#20293A] text-[#94A3B8] hover:text-[#F8FAFC]'
                  }`}
                >
                  Todos ({products?.length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCategoryId('FOOD')}
                  className={`min-h-[48px] px-4 py-2 rounded-xl text-xs font-bold shrink-0 border flex items-center gap-1.5 transition-all active:scale-[0.97] ${
                    selectedCategoryId === 'FOOD'
                      ? 'bg-[#D97706] border-[#D97706] text-[#0B0F17]'
                      : 'bg-[#131823] border-[#20293A] text-[#94A3B8] hover:text-[#F8FAFC]'
                  }`}
                >
                  <UtensilsCrossed className="w-3.5 h-3.5" />
                  Comidas
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCategoryId('BEVERAGE')}
                  className={`min-h-[48px] px-4 py-2 rounded-xl text-xs font-bold shrink-0 border flex items-center gap-1.5 transition-all active:scale-[0.97] ${
                    selectedCategoryId === 'BEVERAGE'
                      ? 'bg-[#10B981] border-[#10B981] text-[#0B0F17]'
                      : 'bg-[#131823] border-[#20293A] text-[#94A3B8] hover:text-[#F8FAFC]'
                  }`}
                >
                  <Wine className="w-3.5 h-3.5" />
                  Bebidas
                </button>

                {categories?.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`min-h-[48px] px-4 py-2 rounded-xl text-xs font-semibold shrink-0 border transition-all active:scale-[0.97] ${
                      selectedCategoryId === cat.id
                        ? 'bg-[#1A2234] border-[#2563EB] text-[#F8FAFC]'
                        : 'bg-[#131823] border-[#20293A] text-[#94A3B8] hover:text-[#F8FAFC]'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </section>

            {/* GRILLA DE PRODUCTOS CON CERO LAYOUT SHIFT (CLS = 0) */}
            {isProdLoading || isCatLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="h-36 rounded-2xl bg-[#1A2234] border border-[#20293A] animate-pulse p-4 flex flex-col justify-between"
                  >
                    <div className="h-4 w-2/3 bg-[#20293A] rounded" />
                    <div className="h-3 w-1/2 bg-[#20293A] rounded" />
                    <div className="h-10 w-full bg-[#20293A] rounded-xl" />
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-[#131823] border border-[#20293A] rounded-2xl p-10 text-center space-y-3">
                <UtensilsCrossed className="w-10 h-10 text-[#757681] mx-auto" />
                <p className="text-base font-bold text-[#F8FAFC]">
                  No se encontraron productos para tu búsqueda
                </p>
                <p className="text-xs text-[#94A3B8]">
                  Intenta con otro término o selecciona la categoría &ldquo;Todos&rdquo;.
                </p>
              </div>
            ) : (
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredProducts.map((product) => {
                  const cartItem = cart.items.find((i) => i.productId === product.id);
                  const qtyInCart = cartItem?.quantity || 0;
                  const isOutOfStock =
                    Boolean(product.isBeverage) && Number(product.currentStock) <= 0;
                  const isLowStock =
                    Boolean(product.isBeverage) &&
                    Number(product.currentStock) > 0 &&
                    Number(product.currentStock) <= Number(product.minStockAlert || 5);

                  return (
                    <div
                      key={product.id}
                      className={`rounded-2xl border p-4 flex flex-col justify-between transition-all duration-150 ${
                        isOutOfStock
                          ? 'bg-[#131823]/50 border-[#20293A] opacity-60'
                          : qtyInCart > 0
                          ? 'bg-[#1A2234] border-[#2563EB] shadow-lg shadow-[#2563EB]/10'
                          : 'bg-[#131823] border-[#20293A] hover:border-[#757681]/60'
                      }`}
                    >
                      {/* Cabecera de Tarjeta: Categoría + Estación KDS / Stock */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#0B0F17] text-[#94A3B8] border border-[#20293A]">
                            {product.category?.name || (product.isBeverage ? 'Bebida' : 'Comida')}
                          </span>

                          {product.kdsStation ? (
                            <span
                              className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full text-white flex items-center gap-1"
                              style={{ backgroundColor: product.kdsStation.colorHex || '#2563EB' }}
                            >
                              <MonitorPlay className="w-3 h-3" />
                              {product.kdsStation.name}
                            </span>
                          ) : (
                            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#0B0F17] text-[#757681] border border-[#20293A]">
                              Barra / Directo
                            </span>
                          )}
                        </div>

                        <div className="flex items-start justify-between gap-2 pt-1">
                          <div>
                            <h3 className="text-base font-bold text-[#F8FAFC] leading-snug">
                              {product.name}
                            </h3>
                            {product.description && (
                              <p className="text-xs text-[#94A3B8] line-clamp-1 mt-0.5">
                                {product.description}
                              </p>
                            )}
                          </div>

                          {/* Precio en JetBrains Mono */}
                          <span className="text-base font-bold font-mono text-[#10B981] shrink-0 bg-[#10B981]/10 px-2.5 py-1 rounded-xl border border-[#10B981]/20">
                            S/ {Number(product.price).toFixed(2)}
                          </span>
                        </div>

                        {/* Indicador de Stock para Bebidas */}
                        {product.isBeverage && (
                          <div className="pt-1 flex items-center gap-2">
                            {isOutOfStock ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-red-500/20 border border-red-500/40 text-red-400 text-[11px] font-mono font-bold">
                                AGOTADO (0 UNDS)
                              </span>
                            ) : (
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold ${
                                  isLowStock
                                    ? 'bg-[#D97706]/20 text-[#D97706] border border-[#D97706]/30'
                                    : 'bg-[#0B0F17] text-[#94A3B8] border border-[#20293A]'
                                }`}
                              >
                                Stock disponible: {product.currentStock} unds
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Controles Táctiles (Mínimo 48px de alto) */}
                      <div className="pt-3 mt-3 border-t border-[#20293A] flex flex-col gap-2">
                        {qtyInCart === 0 ? (
                          <button
                            type="button"
                            disabled={isOutOfStock}
                            onClick={() => handleAddProduct(product)}
                            className={`w-full min-h-[48px] rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.97] ${
                              isOutOfStock
                                ? 'bg-[#0B0F17] text-[#757681] border border-[#20293A] cursor-not-allowed'
                                : 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-md shadow-[#2563EB]/20 cursor-pointer'
                            }`}
                          >
                            {isOutOfStock ? (
                              <span>AGOTADO</span>
                            ) : (
                              <>
                                <Plus className="w-5 h-5" />
                                <span>Agregar a {cart.tableNumber}</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <button
                                type="button"
                                onClick={() => dispatch(decrementItemFromCart(product.id))}
                                className="min-h-[48px] min-w-[52px] rounded-xl bg-[#0B0F17] hover:bg-red-500/20 border border-[#20293A] text-[#F8FAFC] flex items-center justify-center transition active:scale-[0.97]"
                                aria-label="Disminuir cantidad"
                              >
                                <Minus className="w-5 h-5" />
                              </button>

                              <div className="flex-1 text-center">
                                <span className="font-mono font-bold text-lg text-[#F8FAFC]">
                                  {qtyInCart}
                                </span>
                                <span className="block text-[10px] font-mono text-[#10B981]">
                                  Subtotal: S/ {(qtyInCart * Number(product.price)).toFixed(2)}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleAddProduct(product)}
                                className="min-h-[48px] min-w-[52px] rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white flex items-center justify-center transition active:scale-[0.97]"
                                aria-label="Aumentar cantidad"
                              >
                                <Plus className="w-5 h-5" />
                              </button>
                            </div>

                            {/* Botón para abrir modificadores rápidos de cocina */}
                            <button
                              type="button"
                              onClick={() =>
                                setEditingNoteProductId(
                                  editingNoteProductId === product.id ? null : product.id,
                                )
                              }
                              className="w-full min-h-[40px] px-3 py-1.5 rounded-xl bg-[#0B0F17] border border-[#20293A] text-xs text-[#94A3B8] hover:text-[#F8FAFC] flex items-center justify-between transition active:scale-[0.98]"
                            >
                              <span className="flex items-center gap-1.5 truncate">
                                <MessageSquarePlus className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
                                <span className="truncate">
                                  {cartItem?.notes
                                    ? `Nota: ${cartItem.notes}`
                                    : 'Agregar nota de cocina (sin cebolla, helada...)'}
                                </span>
                              </span>
                              <span className="text-[11px] text-[#2563EB] font-semibold shrink-0 ml-2">
                                {editingNoteProductId === product.id ? 'Cerrar' : 'Editar'}
                              </span>
                            </button>

                            {/* Panel desplegable de notas rápidas para el ítem */}
                            {editingNoteProductId === product.id && cartItem && (
                              <div className="p-2.5 rounded-xl bg-[#0B0F17] border border-[#20293A] space-y-2">
                                <div className="flex flex-wrap gap-1.5">
                                  {(product.isBeverage
                                    ? QUICK_NOTES_BEVERAGE
                                    : QUICK_NOTES_FOOD
                                  ).map((chip) => {
                                    const isChipSelected = cartItem.notes
                                      .split(',')
                                      .map((s) => s.trim())
                                      .includes(chip);
                                    return (
                                      <button
                                        key={chip}
                                        type="button"
                                        onClick={() =>
                                          handleToggleQuickNote(
                                            product.id,
                                            cartItem.notes,
                                            chip,
                                          )
                                        }
                                        className={`min-h-[36px] px-2.5 py-1 rounded-lg text-[11px] font-medium border transition active:scale-[0.97] ${
                                          isChipSelected
                                            ? 'bg-[#D97706] border-[#D97706] text-[#0B0F17] font-bold'
                                            : 'bg-[#131823] border-[#20293A] text-[#94A3B8]'
                                        }`}
                                      >
                                        {chip}
                                      </button>
                                    );
                                  })}
                                </div>
                                <input
                                  type="text"
                                  value={cartItem.notes}
                                  onChange={(e) =>
                                    dispatch(
                                      updateItemNotes({
                                        productId: product.id,
                                        notes: e.target.value,
                                      }),
                                    )
                                  }
                                  placeholder="Escribe una observación personalizada..."
                                  className="w-full min-h-[40px] bg-[#131823] border border-[#20293A] rounded-lg px-2.5 py-1.5 text-xs text-[#F8FAFC] placeholder-[#757681] focus:outline-none focus:border-[#D97706]"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </section>
            )}
          </>
        ) : (
          /* VISTA 2: MONITOR DE PEDIDOS ACTIVOS EN SALÓN */
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#F8FAFC]">
                  Comandas Activas en Curso
                </h2>
                <p className="text-xs text-[#94A3B8]">
                  Sincronizado en vivo con Pantallas KDS de Cocina y Terminal de Caja
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  refetchOrders();
                  refetchTables();
                }}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#131823] border border-[#20293A] text-xs text-[#94A3B8] hover:text-white transition active:scale-[0.97]"
              >
                Actualizar
              </button>
            </div>

            {isOrdersLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-32 rounded-2xl bg-[#1A2234] border border-[#20293A] animate-pulse"
                  />
                ))}
              </div>
            ) : !activeOrders || activeOrders.length === 0 ? (
              <div className="bg-[#131823] border border-[#20293A] rounded-2xl p-10 text-center space-y-3">
                <ChefHat className="w-12 h-12 text-[#757681] mx-auto" />
                <p className="text-base font-bold text-[#F8FAFC]">
                  No hay comandas activas en este momento
                </p>
                <p className="text-xs text-[#94A3B8]">
                  Selecciona una mesa en la pestaña &ldquo;Carta & Mesas&rdquo; para emitir un pedido.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeOrders.map((ord: any) => {
                  const isReady = ord.status === 'READY';
                  const isServed = ord.status === 'SERVED';

                  return (
                    <div
                      key={ord.id}
                      className={`rounded-2xl border p-4 flex flex-col justify-between gap-3 ${
                        isReady
                          ? 'bg-[#131823] border-2 border-[#10B981] shadow-lg shadow-[#10B981]/10'
                          : 'bg-[#131823] border-[#20293A]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 border-b border-[#20293A] pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-lg bg-[#2563EB]/20 text-[#60A5FA] font-mono font-bold text-xs">
                              {ord.tableNumber || 'Salón'}
                            </span>
                            <span className="text-xs font-mono text-[#757681]">
                              {ord.orderNumber}
                            </span>
                          </div>
                          <p className="text-xs text-[#94A3B8] mt-1">
                            Mesera: {ord.waiter?.fullName || 'Salón'} &bull;{' '}
                            <span className="font-mono">
                              {new Date(ord.createdAt).toLocaleTimeString('es-PE', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </p>
                        </div>

                        <div className="text-right">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              isReady
                                ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40'
                                : isServed
                                ? 'bg-[#2563EB]/20 text-[#60A5FA] border border-[#2563EB]/30'
                                : 'bg-[#D97706]/20 text-[#D97706] border border-[#D97706]/30'
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            {isReady
                              ? 'LISTO EN COCINA'
                              : isServed
                              ? 'EN MESA'
                              : 'EN PREPARACIÓN'}
                          </span>
                          <p className="text-base font-bold font-mono text-[#10B981] mt-1">
                            S/ {Number(ord.totalAmount).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Ítems de la orden */}
                      <div className="space-y-1.5">
                        {ord.items?.map((item: any) => (
                          <div
                            key={item.id}
                            className="flex items-start justify-between text-xs py-1 border-b border-[#20293A]/50 last:border-none"
                          >
                            <div className="flex items-start gap-2">
                              <span className="font-mono font-bold text-[#F8FAFC] bg-[#1A2234] px-1.5 py-0.5 rounded">
                                {item.quantity}x
                              </span>
                              <div>
                                <span className="text-[#F8FAFC] font-medium">
                                  {item.productName}
                                </span>
                                {item.notes && (
                                  <p className="text-[11px] text-[#D97706]">⚠️ {item.notes}</p>
                                )}
                              </div>
                            </div>
                            <span className="font-mono text-[#94A3B8]">
                              S/ {Number(item.subtotal).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Acciones Táctiles de la Orden */}
                      {ord.status !== 'SERVED' && (
                        <button
                          type="button"
                          onClick={() => handleMarkServed(ord.id, ord.tableNumber || 'Mesa')}
                          className={`w-full min-h-[48px] rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition active:scale-[0.97] ${
                            isReady
                              ? 'bg-[#10B981] hover:bg-[#059669] text-[#0B0F17] shadow-md shadow-[#10B981]/20'
                              : 'bg-[#1A2234] hover:bg-[#20293A] text-[#F8FAFC] border border-[#20293A]'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Marcar como Servido en Mesa
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>

      {/* BARRA FLOTANTE INFERIOR PARA PULGAR (THUMB-ZONE) */}
      {totalCartItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-3 bg-gradient-to-t from-[#0B0F17] via-[#0B0F17]/95 to-transparent">
          <div className="max-w-3xl mx-auto bg-[#131823] border-2 border-[#2563EB] rounded-2xl p-3 shadow-2xl flex items-center justify-between gap-3">
            <div
              onClick={() => setIsCartDrawerOpen(true)}
              className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
            >
              <div className="w-12 h-12 rounded-xl bg-[#2563EB] text-white font-mono font-bold text-base flex items-center justify-center shrink-0 shadow-md">
                {totalCartItems}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
                    {cart.tableNumber}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-[#10B981]/15 text-[#10B981] font-mono">
                    + Caja & KDS
                  </span>
                </div>
                <p className="text-lg font-bold font-mono text-[#F8FAFC] truncate">
                  S/ {totalCartAmount.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsCartDrawerOpen(true)}
                className="min-h-[50px] px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-[#2563EB]/30 transition active:scale-[0.97]"
              >
                <span>Ver y Enviar</span>
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM SHEET / DRAWER TÁCTIL DE REVISIÓN Y DESPACHO DE COMANDA */}
      {isCartDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#131823] border-t sm:border border-[#20293A] rounded-t-3xl sm:rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200">
            {/* Cabecera del Drawer */}
            <div className="p-4 sm:p-5 bg-[#1A2234] border-b border-[#20293A] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-[#F8FAFC]">
                    Confirmar Comanda
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#2563EB] text-white">
                    {cart.tableNumber}
                  </span>
                </div>
                <p className="text-xs text-[#94A3B8] mt-0.5">
                  Despacho simultáneo a Pantallas KDS y Terminal de Caja
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsCartDrawerOpen(false)}
                className="min-h-[44px] min-w-[44px] rounded-xl bg-[#131823] text-[#94A3B8] hover:text-white flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cuerpo scrollable de ítems y previsualización de enrutamiento KDS */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
              {/* Previsualización del Enrutamiento Dual (KDS 1..N + Regla Inmutable a Caja) */}
              <div className="p-3 rounded-xl bg-[#0B0F17] border border-[#20293A] space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
                  Destino de Enrutamiento en Tiempo Real:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {/* Regla Inmutable: Siempre Caja */}
                  <span className="px-2.5 py-1 rounded-lg bg-[#10B981]/15 border border-[#10B981]/40 text-[#10B981] text-xs font-mono font-bold flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5" />
                    Caja Principal (100% Ítems)
                  </span>
                  {kdsRoutingPreview.map((st, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-white text-xs font-mono font-semibold flex items-center gap-1"
                      style={{ backgroundColor: st.color }}
                    >
                      <MonitorPlay className="w-3 h-3" />
                      {st.name} ({st.count})
                    </span>
                  ))}
                </div>
              </div>

              {/* Lista de Ítems en Comanda */}
              <div className="space-y-2.5">
                {cart.items.map((item) => (
                  <div
                    key={item.productId}
                    className="p-3.5 rounded-xl bg-[#0B0F17] border border-[#20293A] space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-[#F8FAFC]">{item.name}</p>
                        <p className="text-xs font-mono text-[#94A3B8]">
                          S/ {item.price.toFixed(2)} c/u &bull; Subtotal:{' '}
                          <strong className="text-[#10B981]">
                            S/ {(item.price * item.quantity).toFixed(2)}
                          </strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => dispatch(decrementItemFromCart(item.productId))}
                          className="min-h-[42px] min-w-[42px] rounded-xl bg-[#131823] border border-[#20293A] text-white flex items-center justify-center active:scale-[0.97]"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-7 text-center font-mono font-bold text-sm text-white">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            dispatch(
                              addItemToCart({
                                productId: item.productId,
                                name: item.name,
                                price: item.price,
                                isBeverage: item.isBeverage,
                                maxStock: item.maxStock,
                              }),
                            )
                          }
                          className="min-h-[42px] min-w-[42px] rounded-xl bg-[#2563EB] text-white flex items-center justify-center active:scale-[0.97]"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => dispatch(removeItemFromCart(item.productId))}
                          className="min-h-[42px] min-w-[42px] rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center active:scale-[0.97]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Input de Nota Rápida por Ítem */}
                    <input
                      type="text"
                      value={item.notes}
                      onChange={(e) =>
                        dispatch(
                          updateItemNotes({
                            productId: item.productId,
                            notes: e.target.value,
                          }),
                        )
                      }
                      placeholder="Nota de preparación (ej. sin cebolla, helada)..."
                      className="w-full min-h-[38px] bg-[#131823] border border-[#20293A] rounded-lg px-3 py-1.5 text-xs text-[#F8FAFC] placeholder-[#757681] focus:outline-none focus:border-[#D97706]"
                    />
                  </div>
                ))}
              </div>

              {/* Observación General de la Orden */}
              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                  Observación General de la Mesa (Opcional)
                </label>
                <input
                  type="text"
                  value={cart.orderNotes}
                  onChange={(e) => dispatch(setOrderNotes(e.target.value))}
                  placeholder="Ej. Cubiertos extra, niños en mesa..."
                  className="w-full min-h-[44px] bg-[#0B0F17] border border-[#20293A] rounded-xl px-3.5 py-2 text-xs text-[#F8FAFC] placeholder-[#757681] focus:outline-none focus:border-[#2563EB]"
                />
              </div>
            </div>

            {/* Footer de Confirmación y Despacho */}
            <div className="p-4 sm:p-5 bg-[#1A2234] border-t border-[#20293A] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#94A3B8]">
                  Total de Comanda ({totalCartItems} ítems):
                </span>
                <span className="text-2xl font-bold font-mono text-[#10B981]">
                  S/ {totalCartAmount.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    dispatch(clearCart());
                    setIsCartDrawerOpen(false);
                    toast.info('Carrito vaciado');
                  }}
                  className="min-h-[52px] px-4 rounded-xl bg-[#131823] border border-[#20293A] text-xs font-semibold text-[#94A3B8] hover:text-red-400 transition active:scale-[0.97]"
                >
                  Vaciar
                </button>

                <button
                  type="button"
                  disabled={isSubmittingOrder || !isShiftOpen}
                  onClick={handleDispatchOrder}
                  className="flex-1 min-h-[52px] rounded-xl bg-[#10B981] hover:bg-[#059669] disabled:opacity-50 text-[#0B0F17] font-black text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-[#10B981]/25 transition active:scale-[0.97]"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {isSubmittingOrder
                      ? 'DESPACHANDO A COCINA Y CAJA...'
                      : 'CONFIRMAR Y DESPACHAR COMANDA'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
