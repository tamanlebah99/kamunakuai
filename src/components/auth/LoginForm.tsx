'use client';

import { useState, Suspense, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Komponen untuk menangani params
function LoginParamsHandler({ onParamsChange }: { onParamsChange: (isJustRegistered: boolean) => void }) {
  const searchParams = useSearchParams();
  const isJustRegistered = searchParams.get('registered') === 'true';
  
  useEffect(() => {
    onParamsChange(isJustRegistered);
  }, [isJustRegistered, onParamsChange]);
  
  return null;
}

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isJustRegistered, setIsJustRegistered] = useState(false);
  const router = useRouter();

  const handleParamsChange = useCallback((isJustRegistered: boolean) => {
    setIsJustRegistered(isJustRegistered);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/webhook/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password
        }),
      });

      const data = await response.json();
      
      if (data.isValid) {
        // Login berhasil
        const authData = {
          user: {
            id: data.id,
            email: data.email,
            name: data.name
          }
        };
        localStorage.setItem('auth', JSON.stringify(authData));
        router.push('/explore');
      } else {
        // Login gagal
        setError(data.message || 'Login gagal. Silakan coba lagi.');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Suspense fallback={null}>
        <LoginParamsHandler onParamsChange={handleParamsChange} />
      </Suspense>

      {isJustRegistered && (
        <div className="p-3 text-sm text-green-600 bg-green-50 rounded-lg">
          Registrasi berhasil! Silakan login dengan akun Anda.
        </div>
      )}
      
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
          Email
        </label>
        <div className="mt-2">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="block w-full rounded-lg border border-gray-200 py-2 px-3 text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4C1D95] sm:text-sm sm:leading-6 bg-white"
            placeholder="nama@email.com"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
            Password
          </label>
          <div className="text-sm">
            <Link href="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
              Lupa password?
            </Link>
          </div>
        </div>
        <div className="mt-2">
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="block w-full rounded-lg border border-gray-200 py-2 px-3 text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4C1D95] sm:text-sm sm:leading-6 bg-white"
            placeholder="••••••••"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="flex w-full justify-center rounded-lg bg-[#4C1D95] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#5B21B6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4C1D95] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Memuat...' : 'Masuk'}
      </button>
    </form>
  );
} 