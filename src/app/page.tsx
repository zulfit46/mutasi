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
  
  // Selected month for detail view
  const [selectedMonth, setSelectedMonth] = useState<{year: number, month: number} | null>(null)

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

  // Get students by month for detail view
  const getStudentsByMonth = (year: number, month: number) => {
    const masuk: { nama: string; rombel: string }[] = []
    const keluar: { nama: string; rombel: string }[] = []
    
    // Filter mutasi masuk
    mutasiMasuk.forEach(m => {
      const date = parseDate(m.timestamp)
      if (date && date.getFullYear() === year && date.getMonth() === month) {
        masuk.push({
          nama: m.nama_siswa,
          rombel: m.rombel_tujuan
        })
      }
    })
    
    // Filter mutasi keluar
    mutasiKeluar.forEach(m => {
      const dateStr = (m as any).tgl_mutasi || m.timestamp
      const date = parseDate(dateStr)
      if (date && date.getFullYear() === year && date.getMonth() === month) {
        keluar.push({
          nama: m.nama,
          rombel: m.rombel
        })
      }
    })
    
    return { masuk, keluar }
  }

  // Check if any dialog is open for blur effect
  const isDialogOpen = showMutasiMasuk || showMutasiKeluar || showList || showRekap || editData || selectedMonth

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
                        const hasData = stat.masuk > 0 || stat.keluar > 0
                        return (
                          <tr 
                            key={idx} 
                            className={`border-t border-slate-100 ${hasData ? 'hover:bg-purple-50 cursor-pointer' : 'hover:bg-slate-50'}`}
                            onClick={() => hasData && setSelectedMonth({ year: stat.year, month: stat.month })}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                <span className="font-medium text-slate-700">
                                  {getMonthName(stat.month)} {stat.year}
                                </span>
                                {hasData && (
                                  <span className="text-xs text-purple-500 ml-1">• klik untuk detail</span>
                                )}
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

      {/* Detail Bulanan Dialog */}
      <Dialog open={selectedMonth !== null} onOpenChange={() => setSelectedMonth(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-purple-600">
              <Calendar className="w-5 h-5" />
              Detail Mutasi {selectedMonth && getMonthName(selectedMonth.month)} {selectedMonth?.year}
            </DialogTitle>
            <DialogDescription>
              Daftar siswa mutasi masuk dan keluar pada bulan ini
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 max-h-[50vh]">
            {selectedMonth && (() => {
              const { masuk, keluar } = getStudentsByMonth(selectedMonth.year, selectedMonth.month)
              return (
                <div className="space-y-4 p-1 pr-3">
                  {/* Mutasi Masuk List */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-emerald-50 px-4 py-2 border-b border-emerald-100">
                      <div className="flex items-center gap-2">
                        <UserPlus className="w-4 h-4 text-emerald-600" />
                        <span className="font-semibold text-emerald-700">
                          Mutasi Masuk ({masuk.length})
                        </span>
                      </div>
                    </div>
                    <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                      {masuk.length === 0 ? (
                        <p className="px-4 py-3 text-sm text-slate-500 text-center">Tidak ada data</p>
                      ) : (
                        masuk.map((s, i) => (
                          <div key={i} className="px-4 py-3 flex items-center justify-between hover:bg-emerald-50/50">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                <UserPlus className="w-4 h-4 text-emerald-600" />
                              </div>
                              <span className="font-medium text-slate-700">{s.nama}</span>
                            </div>
                            <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                              {s.rombel}
                            </Badge>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Mutasi Keluar List */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-teal-50 px-4 py-2 border-b border-teal-100">
                      <div className="flex items-center gap-2">
                        <UserMinus className="w-4 h-4 text-teal-600" />
                        <span className="font-semibold text-teal-700">
                          Mutasi Keluar ({keluar.length})
                        </span>
                      </div>
                    </div>
                    <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                      {keluar.length === 0 ? (
                        <p className="px-4 py-3 text-sm text-slate-500 text-center">Tidak ada data</p>
                      ) : (
                        keluar.map((s, i) => (
                          <div key={i} className="px-4 py-3 flex items-center justify-between hover:bg-teal-50/50">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                                <UserMinus className="w-4 h-4 text-teal-600" />
                              </div>
                              <span className="font-medium text-slate-700">{s.nama}</span>
                            </div>
                            <Badge variant="outline" className="border-teal-200 text-teal-700">
                              {s.rombel}
                            </Badge>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )
            })()}
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
