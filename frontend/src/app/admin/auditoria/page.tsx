'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  useGetFinancialAuditQuery,
  useGetShiftsHistoryQuery,
} from '../../../store/services/api';

type PaymentMethod = 'CASH' | 'YAPE' | 'PLIN' | 'CARD';

interface ProductRankingItem {
  productId: string;
  productName: string;
  quantitySold: number;
  totalRevenue: number;
}

interface ShiftAuditItem {
  id: string;
  status: 'OPEN' | 'CLOSED';
  openedBy: string;
  closedBy: string | null;
  initialCash: number;
  expectedCash: number;
  declaredCash: number | null;
  difference: number | null;
  openedAt: string;
  closedAt: string | null;
}

interface PaymentRecordItem {
  id: string;
  orderId: string;
  receiptNumber: string;
  receiptType: 'TICKET' | 'BOLETA' | 'FACTURA';
  paymentMethod: PaymentMethod;
  amount: number;
  cashReceived?: number | null;
  receivedAmount?: number | null;
  changeGiven: number;
  operationCode: string | null;
  customerDocument: string | null;
  customerName: string | null;
  paidAt: string;
}

const PAYMENT_LABELS: Record<PaymentMethod, { label: string; color: string; bg: string }> = {
  CASH: {
    label: 'Efectivo',
    color: 'text-[#10B981]',
    bg: 'bg-[#10B981]/10 border-[#10B981]/30',
  },
  YAPE: {
    label: 'Yape',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/30',
  },
  PLIN: {
    label: 'Plin',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/30',
  },
  CARD: {
    label: 'Tarjeta POS',
    color: 'text-[#2563EB]',
    bg: 'bg-[#2563EB]/10 border-[#2563EB]/30',
  },
};

export default function AuditoriaFinancieraPage() {
  const [selectedShiftId, setSelectedShiftId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'ranking' | 'arqueos' | 'comprobantes'>('ranking');

  const { data: shiftsHistory = [] } = useGetShiftsHistoryQuery();

  const {
    data: auditData,
    isLoading,
    isFetching,
    refetch,
  } = useGetFinancialAuditQuery({
    shiftId: selectedShiftId || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const rawSummary = auditData?.summary;
  const breakdownMethods = auditData?.paymentMethodsBreakdown;
  const breakdownReceipts = auditData?.receiptsBreakdown;

  const summary = {
    totalRevenue: Number(rawSummary?.totalRevenue ?? 0),
    totalTransactions: Number(rawSummary?.totalTransactions ?? 0),
    averageTicket: Number(rawSummary?.averageTicket ?? 0),
    cashRevenue: Number(rawSummary?.cashRevenue ?? 0),
    digitalRevenue: Number(rawSummary?.digitalRevenue ?? 0),
    byPaymentMethod: {
      CASH: Number(rawSummary?.byPaymentMethod?.CASH ?? breakdownMethods?.CASH?.total ?? 0),
      YAPE: Number(rawSummary?.byPaymentMethod?.YAPE ?? breakdownMethods?.YAPE?.total ?? 0),
      PLIN: Number(rawSummary?.byPaymentMethod?.PLIN ?? breakdownMethods?.PLIN?.total ?? 0),
      CARD: Number(rawSummary?.byPaymentMethod?.CARD ?? breakdownMethods?.CARD?.total ?? 0),
    },
    byReceiptType: {
      TICKET: Number(rawSummary?.byReceiptType?.TICKET ?? breakdownReceipts?.TICKET?.total ?? 0),
      BOLETA: Number(rawSummary?.byReceiptType?.BOLETA ?? breakdownReceipts?.BOLETA?.total ?? 0),
      FACTURA: Number(rawSummary?.byReceiptType?.FACTURA ?? breakdownReceipts?.FACTURA?.total ?? 0),
    },
  };

  const productRanking: ProductRankingItem[] = auditData?.productSalesRanking ?? [];
  const shiftsAudit: ShiftAuditItem[] = auditData?.shiftsAudit ?? [];
  const recentPayments: PaymentRecordItem[] = auditData?.recentPayments ?? [];

  const clearFilters = () => {
    setSelectedShiftId('');
    setStartDate('');
    setEndDate('');
  };

  return (
    <main className="min-h-screen bg-[#0B0F17] text-[#F8FAFC] p-6 md:p-8 select-none">
      {/* Header Ejecutivo */}
      <header className="max-w-7xl mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 mb-6 border-b border-white/[0.07]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#10B981]" />
            <span className="text-xs uppercase tracking-widest text-[#94A3B8] font-mono">
              ADMINISTRACIÓN & FINANZAS • AUDITORÍA MULTI-TENANT
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight mt-1">
            Auditoría Financiera, Arqueos & Ranking de Ventas
          </h1>
          <p className="text-sm text-[#94A3B8] mt-0.5">
            Cuadre de caja al centavo, desglose por medio de pago (Efectivo, Yape, Plin, POS) y rotación de carta
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/caja/turno"
            className="min-h-[44px] px-4 py-2.5 rounded-lg bg-[#2563EB] hover:bg-blue-600 text-xs font-medium text-white transition-all duration-150 active:scale-[0.98] flex items-center"
          >
            Terminal POS Caja
          </Link>
          <Link
            href="/comandero"
            className="min-h-[44px] px-3.5 py-2.5 rounded-lg bg-[#131823] hover:bg-[#1A2234] border border-white/[0.08] text-xs font-medium text-[#94A3B8] hover:text-[#F8FAFC] transition-all duration-150 flex items-center"
          >
            Comandero Salón
          </Link>
          <Link
            href="/admin/carta"
            className="min-h-[44px] px-3.5 py-2.5 rounded-lg bg-[#131823] hover:bg-[#1A2234] border border-white/[0.08] text-xs font-medium text-[#94A3B8] hover:text-[#F8FAFC] transition-all duration-150 flex items-center"
          >
            Carta & Precios
          </Link>
          <Link
            href="/admin/inventario"
            className="min-h-[44px] px-3.5 py-2.5 rounded-lg bg-[#131823] hover:bg-[#1A2234] border border-white/[0.08] text-xs font-medium text-[#94A3B8] hover:text-[#F8FAFC] transition-all duration-150 flex items-center"
          >
            Inventario Kardex
          </Link>
        </div>
      </header>

      {/* Barra de Filtros de Auditoría */}
      <section className="max-w-7xl mx-auto mb-6 bg-[#131823] border border-white/[0.07] rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-end justify-between gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-[#94A3B8] mb-1.5 font-medium">
              Filtrar por Turno de Caja
            </label>
            <select
              value={selectedShiftId}
              onChange={(e) => setSelectedShiftId(e.target.value)}
              className="w-full min-h-[42px] bg-[#0B0F17] border border-white/[0.1] rounded-lg px-3 py-2 text-xs font-mono text-[#F8FAFC] focus:outline-none focus:border-[#2563EB]"
            >
              <option value="">Todos los turnos históricos</option>
              {shiftsHistory.map((shift: any) => (
                <option key={shift.id} value={shift.id}>
                  #{String(shift.id).slice(0, 8)} • {shift.status} •{' '}
                  {new Date(shift.openedAt).toLocaleDateString('es-PE')} (S/{' '}
                  {Number(shift.expectedCash).toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-[#94A3B8] mb-1.5 font-medium">
              Fecha Inicio
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full min-h-[42px] bg-[#0B0F17] border border-white/[0.1] rounded-lg px-3 py-2 text-xs font-mono text-[#F8FAFC] focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-[#94A3B8] mb-1.5 font-medium">
              Fecha Fin
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full min-h-[42px] bg-[#0B0F17] border border-white/[0.1] rounded-lg px-3 py-2 text-xs font-mono text-[#F8FAFC] focus:outline-none focus:border-[#2563EB]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {(selectedShiftId || startDate || endDate) && (
            <button
              type="button"
              onClick={clearFilters}
              className="min-h-[42px] px-3.5 py-2 rounded-lg bg-[#1A2234] hover:bg-[#20293A] border border-white/[0.08] text-xs font-medium text-[#94A3B8] hover:text-[#F8FAFC] transition-all"
            >
              Limpiar Filtros
            </button>
          )}
          <button
            type="button"
            onClick={() => refetch()}
            className="min-h-[42px] px-4 py-2 rounded-lg bg-[#1A2234] hover:bg-[#20293A] border border-white/[0.1] text-xs font-medium text-[#F8FAFC] transition-all active:scale-[0.98]"
          >
            {isFetching ? 'Actualizando...' : 'Sincronizar Ahora'}
          </button>
        </div>
      </section>

      {/* Tarjetas KPI Principales (Executive Precision Dark + JetBrains Mono) */}
      <section className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#131823] border border-white/[0.07] rounded-xl p-5">
          <span className="text-xs uppercase tracking-wider text-[#94A3B8]">
            Ventas Totales Consolidadas
          </span>
          <p className="text-2xl font-mono font-semibold text-[#10B981] mt-2">
            S/ {Number(summary.totalRevenue).toFixed(2)}
          </p>
          <p className="text-[11px] text-[#64748B] mt-1 font-mono">
            {summary.totalTransactions} comprobantes cobrados
          </p>
        </div>

        <div className="bg-[#131823] border border-white/[0.07] rounded-xl p-5">
          <span className="text-xs uppercase tracking-wider text-[#94A3B8]">
            Recaudación Efectivo (Gaveta)
          </span>
          <p className="text-2xl font-mono font-semibold text-[#F8FAFC] mt-2">
            S/ {Number(summary.cashRevenue).toFixed(2)}
          </p>
          <p className="text-[11px] text-[#64748B] mt-1">
            Impacta directamente el arqueo físico
          </p>
        </div>

        <div className="bg-[#131823] border border-white/[0.07] rounded-xl p-5">
          <span className="text-xs uppercase tracking-wider text-[#94A3B8]">
            Cobros Digitales (Yape / Plin / POS)
          </span>
          <p className="text-2xl font-mono font-semibold text-[#2563EB] mt-2">
            S/ {Number(summary.digitalRevenue).toFixed(2)}
          </p>
          <p className="text-[11px] text-[#64748B] mt-1">
            Conciliación bancaria con código de operación
          </p>
        </div>

        <div className="bg-[#131823] border border-white/[0.07] rounded-xl p-5">
          <span className="text-xs uppercase tracking-wider text-[#94A3B8]">
            Ticket Promedio por Orden
          </span>
          <p className="text-2xl font-mono font-semibold text-[#F8FAFC] mt-2">
            S/ {Number(summary.averageTicket).toFixed(2)}
          </p>
          <p className="text-[11px] text-[#64748B] mt-1 font-mono">
            Boletas: S/ {Number(summary.byReceiptType.BOLETA).toFixed(2)} • Facturas: S/{' '}
            {Number(summary.byReceiptType.FACTURA).toFixed(2)}
          </p>
        </div>
      </section>

      {/* Desglose por Medio de Pago */}
      <section className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {(['CASH', 'YAPE', 'PLIN', 'CARD'] as PaymentMethod[]).map((method) => {
          const meta = PAYMENT_LABELS[method];
          const amount = summary.byPaymentMethod[method] ?? 0;
          const percentage =
            summary.totalRevenue > 0
              ? Math.round((amount / summary.totalRevenue) * 100)
              : 0;

          return (
            <div
              key={method}
              className="bg-[#131823] border border-white/[0.07] rounded-xl p-4 flex items-center justify-between"
            >
              <div>
                <span
                  className={`inline-block text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${meta.bg} ${meta.color}`}
                >
                  {meta.label}
                </span>
                <p className="text-lg font-mono font-semibold text-[#F8FAFC] mt-2">
                  S/ {Number(amount).toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono text-[#94A3B8]">{percentage}%</span>
                <div className="w-16 h-1.5 bg-[#0B0F17] rounded-full overflow-hidden mt-1.5">
                  <div
                    className="h-full bg-[#2563EB] rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, percentage)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Selector de Pestañas Analíticas */}
      <section className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 bg-[#131823] p-1.5 rounded-xl border border-white/[0.07]">
            <button
              type="button"
              onClick={() => setActiveTab('ranking')}
              className={`min-h-[40px] px-4 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                activeTab === 'ranking'
                  ? 'bg-[#2563EB] text-white shadow'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              Ranking de Ventas por Plato ({productRanking.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('arqueos')}
              className={`min-h-[40px] px-4 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                activeTab === 'arqueos'
                  ? 'bg-[#2563EB] text-white shadow'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              Historial Inmutable de Arqueos ({shiftsAudit.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('comprobantes')}
              className={`min-h-[40px] px-4 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                activeTab === 'comprobantes'
                  ? 'bg-[#2563EB] text-white shadow'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              Bitácora de Comprobantes ({recentPayments.length})
            </button>
          </div>

          {isLoading && (
            <span className="text-xs font-mono text-[#94A3B8]">
              Cargando telemetría financiera...
            </span>
          )}
        </div>

        {/* TAB 1: Ranking de Ventas por Producto */}
        {activeTab === 'ranking' && (
          <div className="bg-[#131823] border border-white/[0.07] rounded-xl overflow-hidden">
            <div className="p-5 border-b border-white/[0.07] flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-[#F8FAFC]">
                  Ranking Analítico de Platos y Bebidas Vendidas
                </h2>
                <p className="text-xs text-[#94A3B8] mt-0.5">
                  Calculado exclusivamente sobre comandas con estado PAID (cobradas en caja)
                </p>
              </div>
              <span className="text-xs font-mono text-[#94A3B8]">
                {productRanking.reduce((acc: number, item: ProductRankingItem) => acc + item.quantitySold, 0)} unidades despachadas
              </span>
            </div>

            {productRanking.length === 0 ? (
              <div className="p-10 text-center text-sm text-[#64748B]">
                Aún no se registran ventas pagadas para los filtros seleccionados.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.07] text-[11px] uppercase tracking-wider text-[#94A3B8] bg-[#0B0F17]/40">
                      <th className="py-3.5 px-5 font-medium"># Posición</th>
                      <th className="py-3.5 px-5 font-medium">Plato / Producto de Carta</th>
                      <th className="py-3.5 px-5 font-medium text-right">Unidades Vendidas</th>
                      <th className="py-3.5 px-5 font-medium text-right">Ingresos Generados</th>
                      <th className="py-3.5 px-5 font-medium text-right">Participación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05] text-sm">
                    {productRanking.map((item: ProductRankingItem, idx: number) => {
                      const share =
                        summary.totalRevenue > 0
                          ? Math.round((item.totalRevenue / summary.totalRevenue) * 100)
                          : 0;

                      return (
                        <tr
                          key={item.productId}
                          className="hover:bg-[#1A2234]/60 transition-colors"
                        >
                          <td className="py-3.5 px-5 font-mono text-xs text-[#94A3B8]">
                            #{String(idx + 1).padStart(2, '0')}
                          </td>
                          <td className="py-3.5 px-5 font-medium text-[#F8FAFC]">
                            {item.productName}
                          </td>
                          <td className="py-3.5 px-5 text-right font-mono text-[#F8FAFC]">
                            {item.quantitySold} und.
                          </td>
                          <td className="py-3.5 px-5 text-right font-mono font-semibold text-[#10B981]">
                            S/ {Number(item.totalRevenue).toFixed(2)}
                          </td>
                          <td className="py-3.5 px-5 text-right font-mono text-xs text-[#94A3B8]">
                            {share}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Historial Inmutable de Arqueos de Turno */}
        {activeTab === 'arqueos' && (
          <div className="bg-[#131823] border border-white/[0.07] rounded-xl overflow-hidden">
            <div className="p-5 border-b border-white/[0.07]">
              <h2 className="text-base font-semibold text-[#F8FAFC]">
                Historial Inmutable de Aperturas y Cierres de Turno (Arqueo Ciego)
              </h2>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Comparativa exacta entre Efectivo Esperado por Sistema vs Efectivo Físico Declarado por Cajero
              </p>
            </div>

            {shiftsAudit.length === 0 ? (
              <div className="p-10 text-center text-sm text-[#64748B]">
                No existen turnos registrados en este tenant.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.07] text-[11px] uppercase tracking-wider text-[#94A3B8] bg-[#0B0F17]/40">
                      <th className="py-3.5 px-4 font-medium">Turno ID</th>
                      <th className="py-3.5 px-4 font-medium">Estado</th>
                      <th className="py-3.5 px-4 font-medium">Apertura</th>
                      <th className="py-3.5 px-4 font-medium text-right">Fondo Inicial</th>
                      <th className="py-3.5 px-4 font-medium text-right">Efectivo Esperado</th>
                      <th className="py-3.5 px-4 font-medium text-right">Efectivo Declarado</th>
                      <th className="py-3.5 px-4 font-medium text-right">Descuadre / Diferencia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05] text-sm">
                    {shiftsAudit.map((shift: ShiftAuditItem) => {
                      const diff = shift.difference !== null ? Number(shift.difference) : null;
                      const isZeroDiff = diff !== null && Math.abs(diff) < 0.005;

                      return (
                        <tr
                          key={shift.id}
                          className="hover:bg-[#1A2234]/60 transition-colors"
                        >
                          <td className="py-3.5 px-4 font-mono text-xs text-[#F8FAFC]">
                            #{String(shift.id).slice(0, 8)}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                                shift.status === 'OPEN'
                                  ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30'
                                  : 'bg-white/[0.05] text-[#94A3B8] border-white/[0.1]'
                              }`}
                            >
                              {shift.status === 'OPEN' ? 'ABIERTO' : 'CERRADO'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs text-[#94A3B8]">
                            {new Date(shift.openedAt).toLocaleString('es-PE')}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-[#F8FAFC]">
                            S/ {Number(shift.initialCash).toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-medium text-[#10B981]">
                            S/ {Number(shift.expectedCash).toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-[#F8FAFC]">
                            {shift.declaredCash !== null
                              ? `S/ ${Number(shift.declaredCash).toFixed(2)}`
                              : '—'}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-semibold">
                            {diff === null ? (
                              <span className="text-xs text-[#64748B]">En curso</span>
                            ) : isZeroDiff ? (
                              <span className="text-xs px-2 py-0.5 rounded bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30">
                                CUADRE EXACTO (S/ 0.00)
                              </span>
                            ) : diff > 0 ? (
                              <span className="text-xs px-2 py-0.5 rounded bg-[#2563EB]/15 text-blue-400 border border-[#2563EB]/30">
                                SOBRANTE +S/ {diff.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-xs px-2 py-0.5 rounded bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30">
                                FALTANTE S/ {diff.toFixed(2)}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Bitácora de Comprobantes Emitidos */}
        {activeTab === 'comprobantes' && (
          <div className="bg-[#131823] border border-white/[0.07] rounded-xl overflow-hidden">
            <div className="p-5 border-b border-white/[0.07]">
              <h2 className="text-base font-semibold text-[#F8FAFC]">
                Bitácora de Comprobantes y Transacciones de Caja
              </h2>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Registro detallado con número correlativo, medio de pago, vuelto exacto y código de operación
              </p>
            </div>

            {recentPayments.length === 0 ? (
              <div className="p-10 text-center text-sm text-[#64748B]">
                No hay comprobantes emitidos para los filtros activos.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.07] text-[11px] uppercase tracking-wider text-[#94A3B8] bg-[#0B0F17]/40">
                      <th className="py-3.5 px-4 font-medium">Comprobante</th>
                      <th className="py-3.5 px-4 font-medium">Tipo</th>
                      <th className="py-3.5 px-4 font-medium">Método</th>
                      <th className="py-3.5 px-4 font-medium">Cód. Operación / Cliente</th>
                      <th className="py-3.5 px-4 font-medium text-right">Recibido</th>
                      <th className="py-3.5 px-4 font-medium text-right">Vuelto</th>
                      <th className="py-3.5 px-4 font-medium text-right">Total Cobrado</th>
                      <th className="py-3.5 px-4 font-medium text-right">Fecha / Hora</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05] text-sm">
                    {recentPayments.map((payment: PaymentRecordItem) => {
                      const meta = PAYMENT_LABELS[payment.paymentMethod] || PAYMENT_LABELS.CASH;
                      const received =
                        payment.cashReceived ?? payment.receivedAmount ?? payment.amount;
                      return (
                        <tr
                          key={payment.id}
                          className="hover:bg-[#1A2234]/60 transition-colors"
                        >
                          <td className="py-3.5 px-4 font-mono text-xs font-semibold text-[#F8FAFC]">
                            {payment.receiptNumber}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs text-[#94A3B8]">
                            {payment.receiptType}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${meta.bg} ${meta.color}`}
                            >
                              {meta.label}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs text-[#94A3B8]">
                            {payment.operationCode ? `OP: ${payment.operationCode}` : '—'}
                            {payment.customerDocument ? ` • Doc: ${payment.customerDocument}` : ''}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-xs text-[#94A3B8]">
                            S/ {Number(received).toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-xs text-[#D97706]">
                            S/ {Number(payment.changeGiven).toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-semibold text-[#10B981]">
                            S/ {Number(payment.amount).toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-xs text-[#94A3B8]">
                            {new Date(payment.paidAt).toLocaleString('es-PE')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
