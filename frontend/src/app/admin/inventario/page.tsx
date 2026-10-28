'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { logout } from '@/store/slices/authSlice';
import {
  useGetProductsQuery,
  useGetInventoryAlertsQuery,
  useGetInventoryMovementsQuery,
  useRestockProductMutation,
} from '@/store/services/api';
import { toast } from 'sonner';
import {
  PackageCheck,
  AlertTriangle,
  PlusCircle,
  History,
  MonitorPlay,
  UtensilsCrossed,
  CreditCard,
  LogOut,
  X,
  Loader2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

export default function InventoryPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, tenantId } = useSelector((state: RootState) => state.auth);

  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [restockForm, setRestockForm] = useState({
    productId: '',
    quantity: 12,
    notes: 'Ingreso de mercadería por almacén',
  });

  // Consultas RTK Query
  const { data: beverages, isLoading: isProdLoading } = useGetProductsQuery({ isBeverage: true });
  const { data: alerts, isLoading: isAlertsLoading } = useGetInventoryAlertsQuery();
  const { data: movements, isLoading: isMovLoading } = useGetInventoryMovementsQuery();
  const [restock, { isLoading: isRestocking }] = useRestockProductMutation();

  const handleLogout = () => {
    dispatch(logout());
    router.push('/login');
    toast.success('Sesión cerrada');
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockForm.productId || restockForm.quantity <= 0) {
      toast.error('Selecciona una bebida y una cantidad válida');
      return;
    }

    try {
      await restock(restockForm).unwrap();
      toast.success('Stock actualizado exitosamente');
      setIsRestockModalOpen(false);
      setRestockForm({ productId: '', quantity: 12, notes: '' });
    } catch (err: any) {
      toast.error(err?.data?.message || 'Error al reabastecer');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-white flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-gray-800 bg-[#131823]/80 backdrop-blur sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <PackageCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              Control de Inventario de Bebidas
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                Atómico & En Tiempo Real
              </span>
            </h1>
            <p className="text-xs text-gray-400">
              Tenant: <span className="text-gray-200 font-mono">{tenantId}</span> | {user?.fullName}
            </p>
          </div>
        </div>

      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#131823] border border-gray-800 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">Total Bebidas Registradas</p>
              <p className="text-2xl font-bold font-mono text-white mt-1">
                {beverages?.length || 0}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <PackageCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-[#131823] border border-gray-800 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">Alertas de Stock Bajo / Crítico</p>
              <p className="text-2xl font-bold font-mono text-amber-400 mt-1">
                {alerts?.length || 0}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-[#131823] border border-gray-800 rounded-2xl p-5 flex items-center justify-between">
            <button
              onClick={() => setIsRestockModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition shadow-lg shadow-emerald-600/20 active:scale-[0.97] text-sm"
            >
              <PlusCircle className="w-4 h-4" />
              Ingreso de Mercadería
            </button>
          </div>
        </div>

        {/* Sección de Bebidas & Nivel de Stock */}
        <div className="bg-[#131823] border border-gray-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <PackageCheck className="w-4 h-4 text-emerald-400" />
            Existencias de Bebidas en Tiempo Real
          </h2>

          {isProdLoading ? (
            <div className="flex items-center justify-center p-8 text-gray-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" /> Cargando stock...
            </div>
          ) : beverages && beverages.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-gray-800 text-gray-400">
                  <tr>
                    <th className="py-3 px-4 font-medium">Bebida</th>
                    <th className="py-3 px-4 font-medium">Precio</th>
                    <th className="py-3 px-4 font-medium">Stock Actual</th>
                    <th className="py-3 px-4 font-medium">Alerta Mínima</th>
                    <th className="py-3 px-4 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 font-mono">
                  {beverages.map((b) => {
                    const isOutOfStock = b.currentStock <= 0;
                    const isLowStock = b.currentStock <= b.minStockAlert;

                    return (
                      <tr key={b.id} className="hover:bg-gray-800/30 transition">
                        <td className="py-3 px-4 font-sans font-medium text-white">
                          {b.name}
                        </td>
                        <td className="py-3 px-4 text-emerald-400">
                          S/ {Number(b.price).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 font-bold text-sm">
                          <span
                            className={
                              isOutOfStock
                                ? 'text-red-400'
                                : isLowStock
                                ? 'text-amber-400'
                                : 'text-gray-200'
                            }
                          >
                            {b.currentStock} unidades
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-400">{b.minStockAlert} unidades</td>
                        <td className="py-3 px-4 font-sans">
                          {isOutOfStock ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                              AGOTADO (Bloqueo Comandero)
                            </span>
                          ) : isLowStock ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              STOCK CRÍTICO
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              DISPONIBLE
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-gray-400 text-center py-6">
              No hay bebidas registradas en la carta todavía.
            </p>
          )}
        </div>

        {/* Historial de Movimientos de Inventario */}
        <div className="bg-[#131823] border border-gray-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <History className="w-4 h-4 text-blue-400" />
            Auditoría de Movimientos Recientes
          </h2>

          {isMovLoading ? (
            <div className="flex items-center justify-center p-8 text-gray-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" /> Cargando historial...
            </div>
          ) : movements && movements.length > 0 ? (
            <div className="space-y-2">
              {movements.slice(0, 15).map((m: any) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#0B0F17] border border-gray-800 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        m.type === 'RESTOCK'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-blue-500/10 text-blue-400'
                      }`}
                    >
                      {m.type === 'RESTOCK' ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-white">
                        {m.product?.name || 'Bebida'} -{' '}
                        <span className="font-mono text-gray-300">
                          {m.type === 'RESTOCK' ? `+${m.quantity}` : `-${m.quantity}`} unds
                        </span>
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {m.notes || 'Movimiento de inventario'} | Por:{' '}
                        {m.user?.fullName || 'Sistema'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-gray-400 text-[11px]">
                      {m.previousStock} → <span className="text-white font-bold">{m.newStock}</span>
                    </span>
                    <p className="text-[10px] text-gray-500">
                      {new Date(m.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 text-center py-6">
              Aún no hay movimientos de inventario registrados.
            </p>
          )}
        </div>
      </main>

      {/* Modal de Reabastecimiento */}
      {isRestockModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131823] border border-gray-800 rounded-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-emerald-400" />
                Ingreso de Mercadería
              </h3>
              <button
                onClick={() => setIsRestockModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRestockSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-300 font-medium mb-1">Bebida a Ingresar *</label>
                <select
                  value={restockForm.productId}
                  onChange={(e) => setRestockForm({ ...restockForm, productId: e.target.value })}
                  className="w-full bg-[#0B0F17] border border-gray-700 rounded-xl px-3 py-2 text-white text-xs"
                  required
                >
                  <option value="">Selecciona bebida...</option>
                  {beverages?.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} (Stock actual: {b.currentStock})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-1">
                  Cantidad a Agregar (Unidades) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={restockForm.quantity}
                  onChange={(e) =>
                    setRestockForm({
                      ...restockForm,
                      quantity: parseInt(e.target.value, 10) || 1,
                    })
                  }
                  className="w-full bg-[#0B0F17] border border-gray-700 rounded-xl px-3 py-2 text-white font-mono text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-1">
                  Nota / Guía de Remisión (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Fardo de 12 botellas - Proveedor Lindley"
                  value={restockForm.notes}
                  onChange={(e) => setRestockForm({ ...restockForm, notes: e.target.value })}
                  className="w-full bg-[#0B0F17] border border-gray-700 rounded-xl px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsRestockModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isRestocking}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition flex items-center gap-1.5 active:scale-[0.97]"
                >
                  {isRestocking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Confirmar Ingreso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
