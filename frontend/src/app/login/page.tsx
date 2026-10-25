'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { setCredentials, setTenantId } from '@/store/slices/authSlice';
import { useLoginMutation, useGetTenantsQuery } from '@/store/services/api';
import { toast } from 'sonner';
import { Lock, User, Store, ShieldAlert, ArrowRight, Loader2 } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const dispatch = useDispatch();
  const currentTenantId = useSelector((state: RootState) => state.auth.tenantId);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedTenant, setSelectedTenant] = useState(currentTenantId || 'chifa-mariana');
  const [lockoutCountdown, setLockoutCountdown] = useState<number | null>(null);

  const [login, { isLoading }] = useLoginMutation();
  const { data: tenants } = useGetTenantsQuery();

  // Temporizador visual para rate limiting (429)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (lockoutCountdown !== null && lockoutCountdown > 0) {
      timer = setInterval(() => {
        setLockoutCountdown((prev) => (prev && prev > 1 ? prev - 1 : null));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [lockoutCountdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutCountdown) {
      toast.error(`Acceso bloqueado. Espere ${lockoutCountdown}s para reintentar.`);
      return;
    }

    try {
      const response = await login({
        username,
        password,
        tenantId: selectedTenant,
      }).unwrap();

      dispatch(
        setCredentials({
          user: response.user,
          accessToken: response.accessToken,
          tenantId: selectedTenant,
        }),
      );

      toast.success(`Bienvenido, ${response.user.fullName}`);

      // Redirección según rol
      if (response.user.role === 'ADMIN' || response.user.role === 'SUPER_ADMIN') {
        router.push('/admin/trabajadores');
      } else {
        router.push('/caja/turno');
      }
    } catch (err: any) {
      if (err.status === 429) {
        const retryAfter = err.data?.retryAfter || 300;
        setLockoutCountdown(retryAfter);
        toast.error('Demasiados intentos fallidos. Bloqueo temporal por seguridad.');
      } else {
        const msg = err.data?.message || 'Credenciales incorrectas o usuario inactivo';
        toast.error(msg);
      }
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-[#0B0F17]">
      <div className="w-full max-w-md">
        {/* Cabecera / Marca */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#131823] border border-[#20293A] mb-4 shadow-xl">
            <span className="text-2xl font-bold text-[#2563EB]">CM</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F8FAFC]">
            Chifa Mariana SaaS
          </h1>
          <p className="text-sm text-[#94A3B8] mt-1">
            Plataforma 100% Web para Salón, KDS y Caja
          </p>
        </div>

        {/* Tarjeta de Login - Executive Precision Dark */}
        <div className="bg-[#131823] border border-[#20293A] rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Alerta Visual de Bloqueo por Fuerza Bruta */}
          {lockoutCountdown !== null && (
            <div className="mb-6 p-4 rounded-xl bg-[#D97706]/10 border border-[#D97706]/30 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
              <div>
                <h2 className="text-sm font-semibold text-[#D97706]">
                  Bloqueo de Seguridad Activo
                </h2>
                <p className="text-xs text-[#F8FAFC]/80 mt-1">
                  Se excedió el límite de 5 intentos fallidos. Reintente en:
                </p>
                <div className="font-mono-numbers text-lg font-bold text-[#D97706] mt-1">
                  {Math.floor(lockoutCountdown / 60)}:
                  {(lockoutCountdown % 60).toString().padStart(2, '0')} min
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Selector de Tenant / Restaurante */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-2">
                Restaurante / Empresa
              </label>
              <div className="relative">
                <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#757681]" />
                <select
                  value={selectedTenant}
                  onChange={(e) => {
                    setSelectedTenant(e.target.value);
                    dispatch(setTenantId(e.target.value));
                  }}
                  className="w-full bg-[#0B0F17] border border-[#20293A] text-[#F8FAFC] rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#2563EB] transition-colors appearance-none cursor-pointer"
                >
                  {tenants && tenants.length > 0 ? (
                    tenants.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.id})
                      </option>
                    ))
                  ) : (
                    <option value="chifa-mariana">Chifa Mariana Principal</option>
                  )}
                </select>
              </div>
            </div>

            {/* Usuario */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-2">
                Usuario
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#757681]" />
                <input
                  type="text"
                  required
                  placeholder="ej. mesera1 o admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#0B0F17] border border-[#20293A] text-[#F8FAFC] rounded-xl pl-10 pr-4 py-3 text-sm placeholder-[#757681] focus:outline-none focus:border-[#2563EB] transition-colors"
                />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#757681]" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0B0F17] border border-[#20293A] text-[#F8FAFC] rounded-xl pl-10 pr-4 py-3 text-sm placeholder-[#757681] focus:outline-none focus:border-[#2563EB] transition-colors"
                />
              </div>
            </div>

            {/* Botón de Ingreso Táctil */}
            <button
              type="submit"
              disabled={isLoading || lockoutCountdown !== null}
              className="w-full btn-tactile bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white font-semibold py-3.5 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 mt-6 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <span>Ingresar al Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Informativo */}
        <p className="text-center text-xs text-[#757681] mt-6">
          Chifa Mariana &copy; 2026 &bull; Seguridad Estricta con Better Auth & OpenBao
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#07090E] flex items-center justify-center text-slate-500">
          Cargando login...
        </div>
      }
    >
      <LoginForm />
    </React.Suspense>
  );
}
