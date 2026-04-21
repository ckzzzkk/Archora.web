import type { Metadata } from 'next';
import { Suspense } from 'react';
import AuthForm from '@/components/AuthForm';

export const metadata: Metadata = {
  title: 'Log In',
  description: 'Sign in to your ASORIA account to manage your subscription and access premium features.',
};

export default function LoginPage() {
  return (
    <section className="min-h-[80vh] flex items-center justify-center px-6 py-20">
      <div className="w-full max-w-md">
        <Suspense fallback={
          <div className="border border-sketch rounded-card bg-surface p-12 text-center">
            <p className="text-text-dim font-body">Loading...</p>
          </div>
        }>
          <AuthForm />
        </Suspense>
      </div>
    </section>
  );
}
