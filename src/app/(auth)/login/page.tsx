'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { loginWithGoogle } from '@/lib/api/auth';
import { GoogleLogin } from '@react-oauth/google';
import { LoginForm } from '@/components/auth/LoginForm';
import { Heart } from 'lucide-react';

// Deklarasi tipe untuk window.google
declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          cancel: () => void;
          initialize: (params: Record<string, unknown>) => void;
          prompt: () => void;
          renderButton: (element: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

export default function LoginPage() {
  const router = useRouter();
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

  const handleGoogleSuccess = async (credentialResponse: { credential: string }) => {
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
    } catch (err) {
      console.error('Google login error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <Link href="/" className="flex justify-center mb-8">
            <div className="w-12 h-12 rounded-full bg-[#4C1D95] flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
          </Link>
          <h2 className="text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
            Selamat datang kembali
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
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

            <div className="mt-6">
              <div className="w-full flex justify-center">
                <div className="w-full">
                  {isGoogleReady && (
                    <div className="rounded-lg overflow-hidden">
                      <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => {
                          console.error('Login Failed');
                        }}
                        useOneTap={false}
                        type="standard"
                        theme="outline"
                        size="large"
                        width="100%"
                        text="continue_with"
                        shape="rectangular"
                        locale="id_ID"
                      />
                    </div>
                  )}
                </div>
              </div>
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