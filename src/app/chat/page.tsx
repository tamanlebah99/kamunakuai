'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { ChatContent } from '@/components/chat/ChatContent';

// Komponen untuk menangani params
function ChatParamsHandler() {
  const searchParams = useSearchParams();
  return null;
}

// Tambahkan konfigurasi dynamic route
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export default function ChatPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <>
      <Suspense fallback={null}>
        <ChatParamsHandler />
      </Suspense>
      <div className="flex h-screen">
        <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
        <Suspense fallback={<div>Loading...</div>}>
          <ChatContent 
            isSidebarOpen={isSidebarOpen} 
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
          />
        </Suspense>
      </div>
    </>
  );
} 