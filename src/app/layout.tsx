import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DiáriaCamp - Gestão de Diárias de Campanha',
  description:
    'Sistema de gestão de pagamento de diárias para trabalhadores em campanha política com perfis de Administrador, Gestor e Coordenador.',
  openGraph: {
    title: 'DiáriaCamp - Gestão de Campanha',
    description:
      'Sistema de gestão de pagamento de diárias para trabalhadores em campanha política com perfis de Administrador, Gestor e Coordenador.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0f172a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
