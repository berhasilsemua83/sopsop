/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║           KONFIGURASI AFFILIATE LINK SHOPEE — SVScript AI            ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * ── CARA SETUP (3 Langkah) ──────────────────────────────────────────────
 *
 * LANGKAH 1 — Isi BLOG_REDIRECT_URL
 *   Ganti string kosong di bawah dengan URL halaman blog Anda.
 *   Contoh: 'https://namablog.blogspot.com/p/promo.html'
 *
 *   Jika dikosongkan (''), link Shopee akan dibuka langsung tanpa redirect.
 *
 * LANGKAH 2 — Isi AFFILIATE_LINKS
 *   Tambahkan semua link affiliate Shopee Anda (bisa hingga 100+).
 *   Format: 'https://s.shopee.co.id/xxxxxxxxx'
 *
 * LANGKAH 3 — Setup halaman blog Anda
 *   Buat halaman baru di blog, lalu tambahkan kode HTML berikut:
 *
 *   ┌─────────────────────────────────────────────────────────────────┐
 *   │ <div id="wrap" style="margin:0;padding:0;overflow:hidden">      │
 *   │   <iframe id="shopee-frame"                                     │
 *   │     style="width:100%;height:100vh;border:none;display:block"   │
 *   │     allowfullscreen>                                            │
 *   │   </iframe>                                                     │
 *   │ </div>                                                          │
 *   │ <script>                                                        │
 *   │   (function() {                                                 │
 *   │     var params = new URLSearchParams(window.location.search);   │
 *   │     var shopUrl = params.get('shop');                           │
 *   │     if (shopUrl) {                                              │
 *   │       document.getElementById('shopee-frame').src = shopUrl;   │
 *   │     }                                                           │
 *   │   })();                                                         │
 *   │ </script>                                                       │
 *   └─────────────────────────────────────────────────────────────────┘
 *
 *   URL halaman blog Anda itulah yang diisi di BLOG_REDIRECT_URL.
 *   Ketika dipanggil, app akan otomatis menambahkan ?shop=LINK_SHOPEE
 *   sehingga iframe langsung memuat link affiliate yang dipilih secara acak.
 */

// ─── [LANGKAH 1] Ganti dengan URL halaman blog Anda ──────────────────────────
// Contoh: 'https://namablog.blogspot.com/p/promo.html'
// Kosongkan ('') untuk buka link Shopee langsung (tanpa iframe blog)
export const BLOG_REDIRECT_URL = '';


// ─── [LANGKAH 2] Daftar Link Affiliate Shopee Anda ───────────────────────────
// Tambahkan link affiliate sebanyak yang Anda punya (1 link per baris)
// Setiap klik Generate akan memilih link secara acak

export const AFFILIATE_LINKS: string[] = [
  // === CONTOH FORMAT (hapus "//" dan ganti dengan link Anda) ===
  'https://s.shopee.co.id/50WITe1hfK',
'https://s.shopee.co.id/7fX3ebpJiS',
'https://s.shopee.co.id/1109iNsquh',
'https://s.shopee.co.id/5flzGzQNan',
'https://s.shopee.co.id/9Uyhq3wxEK',
'https://s.shopee.co.id/7KuDG900oQ',
'https://s.shopee.co.id/3g0utR9vq7',
'https://s.shopee.co.id/9zuyR6el2A',
  // 'https://s.shopee.co.id/link02',
  // 'https://s.shopee.co.id/link03',
  // 'https://s.shopee.co.id/link04',
  // 'https://s.shopee.co.id/link05',
  // 'https://s.shopee.co.id/link06',
  // 'https://s.shopee.co.id/link07',
  // 'https://s.shopee.co.id/link08',
  // 'https://s.shopee.co.id/link09',
  // 'https://s.shopee.co.id/link10',
  // ... tambah terus hingga link ke-100
];


// ─── Helper Functions (tidak perlu diubah) ───────────────────────────────────

/**
 * Pilih satu link affiliate secara acak dari AFFILIATE_LINKS.
 * Mengembalikan null jika array masih kosong.
 */
export function getRandomAffiliateLink(): string | null {
  if (AFFILIATE_LINKS.length === 0) return null;
  const idx = Math.floor(Math.random() * AFFILIATE_LINKS.length);
  return AFFILIATE_LINKS[idx];
}

/**
 * Buka link affiliate di tab baru saat user klik Generate.
 *
 * Logika:
 * - Jika BLOG_REDIRECT_URL diisi  → buka blog dengan ?shop=LINK_SHOPEE
 *   (user melihat blog, iframe di dalam blog memuat Shopee)
 * - Jika BLOG_REDIRECT_URL kosong → buka link Shopee langsung
 * - Jika AFFILIATE_LINKS kosong   → tidak buka apa-apa (silent)
 *
 * PENTING: fungsi ini harus dipanggil SEBELUM operasi async (await)
 * agar tidak diblokir popup-blocker browser.
 */
export function openAffiliateLink(): void {
  const link = getRandomAffiliateLink();
  if (!link) return;

  const targetUrl = BLOG_REDIRECT_URL.trim()
    ? `${BLOG_REDIRECT_URL.trim()}?shop=${encodeURIComponent(link)}`
    : link;

  window.open(targetUrl, '_blank', 'noopener,noreferrer');
}
