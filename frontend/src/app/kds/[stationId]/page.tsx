'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useGetKdsStationByIdQuery } from '@/store/services/api';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import {
  MonitorPlay,
  Clock,
  CheckCircle2,
  AlertCircle,
  Wifi,
  WifiOff,
  Maximize2,
  Minimize2,
  ChefHat,
  ArrowLeft,
  Volume2,
} from 'lucide-react';

interface KdsOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  notes?: string;
  isReady?: boolean;
}

interface KdsOrder {
  orderId: string;
  tableNumber?: string;
  orderType: string;
  waiterName?: string;
  items: KdsOrderItem[];
  dispatchedAt: string;
  status: 'PENDING' | 'PREPARING' | 'READY';
}

function KdsContent({ stationId }: { stationId: string }) {

  const { tenantId } = useSelector((state: RootState) => state.auth);
  const effectiveTenantId = tenantId || 'chifa-mariana';

  const { data: station, isLoading: isStationLoading } = useGetKdsStationByIdQuery(stationId);

  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [orders, setOrders] = useState<KdsOrder[]>([]);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Reloj en tiempo real para el cálculo de minutos transcurridos
  useEffect(() => {
    setCurrentTime(Date.now());
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Conexión WebSocket a la sala de la pantalla KDS
  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000/kds';
    const s = io(socketUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    s.on('connect', () => {
      setIsConnected(true);
      s.emit('join_kds', { tenantId: effectiveTenantId, stationId }, (res: any) => {
        if (res?.success) {
          toast.success(`Conectado a pantalla KDS`);
        }
      });
    });

    s.on('disconnect', () => {
      setIsConnected(false);
    });

    s.on('kds:order_items', (payload: any) => {
      const newOrder: KdsOrder = {
        orderId: payload.orderId,
        tableNumber: payload.tableNumber,
        orderType: payload.orderType || 'DINE_IN',
        waiterName: payload.waiterName,
        items: payload.items.map((i: any) => ({ ...i, isReady: false })),
        dispatchedAt: payload.dispatchedAt || new Date().toISOString(),
        status: 'PENDING',
      };

      setOrders((prev) => [newOrder, ...prev]);

      // Alerta sonora con Web Audio API (Chime de Cocina)
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      } catch (e) {
        // Silencioso si audio no permitido por navegador
      }

      toast.info(`¡Nueva comanda para ${station?.name || 'Cocina'}!`);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [stationId, effectiveTenantId, station?.name]);

  const toggleItemReady = (orderIndex: number, itemIndex: number) => {
    setOrders((prev) => {
      const copy = [...prev];
      const order = { ...copy[orderIndex] };
      const items = [...order.items];
      items[itemIndex] = { ...items[itemIndex], isReady: !items[itemIndex].isReady };
      order.items = items;
      copy[orderIndex] = order;
      return copy;
    });
  };

  const markOrderReady = (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.orderId !== orderId));
    toast.success(`Comanda #${orderId} completada y despachada`);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070A0F] text-white flex flex-col font-sans select-none">
      {/* Header KDS Industrial */}
      <header
        className="px-6 py-3 border-b border-gray-800 flex items-center justify-between"
        style={{
          backgroundColor: '#0F131D',
          borderBottomColor: station?.colorHex || '#2563EB',
          borderBottomWidth: '3px',
        }}
      >
        <div className="flex items-center gap-4">
          <Link
            href="/admin/pantallas-kds"
            className="p-2 rounded-xl bg-gray-800/60 hover:bg-gray-800 text-gray-400 hover:text-white transition active:scale-[0.97]"
            title="Volver a Administración"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <span
              className="w-4 h-4 rounded-full animate-pulse"
              style={{ backgroundColor: station?.colorHex || '#2563EB' }}
            />
            <div>
              <h1 className="text-xl font-black tracking-wide text-white uppercase flex items-center gap-2">
                {station?.name || 'Cargando Estación...'}
                <span className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-300 font-mono font-normal">
                  KDS DINÁMICO
                </span>
              </h1>
              <p className="text-xs font-mono text-gray-400">
                Tenant: {effectiveTenantId} | Órdenes Activas: {orders.length}
              </p>
            </div>
          </div>
        </div>

        {/* Indicadores de Estado & Botones */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-800/80 border border-gray-700 text-xs">
            {isConnected ? (
              <>
                <Wifi className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="text-emerald-400 font-medium font-mono">EN VIVO</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-red-400" />
                <span className="text-red-400 font-medium font-mono">RECONECTANDO...</span>
              </>
            )}
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-gray-800/60 hover:bg-gray-800 text-gray-300 hover:text-white transition active:scale-[0.97]"
            title="Pantalla Completa"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Grid de Comandas KDS */}
      <main className="flex-1 p-6 overflow-y-auto">
        {orders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-12 text-gray-600 space-y-4">
            <ChefHat className="w-20 h-20 text-gray-800 stroke-[1.2]" />
            <h2 className="text-2xl font-bold text-gray-500">Sin comandas pendientes</h2>
            <p className="text-sm text-gray-600 max-w-sm">
              Esperando pedidos desde los comanderos de salón. Los platos asignados a esta pantalla
              aparecerán aquí instantáneamente con alerta sonora.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {orders.map((order, orderIdx) => {
              const elapsedMinutes = Math.floor(
                (currentTime - new Date(order.dispatchedAt).getTime()) / 60000,
              );
              const elapsedSeconds = Math.floor(
                ((currentTime - new Date(order.dispatchedAt).getTime()) % 60000) / 1000,
              );

              // Código de colores por tiempo transcurrido
              const isUrgent = elapsedMinutes >= 15;
              const isWarning = elapsedMinutes >= 10 && elapsedMinutes < 15;

              return (
                <div
                  key={order.orderId}
                  className={`bg-[#10141E] border-2 rounded-2xl flex flex-col justify-between overflow-hidden shadow-2xl transition-all duration-200 ${
                    isUrgent
                      ? 'border-red-500 shadow-red-500/20 animate-pulse'
                      : isWarning
                      ? 'border-amber-500 shadow-amber-500/10'
                      : 'border-gray-800 hover:border-gray-700'
                  }`}
                >
                  {/* Encabezado de Comanda */}
                  <div className="p-4 bg-[#161B28] border-b border-gray-800 flex items-center justify-between">
                    <div>
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold tracking-wide uppercase">
                        {order.tableNumber || 'BARRA / SALÓN'}
                      </span>
                      <p className="text-xs font-mono text-gray-400 mt-1">
                        #{order.orderId.slice(-6).toUpperCase()} | {order.waiterName || 'Mesera'}
                      </p>
                    </div>

                    {/* Temporizador */}
                    <div
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono font-bold text-sm ${
                        isUrgent
                          ? 'bg-red-500/20 text-red-400'
                          : isWarning
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      {String(elapsedMinutes).padStart(2, '0')}:
                      {String(elapsedSeconds).padStart(2, '0')}
                    </div>
                  </div>

                  {/* Lista de Ítems */}
                  <div className="p-4 flex-1 space-y-3">
                    {order.items.map((item, itemIdx) => (
                      <div
                        key={item.productId + itemIdx}
                        onClick={() => toggleItemReady(orderIdx, itemIdx)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 active:scale-[0.98] ${
                          item.isReady
                            ? 'bg-emerald-950/30 border-emerald-500/40 opacity-60'
                            : 'bg-[#182030] border-gray-700/80 hover:border-gray-600'
                        }`}
                      >
                        <span
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-black text-sm shrink-0 ${
                            item.isReady
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-blue-600 text-white'
                          }`}
                        >
                          {item.quantity}
                        </span>

                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-bold leading-tight ${
                              item.isReady ? 'line-through text-gray-400' : 'text-white'
                            }`}
                          >
                            {item.productName}
                          </p>
                          {item.notes && (
                            <p className="text-xs text-amber-400/90 font-medium mt-1">
                              ⚠️ {item.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Botón de Despacho Completo */}
                  <div className="p-3 bg-[#0D111A] border-t border-gray-800">
                    <button
                      onClick={() => markOrderReady(order.orderId)}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm tracking-wide rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-600/30 active:scale-[0.97]"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      DESPACHAR ORDEN
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function KdsScreenInner({ params }: { params: Promise<{ stationId: string }> }) {
  const resolvedParams = use(params);
  return <KdsContent stationId={resolvedParams.stationId} />;
}

export default function KdsScreenPage({ params }: { params: Promise<{ stationId: string }> }) {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-[#07090E] flex items-center justify-center text-slate-500">Cargando KDS...</div>}>
      <KdsScreenInner params={params} />
    </React.Suspense>
  );
}
