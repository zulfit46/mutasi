import { NextRequest, NextResponse } from 'next/server'

const GAS_URL = 'https://script.google.com/macros/s/AKfycbzuP8eQyYpWW5h8GWBb0d8fdMpHstT04NakfCdoCv0h04P1I2vbrH8qOdvuspczXYpMYQ/exec'

// PATCH - Update status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    
    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'updateStatus',
        type: 'keluar',
        rowIndex: body.rowIndex,
        status: body.status
      })
    })
    
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengupdate data' }, { status: 500 })
  }
}

// DELETE - Delete data
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    
    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'delete',
        type: 'keluar',
        rowIndex: body.rowIndex
      })
    })
    
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menghapus data' }, { status: 500 })
  }
}
