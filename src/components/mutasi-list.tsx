'use client'

import { useState } from 'react'
import { 
  Trash2,
  Edit,
  UserPlus,
  UserMinus,
  AlertTriangle,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { useToast } from '@/hooks/use-toast'

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
  _rowIndex?: number
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
  _rowIndex?: number
}

interface DeleteDialogState {
  open: boolean
  rowIndex: number | null
  nama: string
}

interface MutasiListProps {
  type: 'masuk' | 'keluar'
  data: MutasiMasuk[] | MutasiKeluar[]
  onUpdate: () => void
  onEdit: (item: MutasiMasuk | MutasiKeluar, type: 'masuk' | 'keluar') => void
}

export default function MutasiList({ type, data, onUpdate, onEdit }: MutasiListProps) {
  const [deleting, setDeleting] = useState<number | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({
    open: false,
    rowIndex: null,
    nama: ''
  })
  const { toast } = useToast()

  const handleDeleteClick = (rowIndex: number, nama: string) => {
    setDeleteDialog({
      open: true,
      rowIndex,
      nama
    })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.rowIndex) return
    
    const rowIndex = deleteDialog.rowIndex
    setDeleting(rowIndex)
    setDeleteDialog({ open: false, rowIndex: null, nama: '' })
    
    try {
      const endpoint = type === 'masuk' ? '/api/mutasi-masuk' : '/api/mutasi-keluar'
      const response = await fetch(`${endpoint}?row=${rowIndex}`, {
        method: 'DELETE',
      })
      
      const result = await response.json()
      
      if (!response.ok) throw new Error(result.error || 'Gagal menghapus data')
      
      toast({
        title: 'Berhasil!',
        description: 'Data berhasil dihapus',
      })
      onUpdate()
    } catch (error) {
      toast({
        title: 'Gagal!',
        description: 'Terjadi kesalahan saat menghapus data',
        variant: 'destructive',
      })
    } finally {
      setDeleting(null)
    }
  }

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-'
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    } catch {
      return dateStr
    }
  }

  // Untuk Mutasi Keluar - tampilan tabel
  if (type === 'keluar') {
    return (
      <>
        <div className="h-[60vh] overflow-auto">
          {data.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <UserMinus className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Belum ada data mutasi keluar</p>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-teal-50 text-teal-700">
                  <th className="px-3 py-3 text-left font-semibold text-sm border-b border-teal-100 whitespace-nowrap" style={{width: '60px'}}>No</th>
                  <th className="px-3 py-3 text-left font-semibold text-sm border-b border-teal-100 whitespace-nowrap" style={{width: '100px'}}>NIPD</th>
                  <th className="px-3 py-3 text-left font-semibold text-sm border-b border-teal-100 whitespace-nowrap" style={{width: '120px'}}>NISN</th>
                  <th className="px-3 py-3 text-left font-semibold text-sm border-b border-teal-100 whitespace-nowrap">Nama</th>
                  <th className="px-3 py-3 text-left font-semibold text-sm border-b border-teal-100 whitespace-nowrap" style={{width: '120px'}}>Rombel</th>
                  <th className="px-3 py-3 text-left font-semibold text-sm border-b border-teal-100 whitespace-nowrap" style={{width: '150px'}}>Ket. Mutasi</th>
                  <th className="px-3 py-3 text-left font-semibold text-sm border-b border-teal-100 whitespace-nowrap" style={{width: '100px'}}>Ket</th>
                  <th className="px-3 py-3 text-center font-semibold text-sm border-b border-teal-100 whitespace-nowrap" style={{width: '120px'}}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, idx) => {
                  const keluarItem = item as MutasiKeluar
                  const rowKey = keluarItem._rowIndex || (idx + 2)
                  
                  return (
                    <tr 
                      key={`mutasi-keluar-${rowKey}`}
                      className="bg-white hover:bg-slate-50 border-b border-slate-100"
                    >
                      <td className="px-3 py-3 text-sm font-medium text-slate-700 whitespace-nowrap">{keluarItem.no || idx + 1}</td>
                      <td className="px-3 py-3 text-sm text-slate-600 font-mono whitespace-nowrap">{keluarItem.nipd || '-'}</td>
                      <td className="px-3 py-3 text-sm text-slate-600 font-mono whitespace-nowrap">{keluarItem.nisn || '-'}</td>
                      <td className="px-3 py-3 text-sm font-medium text-slate-800 whitespace-nowrap">{keluarItem.nama || '-'}</td>
                      <td className="px-3 py-3 text-sm text-slate-600 whitespace-nowrap">{keluarItem.rombel || '-'}</td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-700">
                          {keluarItem.ket_mutasi || '-'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-sm text-slate-600 whitespace-nowrap">{keluarItem.ket || '-'}</td>
                      <td className="px-3 py-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 h-8 w-8 p-0"
                            onClick={() => onEdit(keluarItem, 'keluar')}
                            title="Edit data"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                            onClick={() => handleDeleteClick(rowKey, keluarItem.nama || '')}
                            disabled={deleting === rowKey}
                            title="Hapus data"
                          >
                            {deleting === rowKey ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <AlertDialogTitle className="text-lg">Hapus Data?</AlertDialogTitle>
                  <AlertDialogDescription className="text-sm text-slate-500 mt-1">
                    Data yang dihapus tidak dapat dikembalikan.
                  </AlertDialogDescription>
                </div>
              </div>
            </AlertDialogHeader>
            <div className="py-4">
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p className="text-sm text-slate-600">Anda akan menghapus data:</p>
                <p className="text-base font-semibold text-slate-800 mt-1">
                  "{deleteDialog.nama}"
                </p>
              </div>
            </div>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel className="mt-0">Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Ya, Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    )
  }

  // Untuk Mutasi Masuk - tampilan tabel
  return (
    <>
      <div className="h-[60vh] overflow-auto">
        {data.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Belum ada data mutasi masuk</p>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-emerald-50 text-emerald-700">
                <th className="px-3 py-3 text-left font-semibold text-sm border-b border-emerald-100 whitespace-nowrap">NISN</th>
                <th className="px-3 py-3 text-left font-semibold text-sm border-b border-emerald-100 whitespace-nowrap">Nama</th>
                <th className="px-3 py-3 text-left font-semibold text-sm border-b border-emerald-100 whitespace-nowrap">Provinsi</th>
                <th className="px-3 py-3 text-left font-semibold text-sm border-b border-emerald-100 whitespace-nowrap">Kab/Kota</th>
                <th className="px-3 py-3 text-left font-semibold text-sm border-b border-emerald-100 whitespace-nowrap">Kecamatan</th>
                <th className="px-3 py-3 text-left font-semibold text-sm border-b border-emerald-100 whitespace-nowrap">Nama Sekolah</th>
                <th className="px-3 py-3 text-left font-semibold text-sm border-b border-emerald-100 whitespace-nowrap">Rombel</th>
                <th className="px-3 py-3 text-left font-semibold text-sm border-b border-emerald-100 whitespace-nowrap">Ket</th>
                <th className="px-3 py-3 text-center font-semibold text-sm border-b border-emerald-100 whitespace-nowrap" style={{width: '80px'}}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, idx) => {
                const masukItem = item as MutasiMasuk
                const rowKey = masukItem._rowIndex || (idx + 2)
                
                return (
                  <tr 
                    key={`mutasi-masuk-${rowKey}`}
                    className="bg-white hover:bg-slate-50 border-b border-slate-100"
                  >
                    <td className="px-3 py-3 text-sm text-slate-600 font-mono whitespace-nowrap">{masukItem.nisn || '-'}</td>
                    <td className="px-3 py-3 text-sm font-medium text-slate-800 whitespace-nowrap">{masukItem.nama_siswa || '-'}</td>
                    <td className="px-3 py-3 text-sm text-slate-600 whitespace-nowrap">{masukItem.provinsi || '-'}</td>
                    <td className="px-3 py-3 text-sm text-slate-600 whitespace-nowrap">{masukItem.kab_kota || '-'}</td>
                    <td className="px-3 py-3 text-sm text-slate-600 whitespace-nowrap">{masukItem.kecamatan || '-'}</td>
                    <td className="px-3 py-3 text-sm text-slate-600 whitespace-nowrap">{masukItem.nama_sekolah || '-'}</td>
                    <td className="px-3 py-3 text-sm text-slate-600 whitespace-nowrap">{masukItem.rombel_tujuan || '-'}</td>
                    <td className="px-3 py-3 text-sm text-slate-600 whitespace-nowrap">{masukItem.ket || '-'}</td>
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 h-8 w-8 p-0"
                          onClick={() => onEdit(masukItem, 'masuk')}
                          title="Edit data"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                          onClick={() => handleDeleteClick(rowKey, masukItem.nama_siswa || '')}
                          disabled={deleting === rowKey}
                          title="Hapus data"
                        >
                          {deleting === rowKey ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <AlertDialogTitle className="text-lg">Hapus Data?</AlertDialogTitle>
                <AlertDialogDescription className="text-sm text-slate-500 mt-1">
                  Data yang dihapus tidak dapat dikembalikan.
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <div className="py-4">
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <p className="text-sm text-slate-600">Anda akan menghapus data:</p>
              <p className="text-base font-semibold text-slate-800 mt-1">
                "{deleteDialog.nama}"
              </p>
            </div>
          </div>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="mt-0">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
