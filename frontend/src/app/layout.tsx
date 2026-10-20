import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import { StoreProvider } from '@/store/StoreProvider';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Chifa Mariana | SaaS Restaurantero de Precisión',
  description: 'Plataforma 100% Web para gestión de salón, KDS de cocina, caja y cobranza multi-restaurante.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased selection:bg-[#2563EB] selection:text-white">
        <StoreProvider>
          {children}
          <Toaster
            theme="dark"
            position="top-right"
            toastOptions={{
              style: {
                background: '#131823',
                borderColor: '#20293A',
                color: '#F8FAFC',
                borderRadius: '0.75rem',
              },
            }}
          />
        </StoreProvider>
      </body>
    </html>
  );
}
