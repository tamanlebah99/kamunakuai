import Link from 'next/link';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/" className="text-xl font-semibold">
            Kamunaku AI
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Kebijakan Privasi</h1>
        
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-lg mb-6">
            Terakhir diperbarui: {new Date().toLocaleDateString('id-ID')}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Informasi yang Kami Kumpulkan</h2>
            <p>
              Kami mengumpulkan beberapa jenis informasi dari pengguna kami, termasuk:
            </p>
            <ul className="list-disc pl-6 mt-4">
              <li>Informasi yang Anda berikan saat mendaftar (nama, email)</li>
              <li>Riwayat percakapan dengan Kamunaku AI</li>
              <li>Informasi penggunaan layanan</li>
              <li>Data teknis (seperti IP address dan jenis browser)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Penggunaan Informasi</h2>
            <p>
              Kami menggunakan informasi yang dikumpulkan untuk:
            </p>
            <ul className="list-disc pl-6 mt-4">
              <li>Menyediakan dan meningkatkan layanan kami</li>
              <li>Personalisasi pengalaman pengguna</li>
              <li>Menganalisis penggunaan layanan</li>
              <li>Berkomunikasi dengan Anda tentang layanan kami</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Perlindungan Data</h2>
            <p>
              Kami mengambil langkah-langkah keamanan yang sesuai untuk melindungi informasi Anda dari akses yang tidak sah, 
              perubahan, pengungkapan, atau penghancuran yang tidak sah.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Berbagi Informasi</h2>
            <p>
              Kami tidak akan menjual, menukar, atau mentransfer informasi pribadi Anda kepada pihak ketiga tanpa persetujuan Anda, 
              kecuali jika diperlukan untuk menyediakan layanan atau diwajibkan oleh hukum.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Hak Pengguna</h2>
            <p>
              Anda memiliki hak untuk:
            </p>
            <ul className="list-disc pl-6 mt-4">
              <li>Mengakses informasi pribadi Anda</li>
              <li>Meminta koreksi informasi yang tidak akurat</li>
              <li>Meminta penghapusan informasi Anda</li>
              <li>Menolak penggunaan informasi Anda untuk tujuan tertentu</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Perubahan Kebijakan</h2>
            <p>
              Kami dapat memperbarui kebijakan privasi ini dari waktu ke waktu. Perubahan akan diumumkan di halaman ini 
              dengan tanggal pembaruan yang baru.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
} 