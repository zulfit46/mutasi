import { NextRequest, NextResponse } from 'next/server'

const GAS_URL = 'https://script.google.com/macros/s/AKfycbzuP8eQyYpWW5h8GWBb0d8fdMpHstT04NakfCdoCv0h04P1I2vbrH8qOdvuspczXYpMYQ/exec'

// GET - Fetch all mutasi keluar atau search siswa
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const nipd = searchParams.get('nipd')
    
    if (nipd) {
      // Search siswa by NIPD
      const response = await fetch(`${GAS_URL}?action=searchSiswa&nipd=${encodeURIComponent(nipd)}`)
      const data = await response.json()
      return NextResponse.json(data)
    }
    
    // Get all mutasi keluar
    const response = await fetch(`${GAS_URL}?action=getKeluar`)
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json([])
  }
}

// POST - Add new mutasi keluar
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'addKeluar',
        ...body
      })
    })
    
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error saving mutasi keluar:', error)
    return NextResponse.json({ error: 'Gagal menyimpan data' }, { status: 500 })
  }
}

// PUT - Update mutasi keluar
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'updateKeluar',
        ...body
      })
    })
    
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating mutasi keluar:', error)
    return NextResponse.json({ error: 'Gagal mengupdate data' }, { status: 500 })
  }
}

// DELETE - Delete mutasi keluar
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const row = searchParams.get('row')
    
    if (!row) {
      return NextResponse.json({ success: false, error: 'Row tidak ditemukan' }, { status: 400 })
    }
    
    const response = await fetch(`${GAS_URL}?action=deleteKeluar&row=${row}`)
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error deleting mutasi keluar:', error)
    return NextResponse.json({ success: false, error: 'Gagal menghapus data' }, { status: 500 })
  }
}
