import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

// Inisialisasi koneksi ke Upstash Redis 
// (Otomatis membaca UPSTASH_REDIS_REST_URL dan UPSTASH_REDIS_REST_TOKEN dari .env)
const redis = Redis.fromEnv();

export async function POST(request) {
  try {
    const body = await request.json();
    const { license_key, ip_address } = body;

    // Validasi dasar jika request kosong
    if (!license_key || !ip_address) {
      return NextResponse.json(
        { status: "error", message: "Key lisensi dan IP address wajib diisi." },
        { status: 400 }
      );
    }

    // 1. Ambil data lisensi dari database Redis
    // Data disimpan dengan struktur: { ip_address: "103.x.x.x", expired_at: "2026-12-31T00:00:00Z" }
    const license = await redis.get(license_key);

    if (!license) {
      return NextResponse.json({ 
        status: "error", 
        message: "Lisensi tidak ditemukan di sistem kami." 
      });
    }

    // 2. Cek IP Binding (Anti-Maling)
    if (license.ip_address !== ip_address) {
      return NextResponse.json({ 
        status: "invalid_ip", 
        message: `Lisensi ini terkunci untuk IP lain.` 
      });
    }

    // 3. Cek Kadaluwarsa (Masa Sewa)
    const currentDate = new Date();
    const expiredDate = new Date(license.expired_at);

    if (currentDate > expiredDate) {
      return NextResponse.json({ 
        status: "expired", 
        message: "Masa aktif lisensi Anda telah habis." 
      });
    }

    // 4. Validasi Sukses
    return NextResponse.json({ 
      status: "active", 
      message: "Autentikasi berhasil.", 
      expired_date: license.expired_at 
    });

  } catch (error) {
    console.error("Terjadi kesalahan pada API verifikasi:", error);
    return NextResponse.json(
      { status: "error", message: "Terjadi kesalahan pada server internal." }, 
      { status: 500 }
    );
  }
}
