import { NextRequest, NextResponse } from 'next/server'

const GAS_URL = 'https://script.google.com/macros/s/AKfycbzuP8eQyYpWW5h8GWBb0d8fdMpHstT04NakfCdoCv0h04P1I2vbrH8qOdvuspczXYpMYQ/exec'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json({ 
        success: false, 
        error: 'Password harus diisi' 
      }, { status: 400 })
    }

    // Call Google Apps Script
    const response = await fetch(`${GAS_URL}?action=loginUser&password=${encodeURIComponent(password)}`)
    const data = await response.json()

    if (data.success) {
      return NextResponse.json({
        success: true,
        message: data.message,
        nama: data.nama || 'User',
        kelas: data.kelas || ''
      })
    } else {
      return NextResponse.json({
        success: false,
        error: data.error || 'Login gagal'
      }, { status: 401 })
    }
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Terjadi kesalahan saat login' 
    }, { status: 500 })
  }
}
