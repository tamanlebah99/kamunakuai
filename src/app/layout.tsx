import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { GoogleAuthProvider } from '@/components/providers/GoogleOAuthProvider';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { ChatProvider } from '@/contexts/ChatContext';
import { ExploreProvider } from '@/contexts/ExploreContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Kamunaku AI - Asisten AI Pribadi Anda',
  description: 'Asisten AI yang membantu Anda dalam berbagai tugas sehari-hari',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={inter.className}>
        <SidebarProvider>
          <ChatProvider>
            <ExploreProvider>
              <GoogleAuthProvider>
                <ThemeProvider
                  attribute="class"
                  defaultTheme="system"
                  enableSystem
                  disableTransitionOnChange
                >
                  {children}
                </ThemeProvider>
              </GoogleAuthProvider>
            </ExploreProvider>
          </ChatProvider>
        </SidebarProvider>
      </body>
    </html>
  );
}
