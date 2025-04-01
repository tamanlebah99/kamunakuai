import { useState } from 'react';
import Link from 'next/link';
import { login } from '@/lib/api/auth';
import { useRouter } from 'next/navigation';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await login({ email, password });
      if (response.token) {
        localStorage.setItem('auth', JSON.stringify(response));
        router.push('/explore');
      } else {
        setError('Login gagal. Silakan coba lagi.');
      }
    } catch (error) {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded-lg">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900 dark:text-white">
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
            className="block w-full rounded-lg border border-gray-200 dark:border-gray-800 py-2 px-3 text-gray-900 dark:text-white shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4C1D95] sm:text-sm sm:leading-6 bg-white dark:bg-gray-900"
            placeholder="nama@email.com"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900 dark:text-white">
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
            className="block w-full rounded-lg border border-gray-200 dark:border-gray-800 py-2 px-3 text-gray-900 dark:text-white shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4C1D95] sm:text-sm sm:leading-6 bg-white dark:bg-gray-900"
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