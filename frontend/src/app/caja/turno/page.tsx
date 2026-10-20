'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import {
  useGetCurrentShiftQuery,
  useOpenShiftMutation,
  useCloseShiftMutation,
} from '../../../store/services/api';

export default function TurnoCajaPage() {
  const router = useRouter();
  const { user, tenantId } = useSelector((state: RootState) => state.auth);

  const { data: shiftData, isLoading, refetch } = useGetCurrentShiftQuery(undefined, {
    pollingInterval: 15000, // Refresco cada 15s para sincronizar estado
  });

  const [openShift, { isLoading: isOpening }] = useOpenShiftMutation();
  const [closeShift, { isLoading: isClosing }] = useCloseShiftMutation();

  // Modales
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);

  // Formulario Apertura
  const [initialCash, setInitialCash] = useState<number>(100);
  const [openNotes, setOpenNotes] = useState('');

  // Formulario Cierre / Arqueo
  const [declaredCash, setDeclaredCash] = useState<number>(0);
  const [closeNotes, setCloseNotes] = useState('');

  useEffect(() => {
    if (shiftData?.shift?.expectedCash !== undefined) {
      setDeclaredCash(Number(shiftData.shift.expectedCash));
    }
  }, [shiftData]);

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
      refetch();
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
      const res = await closeShift({
        declaredCash: Number(declaredCash),
        notes: closeNotes.trim() || undefined,
      }).unwrap();

      toast.warning(
        `Turno cerrado. Ventana de gracia iniciada (2.5h restantes antes del cierre de sesión).`,
      );
      setShowCloseModal(false);
      setCloseNotes('');
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Error al cerrar el turno.');
    }
  };

  const activeShift = shiftData?.shift;
  const isShiftOpen = shiftData?.isShiftOpen ?? false;
  const isInGrace = shiftData?.isInGracePeriod ?? false;
  const minutesGrace = shiftData?.minutesRemainingInGrace ?? 0;

  // Cálculo en vivo de discrepancia de arqueo
  const expectedCash = activeShift ? Number(activeShift.expectedCash) : 0;
  const currentDifference = declaredCash - expectedCash;

  return (
    <div className="min-h-screen bg-[#0B0F17] text-[#F8FAFC] p-4 md:p-8 flex flex-col font-sans">
      {/* Header Superior y Barra de Navegación */}
      <header className="max-w-6xl w-full mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-[#20293A] gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#F8FAFC]">
              Caja & Control de Turnos
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
            Restaurante: <span className="text-[#F8FAFC] font-medium">{tenantId || 'chifa-mariana'}</span> | Operador: <span className="text-[#F8FAFC] font-medium">{user?.fullName || 'Personal'}</span>
          </p>
        </div>

        {/* Accesos Rápidos */}
        <div className="flex items-center gap-3">
          <Link
            href="/admin/trabajadores"
            className="px-4 py-2 rounded-lg bg-[#131823] hover:bg-[#1A2234] border border-[#20293A] text-sm text-[#94A3B8] hover:text-[#F8FAFC] transition-all duration-150 active:scale-97"
          >
            Personal
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 rounded-lg bg-[#131823] hover:bg-[#1A2234] border border-[#20293A] text-sm text-[#94A3B8] hover:text-[#F8FAFC] transition-all duration-150 active:scale-97"
          >
            Cambiar Sesión
          </Link>
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
                Regla de Sesión Persistente (Shift-Bound Sessions)
              </p>
              <p className="text-xs text-[#757681]">
                {isShiftOpen
                  ? 'El turno está ABIERTO. Todas las sesiones en salón (meseras en celulares) y cocinas se mantienen activas de forma indefinida.'
                  : isInGrace
                  ? `El turno está CERRADO. Quedan ${minutesGrace} minutos de gracia antes de que el sistema desconecte automáticamente las sesiones del local.`
                  : 'No hay turno activo. Los pedidos en comandero y mesas están estrictamente bloqueados.'}
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

        {/* Dashboard de Tarjetas de Balance */}
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
              Ingresado en apertura
            </span>
          </div>

          <div className="p-5 rounded-xl bg-[#131823] border border-[#20293A] flex flex-col justify-between">
            <span className="text-xs text-[#757681] uppercase tracking-wider font-semibold">
              Efectivo Esperado (Caja)
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
              Hora de Apertura
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-lg font-bold font-mono text-[#F8FAFC]">
                {activeShift?.openedAt
                  ? new Date(activeShift.openedAt).toLocaleTimeString('es-PE', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })
                  : '--:--:--'}
              </span>
            </div>
            <span className="text-xs text-[#757681] mt-2 truncate">
              Por: {activeShift?.openedBy?.fullName || activeShift?.openedById || 'N/A'}
            </span>
          </div>

          <div className="p-5 rounded-xl bg-[#131823] border border-[#20293A] flex flex-col justify-between">
            <span className="text-xs text-[#757681] uppercase tracking-wider font-semibold">
              Estado Operativo
            </span>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`text-lg font-bold ${
                  isShiftOpen ? 'text-[#10B981]' : 'text-[#757681]'
                }`}
              >
                {isShiftOpen ? 'Operación Activa' : 'Caja Inactiva'}
              </span>
            </div>
            <span className="text-xs text-[#757681] mt-2">
              {isShiftOpen ? 'Comandas habilitadas' : 'Comandas bloqueadas (412)'}
            </span>
          </div>
        </div>

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
              {/* Resumen de Caja */}
              <div className="p-3 rounded-lg bg-[#0B0F17] border border-[#20293A] space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#757681]">Efectivo Esperado en Caja:</span>
                  <span className="font-mono font-bold text-[#2563EB]">
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
                      ? 'S/ 0.00 (Cuadrada)'
                      : `S/ ${currentDifference.toFixed(2)} ${
                          currentDifference < 0 ? '(Faltante)' : '(Sobrante)'
                        }`}
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
