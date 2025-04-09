import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { GoogleAuthProvider } from '@/components/providers/GoogleOAuthProvider';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export default function WelcomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <GoogleAuthProvider>
        {children}
        <Toaster />
      </GoogleAuthProvider>
    </ThemeProvider>
  );
} 