'use client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { useState, useRef, useEffect, Suspense } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Link from 'next/link';
import { Send, User, Heart } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { SearchParamsProvider } from '@/components/common/SearchParamsProvider';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
}

const markdownComponents = {
  p: ({ children }: { children: React.ReactNode }) => <p className="mb-2 last:mb-0">{children}</p>,
  strong: ({ children }: { children: React.ReactNode }) => <strong className="font-bold">{children}</strong>,
  em: ({ children }: { children: React.ReactNode }) => <em className="italic">{children}</em>,
  ul: ({ children }: { children: React.ReactNode }) => (
    <ul className="list-disc pl-6 space-y-2 my-4">
      {children}
    </ul>
  ),
  ol: ({ children }: { children: React.ReactNode }) => <ol className="list-decimal pl-6 mb-2">{children}</ol>,
  li: ({ children }: { children: React.ReactNode }) => (
    <li className="pl-2">
      {children}
    </li>
  ),
  code: ({ inline, className, children }: { inline?: boolean; className?: string; children: React.ReactNode }) => {
    const match = /language-(\w+)/.exec(className || '');
    return !inline && match ? (
      <SyntaxHighlighter
        style={tomorrow}
        language={match[1]}
        PreTag="div"
        className="rounded-md my-2"
      >
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    ) : (
      <code className="bg-gray-100 rounded px-1">
        {children}
      </code>
    );
  }
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [chatId] = useState(() => uuidv4());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage = {
      id: uuidv4(),
      content: text.trim(),
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
          message: text.trim(),
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      await handleSendMessage(input);
    }
  };

  const handleCategoryClick = async (category: { name: string; description: string }) => {
    let message = '';
    
    switch (category.name) {
      case 'Pengembangan Diri':
        message = 'Saya tertarik dengan kategori Pengembangan Diri. Dapatkah kamu menjelaskan fitur apa yang kamu miliki terkait pengembangan diri?';
        break;
      case 'Spiritual':
        message = 'Saya tertarik dengan kategori Spiritual. Bisakah kamu jelaskan fitur-fitur yang tersedia untuk membantu saya dalam hal spiritual?';
        break;
      case 'Traveling':
        message = 'Saya tertarik dengan kategori Traveling. Bisa tolong jelaskan fitur apa saja yang bisa membantu saya menemukan tempat-tempat menarik di Bogor?';
        break;
      case 'Hobi':
        message = 'Saya tertarik dengan kategori Hobi. Dapatkah kamu menjelaskan fitur-fitur yang tersedia untuk mengembangkan hobi saya?';
        break;
      default:
        message = 'Saya tertarik dengan kategori Lainnya. Bisa tolong jelaskan fitur-fitur unik apa saja yang tersedia?';
    }

    await handleSendMessage(message);
  };

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchParamsProvider>
        {(searchParams) => (
          <div className="flex flex-col min-h-screen bg-white">
            {/* Header */}
            <header className="flex justify-between items-center p-4 border-b border-gray-200">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-[#4C1D95] flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-semibold text-gray-900">Kamunaku AI</h1>
              </Link>
              <div className="flex items-center gap-4">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="hidden md:block px-4 py-2 text-sm font-medium text-white bg-[#4C1D95] hover:bg-[#3b1672] rounded-lg"
                >
                  Daftar
                </Link>
              </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col max-w-5xl mx-auto w-full p-4 relative">
              <div className="text-center mb-4">
                <h1 className="text-2xl md:text-4xl font-bold text-gray-900">Apa yang bisa saya bantu?</h1>
              </div>

              {/* Category Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    onClick={() => handleCategoryClick(category)}
                    className="p-6 rounded-lg border border-gray-200 hover:border-[#4C1D95] transition-colors duration-200 cursor-pointer bg-white"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-[#F3E8FF] p-2 flex items-center justify-center">
                        <img
                          src={category.icon}
                          alt={category.name}
                          className="w-6 h-6 text-[#4C1D95]"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2 text-gray-900">{category.name}</h3>
                        <p className="text-sm text-gray-600">
                          {category.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto mb-24">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start mb-6 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <div className="w-full bg-white">
                        <div className="text-[14px] text-gray-700 leading-relaxed py-3 px-8">
                          <div className="prose prose-sm prose-gray max-w-none chat-message">
                            <ReactMarkdown>
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-[#f9f6fe] px-4 py-3 rounded-lg max-w-[70%]">
                        <div className="text-[14px] text-gray-700 leading-relaxed">
                          <div className="prose prose-sm prose-gray max-w-none chat-message">
                            <ReactMarkdown>
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-center justify-center gap-2 text-gray-500">
                    <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce"></div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100">
                <div className="max-w-5xl mx-auto px-4">
                  <form onSubmit={handleSubmit} className="flex flex-col bg-white rounded-2xl shadow-lg overflow-hidden mb-2">
                    <div className="flex items-center gap-2 p-2">
                      <User className="w-6 h-6 text-gray-400" />
                      <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ketik pesan..."
                        className="flex-1 px-4 py-2 bg-transparent focus:outline-none text-[14px] text-gray-700"
                        disabled={isLoading}
                      />
                      <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="p-2 bg-black hover:bg-gray-900 rounded-full"
                      >
                        <Send className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </form>
                  
                  {/* Disclaimer */}
                  <div className="text-center pb-4 text-xs text-gray-500">
                    {messages.length === 0 ? (
                      <p>
                        Dengan mengirim pesan ke Kamunaku AI, Anda menyetujui{' '}
                        <Link href="/terms" className="font-bold text-[#4C1D95] hover:underline">
                          Ketentuan Layanan
                        </Link>{' '}
                        kami dan telah membaca{' '}
                        <Link href="/privacy" className="font-bold text-[#4C1D95] hover:underline">
                          Kebijakan Privasi
                        </Link>{' '}
                        kami.
                      </p>
                    ) : (
                      <p className="text-gray-500">
                        Kamunaku AI bisa salah. Periksa info penting.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </main>
          </div>
        )}
      </SearchParamsProvider>
    </Suspense>
  );
}
