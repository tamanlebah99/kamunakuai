'use client';

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Link from 'next/link';
import { Send, User, Heart } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatId] = useState(() => uuidv4());

  const categories = [
    {
      id: 1,
      name: "Pengembangan Diri",
      description: "Tingkatkan dirimu dengan panduan karir, pencapaian tujuan, dan solusi masalah.",
      icon: "https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.2/svgs/solid/lightbulb.svg"
    },
    {
      id: 2,
      name: "Spiritual",
      description: "Temukan inspirasi spiritual dari referensi hadits dan ajaran agama.",
      icon: "https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.2/svgs/solid/book-open.svg"
    },
    {
      id: 3,
      name: "Traveling",
      description: "Dapatkan rekomendasi tempat wisata, kafe, dan aktivitas seru di Bogor.",
      icon: "https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.2/svgs/solid/plane.svg"
    },
    {
      id: 4,
      name: "Hobi",
      description: "Eksplorasi hobi seperti menulis cerita dengan metode Save the Cat.",
      icon: "https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.2/svgs/solid/book.svg"
    },
    {
      id: 5,
      name: "Lainnya",
      description: "Kategori tambahan untuk topik-topik umum dan unik.",
      icon: "https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.2/svgs/solid/ellipsis.svg"
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: uuidv4(),
      content: input.trim(),
      role: 'user' as const
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('https://coachbot-n8n-01.fly.dev/webhook/chat/welcome', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input.trim(),
          chatId: chatId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      const assistantMessage = {
        id: uuidv4(),
        content: data[0].output,
        role: 'assistant' as const
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-800">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-[#4C1D95] flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-semibold">Kamunaku AI</h1>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            Masuk
          </Link>
          <Link
            href="/register"
            className="hidden md:block px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            Daftar
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col max-w-5xl mx-auto w-full p-4">
        <div className="flex-1 flex flex-col items-center justify-center gap-8 mb-8">
          <div className="text-center space-y-4">
            <h1 className="text-2xl md:text-4xl font-bold">Apa yang bisa saya bantu?</h1>
          </div>
          
          {/* Input Form - Centered */}
          <div className="w-full max-w-2xl">
            <form onSubmit={handleSubmit} className="relative flex items-center gap-2 bg-white rounded-full shadow-lg border border-gray-100 px-6 py-3">
              <User className="w-6 h-6 text-gray-400" />
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ketik pesan..."
                className="flex-1 px-2 bg-transparent border-0 focus:outline-none text-gray-600 placeholder:text-gray-400"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <Send className="w-6 h-6" />
              </button>
            </form>
          </div>
        </div>

        {/* Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {categories.map((category) => (
            <div
              key={category.id}
              className="p-6 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-purple-500 dark:hover:border-purple-500 transition-colors duration-200 cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/20 p-2 flex items-center justify-center">
                  <img
                    src={category.icon}
                    alt={category.name}
                    className="w-6 h-6 text-purple-600"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">{category.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {category.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-sm text-gray-500">
        <p>
          Dengan mengirim pesan ke Kamunaku AI, Anda menyetujui{' '}
          <Link href="/terms" className="font-bold text-gray-900 hover:underline">
            Ketentuan Layanan
          </Link>{' '}
          kami dan telah membaca{' '}
          <Link href="/privacy" className="font-bold text-gray-900 hover:underline">
            Kebijakan Privasi
          </Link>{' '}
          kami.
        </p>
      </footer>
    </div>
  );
}
