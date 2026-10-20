'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { logout } from '@/store/slices/authSlice';
import {
  useGetWorkersQuery,
  useCreateWorkerMutation,
  useToggleWorkerStatusMutation,
  useDeleteWorkerMutation,
} from '@/store/services/api';
import { toast } from 'sonner';
import {
  Users,
  UserPlus,
  Shield,
  Phone,
  CreditCard,
  LogOut,
  X,
  Loader2,
  Trash2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export default function WorkersPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, tenantId } = useSelector((state: RootState) => state.auth);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    password: '',
    roleId: 4, // Mesera por defecto
    dni: '',
    phone: '',
  });

  const { data: workers, isLoading, error } = useGetWorkersQuery();
  const [createWorker, { isLoading: isCreating }] = useCreateWorkerMutation();
  const [toggleStatus] = useToggleWorkerStatusMutation();
  const [deleteWorker] = useDeleteWorkerMutation();

  const handleLogout = () => {
    dispatch(logout());
    router.push('/login');
    toast.success('Sesión cerrada correctamente');
  };

  const handleCreateWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createWorker({
        ...formData,
        roleId: Number(formData.roleId),
      }).unwrap();
      toast.success('Trabajador registrado exitosamente');
      setIsModalOpen(false);
      setFormData({
        username: '',
        fullName: '',
        password: '',
        roleId: 4,
        dni: '',
        phone: '',
      });
    } catch (err: any) {
      toast.error(err.data?.message || 'Error al registrar trabajador');
    }
  };

  const handleToggleStatus = async (id: string, name: string) => {
    try {
      await toggleStatus(id).unwrap();
      toast.success(`Estado de ${name} actualizado`);
    } catch {
      toast.error('No se pudo actualizar el estado');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`¿Confirma dar de baja lógica a ${name}?`)) {
      try {
        await deleteWorker(id).unwrap();
        toast.success(`Trabajador ${name} dado de baja (Soft-Delete)`);
      } catch {
        toast.error('No se pudo dar de baja al trabajador');
      }
    }
  };

  const getRoleBadge = (roleName?: string) => {
    switch (roleName) {
      case 'ADMIN':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#2563EB]/20 text-[#60A5FA] border border-[#2563EB]/30">Administrador</span>;
      case 'CAJERO':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#10B981]/20 text-[#34D399] border border-[#10B981]/30">Cajero</span>;
      case 'COCINERO':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#D97706]/20 text-[#FBBF24] border border-[#D97706]/30">Cocinero</span>;
      case 'MESERA':
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#757681]/20 text-[#CBD5E1] border border-[#757681]/30">Mesera</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-[#F8FAFC]">
      {/* Barra de Navegación Superior - Executive Precision Dark */}
      <header className="border-b border-[#20293A] bg-[#131823]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2563EB] flex items-center justify-center font-bold text-white shadow-md">
              CM
            </div>
            <div>
              <h1 className="text-base font-bold text-[#F8FAFC]">Chifa Mariana</h1>
              <p className="text-xs text-[#94A3B8]">Restaurante: <span className="text-[#38BDF8] font-mono-numbers">{tenantId}</span></p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs text-[#94A3B8] bg-[#0B0F17] px-3 py-1.5 rounded-lg border border-[#20293A]">
              <Shield className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Rol: <strong className="text-white">{user?.role || 'ADMIN'}</strong></span>
            </div>
            <button
              onClick={handleLogout}
              className="btn-tactile flex items-center gap-2 text-xs font-semibold text-[#94A3B8] hover:text-white bg-[#0B0F17] hover:bg-[#1A2234] px-3.5 py-2 rounded-xl border border-[#20293A] cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[#F8FAFC] flex items-center gap-2.5">
              <Users className="w-6 h-6 text-[#2563EB]" />
              Personal del Restaurante
            </h2>
            <p className="text-sm text-[#94A3B8] mt-1">
              Gestión exclusiva de trabajadores y asignación de roles operativos.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-tactile bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm py-2.5 px-4 rounded-xl shadow-lg flex items-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Registrar Nuevo Trabajador</span>
          </button>
        </div>

        {/* Listado de Trabajadores */}
        {isLoading ? (
          <div className="p-12 text-center text-[#94A3B8] flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#2563EB]" />
            <p>Cargando personal...</p>
          </div>
        ) : error ? (
          <div className="p-8 rounded-2xl bg-[#131823] border border-[#20293A] text-center text-[#94A3B8]">
            <p className="text-sm">Inicie sesión como <strong>ADMIN</strong> para visualizar los trabajadores.</p>
          </div>
        ) : workers && workers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workers.map((w) => (
              <div
                key={w.id}
                className="bg-[#131823] border border-[#20293A] rounded-2xl p-5 shadow-lg flex flex-col justify-between hover:border-[#2563EB]/40 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h3 className="font-semibold text-[#F8FAFC] text-base">{w.fullName}</h3>
                      <p className="text-xs text-[#94A3B8] font-mono-numbers">@{w.username}</p>
                    </div>
                    {getRoleBadge(w.role?.name)}
                  </div>

                  <div className="space-y-1.5 text-xs text-[#94A3B8] mb-4">
                    {w.dni && (
                      <p className="flex items-center gap-2">
                        <CreditCard className="w-3.5 h-3.5 text-[#757681]" />
                        <span>DNI: <strong className="text-white font-mono-numbers">{w.dni}</strong></span>
                      </p>
                    )}
                    {w.phone && (
                      <p className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-[#757681]" />
                        <span>Teléfono: <strong className="text-white font-mono-numbers">{w.phone}</strong></span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#20293A] flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleToggleStatus(w.id, w.fullName)}
                    className="btn-tactile flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-[#0B0F17] hover:bg-[#1A2234] border border-[#20293A] cursor-pointer"
                  >
                    {w.isActive ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                        <span className="text-[#10B981]">Activo</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5 text-[#757681]" />
                        <span className="text-[#757681]">Inactivo</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleDelete(w.id, w.fullName)}
                    title="Baja lógica (Soft-delete)"
                    className="btn-tactile p-1.5 rounded-lg text-[#757681] hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center rounded-2xl bg-[#131823] border border-[#20293A] text-[#94A3B8]">
            <p className="text-sm">No hay trabajadores registrados en este restaurante.</p>
          </div>
        )}
      </main>

      {/* Modal Táctil de Registro de Trabajador */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131823] border border-[#20293A] w-full max-w-lg rounded-2xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-[#20293A] mb-5">
              <h3 className="text-lg font-bold text-[#F8FAFC] flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#2563EB]" />
                Registrar Trabajador
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#94A3B8] hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWorker} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-[#94A3B8] mb-1.5">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. María Morales"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full bg-[#0B0F17] border border-[#20293A] text-[#F8FAFC] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-[#94A3B8] mb-1.5">
                    Usuario
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="mesera_maria"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full bg-[#0B0F17] border border-[#20293A] text-[#F8FAFC] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-[#94A3B8] mb-1.5">
                    Rol Operativo
                  </label>
                  <select
                    value={formData.roleId}
                    onChange={(e) => setFormData({ ...formData, roleId: Number(e.target.value) })}
                    className="w-full bg-[#0B0F17] border border-[#20293A] text-[#F8FAFC] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#2563EB] cursor-pointer"
                  >
                    <option value={4}>Mesera (Salón)</option>
                    <option value={3}>Cajero (Caja & Cobranza)</option>
                    <option value={5}>Cocinero (KDS Cocina)</option>
                    <option value={2}>Administrador</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-[#94A3B8] mb-1.5">
                  Contraseña (mínimo 8 caracteres)
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-[#0B0F17] border border-[#20293A] text-[#F8FAFC] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-[#94A3B8] mb-1.5">
                    DNI / Documento (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="70123456"
                    value={formData.dni}
                    onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                    className="w-full bg-[#0B0F17] border border-[#20293A] text-[#F8FAFC] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-[#94A3B8] mb-1.5">
                    Teléfono (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="987654321"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-[#0B0F17] border border-[#20293A] text-[#F8FAFC] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#20293A]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-tactile px-4 py-2 text-sm font-semibold text-[#94A3B8] hover:text-white rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="btn-tactile bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>Registrar</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
