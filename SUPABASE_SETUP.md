# Setup Database Supabase (Tanpa Upload Foto)

## 1. Buat Tabel `form_submissions`

Jalankan SQL berikut di Supabase SQL Editor:

```sql
CREATE TABLE form_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  sector TEXT NOT NULL,
  department TEXT NOT NULL,
  division TEXT NOT NULL,
  program_studi TEXT NOT NULL,
  instagram TEXT NOT NULL,
  birth_place TEXT NOT NULL,
  birth_date DATE NOT NULL,
  quotes TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow insert
CREATE POLICY "Allow public insert" ON form_submissions
  FOR INSERT TO public
  WITH CHECK (true);

-- Create policy to allow read access
CREATE POLICY "Allow public read access" ON form_submissions
  FOR SELECT TO public
  USING (true);
```

## 2. Update File `.env.local`

Ganti nilai di file `.env.local` dengan credentials Supabase Anda:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Dapatkan credentials dari Supabase Dashboard > Settings > API

## 3. Jalankan Aplikasi

```bash
npm run dev
```

Aplikasi akan berjalan di http://localhost:3000

## 4. Struktur Data Form

Form akan menyimpan data berikut:
- **employee_id**: ID karyawan dari JSON
- **employee_name**: Nama panggilan
- **full_name**: Nama lengkap
- **sector**: Sektor (FNS, Event, General)
- **department**: Departemen (Finance, Secretariat, dll)
- **division**: Divisi/Posisi
- **program_studi**: Program Studi (Ilmu Politik, Hukum, Informatika, dll)
- **instagram**: Username Instagram
- **birth_place**: Tempat lahir
- **birth_date**: Tanggal lahir
- **quotes**: Quotes/motto

## 5. Query untuk Melihat Data

```sql
-- Lihat semua data yang sudah disubmit
SELECT * FROM form_submissions ORDER BY created_at DESC;

-- Lihat data berdasarkan departemen
SELECT * FROM form_submissions WHERE department = 'Finance';

-- Lihat data berdasarkan sector
SELECT * FROM form_submissions WHERE sector = 'FNS';

-- Count data per departemen
SELECT department, COUNT(*) as total 
FROM form_submissions 
GROUP BY department 
ORDER BY total DESC;
```
