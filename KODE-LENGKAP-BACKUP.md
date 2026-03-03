# KODE LENGKAP - SISTEM MUTASI SISWA SMKN 1 PALOPO
## Backup tanggal: Januari 2025

---

## DAFTAR ISI:
1. Google Apps Script (Backend)
2. Next.js - page.tsx (Halaman Utama)
3. Next.js - mutasi-masuk-form.tsx
4. Next.js - mutasi-masuk-edit-form.tsx
5. Next.js - mutasi-keluar-form.tsx
6. Next.js - mutasi-keluar-edit-form.tsx
7. Next.js - mutasi-list.tsx
8. Next.js - login-form.tsx
9. Next.js - API Routes

---

# 1. GOOGLE APPS SCRIPT (Backend)
## File: Code.gs

```javascript
// ========================================
// KONFIGURASI
// ========================================

// ID Spreadsheet dan folder (GANTI DENGAN ID ANDA)
const SPREADSHEET_ID = '1M6Ih95J_hQS2p4NLqGKXZKVZJYJjXLSj7J0tSjQNxPU';
const DRIVE_FOLDER_ID = '1DqDhF2tXZ-_xq_B0VZmTCTzSKJ5-xZyN';

// Konfigurasi Telegram Bot
const TELEGRAM_BOT_TOKEN = '8798086610:AAHTiioEb5YqjiEU6K6YFAWdf0f-zmpyp-I';
const TELEGRAM_CHAT_ID = '1027594762';

// Nama sheet
const SHEET_MASUK = 'Mutasi Masuk';
const SHEET_KELUAR = 'Mutasi Keluar';
const SHEET_SISWA = 'Data Siswa';
const SHEET_ROMBEL = 'Rombel';

// ========================================
// FUNGSI UTILITAS
// ========================================

function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function getSheet(name) {
  return getSpreadsheet().getSheetByName(name);
}

// Fungsi untuk menghasilkan nomor urut otomatis
function generateNo(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return 1;
  var data = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  var maxNo = 0;
  for (var i = 0; i < data.length; i++) {
    if (data[i][0] > maxNo) maxNo = data[i][0];
  }
  return maxNo + 1;
}

// Fungsi untuk format tanggal
function formatDate(date) {
  if (!date) return '';
  var d = new Date(date);
  var day = ('0' + d.getDate()).slice(-2);
  var month = ('0' + (d.getMonth() + 1)).slice(-2);
  var year = d.getFullYear();
  return day + '/' + month + '/' + year;
}

// Fungsi untuk mendapatkan timestamp
function getTimestamp() {
  return new Date().toISOString();
}

// ========================================
// FUNGSI TELEGRAM NOTIFICATION
// ========================================

function sendTelegramNotification(message) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    Logger.log('Telegram configuration missing');
    return false;
  }
  
  var url = 'https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN + '/sendMessage';
  
  var payload = {
    chat_id: TELEGRAM_CHAT_ID,
    text: message,
    parse_mode: 'HTML'
  };
  
  var options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  try {
    var response = UrlFetchApp.fetch(url, options);
    var responseCode = response.getResponseCode();
    if (responseCode === 200) {
      Logger.log('Telegram notification sent successfully');
      return true;
    } else {
      Logger.log('Telegram notification failed: ' + response.getContentText());
      return false;
    }
  } catch (e) {
    Logger.log('Error sending Telegram notification: ' + e.toString());
    return false;
  }
}

function formatMutasiMasukNotification(data) {
  var message = '🟢 <b>MUTASI MASUK BARU</b>\n\n';
  message += '👤 <b>Nama:</b> ' + data.nama_siswa + '\n';
  message += '🎓 <b>NISN:</b> ' + data.nisn + '\n';
  message += '🏫 <b>Asal Sekolah:</b> ' + data.nama_sekolah + '\n';
  message += '📍 <b>Asal:</b> ' + data.kecamatan + ', ' + data.kab_kota + ', ' + data.provinsi + '\n';
  message += '📚 <b>Rombel Tujuan:</b> ' + data.rombel_tujuan + '\n';
  message += '📅 <b>Waktu:</b> ' + formatDate(new Date()) + '\n';
  message += '\n<i>Data ditambahkan via Sistem Mutasi Siswa SMKN 1 Palopo</i>';
  return message;
}

function formatMutasiKeluarNotification(data) {
  var message = '🔴 <b>MUTASI KELUAR BARU</b>\n\n';
  message += '👤 <b>Nama:</b> ' + data.nama + '\n';
  message += '🎓 <b>NISN:</b> ' + data.nisn + '\n';
  message += '📚 <b>Rombel:</b> ' + data.rombel + '\n';
  message += '🏫 <b>Pindah Ke:</b> ' + data.pindah_ke + '\n';
  message += '📅 <b>Tgl Mutasi:</b> ' + data.tgl_mutasi + '\n';
  message += '📝 <b>Alasan:</b> ' + data.alasan_mutasi + '\n';
  message += '\n<i>Data ditambahkan via Sistem Mutasi Siswa SMKN 1 Palopo</i>';
  return message;
}

function testTelegramNotification() {
  var testMessage = '🧪 <b>TEST NOTIFIKASI</b>\n\n';
  testMessage += 'Ini adalah pesan test dari Sistem Mutasi Siswa SMKN 1 Palopo.\n';
  testMessage += 'Jika Anda menerima pesan ini, berarti konfigurasi Telegram Bot sudah benar! ✅';
  
  var result = sendTelegramNotification(testMessage);
  Logger.log('Test notification result: ' + result);
  return result;
}

// ========================================
// WEB APP ENDPOINTS
// ========================================

function doGet(e) {
  var action = e.parameter.action || 'getAll';
  var callback = e.parameter.callback;
  
  var result;
  
  try {
    switch (action) {
      case 'getAll':
        result = {
          masuk: getAllMasuk(),
          keluar: getAllKeluar()
        };
        break;
      case 'getMasuk':
        result = getAllMasuk();
        break;
      case 'getKeluar':
        result = getAllKeluar();
        break;
      case 'getSiswa':
        result = getSiswa();
        break;
      case 'getRombel':
        result = getRombel();
        break;
      case 'searchSiswa':
        result = searchSiswa(e.parameter.query || '');
        break;
      default:
        result = { error: 'Invalid action' };
    }
  } catch (err) {
    result = { error: err.toString() };
  }
  
  return jsonResponse(result, callback);
}

function doPost(e) {
  var action = e.parameter.action || 'add';
  var callback = e.parameter.callback;
  
  var result;
  
  try {
    var data = JSON.parse(e.postData.contents);
    
    switch (action) {
      case 'addMasuk':
        result = addMasuk(data);
        break;
      case 'addKeluar':
        result = addKeluar(data);
        break;
      case 'updateMasuk':
        result = updateMasuk(data);
        break;
      case 'updateKeluar':
        result = updateKeluar(data);
        break;
      case 'deleteMasuk':
        result = deleteMasuk(data.rowIndex);
        break;
      case 'deleteKeluar':
        result = deleteKeluar(data.rowIndex);
        break;
      case 'uploadFile':
        result = uploadFile(e);
        break;
      default:
        result = { error: 'Invalid action' };
    }
  } catch (err) {
    result = { error: err.toString() };
  }
  
  return jsonResponse(result, callback);
}

function doPut(e) {
  return doPost(e);
}

function doDelete(e) {
  var callback = e.parameter.callback;
  var result;
  
  try {
    var type = e.parameter.type;
    var rowIndex = parseInt(e.parameter.rowIndex);
    
    if (type === 'masuk') {
      result = deleteMasuk(rowIndex);
    } else if (type === 'keluar') {
      result = deleteKeluar(rowIndex);
    } else {
      result = { error: 'Invalid type' };
    }
  } catch (err) {
    result = { error: err.toString() };
  }
  
  return jsonResponse(result, callback);
}

function jsonResponse(data, callback) {
  var json = JSON.stringify(data);
  
  if (callback) {
    return ContentService
      .createTextOutput(callback + '(' + json + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  } else {
    return ContentService
      .createTextOutput(json)
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ========================================
// CRUD MUTASI MASUK
// ========================================

function getAllMasuk() {
  var sheet = getSheet(SHEET_MASUK);
  var data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) return [];
  
  var result = [];
  for (var i = 1; i < data.length; i++) {
    result.push({
      no: data[i][0],
      nisn: data[i][1],
      nama_siswa: data[i][2],
      provinsi: data[i][3],
      kab_kota: data[i][4],
      kecamatan: data[i][5],
      nama_sekolah: data[i][6],
      rombel_tujuan: data[i][7],
      timestamp: data[i][8],
      ket: data[i][9],
      _rowIndex: i + 1
    });
  }
  
  return result;
}

function addMasuk(data) {
  var sheet = getSheet(SHEET_MASUK);
  var no = generateNo(sheet);
  
  var rowData = [
    no,
    data.nisn,
    data.nama_siswa,
    data.provinsi,
    data.kab_kota,
    data.kecamatan,
    data.nama_sekolah,
    data.rombel_tujuan,
    getTimestamp(),
    data.ket || ''
  ];
  
  sheet.appendRow(rowData);
  
  // Kirim notifikasi Telegram
  var notification = formatMutasiMasukNotification(data);
  sendTelegramNotification(notification);
  
  return { success: true, no: no };
}

function updateMasuk(data) {
  var sheet = getSheet(SHEET_MASUK);
  var rowIndex = data.rowIndex;
  
  var rowData = [
    data.no,
    data.nisn,
    data.nama_siswa,
    data.provinsi,
    data.kab_kota,
    data.kecamatan,
    data.nama_sekolah,
    data.rombel_tujuan,
    data.timestamp,
    data.ket || ''
  ];
  
  sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  
  return { success: true };
}

function deleteMasuk(rowIndex) {
  var sheet = getSheet(SHEET_MASUK);
  sheet.deleteRow(rowIndex);
  return { success: true };
}

// ========================================
// CRUD MUTASI KELUAR
// ========================================

function getAllKeluar() {
  var sheet = getSheet(SHEET_KELUAR);
  var data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) return [];
  
  var result = [];
  for (var i = 1; i < data.length; i++) {
    result.push({
      no: data[i][0],
      nipd: data[i][1],
      nisn: data[i][2],
      nama: data[i][3],
      tempat_lahir: data[i][4],
      tgl_lahir: data[i][5],
      rombel: data[i][6],
      ket_mutasi: data[i][7],
      pindah_ke: data[i][8],
      tgl_mutasi: data[i][9],
      alasan_mutasi: data[i][10],
      upload_berkas: data[i][11],
      timestamp: data[i][12],
      ket: data[i][13],
      _rowIndex: i + 1
    });
  }
  
  return result;
}

function addKeluar(data) {
  var sheet = getSheet(SHEET_KELUAR);
  var no = generateNo(sheet);
  
  var rowData = [
    no,
    data.nipd,
    data.nisn,
    data.nama,
    data.tempat_lahir,
    data.tgl_lahir,
    data.rombel,
    data.ket_mutasi,
    data.pindah_ke,
    data.tgl_mutasi,
    data.alasan_mutasi,
    data.upload_berkas || '',
    getTimestamp(),
    data.ket || ''
  ];
  
  sheet.appendRow(rowData);
  
  // Kirim notifikasi Telegram
  var notification = formatMutasiKeluarNotification(data);
  sendTelegramNotification(notification);
  
  return { success: true, no: no };
}

function updateKeluar(data) {
  var sheet = getSheet(SHEET_KELUAR);
  var rowIndex = data.rowIndex;
  
  var rowData = [
    data.no,
    data.nipd,
    data.nisn,
    data.nama,
    data.tempat_lahir,
    data.tgl_lahir,
    data.rombel,
    data.ket_mutasi,
    data.pindah_ke,
    data.tgl_mutasi,
    data.alasan_mutasi,
    data.upload_berkas,
    data.timestamp,
    data.ket || ''
  ];
  
  sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  
  return { success: true };
}

function deleteKeluar(rowIndex) {
  var sheet = getSheet(SHEET_KELUAR);
  sheet.deleteRow(rowIndex);
  return { success: true };
}

// ========================================
// DATA SISWA & ROMBEL
// ========================================

function getSiswa() {
  var sheet = getSheet(SHEET_SISWA);
  var data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) return [];
  
  var result = [];
  for (var i = 1; i < data.length; i++) {
    result.push({
      nipd: data[i][0],
      nisn: data[i][1],
      nama: data[i][2],
      tempat_lahir: data[i][3],
      tgl_lahir: data[i][4],
      rombel: data[i][5]
    });
  }
  
  return result;
}

function getRombel() {
  var sheet = getSheet(SHEET_ROMBEL);
  var data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) return [];
  
  var result = [];
  for (var i = 1; i < data.length; i++) {
    if (data[i][0]) {
      result.push(data[i][0]);
    }
  }
  
  return result;
}

function searchSiswa(query) {
  var siswa = getSiswa();
  query = query.toLowerCase();
  
  return siswa.filter(function(s) {
    return s.nama.toLowerCase().indexOf(query) !== -1 ||
           s.nisn.indexOf(query) !== -1 ||
           s.nipd.indexOf(query) !== -1;
  });
}

// ========================================
// FILE UPLOAD
// ========================================

function uploadFile(e) {
  try {
    var file = e.parameter.file;
    var fileName = e.parameter.fileName;
    
    var blob = Utilities.newBlob(
      Utilities.base64Decode(file),
      MimeType.PDF,
      fileName
    );
    
    var folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    var driveFile = folder.createFile(blob);
    
    return {
      success: true,
      fileId: driveFile.getId(),
      fileUrl: driveFile.getUrl()
    };
  } catch (err) {
    return { error: err.toString() };
  }
}

// ========================================
// TEST FUNCTIONS
// ========================================

function testGetAll() {
  Logger.log('=== Testing getAll ===');
  Logger.log('Masuk: ' + getAllMasuk().length + ' records');
  Logger.log('Keluar: ' + getAllKeluar().length + ' records');
}

function testAddMasuk() {
  var testData = {
    nisn: '0012345678',
    nama_siswa: 'Test Siswa',
    provinsi: 'Sulawesi Selatan',
    kab_kota: 'Kota Palopo',
    kecamatan: 'Wara',
    nama_sekolah: 'SMPN 1 Palopo',
    rombel_tujuan: 'XII TKJ 1',
    ket: 'Test data'
  };
  
  var result = addMasuk(testData);
  Logger.log('Add Masuk Result: ' + JSON.stringify(result));
}
```

## File: appsscript.json

```json
{
  "timeZone": "Asia/Makassar",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "oauthScopes": [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/script.external_request"
  ]
}
```

## URL Deployment:
```
https://script.google.com/macros/s/AKfycbzuP8eQyYpWW5h8GWBb0d8fdMpHstT04NakfCdoCv0h04P1I2vbrH8qOdvuspczXYpMYQ/exec
```

---

# 2. NEXT.JS - page.tsx (Halaman Utama)

```typescript
'use client'

import { useState, useEffect } from 'react'
import { 
  UserPlus, 
  UserMinus, 
  School, 
  ArrowRightLeft,
  Clock,
  AlertCircle,
  Users,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  LogOut,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import MutasiMasukForm from '@/components/mutasi-masuk-form'
import MutasiMasukEditForm from '@/components/mutasi-masuk-edit-form'
import MutasiKeluarForm from '@/components/mutasi-keluar-form'
import MutasiKeluarEditForm from '@/components/mutasi-keluar-edit-form'
import MutasiList from '@/components/mutasi-list'
import LoginForm from '@/components/login-form'
import { useAuth } from '@/contexts/AuthContext'

// Types untuk data dari Google Sheets
type MutasiMasuk = {
  no: number
  nisn: string
  nama_siswa: string
  provinsi: string
  kab_kota: string
  kecamatan: string
  nama_sekolah: string
  rombel_tujuan: string
  timestamp: string
  ket: string
  rowIndex: number
}

type MutasiKeluar = {
  no: number
  nipd: string
  nisn: string
  nama: string
  tempat_lahir: string
  tgl_lahir: string
  rombel: string
  ket_mutasi: string
  pindah_ke: string
  tgl_mutasi: string
  alasan_mutasi: string
  upload_berkas: string
  timestamp: string
  ket: string
  rowIndex: number
}

// Helper function to get month name in Indonesian
const getMonthName = (monthIndex: number) => {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]
  return months[monthIndex]
}

// Helper function to parse date from various formats
const parseDate = (dateStr: string): Date | null => {
  if (!dateStr) return null
  
  try {
    // Format 1: ISO format (YYYY-MM-DDTHH:mm:ss.sssZ or YYYY-MM-DD)
    if (dateStr.includes('T') || /^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      const date = new Date(dateStr)
      if (!isNaN(date.getTime())) return date
    }
    
    // Format 2: DD/MM/YYYY or DD/MM/YYYY HH:mm:ss
    const indoMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
    if (indoMatch) {
      const day = parseInt(indoMatch[1], 10)
      const month = parseInt(indoMatch[2], 10) - 1 // Month is 0-indexed
      const year = parseInt(indoMatch[3], 10)
      const date = new Date(year, month, day)
      if (!isNaN(date.getTime())) return date
    }
    
    // Format 3: DD-MM-YYYY
    const dashMatch = dateStr.match(/^(\d{1,2})-(\d{1,2})-(\d{4})/)
    if (dashMatch) {
      const day = parseInt(dashMatch[1], 10)
      const month = parseInt(dashMatch[2], 10) - 1
      const year = parseInt(dashMatch[3], 10)
      const date = new Date(year, month, day)
      if (!isNaN(date.getTime())) return date
    }
    
    // Fallback: try native Date parsing
    const date = new Date(dateStr)
    if (!isNaN(date.getTime())) return date
    
    return null
  } catch {
    return null
  }
}

export default function Home() {
  const { isLoggedIn, userName, login, logout, isLoading: authLoading } = useAuth()
  const [showMutasiMasuk, setShowMutasiMasuk] = useState(false)
  const [showMutasiKeluar, setShowMutasiKeluar] = useState(false)
  const [showList, setShowList] = useState<'masuk' | 'keluar' | null>(null)
  const [showRekap, setShowRekap] = useState(false)
  const [mutasiMasuk, setMutasiMasuk] = useState<MutasiMasuk[]>([])
  const [mutasiKeluar, setMutasiKeluar] = useState<MutasiKeluar[]>([])
  const [loading, setLoading] = useState(true)
  
  // Edit state
  const [editData, setEditData] = useState<{data: MutasiMasuk | MutasiKeluar, type: 'masuk' | 'keluar', rowIndex: number} | null>(null)

  const fetchData = async () => {
    try {
      const [masukRes, keluarRes] = await Promise.all([
        fetch('/api/mutasi-masuk'),
        fetch('/api/mutasi-keluar')
      ])
      const masukData = await masukRes.json()
      const keluarData = await keluarRes.json()
      
      // Ensure data is array
      setMutasiMasuk(Array.isArray(masukData) ? masukData : [])
      setMutasiKeluar(Array.isArray(keluarData) ? keluarData : [])
    } catch (error) {
      console.error('Error fetching data:', error)
      setMutasiMasuk([])
      setMutasiKeluar([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isLoggedIn) {
      fetchData()
    }
  }, [isLoggedIn])

  // Handle edit
  const handleEdit = (item: MutasiMasuk | MutasiKeluar, type: 'masuk' | 'keluar') => {
    // Find the index based on the position in the array + 2 (header is row 1)
    const dataArray = type === 'masuk' ? mutasiMasuk : mutasiKeluar
    const idx = dataArray.findIndex(d => d.no === (item as any).no)
    setEditData({
      data: item,
      type: type,
      rowIndex: idx >= 0 ? idx + 2 : 2
    })
  }

  // Statistics - hanya total
  const totalMasuk = mutasiMasuk.length
  const totalKeluar = mutasiKeluar.length

  // Calculate monthly statistics
  const getMonthlyStats = () => {
    const stats: { [key: string]: { masuk: number; keluar: number; year: number; month: number } } = {}
    
    // Process mutasi masuk - gunakan timestamp
    mutasiMasuk.forEach(m => {
      const date = parseDate(m.timestamp)
      if (date) {
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        if (!stats[key]) {
          stats[key] = { masuk: 0, keluar: 0, year: date.getFullYear(), month: date.getMonth() }
        }
        stats[key].masuk++
      }
    })
    
    // Process mutasi keluar - gunakan tgl_mutasi (tanggal mutasi aktual)
    mutasiKeluar.forEach(m => {
      // Prioritaskan tgl_mutasi, fallback ke timestamp jika tidak ada
      const dateStr = (m as any).tgl_mutasi || m.timestamp
      const date = parseDate(dateStr)
      if (date) {
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        if (!stats[key]) {
          stats[key] = { masuk: 0, keluar: 0, year: date.getFullYear(), month: date.getMonth() }
        }
        stats[key].keluar++
      }
    })
    
    // Convert to array and sort by date (newest first)
    return Object.values(stats).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year
      return b.month - a.month
    })
  }

  const monthlyStats = loading ? [] : getMonthlyStats()

  // Check if any dialog is open for blur effect
  const isDialogOpen = showMutasiMasuk || showMutasiKeluar || showList || showRekap || editData

  // Show loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-white to-slate-100">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
          <p className="text-slate-500">Memuat...</p>
        </div>
      </div>
    )
  }

  // Show login form if not logged in
  if (!isLoggedIn) {
    return <LoginForm onLogin={login} />
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Blur overlay when dialog is open */}
      <div className={`${isDialogOpen ? 'blur-sm pointer-events-none' : ''} transition-all duration-300`}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
                <School className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-800">SMKN 1 Palopo</h1>
                <p className="text-xs sm:text-sm text-slate-500">Sistem Manajemen Mutasi Siswa</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Rekap Bulanan Button */}
              <Button 
                variant="outline"
                className="hidden sm:flex gap-2 border-purple-200 text-purple-700 hover:bg-purple-50"
                onClick={() => setShowRekap(true)}
              >
                <BarChart3 className="w-4 h-4" />
                Rekap Bulanan
              </Button>
              <Badge variant="outline" className="hidden sm:flex gap-1 border-emerald-200 text-emerald-700">
                <Users className="w-3 h-3" />
                Bagian Kesiswaan
              </Badge>
              {/* Logout Button */}
              <Button 
                variant="ghost"
                className="gap-2 text-slate-600 hover:text-red-600 hover:bg-red-50"
                onClick={logout}
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Keluar</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Welcome Section */}
        <div className="mb-8 sm:mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">
                Selamat Datang, <span className="text-emerald-600">{userName}</span>!
              </h2>
              <p className="text-slate-500 mt-1 sm:mt-2">
                Kelola mutasi masuk dan keluar siswa dengan mudah
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Mobile Rekap Button */}
              <Button 
                variant="outline"
                className="sm:hidden gap-2 border-purple-200 text-purple-700"
                onClick={() => setShowRekap(true)}
              >
                <BarChart3 className="w-4 h-4" />
                Rekap
              </Button>
              <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-100 px-4 py-2 rounded-full">
                <AlertCircle className="w-4 h-4 text-emerald-500" />
                <span>Sistem Mutasi Siswa v1.0</span>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Overview */}
        <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-12">
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-500 rounded-xl flex items-center justify-center">
                  <UserPlus className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <div>
                  <p className="text-sm sm:text-base text-emerald-600 font-medium">Total Mutasi Masuk</p>
                  <p className="text-2xl sm:text-3xl font-bold text-emerald-700">{totalMasuk}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-teal-50 to-teal-100/50 border-teal-200">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-teal-500 rounded-xl flex items-center justify-center">
                  <UserMinus className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <div>
                  <p className="text-sm sm:text-base text-teal-600 font-medium">Total Mutasi Keluar</p>
                  <p className="text-2xl sm:text-3xl font-bold text-teal-700">{totalKeluar}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Action Cards */}
        <div className="grid md:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-12">
          {/* Mutasi Masuk Card */}
          <Card className="group relative overflow-hidden border-2 border-emerald-200 hover:border-emerald-400 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-100">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500" />
            <CardHeader className="relative">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200 group-hover:scale-110 transition-transform duration-300">
                  <UserPlus className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl sm:text-2xl text-slate-800">Mutasi Masuk</CardTitle>
                  <CardDescription className="text-slate-500">
                    Pengajuan siswa pindah ke SMKN 1 Palopo
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-200"
                  onClick={() => setShowMutasiMasuk(true)}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Tambah Mutasi Masuk
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  onClick={() => setShowList('masuk')}
                >
                  <ArrowRightLeft className="w-4 h-4 mr-2" />
                  Lihat Daftar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Mutasi Keluar Card */}
          <Card className="group relative overflow-hidden border-2 border-teal-200 hover:border-teal-400 transition-all duration-300 hover:shadow-xl hover:shadow-teal-100">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-100 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500" />
            <CardHeader className="relative">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-teal-400 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-200 group-hover:scale-110 transition-transform duration-300">
                  <UserMinus className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl sm:text-2xl text-slate-800">Mutasi Keluar</CardTitle>
                  <CardDescription className="text-slate-500">
                    Pengajuan siswa pindah dari SMKN 1 Palopo
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  className="flex-1 bg-teal-500 hover:bg-teal-600 text-white shadow-lg shadow-teal-200"
                  onClick={() => setShowMutasiKeluar(true)}
                >
                  <UserMinus className="w-4 h-4 mr-2" />
                  Tambah Mutasi Keluar
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 border-teal-200 text-teal-700 hover:bg-teal-50"
                  onClick={() => setShowList('keluar')}
                >
                  <ArrowRightLeft className="w-4 h-4 mr-2" />
                  Lihat Daftar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl text-slate-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-500" />
              Aktivitas Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-72 sm:h-80">
              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                      <div className="w-10 h-10 bg-slate-200 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-3/4" />
                        <div className="h-3 bg-slate-200 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {[...mutasiMasuk.map(m => ({...m, type: 'masuk' as const})), 
                    ...mutasiKeluar.map(m => ({...m, type: 'keluar' as const}))]
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .slice(0, 10)
                    .map((item, idx) => {
                      const isMasuk = item.type === 'masuk'
                      const nama = isMasuk ? (item as MutasiMasuk).nama_siswa : (item as MutasiKeluar).nama
                      const sekolah = isMasuk 
                        ? `Dari ${(item as MutasiMasuk).nama_sekolah}` 
                        : `Ke ${(item as MutasiKeluar).pindah_ke}`
                      
                      return (
                        <div 
                          key={`${item.type}-${item.rowIndex || idx}`}
                          className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isMasuk ? 'bg-emerald-100' : 'bg-teal-100'}`}>
                            {isMasuk ? (
                              <UserPlus className="w-5 h-5 text-emerald-600" />
                            ) : (
                              <UserMinus className="w-5 h-5 text-teal-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-800 truncate">{nama}</p>
                            <p className="text-sm text-slate-500 truncate">{sekolah}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className={isMasuk ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : 'bg-teal-100 text-teal-700 hover:bg-teal-100'}>
                              {isMasuk ? 'Mutasi Masuk' : 'Mutasi Keluar'}
                            </Badge>
                          </div>
                        </div>
                      )
                    })}
                  {mutasiMasuk.length === 0 && mutasiKeluar.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                      <School className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>Belum ada data mutasi</p>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 text-white py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                <School className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold">SMKN 1 Palopo</p>
                <p className="text-sm text-slate-400">Bagian Kesiswaan</p>
              </div>
            </div>
            <p className="text-sm text-slate-400">
              © {new Date().getFullYear()} Sistem Mutasi Siswa. App by Zulfitrah Sudir
            </p>
          </div>
        </div>
      </footer>
      </div>{/* End blur wrapper */}

      {/* Rekap Bulanan Dialog */}
      <Dialog open={showRekap} onOpenChange={setShowRekap}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-purple-600">
              <BarChart3 className="w-5 h-5" />
              Rekap Bulanan Mutasi Siswa
            </DialogTitle>
            <DialogDescription>
              Statistik jumlah siswa masuk dan keluar per bulan
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1">
            {monthlyStats.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Belum ada data mutasi</p>
              </div>
            ) : (
              <div className="space-y-3 p-1">
                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 text-center">
                    <TrendingUp className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
                    <p className="text-xs text-emerald-600">Total Masuk</p>
                    <p className="text-xl font-bold text-emerald-700">{totalMasuk}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gradient-to-br from-teal-50 to-teal-100 border border-teal-200 text-center">
                    <TrendingDown className="w-5 h-5 mx-auto mb-1 text-teal-600" />
                    <p className="text-xs text-teal-600">Total Keluar</p>
                    <p className="text-xl font-bold text-teal-700">{totalKeluar}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 text-center">
                    <Users className="w-5 h-5 mx-auto mb-1 text-purple-600" />
                    <p className="text-xs text-purple-600">Selisih</p>
                    <p className="text-xl font-bold text-purple-700">{totalMasuk - totalKeluar > 0 ? '+' : ''}{totalMasuk - totalKeluar}</p>
                  </div>
                </div>

                {/* Monthly Table */}
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Bulan</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">
                          <span className="flex items-center justify-center gap-1">
                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                            Masuk
                          </span>
                        </th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">
                          <span className="flex items-center justify-center gap-1">
                            <TrendingDown className="w-4 h-4 text-teal-500" />
                            Keluar
                          </span>
                        </th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Selisih</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyStats.map((stat, idx) => {
                        const selisih = stat.masuk - stat.keluar
                        return (
                          <tr key={idx} className="border-t border-slate-100 hover:bg-slate-50">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                <span className="font-medium text-slate-700">
                                  {getMonthName(stat.month)} {stat.year}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                                {stat.masuk}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-100">
                                {stat.keluar}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Badge className={
                                selisih > 0 
                                  ? 'bg-purple-100 text-purple-700 hover:bg-purple-100'
                                  : selisih < 0 
                                    ? 'bg-red-100 text-red-700 hover:bg-red-100'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-100'
                              }>
                                {selisih > 0 ? '+' : ''}{selisih}
                              </Badge>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Dialogs */}
      <Dialog open={showMutasiMasuk} onOpenChange={setShowMutasiMasuk}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <UserPlus className="w-5 h-5" />
              Form Mutasi Masuk
            </DialogTitle>
            <DialogDescription>
              Isi form berikut untuk mengajukan mutasi masuk siswa baru
            </DialogDescription>
          </DialogHeader>
          <MutasiMasukForm 
            onSuccess={() => {
              setShowMutasiMasuk(false)
              fetchData()
            }} 
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showMutasiKeluar} onOpenChange={setShowMutasiKeluar}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-teal-600">
              <UserMinus className="w-5 h-5" />
              Form Mutasi Keluar
            </DialogTitle>
            <DialogDescription>
              Isi form berikut untuk mengajukan mutasi keluar siswa
            </DialogDescription>
          </DialogHeader>
          <MutasiKeluarForm 
            onSuccess={() => {
              setShowMutasiKeluar(false)
              fetchData()
            }} 
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!showList && showList === 'masuk'} onOpenChange={() => setShowList(null)}>
        <DialogContent className="w-[95vw] max-w-[1400px] max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-600" />
              <span className="text-emerald-600">Daftar Mutasi Masuk</span>
            </DialogTitle>
          </DialogHeader>
          <MutasiList 
            type="masuk" 
            data={mutasiMasuk}
            onUpdate={fetchData}
            onEdit={handleEdit}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!showList && showList === 'keluar'} onOpenChange={() => setShowList(null)}>
        <DialogContent className="w-[95vw] max-w-[1400px] max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserMinus className="w-5 h-5 text-teal-600" />
              <span className="text-teal-600">Daftar Mutasi Keluar</span>
            </DialogTitle>
          </DialogHeader>
          <MutasiList 
            type="keluar" 
            data={mutasiKeluar}
            onUpdate={fetchData}
            onEdit={handleEdit}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editData} onOpenChange={() => setEditData(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editData?.type === 'masuk' ? (
                <>
                  <UserPlus className="w-5 h-5 text-emerald-600" />
                  <span className="text-emerald-600">Edit Data Mutasi Masuk</span>
                </>
              ) : (
                <>
                  <UserMinus className="w-5 h-5 text-teal-600" />
                  <span className="text-teal-600">Edit Data Mutasi Keluar</span>
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Ubah data mutasi {editData?.type === 'masuk' ? 'masuk' : 'keluar'} siswa
            </DialogDescription>
          </DialogHeader>
          {editData && editData.type === 'masuk' && (
            <MutasiMasukEditForm 
              initialData={editData.data as MutasiMasuk}
              rowIndex={editData.rowIndex}
              onSuccess={() => {
                setEditData(null)
                fetchData()
              }}
            />
          )}
          {editData && editData.type === 'keluar' && (
            <MutasiKeluarEditForm 
              initialData={editData.data as MutasiKeluar}
              rowIndex={editData.rowIndex}
              onSuccess={() => {
                setEditData(null)
                fetchData()
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
```

---

# 3. NEXT.JS - mutasi-masuk-form.tsx

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'

interface MutasiMasukFormProps {
  onSuccess: () => void
}

export default function MutasiMasukForm({ onSuccess }: MutasiMasukFormProps) {
  const [loading, setLoading] = useState(false)
  const [rombelList, setRombelList] = useState<string[]>([])
  const [formData, setFormData] = useState({
    nisn: '',
    nama_siswa: '',
    provinsi: 'Sulawesi Selatan',
    kab_kota: 'Kota Palopo',
    kecamatan: '',
    nama_sekolah: '',
    rombel_tujuan: '',
    ket: ''
  })

  useEffect(() => {
    fetchRombel()
  }, [])

  const fetchRombel = async () => {
    try {
      const res = await fetch('/api/mutasi-masuk?action=getRombel')
      const data = await res.json()
      if (Array.isArray(data)) {
        setRombelList(data)
      }
    } catch (error) {
      console.error('Error fetching rombel:', error)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/mutasi-masuk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await res.json()

      if (result.success) {
        alert('Data mutasi masuk berhasil disimpan!')
        onSuccess()
      } else {
        alert('Gagal menyimpan data: ' + (result.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Terjadi kesalahan saat menyimpan data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nisn">NISN *</Label>
          <Input
            id="nisn"
            value={formData.nisn}
            onChange={(e) => handleChange('nisn', e.target.value)}
            placeholder="Masukkan NISN"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nama_siswa">Nama Siswa *</Label>
          <Input
            id="nama_siswa"
            value={formData.nama_siswa}
            onChange={(e) => handleChange('nama_siswa', e.target.value)}
            placeholder="Masukkan nama lengkap"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="provinsi">Provinsi *</Label>
          <Input
            id="provinsi"
            value={formData.provinsi}
            onChange={(e) => handleChange('provinsi', e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="kab_kota">Kab/Kota *</Label>
          <Input
            id="kab_kota"
            value={formData.kab_kota}
            onChange={(e) => handleChange('kab_kota', e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="kecamatan">Kecamatan *</Label>
          <Input
            id="kecamatan"
            value={formData.kecamatan}
            onChange={(e) => handleChange('kecamatan', e.target.value)}
            placeholder="Masukkan kecamatan"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="nama_sekolah">Nama Sekolah Asal *</Label>
        <Input
          id="nama_sekolah"
          value={formData.nama_sekolah}
          onChange={(e) => handleChange('nama_sekolah', e.target.value)}
          placeholder="Masukkan nama sekolah asal"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="rombel_tujuan">Rombel Tujuan *</Label>
        <Select value={formData.rombel_tujuan} onValueChange={(value) => handleChange('rombel_tujuan', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih rombel tujuan" />
          </SelectTrigger>
          <SelectContent>
            {rombelList.map((rombel) => (
              <SelectItem key={rombel} value={rombel}>
                {rombel}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ket">Keterangan</Label>
        <Textarea
          id="ket"
          value={formData.ket}
          onChange={(e) => handleChange('ket', e.target.value)}
          placeholder="Keterangan tambahan (opsional)"
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Batal
        </Button>
        <Button type="submit" disabled={loading} className="bg-emerald-500 hover:bg-emerald-600">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Menyimpan...
            </>
          ) : (
            'Simpan Data'
          )}
        </Button>
      </div>
    </form>
  )
}
```

---

# 4. NEXT.JS - mutasi-masuk-edit-form.tsx

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'

interface MutasiMasuk {
  no: number
  nisn: string
  nama_siswa: string
  provinsi: string
  kab_kota: string
  kecamatan: string
  nama_sekolah: string
  rombel_tujuan: string
  timestamp: string
  ket: string
  _rowIndex?: number
}

interface MutasiMasukEditFormProps {
  initialData: MutasiMasuk
  rowIndex: number
  onSuccess: () => void
}

export default function MutasiMasukEditForm({ initialData, rowIndex, onSuccess }: MutasiMasukEditFormProps) {
  const [loading, setLoading] = useState(false)
  const [rombelList, setRombelList] = useState<string[]>([])
  const [formData, setFormData] = useState({
    no: initialData.no,
    nisn: initialData.nisn,
    nama_siswa: initialData.nama_siswa,
    provinsi: initialData.provinsi,
    kab_kota: initialData.kab_kota,
    kecamatan: initialData.kecamatan,
    nama_sekolah: initialData.nama_sekolah,
    rombel_tujuan: initialData.rombel_tujuan,
    timestamp: initialData.timestamp,
    ket: initialData.ket || ''
  })

  useEffect(() => {
    fetchRombel()
  }, [])

  const fetchRombel = async () => {
    try {
      const res = await fetch('/api/mutasi-masuk?action=getRombel')
      const data = await res.json()
      if (Array.isArray(data)) {
        setRombelList(data)
      }
    } catch (error) {
      console.error('Error fetching rombel:', error)
    }
  }

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/mutasi-masuk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, rowIndex })
      })

      const result = await res.json()

      if (result.success) {
        alert('Data berhasil diperbarui!')
        onSuccess()
      } else {
        alert('Gagal memperbarui data: ' + (result.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Terjadi kesalahan saat memperbarui data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="no">No. Urut</Label>
          <Input
            id="no"
            value={formData.no}
            disabled
            className="bg-slate-100"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nisn">NISN *</Label>
          <Input
            id="nisn"
            value={formData.nisn}
            onChange={(e) => handleChange('nisn', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="nama_siswa">Nama Siswa *</Label>
        <Input
          id="nama_siswa"
          value={formData.nama_siswa}
          onChange={(e) => handleChange('nama_siswa', e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="provinsi">Provinsi *</Label>
          <Input
            id="provinsi"
            value={formData.provinsi}
            onChange={(e) => handleChange('provinsi', e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="kab_kota">Kab/Kota *</Label>
          <Input
            id="kab_kota"
            value={formData.kab_kota}
            onChange={(e) => handleChange('kab_kota', e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="kecamatan">Kecamatan *</Label>
          <Input
            id="kecamatan"
            value={formData.kecamatan}
            onChange={(e) => handleChange('kecamatan', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="nama_sekolah">Nama Sekolah Asal *</Label>
        <Input
          id="nama_sekolah"
          value={formData.nama_sekolah}
          onChange={(e) => handleChange('nama_sekolah', e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="rombel_tujuan">Rombel Tujuan *</Label>
        <Select value={formData.rombel_tujuan} onValueChange={(value) => handleChange('rombel_tujuan', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih rombel tujuan" />
          </SelectTrigger>
          <SelectContent>
            {rombelList.map((rombel) => (
              <SelectItem key={rombel} value={rombel}>
                {rombel}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ket">Keterangan</Label>
        <Textarea
          id="ket"
          value={formData.ket}
          onChange={(e) => handleChange('ket', e.target.value)}
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Batal
        </Button>
        <Button type="submit" disabled={loading} className="bg-emerald-500 hover:bg-emerald-600">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Menyimpan...
            </>
          ) : (
            'Simpan Perubahan'
          )}
        </Button>
      </div>
    </form>
  )
}
```

---

# 5. NEXT.JS - mutasi-keluar-form.tsx

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Search } from 'lucide-react'

interface MutasiKeluarFormProps {
  onSuccess: () => void
}

interface Siswa {
  nipd: string
  nisn: string
  nama: string
  tempat_lahir: string
  tgl_lahir: string
  rombel: string
}

export default function MutasiKeluarForm({ onSuccess }: MutasiKeluarFormProps) {
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [siswaResults, setSiswaResults] = useState<Siswa[]>([])
  const [selectedSiswa, setSelectedSiswa] = useState<Siswa | null>(null)
  
  const [formData, setFormData] = useState({
    nipd: '',
    nisn: '',
    nama: '',
    tempat_lahir: '',
    tgl_lahir: '',
    rombel: '',
    ket_mutasi: 'Pindah',
    pindah_ke: '',
    tgl_mutasi: '',
    alasan_mutasi: '',
    upload_berkas: '',
    ket: ''
  })

  const handleSearchSiswa = async () => {
    if (!searchQuery.trim()) return
    
    setSearching(true)
    try {
      const res = await fetch(`/api/mutasi-keluar?action=searchSiswa&query=${encodeURIComponent(searchQuery)}`)
      const data = await res.json()
      if (Array.isArray(data)) {
        setSiswaResults(data)
      }
    } catch (error) {
      console.error('Error searching siswa:', error)
    } finally {
      setSearching(false)
    }
  }

  const handleSelectSiswa = (siswa: Siswa) => {
    setSelectedSiswa(siswa)
    setFormData(prev => ({
      ...prev,
      nipd: siswa.nipd,
      nisn: siswa.nisn,
      nama: siswa.nama,
      tempat_lahir: siswa.tempat_lahir,
      tgl_lahir: siswa.tgl_lahir,
      rombel: siswa.rombel
    }))
    setSiswaResults([])
    setSearchQuery('')
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/mutasi-keluar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await res.json()

      if (result.success) {
        alert('Data mutasi keluar berhasil disimpan!')
        onSuccess()
      } else {
        alert('Gagal menyimpan data: ' + (result.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Terjadi kesalahan saat menyimpan data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Search Siswa */}
      <div className="space-y-2">
        <Label>Cari Siswa (NISN / NIPD / Nama)</Label>
        <div className="flex gap-2">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ketik untuk mencari..."
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearchSiswa())}
          />
          <Button type="button" variant="outline" onClick={handleSearchSiswa} disabled={searching}>
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>
        
        {/* Search Results */}
        {siswaResults.length > 0 && (
          <div className="border rounded-lg max-h-40 overflow-y-auto">
            {siswaResults.map((siswa) => (
              <div
                key={siswa.nipd}
                className="p-2 hover:bg-slate-100 cursor-pointer border-b last:border-b-0"
                onClick={() => handleSelectSiswa(siswa)}
              >
                <p className="font-medium">{siswa.nama}</p>
                <p className="text-sm text-slate-500">NISN: {siswa.nisn} | Rombel: {siswa.rombel}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Siswa Info */}
      {selectedSiswa && (
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
          <p className="font-medium text-teal-700">Siswa Terpilih:</p>
          <p>{selectedSiswa.nama} - {selectedSiswa.rombel}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nipd">NIPD</Label>
          <Input
            id="nipd"
            value={formData.nipd}
            onChange={(e) => handleChange('nipd', e.target.value)}
            placeholder="NIPD"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nisn">NISN *</Label>
          <Input
            id="nisn"
            value={formData.nisn}
            onChange={(e) => handleChange('nisn', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="nama">Nama Siswa *</Label>
        <Input
          id="nama"
          value={formData.nama}
          onChange={(e) => handleChange('nama', e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tempat_lahir">Tempat Lahir</Label>
          <Input
            id="tempat_lahir"
            value={formData.tempat_lahir}
            onChange={(e) => handleChange('tempat_lahir', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tgl_lahir">Tanggal Lahir</Label>
          <Input
            id="tgl_lahir"
            value={formData.tgl_lahir}
            onChange={(e) => handleChange('tgl_lahir', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rombel">Rombel</Label>
          <Input
            id="rombel"
            value={formData.rombel}
            onChange={(e) => handleChange('rombel', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ket_mutasi">Keterangan Mutasi *</Label>
          <Select value={formData.ket_mutasi} onValueChange={(value) => handleChange('ket_mutasi', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pindah">Pindah</SelectItem>
              <SelectItem value="Keluar">Keluar</SelectItem>
              <SelectItem value="DO">DO (Dikeluarkan)</SelectItem>
              <SelectItem value="Meninggal">Meninggal</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tgl_mutasi">Tanggal Mutasi *</Label>
          <Input
            id="tgl_mutasi"
            type="date"
            value={formData.tgl_mutasi}
            onChange={(e) => handleChange('tgl_mutasi', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pindah_ke">Pindah Ke *</Label>
        <Input
          id="pindah_ke"
          value={formData.pindah_ke}
          onChange={(e) => handleChange('pindah_ke', e.target.value)}
          placeholder="Nama sekolah tujuan"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="alasan_mutasi">Alasan Mutasi *</Label>
        <Textarea
          id="alasan_mutasi"
          value={formData.alasan_mutasi}
          onChange={(e) => handleChange('alasan_mutasi', e.target.value)}
          placeholder="Alasan mutasi"
          rows={3}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ket">Keterangan Tambahan</Label>
        <Textarea
          id="ket"
          value={formData.ket}
          onChange={(e) => handleChange('ket', e.target.value)}
          placeholder="Keterangan tambahan (opsional)"
          rows={2}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Batal
        </Button>
        <Button type="submit" disabled={loading} className="bg-teal-500 hover:bg-teal-600">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Menyimpan...
            </>
          ) : (
            'Simpan Data'
          )}
        </Button>
      </div>
    </form>
  )
}
```

---

# 6. NEXT.JS - mutasi-keluar-edit-form.tsx

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'

interface MutasiKeluar {
  no: number
  nipd: string
  nisn: string
  nama: string
  tempat_lahir: string
  tgl_lahir: string
  rombel: string
  ket_mutasi: string
  pindah_ke: string
  tgl_mutasi: string
  alasan_mutasi: string
  upload_berkas: string
  timestamp: string
  ket: string
  _rowIndex?: number
}

interface MutasiKeluarEditFormProps {
  initialData: MutasiKeluar
  rowIndex: number
  onSuccess: () => void
}

export default function MutasiKeluarEditForm({ initialData, rowIndex, onSuccess }: MutasiKeluarEditFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    no: initialData.no,
    nipd: initialData.nipd || '',
    nisn: initialData.nisn,
    nama: initialData.nama,
    tempat_lahir: initialData.tempat_lahir || '',
    tgl_lahir: initialData.tgl_lahir || '',
    rombel: initialData.rombel || '',
    ket_mutasi: initialData.ket_mutasi || 'Pindah',
    pindah_ke: initialData.pindah_ke,
    tgl_mutasi: initialData.tgl_mutasi,
    alasan_mutasi: initialData.alasan_mutasi,
    upload_berkas: initialData.upload_berkas || '',
    timestamp: initialData.timestamp,
    ket: initialData.ket || ''
  })

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/mutasi-keluar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, rowIndex })
      })

      const result = await res.json()

      if (result.success) {
        alert('Data berhasil diperbarui!')
        onSuccess()
      } else {
        alert('Gagal memperbarui data: ' + (result.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Terjadi kesalahan saat memperbarui data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="no">No. Urut</Label>
          <Input id="no" value={formData.no} disabled className="bg-slate-100" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nipd">NIPD</Label>
          <Input
            id="nipd"
            value={formData.nipd}
            onChange={(e) => handleChange('nipd', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nisn">NISN *</Label>
          <Input
            id="nisn"
            value={formData.nisn}
            onChange={(e) => handleChange('nisn', e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nama">Nama Siswa *</Label>
          <Input
            id="nama"
            value={formData.nama}
            onChange={(e) => handleChange('nama', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tempat_lahir">Tempat Lahir</Label>
          <Input
            id="tempat_lahir"
            value={formData.tempat_lahir}
            onChange={(e) => handleChange('tempat_lahir', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tgl_lahir">Tanggal Lahir</Label>
          <Input
            id="tgl_lahir"
            value={formData.tgl_lahir}
            onChange={(e) => handleChange('tgl_lahir', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rombel">Rombel</Label>
          <Input
            id="rombel"
            value={formData.rombel}
            onChange={(e) => handleChange('rombel', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ket_mutasi">Keterangan Mutasi *</Label>
          <Select value={formData.ket_mutasi} onValueChange={(value) => handleChange('ket_mutasi', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pindah">Pindah</SelectItem>
              <SelectItem value="Keluar">Keluar</SelectItem>
              <SelectItem value="DO">DO (Dikeluarkan)</SelectItem>
              <SelectItem value="Meninggal">Meninggal</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tgl_mutasi">Tanggal Mutasi *</Label>
          <Input
            id="tgl_mutasi"
            type="date"
            value={formData.tgl_mutasi ? formData.tgl_mutasi.split('T')[0] : ''}
            onChange={(e) => handleChange('tgl_mutasi', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pindah_ke">Pindah Ke *</Label>
        <Input
          id="pindah_ke"
          value={formData.pindah_ke}
          onChange={(e) => handleChange('pindah_ke', e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="alasan_mutasi">Alasan Mutasi *</Label>
        <Textarea
          id="alasan_mutasi"
          value={formData.alasan_mutasi}
          onChange={(e) => handleChange('alasan_mutasi', e.target.value)}
          rows={3}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ket">Keterangan Tambahan</Label>
        <Textarea
          id="ket"
          value={formData.ket}
          onChange={(e) => handleChange('ket', e.target.value)}
          rows={2}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Batal
        </Button>
        <Button type="submit" disabled={loading} className="bg-teal-500 hover:bg-teal-600">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Menyimpan...
            </>
          ) : (
            'Simpan Perubahan'
          )}
        </Button>
      </div>
    </form>
  )
}
```

---

# 7. NEXT.JS - mutasi-list.tsx

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Pencil, Trash2, Loader2, AlertTriangle } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface MutasiListProps {
  type: 'masuk' | 'keluar'
  data: any[]
  onUpdate: () => void
  onEdit: (item: any, type: 'masuk' | 'keluar') => void
}

export default function MutasiList({ type, data, onUpdate, onEdit }: MutasiListProps) {
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (deleteIndex === null) return
    
    setDeleting(true)
    try {
      const item = data.find(d => d._rowIndex === deleteIndex)
      const endpoint = type === 'masuk' ? '/api/mutasi-masuk' : '/api/mutasi-keluar'
      
      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowIndex: deleteIndex })
      })

      const result = await res.json()

      if (result.success) {
        onUpdate()
      } else {
        alert('Gagal menghapus data: ' + (result.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Terjadi kesalahan saat menghapus data')
    } finally {
      setDeleting(false)
      setDeleteIndex(null)
    }
  }

  const isMasuk = type === 'masuk'

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <p>Belum ada data mutasi {isMasuk ? 'masuk' : 'keluar'}</p>
      </div>
    )
  }

  return (
    <>
      <ScrollArea className="flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left font-medium">No</th>
                <th className="px-3 py-2 text-left font-medium">NISN</th>
                <th className="px-3 py-2 text-left font-medium">Nama</th>
                {isMasuk ? (
                  <>
                    <th className="px-3 py-2 text-left font-medium">Asal Sekolah</th>
                    <th className="px-3 py-2 text-left font-medium">Rombel Tujuan</th>
                  </>
                ) : (
                  <>
                    <th className="px-3 py-2 text-left font-medium">Rombel</th>
                    <th className="px-3 py-2 text-left font-medium">Pindah Ke</th>
                    <th className="px-3 py-2 text-left font-medium">Tgl Mutasi</th>
                  </>
                )}
                <th className="px-3 py-2 text-center font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, idx) => (
                <tr key={idx} className="border-b hover:bg-slate-50">
                  <td className="px-3 py-2">{item.no}</td>
                  <td className="px-3 py-2">{item.nisn}</td>
                  <td className="px-3 py-2 font-medium">
                    {isMasuk ? item.nama_siswa : item.nama}
                  </td>
                  {isMasuk ? (
                    <>
                      <td className="px-3 py-2">{item.nama_sekolah}</td>
                      <td className="px-3 py-2">{item.rombel_tujuan}</td>
                    </>
                  ) : (
                    <>
                      <td className="px-3 py-2">{item.rombel}</td>
                      <td className="px-3 py-2">{item.pindah_ke}</td>
                      <td className="px-3 py-2">{item.tgl_mutasi}</td>
                    </>
                  )}
                  <td className="px-3 py-2">
                    <div className="flex justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
                        onClick={() => onEdit(item, type)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                        onClick={() => setDeleteIndex(item._rowIndex)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ScrollArea>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteIndex !== null} onOpenChange={() => setDeleteIndex(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Konfirmasi Hapus Data
            </AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus data{' '}
              <strong>
                {deleteIndex && data.find(d => d._rowIndex === deleteIndex) 
                  ? (isMasuk 
                      ? data.find(d => d._rowIndex === deleteIndex)?.nama_siswa 
                      : data.find(d => d._rowIndex === deleteIndex)?.nama)
                  : ''}
              </strong>
              ? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menghapus...
                </>
              ) : (
                'Ya, Hapus Data'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
```

---

# 8. NEXT.JS - login-form.tsx

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { School, Loader2 } from 'lucide-react'

interface LoginFormProps {
  onLogin: (username: string, password: string) => void
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      await onLogin(username, password)
    } catch (err) {
      setError('Username atau password salah')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-white to-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200">
            <School className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-2xl">SMKN 1 Palopo</CardTitle>
          <CardDescription>Sistem Manajemen Mutasi Siswa</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                required
              />
            </div>
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
            <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Masuk'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

# 9. NEXT.JS - API Routes

## File: src/app/api/mutasi-masuk/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server'

const GAS_URL = 'https://script.google.com/macros/s/AKfycbzuP8eQyYpWW5h8GWBb0d8fdMpHstT04NakfCdoCv0h04P1I2vbrH8qOdvuspczXYpMYQ/exec'

export async function GET(request: NextRequest) {
  const action = request.nextUrl.searchParams.get('action')
  const url = action 
    ? `${GAS_URL}?action=${action}` 
    : `${GAS_URL}?action=getMasuk`

  const res = await fetch(url)
  const data = await res.json()
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  
  const res = await fetch(`${GAS_URL}?action=addMasuk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  
  const data = await res.json()
  return NextResponse.json(data)
}

export async function PUT(request: NextRequest) {
  const body = await request.json()
  
  const res = await fetch(`${GAS_URL}?action=updateMasuk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  
  const data = await res.json()
  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest) {
  const body = await request.json()
  
  const res = await fetch(`${GAS_URL}?action=deleteMasuk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  
  const data = await res.json()
  return NextResponse.json(data)
}
```

## File: src/app/api/mutasi-keluar/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server'

const GAS_URL = 'https://script.google.com/macros/s/AKfycbzuP8eQyYpWW5h8GWBb0d8fdMpHstT04NakfCdoCv0h04P1I2vbrH8qOdvuspczXYpMYQ/exec'

export async function GET(request: NextRequest) {
  const action = request.nextUrl.searchParams.get('action')
  const query = request.nextUrl.searchParams.get('query')
  
  let url = GAS_URL
  if (action === 'searchSiswa' && query) {
    url = `${GAS_URL}?action=searchSiswa&query=${encodeURIComponent(query)}`
  } else if (action) {
    url = `${GAS_URL}?action=${action}`
  } else {
    url = `${GAS_URL}?action=getKeluar`
  }

  const res = await fetch(url)
  const data = await res.json()
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  
  const res = await fetch(`${GAS_URL}?action=addKeluar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  
  const data = await res.json()
  return NextResponse.json(data)
}

export async function PUT(request: NextRequest) {
  const body = await request.json()
  
  const res = await fetch(`${GAS_URL}?action=updateKeluar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  
  const data = await res.json()
  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest) {
  const body = await request.json()
  
  const res = await fetch(`${GAS_URL}?action=deleteKeluar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  
  const data = await res.json()
  return NextResponse.json(data)
}
```

## File: src/contexts/AuthContext.tsx

```typescript
'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface AuthContextType {
  isLoggedIn: boolean
  userName: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userName, setUserName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in
    const stored = localStorage.getItem('auth')
    if (stored) {
      const auth = JSON.parse(stored)
      setIsLoggedIn(true)
      setUserName(auth.userName)
    }
    setIsLoading(false)
  }, [])

  const login = async (username: string, password: string) => {
    // Simple auth check (in production, use proper authentication)
    if (username === 'admin' && password === 'admin123') {
      localStorage.setItem('auth', JSON.stringify({ userName: 'Administrator' }))
      setIsLoggedIn(true)
      setUserName('Administrator')
    } else {
      throw new Error('Invalid credentials')
    }
  }

  const logout = () => {
    localStorage.removeItem('auth')
    setIsLoggedIn(false)
    setUserName(null)
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, userName, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```

## File: src/app/layout.tsx (update)

```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sistem Mutasi Siswa - SMKN 1 Palopo',
  description: 'Sistem Manajemen Mutasi Siswa SMKN 1 Palopo',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
```

---

# KONFIGURASI SPREADSHEET

## Struktur Sheet:

### 1. Sheet "Mutasi Masuk"
| No | NISN | Nama Siswa | Provinsi | Kab/Kota | Kecamatan | Nama Sekolah | Rombel Tujuan | Timestamp | Ket |

### 2. Sheet "Mutasi Keluar"
| No | NIPD | NISN | Nama | Tempat Lahir | Tgl Lahir | Rombel | Ket Mutasi | Pindah Ke | Tgl Mutasi | Alasan Mutasi | Upload Berkas | Timestamp | Ket |

### 3. Sheet "Data Siswa"
| NIPD | NISN | Nama | Tempat Lahir | Tgl Lahir | Rombel |

### 4. Sheet "Rombel"
| Nama Rombel |
| (isi dengan daftar rombel, contoh: XII TKJ 1, XII TKJ 2, dll)

---

# KREDENSIAL LOGIN

- **Username**: admin
- **Password**: admin123

---

# TELEGRAM BOT CONFIGURATION

- **Bot Token**: 8798086610:AAHTiioEb5YqjiEU6K6YFAWdf0f-zmpyp-I
- **Chat ID**: 1027594762

---

# CATATAN PENTING

1. Ganti `SPREADSHEET_ID` dan `DRIVE_FOLDER_ID` di Google Apps Script dengan ID Anda
2. Ganti URL di API routes jika GAS di-deploy ulang
3. Pastikan semua permission di Google Apps Script sudah disetujui
4. Kredensial login hardcoded untuk demo - gunakan sistem auth yang lebih aman untuk produksi

---

**File backup ini dibuat pada: Januari 2025**
**Author: Zulfitrah Sudir**
