'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
      router.push('/admin/trabajadores');
    } else {
      router.push('/caja/turno');
    }
  }, [isAuthenticated, user, router]);

  return (
    <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center text-[#94A3B8]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#2563EB]" />
        <p className="text-sm">Redirigiendo a Chifa Mariana...</p>
      </div>
    </div>
  );
}
