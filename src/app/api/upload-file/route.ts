import { NextRequest, NextResponse } from 'next/server'

const GAS_URL = 'https://script.google.com/macros/s/AKfycbzuP8eQyYpWW5h8GWBb0d8fdMpHstT04NakfCdoCv0h04P1I2vbrH8qOdvuspczXYpMYQ/exec'

// POST - Upload file to Google Drive
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { fileName, mimeType, fileData, nisn, nama, oldFileUrl } = body
    
    console.log('Upload request received:', { 
      fileName, 
      mimeType, 
      hasData: !!fileData,
      nisn,
      nama,
      hasOldFile: !!oldFileUrl
    })
    
    if (!fileData) {
      console.log('Missing required fields:', { fileData: !!fileData })
      return NextResponse.json({ 
        success: false, 
        error: 'fileData diperlukan' 
      }, { status: 400 })
    }
    
    // Upload to Google Drive via GAS
    console.log('Sending to GAS...')
    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'uploadFile',
        fileName: fileName || 'file',
        mimeType: mimeType || 'application/octet-stream',
        fileData: fileData,
        nisn: nisn || '',
        nama: nama || '',
        oldFileUrl: oldFileUrl || ''
      })
    })
    
    const data = await response.json()
    console.log('GAS response:', data)
    
    if (!data.success) {
      console.log('Upload failed:', data.error)
      return NextResponse.json({ 
        success: false, 
        error: data.error || 'Gagal upload file' 
      }, { status: 500 })
    }
    
    console.log('Upload successful:', data.fileUrl)
    return NextResponse.json({
      success: true,
      fileId: data.fileId,
      fileName: data.fileName,
      fileUrl: data.fileUrl || data.webViewLink
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Gagal upload file ke Google Drive: ' + (error instanceof Error ? error.message : String(error)) 
    }, { status: 500 })
  }
}
