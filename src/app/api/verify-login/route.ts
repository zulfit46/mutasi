import { NextRequest, NextResponse } from 'next/server'

const GAS_URL = 'https://script.google.com/macros/s/AKfycbzuP8eQyYpWW5h8GWBb0d8fdMpHstT04NakfCdoCv0h04P1I2vbrH8qOdvuspczXYpMYQ/exec'

// GET - Verify login for keterangan access
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const password = searchParams.get('password')
    
    if (!password) {
      return NextResponse.json({ success: false, error: 'Password diperlukan' }, { status: 400 })
    }
    
    const response = await fetch(`${GAS_URL}?action=verifyLogin&password=${encodeURIComponent(password)}`)
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error verifying login:', error)
    return NextResponse.json({ success: false, error: 'Gagal verifikasi login' }, { status: 500 })
  }
}
