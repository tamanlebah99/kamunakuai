'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { login, loginWithGoogle, loginWithFacebook } from '@/lib/api/auth';
import { GoogleLogin } from '@react-oauth/google';
import { LoginForm } from '@/components/auth/LoginForm';

// Deklarasi tipe untuk window.google
declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          cancel: () => void;
          initialize: (params: any) => void;
          prompt: () => void;
          renderButton: (element: HTMLElement, options: any) => void;
        };
      };
    };
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isGoogleReady, setIsGoogleReady] = useState(false);

  useEffect(() => {
    // Bersihkan state Google sebelumnya
    if (window.google?.accounts?.id) {
      window.google.accounts.id.cancel();
    }
    
    // Hapus data dari sessionStorage
    sessionStorage.removeItem('google_auto_select');
    
    // Tunggu sebentar sebelum menginisialisasi Google Sign-In
    const timer = setTimeout(() => {
      setIsGoogleReady(true);
    }, 1000);

    return () => {
      clearTimeout(timer);
      if (window.google?.accounts?.id) {
        window.google.accounts.id.cancel();
      }
    };
  }, []);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setIsLoading(true);
    try {
      console.log('Google credential:', credentialResponse);
      
      // Login ke backend dengan ID token
      const response = await loginWithGoogle({
        token: credentialResponse.credential,
        email: '',
        name: '',
      });

      console.log('Backend response:', response);

      if (!response || !response.user_id) {
        throw new Error('Data response tidak valid');
      }

      // Simpan data user di localStorage dengan format yang sama dengan login biasa
      const authData = {
        token: credentialResponse.credential,
        user: {
          id: response.user_id,
          name: response.name,
          email: response.email
        }
      };
      
      localStorage.setItem('auth', JSON.stringify(authData));
      router.push('/explore');
    } catch (error) {
      console.error('Google login error:', error);
      setError(error instanceof Error ? error.message : 'Terjadi kesalahan saat login dengan Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await login({ email, password });
      
      // Pastikan format data konsisten
      const authData = {
        token: response.token,
        user: {
          id: response.user.id,
          name: response.user.name,
          email: response.user.email
        }
      };
      
      localStorage.setItem('auth', JSON.stringify(authData));
      router.push('/explore');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Terjadi kesalahan saat login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <h2 className="text-center text-2xl font-bold leading-9 tracking-tight text-gray-900 dark:text-white">
            Selamat datang kembali
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Silakan masuk ke akun Anda
          </p>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          <LoginForm />

          <div className="mt-6 text-center">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white dark:bg-gray-900 px-2 text-gray-500 dark:text-gray-400">
                  Atau lanjutkan dengan
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="flex justify-center">
                {isGoogleReady && (
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => {
                      console.error('Login Failed');
                      setError('Login dengan Google gagal');
                    }}
                    useOneTap={false}
                    type="standard"
                    theme="outline"
                    size="large"
                    width="100%"
                    text="continue_with"
                    shape="pill"
                    locale="id_ID"
                  />
                )}
              </div>

              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm font-semibold text-gray-900 dark:text-white shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4C1D95]"
              >
                <svg className="h-5 w-5 text-[#1877F2]" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9.09815 24L9.15079 15.0964H4V10.9137H9.15079V7.96274C9.15079 2.53428 11.8666 0 16.7775 0C19.1238 0 20.8866 0.150446 21.4875 0.217996V4.34084L18.3333 4.34179C15.9109 4.34179 15.3657 5.4866 15.3657 7.16765V10.9137H22L20.3378 15.0964H15.3657V24H9.09815Z" />
                </svg>
                <span>Facebook</span>
              </button>
            </div>

            <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
              Belum punya akun?{' '}
              <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
                Daftar sekarang
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 