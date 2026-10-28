'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { pushCashierTicket } from '@/store/slices/kdsSlice';
import {
  useGetCurrentShiftQuery,
  useOpenShiftMutation,
  useCloseShiftMutation,
  useGetOrdersQuery,
  useProcessPaymentMutation,
  useGetPaymentsQuery,
} from '../../../store/services/api';
import { io } from 'socket.io-client';
import {
  Smartphone,
  Wifi,
  Receipt,
  Clock,
  CreditCard,
  Banknote,
  QrCode,
  CheckCircle2,
  FileText,
  BarChart3,
  X,
  Printer,
} from 'lucide-react';

type PaymentMethodOption = 'CASH' | 'YAPE' | 'PLIN' | 'CARD';
type ReceiptTypeOption = 'TICKET' | 'BOLETA' | 'FACTURA';

export default function TurnoCajaPage() {
  const dispatch = useDispatch();
  const { user, tenantId } = useSelector((state: RootState) => state.auth);
  const effectiveTenantId = tenantId || 'chifa-mariana';
  const liveCashierFeed = useSelector((state: RootState) => state.kds.cashierFeed);

  const { data: shiftData, refetch: refetchShift } = useGetCurrentShiftQuery(undefined, {
    pollingInterval: 15000,
  });

  const activeShift = shiftData?.shift;
  const isShiftOpen = shiftData?.isShiftOpen ?? false;
  const isInGrace = shiftData?.isInGracePeriod ?? false;
  const minutesGrace = shiftData?.minutesRemainingInGrace ?? 0;

  const { data: activeOrders, refetch: refetchOrders } = useGetOrdersQuery(
    { activeOnly: true },
    { pollingInterval: 10000 },
  );

  const { data: shiftPayments, refetch: refetchPayments } = useGetPaymentsQuery(
    activeShift?.id ? { shiftId: String(activeShift.id) } : undefined,
  );

  const [openShift, { isLoading: isOpening }] = useOpenShiftMutation();
  const [closeShift, { isLoading: isClosing }] = useCloseShiftMutation();
  const [processPayment, { isLoading: isPaying }] = useProcessPaymentMutation();

  // Modales de Turno
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);

  // Modales de Cobranza POS, Pre-Cuenta y Comprobante Emitido
  const [selectedOrderForPreBill, setSelectedOrderForPreBill] = useState<any | null>(null);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<any | null>(null);
  const [emittedReceipt, setEmittedReceipt] = useState<any | null>(null);

  // Formulario Apertura
  const [initialCash, setInitialCash] = useState<number>(100);
  const [openNotes, setOpenNotes] = useState('');

  // Formulario Cierre / Arqueo
  const [declaredCash, setDeclaredCash] = useState<number>(0);
  const [closeNotes, setCloseNotes] = useState('');
  const [isCashierSocketConnected, setIsCashierSocketConnected] = useState(false);

  // Formulario Cobranza POS
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodOption>('CASH');
  const [receiptType, setReceiptType] = useState<ReceiptTypeOption>('TICKET');
  const [cashReceivedInput, setCashReceivedInput] = useState<number>(0);
  const [operationCode, setOperationCode] = useState<string>('');
  const [customerDocument, setCustomerDocument] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');

  useEffect(() => {
    if (shiftData?.shift?.expectedCash !== undefined) {
      setDeclaredCash(Number(shiftData.shift.expectedCash));
    }
  }, [shiftData]);

  // Suscripción en tiempo real a la Sala Inmutable de Caja
  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000/kds';
    const s = io(socketUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    s.on('connect', () => {
      setIsCashierSocketConnected(true);
      s.emit('join_cashier', { tenantId: effectiveTenantId });
    });

    s.on('disconnect', () => {
      setIsCashierSocketConnected(false);
    });

    s.on('cashier:order_ticket', (payload: any) => {
      dispatch(pushCashierTicket(payload));
      refetchOrders();
      toast.info(
        `[Caja] Nueva comanda recibida de ${payload.tableNumber || 'Salón'} (S/ ${Number(
          payload.totalAmount || 0,
        ).toFixed(2)})`,
      );
    });

    s.on('order:status_updated', () => {
      refetchOrders();
      refetchShift();
      refetchPayments();
    });

    return () => {
      s.disconnect();
    };
  }, [effectiveTenantId, dispatch, refetchOrders, refetchShift, refetchPayments]);

  // Métricas financieras del turno en curso al centavo
  const shiftMetrics = useMemo(() => {
    const list = shiftPayments || [];
    let cashSalesCents = 0;
    let yapeSalesCents = 0;
    let plinSalesCents = 0;
    let cardSalesCents = 0;

    for (const p of list) {
      const cents = Math.round(Number(p.amount || 0) * 100);
      if (p.paymentMethod === 'CASH') cashSalesCents += cents;
      else if (p.paymentMethod === 'YAPE') yapeSalesCents += cents;
      else if (p.paymentMethod === 'PLIN') plinSalesCents += cents;
      else if (p.paymentMethod === 'CARD') cardSalesCents += cents;
    }

    const digitalCents = yapeSalesCents + plinSalesCents + cardSalesCents;
    const totalSalesCents = cashSalesCents + digitalCents;

    return {
      cashSales: Number((cashSalesCents / 100).toFixed(2)),
      yapeSales: Number((yapeSalesCents / 100).toFixed(2)),
      plinSales: Number((plinSalesCents / 100).toFixed(2)),
      cardSales: Number((cardSalesCents / 100).toFixed(2)),
      digitalSales: Number((digitalCents / 100).toFixed(2)),
      totalSales: Number((totalSalesCents / 100).toFixed(2)),
      txCount: list.length,
    };
  }, [shiftPayments]);

  const openPaymentModal = (order: any) => {
    const orderTotal = Number(order.totalAmount || 0);
    setSelectedOrderForPayment(order);
    setPaymentMethod('CASH');
    setReceiptType('TICKET');
    setCashReceivedInput(orderTotal);
    setOperationCode('');
    setCustomerDocument('');
    setCustomerName(order.customerName || '');
  };

  // Cálculo en vivo de vuelto al centavo en el modal de cobranza
  const orderToPayTotal = selectedOrderForPayment
    ? Number(selectedOrderForPayment.totalAmount || 0)
    : 0;
  const calculatedChange = useMemo(() => {
    if (paymentMethod !== 'CASH') return 0;
    const recCents = Math.round(Number(cashReceivedInput || 0) * 100);
    const totCents = Math.round(orderToPayTotal * 100);
    return Number(((recCents - totCents) / 100).toFixed(2));
  }, [paymentMethod, cashReceivedInput, orderToPayTotal]);

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForPayment) return;

    if (!isShiftOpen) {
      toast.error('Debe abrir un turno de caja antes de cobrar una comanda.');
      return;
    }

    if (paymentMethod === 'CASH' && calculatedChange < 0) {
      toast.error('El monto en efectivo recibido es menor al total de la comanda.');
      return;
    }

    if (
      (paymentMethod === 'YAPE' || paymentMethod === 'PLIN' || paymentMethod === 'CARD') &&
      !operationCode.trim()
    ) {
      toast.error(`Ingresa el código de operación o referencia de ${paymentMethod}.`);
      return;
    }

    try {
      const res = await processPayment({
        orderId: selectedOrderForPayment.id || selectedOrderForPayment.orderId,
        paymentMethod,
        receiptType,
        cashReceived: paymentMethod === 'CASH' ? Number(cashReceivedInput) : orderToPayTotal,
        operationCode: operationCode.trim() || undefined,
        customerDocument: customerDocument.trim() || undefined,
        customerName: customerName.trim() || undefined,
      }).unwrap();

      toast.success(
        `¡Cobro exitoso! Comprobante ${res.payment.receiptNumber} emitido (${paymentMethod}).`,
      );

      setEmittedReceipt({
        ...res.payment,
        tableNumber: selectedOrderForPayment.tableNumber,
        orderNumber: selectedOrderForPayment.orderNumber,
        items: selectedOrderForPayment.items || [],
      });
      setSelectedOrderForPayment(null);
      refetchOrders();
      refetchShift();
      refetchPayments();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Error al procesar el cobro.');
    }
  };

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (initialCash < 0) {
      toast.error('El fondo inicial no puede ser negativo.');
      return;
    }

    try {
      await openShift({
        initialCash: Number(initialCash),
        notes: openNotes.trim() || undefined,
      }).unwrap();

      toast.success('¡Turno de caja abierto formalmente!');
      setShowOpenModal(false);
      setOpenNotes('');
      refetchShift();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Error al abrir el turno de caja.');
    }
  };

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (declaredCash < 0) {
      toast.error('El efectivo declarado no puede ser negativo.');
      return;
    }

    try {
      await closeShift({
        declaredCash: Number(declaredCash),
        notes: closeNotes.trim() || undefined,
      }).unwrap();

      toast.warning(
        `Turno cerrado. Ventana de gracia iniciada (2.5h restantes antes del cierre de sesión).`,
      );
      setShowCloseModal(false);
      setCloseNotes('');
      refetchShift();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Error al cerrar el turno.');
    }
  };

  // Cálculo en vivo de discrepancia de arqueo al centavo
  const expectedCash = activeShift ? Number(activeShift.expectedCash) : 0;
  const currentDifference = Number(
    ((Math.round(declaredCash * 100) - Math.round(expectedCash * 100)) / 100).toFixed(2),
  );

  const displayedOrders =
    activeOrders && activeOrders.length > 0 ? activeOrders : liveCashierFeed;

  return (
    <div className="min-h-screen bg-[#0B0F17] text-[#F8FAFC] p-4 md:p-8 flex flex-col font-sans">
      {/* Header Superior y Barra de Navegación */}
      <header className="max-w-6xl w-full mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-[#20293A] gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#F8FAFC]">
              Terminal de Caja POS & Turnos
            </h1>
            {isShiftOpen ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
                TURNO ABIERTO
              </span>
            ) : isInGrace ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#D97706]/15 text-[#D97706] border border-[#D97706]/30">
                <span className="w-2 h-2 rounded-full bg-[#D97706]"></span>
                VENTANA DE GRACIA ({minutesGrace} min)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#757681]/15 text-[#757681] border border-[#757681]/30">
                <span className="w-2 h-2 rounded-full bg-[#757681]"></span>
                CAJA CERRADA
              </span>
            )}
          </div>
          <p className="text-sm text-[#757681] mt-1">
            Restaurante:{' '}
            <span className="text-[#F8FAFC] font-medium">{effectiveTenantId}</span> | Operador:{' '}
            <span className="text-[#F8FAFC] font-medium">{user?.fullName || 'Personal'}</span>
          </p>
        </div>

      </header>

      {/* Contenido Principal */}
      <main className="max-w-6xl w-full mx-auto flex-1 py-8 flex flex-col gap-6">
        {/* Banner de Aviso de Sesión Persistente */}
        <div className="p-4 rounded-xl bg-[#131823] border border-[#20293A] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#2563EB]/15 flex items-center justify-center text-[#2563EB] font-bold">
              ℹ
            </div>
            <div>
              <p className="font-medium text-[#F8FAFC]">
                Regla de Sesión Persistente & Cuadre de Caja al Centavo
              </p>
              <p className="text-xs text-[#757681]">
                {isShiftOpen
                  ? 'El turno está ABIERTO. Puedes emitir Pre-Cuentas y cobrar en Efectivo (cálculo de vuelto), Yape, Plin y Tarjetas.'
                  : isInGrace
                  ? `El turno está CERRADO. Quedan ${minutesGrace} minutos de gracia antes de que el sistema desconecte las sesiones del local.`
                  : 'No hay turno activo. Los pedidos en comandero y cobros están estrictamente bloqueados (HTTP 412).'}
              </p>
            </div>
          </div>

          <div>
            {!isShiftOpen ? (
              <button
                onClick={() => setShowOpenModal(true)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#10B981] hover:bg-[#059669] text-white font-medium text-sm transition-all duration-150 active:scale-97 shadow-lg shadow-[#10B981]/20 flex items-center justify-center gap-2"
              >
                <span>+</span> Abrir Turno de Caja
              </button>
            ) : (
              <button
                onClick={() => setShowCloseModal(true)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#D97706] hover:bg-[#B45309] text-white font-medium text-sm transition-all duration-150 active:scale-97 shadow-lg shadow-[#D97706]/20 flex items-center justify-center gap-2"
              >
                <span>⏹</span> Arqueo & Cerrar Turno
              </button>
            )}
          </div>
        </div>

        {/* Dashboard de Tarjetas de Balance Financiero en JetBrains Mono */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl bg-[#131823] border border-[#20293A] flex flex-col justify-between">
            <span className="text-xs text-[#757681] uppercase tracking-wider font-semibold">
              Fondo Inicial en Caja
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-[#F8FAFC]">
                S/ {activeShift ? Number(activeShift.initialCash).toFixed(2) : '0.00'}
              </span>
            </div>
            <span className="text-xs text-[#757681] mt-2">
              Apertura: +S/ {shiftMetrics.cashSales.toFixed(2)} cobros efectivo
            </span>
          </div>

          <div className="p-5 rounded-xl bg-[#131823] border border-[#20293A] flex flex-col justify-between">
            <span className="text-xs text-[#757681] uppercase tracking-wider font-semibold">
              Efectivo Esperado en Gaveta
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-[#2563EB]">
                S/ {activeShift ? Number(activeShift.expectedCash).toFixed(2) : '0.00'}
              </span>
            </div>
            <span className="text-xs text-[#757681] mt-2">
              Fondo inicial + Cobros en efectivo
            </span>
          </div>

          <div className="p-5 rounded-xl bg-[#131823] border border-[#20293A] flex flex-col justify-between">
            <span className="text-xs text-[#757681] uppercase tracking-wider font-semibold">
              Cobros Digitales (Yape / Plin / Tarjeta)
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-[#10B981]">
                S/ {shiftMetrics.digitalSales.toFixed(2)}
              </span>
            </div>
            <span className="text-xs font-mono text-[#757681] mt-2">
              Yape: S/ {shiftMetrics.yapeSales.toFixed(2)} | Plin: S/{' '}
              {shiftMetrics.plinSales.toFixed(2)} | Card: S/ {shiftMetrics.cardSales.toFixed(2)}
            </span>
          </div>

          <div className="p-5 rounded-xl bg-[#131823] border border-[#20293A] flex flex-col justify-between">
            <span className="text-xs text-[#757681] uppercase tracking-wider font-semibold">
              Total Ventas del Turno ({shiftMetrics.txCount} cobros)
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-[#F8FAFC]">
                S/ {shiftMetrics.totalSales.toFixed(2)}
              </span>
            </div>
            <span className="text-xs text-[#757681] mt-2">
              Efectivo + Medios Digitales
            </span>
          </div>
        </div>

        {/* COLA DE COBRANZA POS EN TIEMPO REAL (COMANDAS PENDIENTES DE PAGO) */}
        <div className="p-6 rounded-xl bg-[#131823] border border-[#20293A] flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#20293A]">
            <div className="flex items-center gap-2.5">
              <Receipt className="w-5 h-5 text-[#10B981]" />
              <div>
                <h2 className="text-lg font-semibold text-[#F8FAFC]">
                  Cola de Cobranza POS & Comandas en Salón ({displayedOrders?.length || 0})
                </h2>
                <p className="text-xs text-[#94A3B8]">
                  Emite Pre-Cuentas o liquida la cuenta en Efectivo (con vuelto exacto), Yape, Plin o Tarjeta.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono ${
                  isCashierSocketConnected
                    ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30'
                    : 'bg-[#757681]/15 text-[#757681]'
                }`}
              >
                <Wifi className="w-3.5 h-3.5" />
                {isCashierSocketConnected ? 'SALA CAJA ACTIVA' : 'CONECTANDO...'}
              </span>
            </div>
          </div>

          {displayedOrders && displayedOrders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedOrders.map((ord: any) => (
                <div
                  key={ord.id || ord.orderId}
                  className="p-4 rounded-xl bg-[#0B0F17] border border-[#20293A] hover:border-[#2563EB]/50 flex flex-col justify-between gap-4 transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between border-b border-[#20293A] pb-2.5">
                      <div>
                        <span className="px-2.5 py-0.5 rounded-lg bg-[#2563EB]/20 text-[#60A5FA] font-mono font-bold text-xs">
                          {ord.tableNumber || 'Salón'}
                        </span>
                        <p className="text-xs font-mono text-[#757681] mt-1">
                          {ord.orderNumber || `#${String(ord.orderId || ord.id).slice(0, 6)}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-mono text-[#10B981] font-bold">
                          S/ {Number(ord.totalAmount || 0).toFixed(2)}
                        </span>
                        <p className="text-[11px] text-[#94A3B8] flex items-center justify-end gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {ord.status || 'PENDIENTE'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs mt-3">
                      {ord.items?.map((it: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-[#F8FAFC]">
                          <span>
                            <strong className="font-mono text-[#94A3B8]">{it.quantity}x</strong>{' '}
                            {it.productName}
                          </span>
                          <span className="font-mono text-[#94A3B8]">
                            S/{' '}
                            {Number(
                              it.subtotal ?? Number(it.price || it.unitPrice || 0) * it.quantity,
                            ).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Botones Táctiles de Pre-Cuenta y Cobro POS */}
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#20293A]">
                    <button
                      type="button"
                      onClick={() => setSelectedOrderForPreBill(ord)}
                      className="min-h-[44px] px-3 py-2 rounded-xl bg-[#131823] hover:bg-[#1A2234] border border-[#20293A] text-xs font-semibold text-[#94A3B8] hover:text-[#F8FAFC] flex items-center justify-center gap-1.5 transition active:scale-[0.97]"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#2563EB]" />
                      Pre-Cuenta
                    </button>

                    <button
                      type="button"
                      onClick={() => openPaymentModal(ord)}
                      className="min-h-[44px] px-3 py-2 rounded-xl bg-[#10B981] hover:bg-[#059669] text-[#0B0F17] text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-[#10B981]/20 transition active:scale-[0.97]"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      Cobrar S/ {Number(ord.totalAmount || 0).toFixed(2)}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-[#757681]">
              No hay comandas pendientes de cobro en este momento. Usa el{' '}
              <Link href="/comandero" className="text-[#2563EB] underline font-semibold">
                Comandero Móvil
              </Link>{' '}
              para registrar pedidos.
            </div>
          )}
        </div>

        {/* ÚLTIMOS COMPROBANTES EMITIDOS EN EL TURNO */}
        {shiftPayments && shiftPayments.length > 0 && (
          <div className="p-6 rounded-xl bg-[#131823] border border-[#20293A] flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#20293A]">
              <h2 className="text-base font-semibold text-[#F8FAFC] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                Comprobantes Cobrados en este Turno ({shiftPayments.length})
              </h2>
              <Link
                href="/admin/auditoria"
                className="text-xs text-[#2563EB] hover:underline font-medium"
              >
                Ver Reporte Analítico Completo &rarr;
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#20293A] text-[#757681] uppercase">
                    <th className="py-2 px-3">Comprobante</th>
                    <th className="py-2 px-3">Mesa / Orden</th>
                    <th className="py-2 px-3">Método</th>
                    <th className="py-2 px-3">Cód. Operación</th>
                    <th className="py-2 px-3 text-right">Monto</th>
                    <th className="py-2 px-3 text-right">Vuelto</th>
                    <th className="py-2 px-3 text-right">Hora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#20293A]/60">
                  {shiftPayments.slice(0, 10).map((p: any) => (
                    <tr key={p.id} className="hover:bg-[#1A2234]/50">
                      <td className="py-2.5 px-3 font-mono font-bold text-[#F8FAFC]">
                        {p.receiptNumber}{' '}
                        <span className="text-[10px] text-[#757681] font-normal">
                          ({p.receiptType})
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[#94A3B8]">
                        {p.order?.tableNumber || 'Salón'} ({p.order?.orderNumber || ''})
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                            p.paymentMethod === 'CASH'
                              ? 'bg-[#10B981]/15 text-[#10B981]'
                              : p.paymentMethod === 'YAPE'
                              ? 'bg-purple-500/20 text-purple-300'
                              : p.paymentMethod === 'PLIN'
                              ? 'bg-cyan-500/20 text-cyan-300'
                              : 'bg-[#2563EB]/20 text-[#60A5FA]'
                          }`}
                        >
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#94A3B8]">
                        {p.operationCode || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-[#10B981]">
                        S/ {Number(p.amount).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-[#94A3B8]">
                        S/ {Number(p.changeGiven || 0).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-[#757681]">
                        {new Date(p.paidAt).toLocaleTimeString('es-PE', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Detalle del Turno / Historial de Arqueo */}
        <div className="p-6 rounded-xl bg-[#131823] border border-[#20293A] flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#20293A]">
            <h2 className="text-lg font-semibold text-[#F8FAFC]">
              Detalle del Turno Actual o Último Registrado
            </h2>
            {activeShift && (
              <span className="text-xs font-mono text-[#757681]">
                ID Turno: #{activeShift.id}
              </span>
            )}
          </div>

          {activeShift ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between py-1.5 border-b border-[#20293A]/40">
                  <span className="text-[#757681]">Estado:</span>
                  <span className="font-semibold text-[#F8FAFC]">{activeShift.status}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#20293A]/40">
                  <span className="text-[#757681]">Fecha Apertura:</span>
                  <span className="font-mono text-[#F8FAFC]">
                    {new Date(activeShift.openedAt).toLocaleString('es-PE')}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#20293A]/40">
                  <span className="text-[#757681]">Aperturado por:</span>
                  <span className="text-[#F8FAFC]">
                    {activeShift.openedBy?.fullName || activeShift.openedById}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between py-1.5 border-b border-[#20293A]/40">
                  <span className="text-[#757681]">Fecha Cierre:</span>
                  <span className="font-mono text-[#F8FAFC]">
                    {activeShift.closedAt
                      ? new Date(activeShift.closedAt).toLocaleString('es-PE')
                      : 'En curso'}
                  </span>
                </div>
                {activeShift.status === 'CLOSED' && (
                  <>
                    <div className="flex justify-between py-1.5 border-b border-[#20293A]/40">
                      <span className="text-[#757681]">Efectivo Declarado:</span>
                      <span className="font-mono font-bold text-[#F8FAFC]">
                        S/ {Number(activeShift.declaredCash ?? 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-[#20293A]/40">
                      <span className="text-[#757681]">Diferencia de Arqueo:</span>
                      <span
                        className={`font-mono font-bold ${
                          Number(activeShift.difference ?? 0) === 0
                            ? 'text-[#10B981]'
                            : Number(activeShift.difference ?? 0) < 0
                            ? 'text-red-400'
                            : 'text-[#2563EB]'
                        }`}
                      >
                        S/ {Number(activeShift.difference ?? 0).toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
                {activeShift.notes && (
                  <div className="flex justify-between py-1.5 border-b border-[#20293A]/40">
                    <span className="text-[#757681]">Notas:</span>
                    <span className="text-[#94A3B8] italic">{activeShift.notes}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-[#757681]">
              <p>No se registran turnos en este momento para este restaurante.</p>
              <button
                onClick={() => setShowOpenModal(true)}
                className="mt-4 px-4 py-2 rounded-lg bg-[#2563EB] text-white text-sm font-medium hover:bg-[#1D4ED8] transition-all active:scale-97"
              >
                Abrir Primer Turno
              </button>
            </div>
          )}
        </div>
      </main>

      {/* MODAL PRE-CUENTA DE MESA */}
      {selectedOrderForPreBill && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131823] border border-[#20293A] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#20293A]">
              <div>
                <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-[#2563EB]/20 text-[#60A5FA]">
                  PRE-CUENTA DE CONSUMO
                </span>
                <h3 className="text-lg font-bold text-[#F8FAFC] mt-1">
                  {selectedOrderForPreBill.tableNumber || 'Salón'} &bull;{' '}
                  <span className="font-mono text-sm text-[#94A3B8]">
                    {selectedOrderForPreBill.orderNumber}
                  </span>
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrderForPreBill(null)}
                className="text-[#757681] hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#0B0F17] border border-[#20293A] rounded-xl p-4 space-y-2.5 text-xs">
              <div className="flex justify-between text-[#757681] border-b border-[#20293A] pb-2">
                <span>CANT. / DESCRIPCIÓN</span>
                <span>SUBTOTAL</span>
              </div>
              {selectedOrderForPreBill.items?.map((item: any, idx: number) => {
                const sub = Number(
                  item.subtotal ?? Number(item.unitPrice || item.price || 0) * item.quantity,
                );
                return (
                  <div key={idx} className="flex justify-between text-[#F8FAFC]">
                    <span>
                      <strong className="font-mono text-[#60A5FA]">{item.quantity}x</strong>{' '}
                      {item.productName}
                    </span>
                    <span className="font-mono">S/ {sub.toFixed(2)}</span>
                  </div>
                );
              })}

              <div className="border-t border-[#20293A] pt-2.5 space-y-1">
                <div className="flex justify-between text-[#94A3B8]">
                  <span>Op. Gravada (Base):</span>
                  <span className="font-mono">
                    S/ {(Number(selectedOrderForPreBill.totalAmount || 0) / 1.18).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-[#94A3B8]">
                  <span>IGV (18%):</span>
                  <span className="font-mono">
                    S/{' '}
                    {(
                      Number(selectedOrderForPreBill.totalAmount || 0) -
                      Number(selectedOrderForPreBill.totalAmount || 0) / 1.18
                    ).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold text-[#10B981] pt-1">
                  <span>TOTAL A PAGAR:</span>
                  <span className="font-mono">
                    S/ {Number(selectedOrderForPreBill.totalAmount || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 min-h-[46px] rounded-xl bg-[#1A2234] hover:bg-[#20293A] text-xs font-semibold text-[#F8FAFC] flex items-center justify-center gap-1.5 transition active:scale-[0.97]"
              >
                <Printer className="w-4 h-4" />
                Imprimir Pre-Cuenta
              </button>
              <button
                type="button"
                onClick={() => {
                  const ord = selectedOrderForPreBill;
                  setSelectedOrderForPreBill(null);
                  openPaymentModal(ord);
                }}
                className="flex-1 min-h-[46px] rounded-xl bg-[#10B981] hover:bg-[#059669] text-[#0B0F17] text-xs font-black flex items-center justify-center gap-1.5 transition active:scale-[0.97]"
              >
                <CreditCard className="w-4 h-4" />
                Proceder al Cobro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE COBRANZA POS MULTI-MÉTODO (EFECTIVO, YAPE, PLIN, TARJETA) */}
      {selectedOrderForPayment && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131823] border border-[#20293A] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#20293A]">
              <div>
                <h3 className="text-xl font-bold text-[#F8FAFC]">
                  Liquidar y Cobrar Comanda
                </h3>
                <p className="text-xs text-[#94A3B8] font-mono mt-0.5">
                  {selectedOrderForPayment.tableNumber || 'Salón'} &bull;{' '}
                  {selectedOrderForPayment.orderNumber}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-[#757681] block">Total a Cobrar</span>
                <span className="text-2xl font-black font-mono text-[#10B981]">
                  S/ {orderToPayTotal.toFixed(2)}
                </span>
              </div>
            </div>

            <form onSubmit={handleConfirmPayment} className="space-y-4">
              {/* Selector de Método de Pago */}
              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] uppercase mb-2">
                  1. Método de Pago
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    [
                      { id: 'CASH', label: 'Efectivo', icon: Banknote, color: '#10B981' },
                      { id: 'YAPE', label: 'Yape', icon: QrCode, color: '#A855F7' },
                      { id: 'PLIN', label: 'Plin', icon: QrCode, color: '#06B6D4' },
                      { id: 'CARD', label: 'Tarjeta', icon: CreditCard, color: '#2563EB' },
                    ] as const
                  ).map((m) => {
                    const Icon = m.icon;
                    const isSelected = paymentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id)}
                        className={`min-h-[52px] p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all active:scale-[0.97] ${
                          isSelected
                            ? 'bg-[#1A2234] border-[#2563EB] text-white shadow-md'
                            : 'bg-[#0B0F17] border-[#20293A] text-[#94A3B8] hover:text-white'
                        }`}
                      >
                        <Icon className="w-4 h-4" style={{ color: m.color }} />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sección Condicional: Efectivo (Billetes rápidos y Vuelto al centavo) vs Digital (Código Operación) */}
              {paymentMethod === 'CASH' ? (
                <div className="p-4 rounded-xl bg-[#0B0F17] border border-[#20293A] space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#94A3B8] uppercase">
                      Efectivo Recibido del Cliente (S/)
                    </label>
                    <button
                      type="button"
                      onClick={() => setCashReceivedInput(orderToPayTotal)}
                      className="text-xs font-mono text-[#2563EB] hover:underline"
                    >
                      Monto Exacto (S/ {orderToPayTotal.toFixed(2)})
                    </button>
                  </div>

                  <input
                    type="number"
                    step="0.10"
                    min="0"
                    required
                    value={cashReceivedInput}
                    onChange={(e) => setCashReceivedInput(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#131823] border border-[#20293A] focus:border-[#2563EB] rounded-xl px-4 py-3 font-mono font-bold text-xl text-[#F8FAFC] focus:outline-none"
                  />

                  {/* Botones de billetes rápidos */}
                  <div className="grid grid-cols-5 gap-1.5">
                    {[orderToPayTotal, 20, 50, 100, 200].map((val, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setCashReceivedInput(Number(val.toFixed(2)))}
                        className="min-h-[40px] rounded-lg bg-[#1A2234] hover:bg-[#20293A] border border-[#20293A] text-xs font-mono font-semibold text-[#F8FAFC] transition active:scale-[0.97]"
                      >
                        {i === 0 ? 'Exacto' : `S/ ${val}`}
                      </button>
                    ))}
                  </div>

                  {/* Caja de Vuelto Exacto al Centavo */}
                  <div className="pt-2 border-t border-[#20293A] flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#94A3B8] uppercase">
                      Vuelto a Entregar:
                    </span>
                    <span
                      className={`text-xl font-black font-mono ${
                        calculatedChange >= 0 ? 'text-[#10B981]' : 'text-red-400'
                      }`}
                    >
                      {calculatedChange >= 0
                        ? `S/ ${calculatedChange.toFixed(2)}`
                        : `Faltan S/ ${Math.abs(calculatedChange).toFixed(2)}`}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#0B0F17] border border-[#20293A] space-y-2">
                  <label className="block text-xs font-semibold text-[#94A3B8] uppercase">
                    Código de Operación / Voucher ({paymentMethod}) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={`Ej: ${paymentMethod}-849201`}
                    value={operationCode}
                    onChange={(e) => setOperationCode(e.target.value)}
                    className="w-full bg-[#131823] border border-[#20293A] focus:border-[#2563EB] rounded-xl px-4 py-3 font-mono font-bold text-base text-[#F8FAFC] placeholder-[#757681] focus:outline-none"
                  />
                  <p className="text-[11px] text-[#757681]">
                    El monto digital (S/ {orderToPayTotal.toFixed(2)}) se registra en auditoría sin alterar el efectivo físico de la gaveta.
                  </p>
                </div>
              )}

              {/* Selector de Tipo de Comprobante */}
              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] uppercase mb-2">
                  2. Tipo de Comprobante
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['TICKET', 'BOLETA', 'FACTURA'] as const).map((rt) => (
                    <button
                      key={rt}
                      type="button"
                      onClick={() => setReceiptType(rt)}
                      className={`min-h-[42px] rounded-xl border text-xs font-bold transition active:scale-[0.97] ${
                        receiptType === rt
                          ? 'bg-[#2563EB] border-[#2563EB] text-white'
                          : 'bg-[#0B0F17] border-[#20293A] text-[#94A3B8]'
                      }`}
                    >
                      {rt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Datos opcionales del cliente para Boleta / Factura */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] text-[#757681] uppercase mb-1">
                    DNI / RUC (Opcional)
                  </label>
                  <input
                    type="text"
                    value={customerDocument}
                    onChange={(e) => setCustomerDocument(e.target.value)}
                    placeholder="Ej. 71234567 o 20123456789"
                    className="w-full bg-[#0B0F17] border border-[#20293A] rounded-xl px-3 py-2 text-xs font-mono text-[#F8FAFC]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#757681] uppercase mb-1">
                    Cliente / Razón Social
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Cliente General"
                    className="w-full bg-[#0B0F17] border border-[#20293A] rounded-xl px-3 py-2 text-xs text-[#F8FAFC]"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-[#20293A]">
                <button
                  type="button"
                  onClick={() => setSelectedOrderForPayment(null)}
                  className="px-4 py-3 rounded-xl bg-[#1A2234] text-xs font-semibold text-[#94A3B8] hover:text-white transition active:scale-[0.97]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPaying || (paymentMethod === 'CASH' && calculatedChange < 0)}
                  className="flex-1 py-3 rounded-xl bg-[#10B981] hover:bg-[#059669] disabled:opacity-50 text-[#0B0F17] font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#10B981]/25 transition active:scale-[0.97]"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {isPaying
                      ? 'Procesando Cobro...'
                      : `CONFIRMAR COBRO (S/ ${orderToPayTotal.toFixed(2)})`}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL COMPROBANTE EMITIDO EXITOSAMENTE */}
      {emittedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131823] border-2 border-[#10B981] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="text-center space-y-1 pb-3 border-b border-[#20293A]">
              <div className="w-12 h-12 rounded-full bg-[#10B981]/20 text-[#10B981] flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#F8FAFC]">
                ¡Comprobante Emitido!
              </h3>
              <p className="text-xs font-mono text-[#10B981] font-bold">
                {emittedReceipt.receiptType} N° {emittedReceipt.receiptNumber}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#0B0F17] border border-[#20293A] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#757681]">Mesa / Orden:</span>
                <span className="font-mono text-[#F8FAFC]">
                  {emittedReceipt.tableNumber} ({emittedReceipt.orderNumber})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#757681]">Método de Pago:</span>
                <span className="font-mono font-bold text-[#60A5FA]">
                  {emittedReceipt.paymentMethod}
                </span>
              </div>
              {emittedReceipt.operationCode && (
                <div className="flex justify-between">
                  <span className="text-[#757681]">Cód. Operación:</span>
                  <span className="font-mono text-[#F8FAFC]">
                    {emittedReceipt.operationCode}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-[#20293A]">
                <span className="text-[#94A3B8] font-semibold">Total Cobrado:</span>
                <span className="font-mono font-bold text-sm text-[#10B981]">
                  S/ {Number(emittedReceipt.amount).toFixed(2)}
                </span>
              </div>
              {emittedReceipt.paymentMethod === 'CASH' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-[#757681]">Efectivo Recibido:</span>
                    <span className="font-mono text-[#F8FAFC]">
                      S/ {Number(emittedReceipt.cashReceived).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#757681]">Vuelto Entregado:</span>
                    <span className="font-mono font-bold text-[#10B981]">
                      S/ {Number(emittedReceipt.changeGiven).toFixed(2)}
                    </span>
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setEmittedReceipt(null)}
              className="w-full py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs transition active:scale-[0.97]"
            >
              Listo & Continuar en Caja
            </button>
          </div>
        </div>
      )}

      {/* MODAL 1: Apertura de Turno */}
      {showOpenModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131823] border border-[#20293A] rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#20293A]">
              <h3 className="text-xl font-bold text-[#F8FAFC]">
                Apertura Formal de Turno
              </h3>
              <button
                onClick={() => setShowOpenModal(false)}
                className="text-[#757681] hover:text-[#F8FAFC] text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleOpenShift} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#757681] uppercase mb-1">
                  Fondo Inicial de Caja (Efectivo S/)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-mono text-[#757681]">
                    S/
                  </span>
                  <input
                    type="number"
                    step="0.10"
                    min="0"
                    required
                    value={initialCash}
                    onChange={(e) => setInitialCash(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#0B0F17] border border-[#20293A] rounded-lg pl-9 pr-3 py-2.5 font-mono font-bold text-lg text-[#F8FAFC] focus:outline-none focus:border-[#2563EB]"
                  />
                </div>

                {/* Botones de incremento rápido */}
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {[50, 100, 150, 200].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setInitialCash(amount)}
                      className="py-1.5 px-2 bg-[#1A2234] hover:bg-[#20293A] border border-[#20293A] rounded text-xs font-mono text-[#F8FAFC] transition-all active:scale-97"
                    >
                      S/ {amount}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#757681] uppercase mb-1">
                  Notas u Observaciones (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={openNotes}
                  onChange={(e) => setOpenNotes(e.target.value)}
                  placeholder="Ej: Turno de almuerzo iniciado con sencillo para cambio..."
                  className="w-full bg-[#0B0F17] border border-[#20293A] rounded-lg p-2.5 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOpenModal(false)}
                  className="flex-1 py-2.5 rounded-lg bg-[#1A2234] hover:bg-[#20293A] text-sm text-[#94A3B8] font-medium transition-all active:scale-97"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isOpening}
                  className="flex-1 py-2.5 rounded-lg bg-[#10B981] hover:bg-[#059669] text-white text-sm font-semibold transition-all active:scale-97 disabled:opacity-50"
                >
                  {isOpening ? 'Aperturando...' : 'Confirmar Apertura'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Cierre y Arqueo de Turno */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131823] border border-[#20293A] rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#20293A]">
              <h3 className="text-xl font-bold text-[#F8FAFC]">
                Cierre de Turno & Arqueo de Caja
              </h3>
              <button
                onClick={() => setShowCloseModal(false)}
                className="text-[#757681] hover:text-[#F8FAFC] text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCloseShift} className="flex flex-col gap-4">
              {/* Resumen de Caja al Centavo */}
              <div className="p-3.5 rounded-lg bg-[#0B0F17] border border-[#20293A] space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#757681]">Fondo Inicial:</span>
                  <span className="font-mono text-[#F8FAFC]">
                    S/ {activeShift ? Number(activeShift.initialCash).toFixed(2) : '0.00'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#757681]">+ Ventas Cobradas en Efectivo:</span>
                  <span className="font-mono text-[#10B981]">
                    S/ {shiftMetrics.cashSales.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-[#20293A]">
                  <span className="text-[#94A3B8] font-semibold">Efectivo Esperado en Gaveta:</span>
                  <span className="font-mono font-bold text-sm text-[#2563EB]">
                    S/ {expectedCash.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#757681]">Efectivo Contado en Mano:</span>
                  <span className="font-mono font-bold text-[#F8FAFC]">
                    S/ {declaredCash.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-[#20293A]">
                  <span className="font-medium text-[#757681]">Discrepancia (Diferencia):</span>
                  <span
                    className={`font-mono font-bold ${
                      currentDifference === 0
                        ? 'text-[#10B981]'
                        : currentDifference < 0
                        ? 'text-red-400'
                        : 'text-[#2563EB]'
                    }`}
                  >
                    {currentDifference === 0
                      ? 'S/ 0.00 (Cuadrada al Centavo)'
                      : `S/ ${currentDifference.toFixed(2)} ${
                          currentDifference < 0 ? '(Faltante)' : '(Sobrante)'
                        }`}
                  </span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-[#20293A] text-[11px] text-[#94A3B8]">
                  <span>Cobros Digitales (Yape/Plin/Card):</span>
                  <span className="font-mono font-bold text-[#10B981]">
                    S/ {shiftMetrics.digitalSales.toFixed(2)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#757681] uppercase mb-1">
                  Efectivo Total Contado en Arqueo (S/)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-mono text-[#757681]">
                    S/
                  </span>
                  <input
                    type="number"
                    step="0.10"
                    min="0"
                    required
                    value={declaredCash}
                    onChange={(e) => setDeclaredCash(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#0B0F17] border border-[#20293A] rounded-lg pl-9 pr-3 py-2.5 font-mono font-bold text-lg text-[#F8FAFC] focus:outline-none focus:border-[#D97706]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#757681] uppercase mb-1">
                  Notas de Cierre (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  placeholder="Ej: Arqueo sin incidentes, billetes ordenados..."
                  className="w-full bg-[#0B0F17] border border-[#20293A] rounded-lg p-2.5 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#D97706]"
                />
              </div>

              {/* Advertencia de Ventana de Gracia */}
              <div className="p-3 rounded-lg bg-[#D97706]/10 border border-[#D97706]/30 text-xs text-[#D97706] leading-relaxed">
                ⚠️ Al confirmar el cierre, se activará una ventana de gracia de{' '}
                <strong>2.5 horas (150 minutos)</strong>. Al terminar dicho plazo,
                todas las sesiones del restaurante caducarán automáticamente por seguridad.
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCloseModal(false)}
                  className="flex-1 py-2.5 rounded-lg bg-[#1A2234] hover:bg-[#20293A] text-sm text-[#94A3B8] font-medium transition-all active:scale-97"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isClosing}
                  className="flex-1 py-2.5 rounded-lg bg-[#D97706] hover:bg-[#B45309] text-white text-sm font-semibold transition-all active:scale-97 disabled:opacity-50"
                >
                  {isClosing ? 'Cerrando...' : 'Confirmar Cierre de Turno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
