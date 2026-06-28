import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { license_key, ip_address } = await request.json();

    // 1. Ambil data lisensi berdasarkan key
    // Data disimpan dalam format JSON: { ip_address: "...", expired_at: "..." }
    const license = await kv.get(license_key);

    if (!license) {
      return NextResponse.json({ status: "error", message: "Lisensi tidak ditemukan." });
    }

    // 2. Cek IP Binding
    if (license.ip_address !== ip_address) {
      return NextResponse.json({ status: "invalid_ip", message: "IP VPS tidak cocok." });
    }

    // 3. Cek Kadaluwarsa
    if (new Date() > new Date(license.expired_at)) {
      return NextResponse.json({ status: "expired", message: "Masa aktif habis." });
    }

    return NextResponse.json({ 
      status: "active", 
      message: "Sukses", 
      expired_date: license.expired_at 
    });

  } catch (e) {
    return NextResponse.json({ status: "error", message: "Internal server error." }, { status: 500 });
  }
}
