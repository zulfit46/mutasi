import { NextRequest, NextResponse } from 'next/server'

const GAS_URL = 'https://script.google.com/macros/s/AKfycbzuP8eQyYpWW5h8GWBb0d8fdMpHstT04NakfCdoCv0h04P1I2vbrH8qOdvuspczXYpMYQ/exec'

// GET - Fetch all mutasi masuk or rombel options
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    if (action === 'getRombel') {
      const response = await fetch(`${GAS_URL}?action=getRombel`)
      const data = await response.json()
      return NextResponse.json(data)
    }
    
    // Default: get all mutasi masuk
    const response = await fetch(`${GAS_URL}?action=getMasuk`)
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching data:', error)
    return NextResponse.json([])
  }
}

// POST - Add new mutasi masuk
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Mapping field names dari camelCase ke snake_case
    const payload = {
      action: 'addMasuk',
      nisn: body.nisn,
      nama_siswa: body.namaSiswa,
      provinsi: body.provinsi,
      kab_kota: body.kabKota,
      kecamatan: body.kecamatan,
      nama_sekolah: body.namaSekolah,
      rombel_tujuan: body.rombelTujuan,
    }
    
    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error saving mutasi masuk:', error)
    return NextResponse.json({ error: 'Gagal menyimpan data' }, { status: 500 })
  }
}

// DELETE - Delete mutasi masuk
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const row = searchParams.get('row')
    
    if (!row) {
      return NextResponse.json({ success: false, error: 'Row tidak ditemukan' }, { status: 400 })
    }
    
    const response = await fetch(`${GAS_URL}?action=deleteMasuk&row=${row}`)
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error deleting mutasi masuk:', error)
    return NextResponse.json({ success: false, error: 'Gagal menghapus data' }, { status: 500 })
  }
}

// PUT - Update mutasi masuk
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Mapping field names dari camelCase ke snake_case
    const payload = {
      action: 'updateMasuk',
      row: body.row,
      nisn: body.nisn,
      nama_siswa: body.namaSiswa,
      provinsi: body.provinsi,
      kab_kota: body.kabKota,
      kecamatan: body.kecamatan,
      nama_sekolah: body.namaSekolah,
      rombel_tujuan: body.rombelTujuan,
      ket: body.ket,
    }
    
    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating mutasi masuk:', error)
    return NextResponse.json({ error: 'Gagal mengupdate data' }, { status: 500 })
  }
}
