# SakaliSe — Konten Sekali Akses

SakaliSe adalah aplikasi untuk membuat **tautan sekali pakai** berisi pesan teks dan/atau media seperti gambar, audio, dan video. Setelah tautan dibuka, konten dimusnahkan dan akan dibersihkan otomatis.

## Fitur Utama

- Buat tautan sekali akses dari teks dan/atau upload media
- Opsi kirim tautan lewat email (SMTP)
- **"Burn tab"**: jika link dibuka di 1 tab, tab lain yang masih membuka link akan “hangus” via Socket.IO
- File disajikan lewat **Signed URL** (default 60 detik)

## Tech Stack

- Backend: Node.js, Express, Socket.IO
- Storage & DB: Supabase (Database + Storage)
- Upload: Multer (memory storage)
- Email: Nodemailer

## Cara Menjalankan

1) Install dependency:

```bash
npm install
```

2) Buat file `.env` di root project (contoh variabel ada di bagian bawah).

3) Jalankan:

```bash
npm run dev
# atau
npm start
```

4) Buka:

- Halaman buat tautan: `http://localhost:3000/`
- Halaman baca konten: `http://localhost:3000/tampilan.html?token=...`

## Environment Variables

Wajib:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (jangan taruh di client)

Opsional:

- `PORT` (default `3000`)
- `BASE_URL` (untuk membentuk link share; jika kosong akan pakai host dari request)

SMTP (opsional, hanya jika ingin fitur kirim email):

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE` (`true`/`false`)
- `SMTP_USER`
- `SMTP_PASS`

Contoh `.env`:

```env
PORT=3000
BASE_URL=http://localhost:3000

SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxxxxxxxx

SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## Setup Supabase

Aplikasi menggunakan:

- Bucket Storage: `sakalise-files`
- Table DB: `links`

### 1) Buat bucket `sakalise-files`

- Buat bucket bernama `sakalise-files`
- Disarankan **private** (karena akses file menggunakan signed URL)

### 2) Buat tabel `links`

Field yang dipakai aplikasi:

- `token` (unik)
- `judul`
- `isi_konten`
- `files` (array metadata file)
- `status` (`AKTIF` / `TERPAKAI`)
- `accessed_at`

Contoh SQL (sesuaikan dengan kebutuhanmu):

```sql
create table if not exists public.links (
  id bigserial primary key,
  token text not null unique,
  judul text not null,
  isi_konten text null,
  files jsonb not null default '[]'::jsonb,
  status text not null default 'AKTIF',
  accessed_at timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists links_token_idx on public.links (token);
```

## Aturan Konten & Upload

- Minimal isi **teks atau file** harus ada
- Tipe file yang diizinkan: `image/*`, `audio/*`, `video/*`
- Batas ukuran file (multer): hingga **200MB per file**

## Endpoint API

Base path: `/api/links`

### `POST /api/links`

Membuat tautan baru.

- Content-Type: `multipart/form-data`
- Body:
  - `isi_konten` (string, opsional)
  - `judul` (string, opsional)
  - `email` (string, opsional; jika diisi akan mengirim email)
  - `files` (0..n)

Response sukses:

```json
{ "success": true, "data": { "bagikanUrl": "..." } }
```

### `GET /api/links/:token/check`

Cek apakah token masih valid.

Response:

```json
{ "valid": true, "data": { "judul": "..." } }
```

### `GET /api/links/:token?socketId=...`

Mengakses konten **sekali pakai**.

- Jika sukses: status berubah dari `AKTIF` → `TERPAKAI`, lalu mengirim event `burn` ke tab lain (room token) selain `socketId`.
- File akan dikembalikan sebagai signed URL (berlaku singkat).
- Setelah diakses, data & file akan dihapus otomatis setelah jeda (lihat implementasi di `src/controllers/linkController.js`).

Response sukses:

```json
{
  "success": true,
  "data": {
    "judul": "...",
    "isi_konten": "...",
    "files": [{ "name": "...", "mime": "...", "signedUrl": "..." }]
  }
}
```

## Struktur Singkat

- `server.js`: entry point Express + Socket.IO
- `src/routes/route.js`: definisi endpoint
- `src/controllers/linkController.js`: logika buat/cek/akses link sekali pakai
- `src/services/layananPenyimpanan.js`: upload, signed URL, hapus file (Supabase Storage)
- `src/services/layananEmail.js`: kirim email (Nodemailer)
- `public/`: UI (buat link & tampilan konten)
