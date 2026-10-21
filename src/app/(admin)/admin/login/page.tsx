import { redirect } from 'next/navigation';
import { adminConfigured, isAdmin } from '@/lib/auth';
import { LoginForm } from '@/admin/LoginForm';
import { SetupNotice } from '@/admin/SetupNotice';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  if (!adminConfigured()) return <SetupNotice />;
  if (await isAdmin()) redirect('/admin');

  return (
    <div className="login">
      <div className="login__card">
        <h1>Site editor</h1>
        <p className="field__hint">Sign in to edit the content, images and files of this site.</p>
        <LoginForm />
      </div>
    </div>
  );
}
