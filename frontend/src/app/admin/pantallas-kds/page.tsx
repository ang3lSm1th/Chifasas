'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { logout } from '@/store/slices/authSlice';
import {
  useGetKdsStationsQuery,
  useCreateKdsStationMutation,
  useDeleteKdsStationMutation,
} from '@/store/services/api';
import { toast } from 'sonner';
import {
  MonitorPlay,
  Plus,
  Trash2,
  ExternalLink,
  Users,
  CreditCard,
  UtensilsCrossed,
  PackageCheck,
  LogOut,
  X,
  Loader2,
} from 'lucide-react';

const COLOR_PRESETS = [
  { label: 'Rojo Wok', hex: '#EF4444' },
  { label: 'Naranja Salteado', hex: '#F97316' },
  { label: 'Ámbar Parrilla', hex: '#F59E0B' },
  { label: 'Esmeralda Ensalada', hex: '#10B981' },
  { label: 'Azul Sopas', hex: '#2563EB' },
  { label: 'Violeta Broaster', hex: '#8B5CF6' },
  { label: 'Rosa Barra', hex: '#EC4899' },
];

export default function KdsStationsPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, tenantId } = useSelector((state: RootState) => state.auth);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    colorHex: '#2563EB',
    displayOrder: 1,
  });

  const { data: stations, isLoading } = useGetKdsStationsQuery();
  const [createStation, { isLoading: isCreating }] = useCreateKdsStationMutation();
  const [deleteStation] = useDeleteKdsStationMutation();

  const handleLogout = () => {
    dispatch(logout());
    router.push('/login');
    toast.success('Sesión cerrada correctamente');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('El nombre de la estación es obligatorio');
      return;
    }

    try {
      await createStation(formData).unwrap();
      toast.success(`Estación '${formData.name}' creada exitosamente`);
      setIsModalOpen(false);
      setFormData({ name: '', colorHex: '#2563EB', displayOrder: 1 });
    } catch (err: any) {
      toast.error(err?.data?.message || 'Error al crear la estación KDS');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`¿Estás seguro de eliminar la estación KDS '${name}'?`)) {
      try {
        await deleteStation(id).unwrap();
        toast.success(`Estación '${name}' eliminada`);
      } catch (err: any) {
        toast.error(err?.data?.message || 'Error al eliminar');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-white flex flex-col font-sans">
      {/* Header Ejecutivo */}
      <header className="border-b border-gray-800 bg-[#131823]/80 backdrop-blur sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <MonitorPlay className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Pantallas KDS Dinámicas
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                1..N Cocinas
              </span>
            </h1>
            <p className="text-xs text-gray-400">
              Tenant: <span className="text-gray-200 font-mono font-medium">{tenantId}</span> |{' '}
              {user?.fullName || 'Administrador'}
            </p>
          </div>
        </div>

        {/* Navegación Rápida */}
        <div className="flex items-center gap-2">
          <Link
            href="/admin/carta"
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-700 bg-gray-800/40 text-xs text-gray-300 hover:text-white hover:bg-gray-800 transition active:scale-[0.97]"
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            Carta
          </Link>
          <Link
            href="/admin/inventario"
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-700 bg-gray-800/40 text-xs text-gray-300 hover:text-white hover:bg-gray-800 transition active:scale-[0.97]"
          >
            <PackageCheck className="w-3.5 h-3.5" />
            Bebidas
          </Link>
          <Link
            href="/caja/turno"
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-700 bg-gray-800/40 text-xs text-gray-300 hover:text-white hover:bg-gray-800 transition active:scale-[0.97]"
          >
            <CreditCard className="w-3.5 h-3.5" />
            Caja
          </Link>
          <Link
            href="/admin/trabajadores"
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-700 bg-gray-800/40 text-xs text-gray-300 hover:text-white hover:bg-gray-800 transition active:scale-[0.97]"
          >
            <Users className="w-3.5 h-3.5" />
            Personal
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-xs text-red-400 hover:bg-red-500/20 transition active:scale-[0.97]"
          >
            <LogOut className="w-3.5 h-3.5" />
            Salir
          </button>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Estaciones de Cocina Activas</h2>
            <p className="text-sm text-gray-400">
              Crea estaciones personalizadas (ej. Woks, Freidora, Barra) a las que se enrutarán los platos.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition shadow-lg shadow-blue-600/20 active:scale-[0.97]"
          >
            <Plus className="w-4 h-4" />
            Nueva Pantalla KDS
          </button>
        </div>

        {/* Grid de Pantallas KDS */}
        {isLoading ? (
          <div className="flex items-center justify-center p-12 text-gray-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Cargando estaciones de cocina...
          </div>
        ) : stations && stations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {stations.map((st) => (
              <div
                key={st.id}
                className="bg-[#131823] border border-gray-800 hover:border-gray-700 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 group relative overflow-hidden"
              >
                {/* Indicador de Color Superior */}
                <div
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{ backgroundColor: st.colorHex || '#2563EB' }}
                />

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: st.colorHex || '#2563EB' }}
                    />
                    <span className="text-[11px] font-mono text-gray-400 bg-gray-800/60 px-2 py-0.5 rounded">
                      Orden #{st.displayOrder}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition">
                      {st.name}
                    </h3>
                    <p className="text-xs font-mono text-gray-400 truncate mt-0.5">
                      ID: {st.id}
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-800/80 flex items-center justify-between gap-3 mt-4">
                  <Link
                    href={`/kds/${st.id}`}
                    target="_blank"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-600/10 border border-blue-500/20 hover:bg-blue-600/20 text-blue-400 text-xs font-medium transition active:scale-[0.97]"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Abrir Pantalla KDS
                  </Link>
                  <button
                    onClick={() => handleDelete(st.id, st.name)}
                    className="p-2 rounded-xl border border-gray-800 hover:border-red-500/40 text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition active:scale-[0.97]"
                    title="Eliminar Estación"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#131823] border border-gray-800/80 rounded-2xl p-12 text-center space-y-4">
            <MonitorPlay className="w-12 h-12 text-gray-600 mx-auto" />
            <h3 className="text-base font-semibold text-white">No hay pantallas KDS registradas</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Crea tu primera estación operativa (ej. Woks, Freidora, Barra) para enrutar los platos de cocina.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-xl transition active:scale-[0.97]"
            >
              Crear Estación 1
            </button>
          </div>
        )}
      </main>

      {/* Modal de Registro de Pantalla KDS */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131823] border border-gray-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <MonitorPlay className="w-4 h-4 text-blue-400" />
                Nueva Pantalla KDS
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-300 font-medium mb-1">
                  Nombre de la Estación *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Woks y Salteados, Freidora, Bar"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#0B0F17] border border-gray-700 rounded-xl px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-2">
                  Color Identificador
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      type="button"
                      key={preset.hex}
                      onClick={() => setFormData({ ...formData, colorHex: preset.hex })}
                      className={`w-7 h-7 rounded-full border-2 transition active:scale-95 ${
                        formData.colorHex === preset.hex ? 'border-white scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: preset.hex }}
                      title={preset.label}
                    />
                  ))}
                </div>
                <input
                  type="text"
                  value={formData.colorHex}
                  onChange={(e) => setFormData({ ...formData, colorHex: e.target.value })}
                  className="w-full bg-[#0B0F17] border border-gray-700 rounded-xl px-3 py-1.5 text-gray-300 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-1">
                  Orden de Visualización
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.displayOrder}
                  onChange={(e) =>
                    setFormData({ ...formData, displayOrder: parseInt(e.target.value, 10) || 1 })
                  }
                  className="w-full bg-[#0B0F17] border border-gray-700 rounded-xl px-3 py-2 text-white font-mono text-sm"
                />
              </div>

              <div className="pt-3 border-t border-gray-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-700 text-gray-300 hover:bg-gray-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition flex items-center gap-1.5 active:scale-[0.97]"
                >
                  {isCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Crear Estación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
