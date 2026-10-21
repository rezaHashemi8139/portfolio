import type { Metadata, Viewport } from 'next';
import '@/admin/admin.css';

export const metadata: Metadata = {
  title: 'Site editor',
  robots: { index: false, follow: false, nocache: true },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="adm">{children}</body>
    </html>
  );
}
