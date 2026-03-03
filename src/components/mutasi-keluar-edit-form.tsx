'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Loader2, Upload, MapPin, Calendar, Users, ArrowRightLeft, CheckCircle, ExternalLink, Lock } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'

const formSchema = z.object({
  nipd: z.string().length(7, 'NIPD harus 7 karakter'),
  nisn: z.string().optional(),
  nama: z.string().min(3, 'Nama minimal 3 karakter'),
  tempatLahir: z.string().optional(),
  tglLahir: z.string().optional(),
  rombel: z.string().optional(),
  ketMutasi: z.string().min(1, 'Keterangan mutasi wajib dipilih'),
  pindahKe: z.string().optional(),
  tglMutasi: z.string().min(1, 'Tanggal mutasi wajib diisi'),
  alasanMutasi: z.string().min(10, 'Alasan mutasi minimal 10 karakter'),
  uploadBerkas: z.string().optional(),
  ket: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

const rombelOptions = [
  '10 AKL 1', '10 AKL 2', '10 AKL 3',
  '10 Kuliner 1', '10 Kuliner 2',
  '10 MPLB 1', '10 MPLB 2', '10 MPLB 3',
  '10 PMS 1', '10 PMS 2', '10 PMS 3',
  '10 TJKT 1', '10 TJKT 2', '10 TJKT 3',
  '10 ULP',
  '11 AKL 1', '11 AKL 2', '11 AKL 3', '11 AKL 4',
  '11 Kuliner 1', '11 Kuliner 2',
  '11 MPLB 1', '11 MPLB 2', '11 MPLB 3', '11 MPLB 4',
  '11 PMS 1', '11 PMS 2', '11 PMS 3',
  '11 TJKT 1', '11 TJKT 2', '11 TJKT 3', '11 TJKT 4',
  '11 ULP',
  '12 AKL 1', '12 AKL 2', '12 AKL 3',
  '12 Kuliner 1', '12 Kuliner 2',
  '12 MPLB 1', '12 MPLB 2', '12 MPLB 3',
  '12 PMS 1', '12 PMS 2',
  '12 TJKT 1', '12 TJKT 2', '12 TJKT 3',
  '12 ULP',
]

const ketMutasiOptions = [
  'Mutasi',
  'Dikeluarkan',
  'Mengundurkan Diri',
  'Putus Sekolah',
  'Wafat',
  'Hilang',
]

interface MutasiKeluarEditFormProps {
  initialData: {
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
    ket: string
  }
  rowIndex: number
  onSuccess: () => void
}

export default function MutasiKeluarEditForm({ initialData, rowIndex, onSuccess }: MutasiKeluarEditFormProps) {
  const { canEditKeterangan } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [fileName, setFileName] = useState<string>('')
  const [fileUrl, setFileUrl] = useState<string>('')
  const { toast } = useToast()

  // Helper function untuk convert date format
  const convertDateForInput = (dateStr: string) => {
    if (!dateStr) return ''
    // Jika format DD/MM/YYYY, convert ke YYYY-MM-DD
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/')
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
      }
    }
    // Jika sudah ISO format, ambil date saja
    if (dateStr.includes('T')) {
      return dateStr.split('T')[0]
    }
    return dateStr
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nipd: initialData.nipd || '',
      nisn: initialData.nisn || '',
      nama: initialData.nama || '',
      tempatLahir: initialData.tempat_lahir || '',
      tglLahir: convertDateForInput(initialData.tgl_lahir),
      rombel: initialData.rombel || '',
      ketMutasi: initialData.ket_mutasi || '',
      pindahKe: initialData.pindah_ke || '',
      tglMutasi: convertDateForInput(initialData.tgl_mutasi),
      alasanMutasi: initialData.alasan_mutasi || '',
      uploadBerkas: initialData.upload_berkas || '',
      ket: initialData.ket || '',
    },
  })

  // Watch ketMutasi to conditionally enable/disable pindahKe
  const ketMutasi = form.watch('ketMutasi')
  const isMutasi = ketMutasi === 'Mutasi'

  useEffect(() => {
    if (initialData.upload_berkas) {
      // Check if it's a URL (Google Drive link)
      if (initialData.upload_berkas.startsWith('http')) {
        setFileUrl(initialData.upload_berkas)
        setFileName('File sudah ada di Google Drive')
      } else if (!initialData.upload_berkas.startsWith('data:')) {
        setFileName('File sudah ada')
      }
    }
  }, [initialData.upload_berkas])

  // Clear pindahKe when ketMutasi changes to non-Mutasi
  useEffect(() => {
    if (!isMutasi && ketMutasi) {
      form.setValue('pindahKe', '')
    }
  }, [isMutasi, ketMutasi, form])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFileName(file.name)
      setIsUploading(true)
      
      try {
        // Convert file to base64
        const reader = new FileReader()
        reader.onloadend = async () => {
          try {
            const base64Data = reader.result as string
            
            // Upload to Google Drive via API with nisn_nama format and oldFileUrl for replacement
            const uploadResponse = await fetch('/api/upload-file', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                fileName: file.name,
                mimeType: file.type,
                fileData: base64Data,
                nisn: initialData.nisn || '',
                nama: initialData.nama || '',
                oldFileUrl: initialData.upload_berkas || '' // Pass old file URL for deletion
              })
            })
            
            const uploadResult = await uploadResponse.json()
            
            if (uploadResult.success) {
              setFileUrl(uploadResult.fileUrl)
              form.setValue('uploadBerkas', uploadResult.fileUrl)
              toast({
                title: 'Upload Berhasil!',
                description: `File "${uploadResult.fileName}" berhasil diupload (file lama dihapus)`,
              })
            } else {
              throw new Error(uploadResult.error || 'Gagal upload file')
            }
          } catch (error) {
            console.error('Error uploading file:', error)
            toast({
              title: 'Upload Gagal!',
              description: 'Gagal mengupload file ke Google Drive',
              variant: 'destructive',
            })
            setFileName('')
            setFileUrl('')
          } finally {
            setIsUploading(false)
          }
        }
        reader.readAsDataURL(file)
      } catch (error) {
        console.error('Error reading file:', error)
        setIsUploading(false)
        setFileName('')
      }
    }
  }

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true)
    try {
      // Mapping field names dari camelCase ke snake_case
      const payload = {
        row: rowIndex,
        nipd: data.nipd,
        nisn: data.nisn,
        nama: data.nama,
        tempat_lahir: data.tempatLahir,
        tgl_lahir: data.tglLahir,
        rombel: data.rombel,
        ket_mutasi: data.ketMutasi,
        pindah_ke: data.pindahKe || '',
        tgl_mutasi: data.tglMutasi,
        alasan_mutasi: data.alasanMutasi,
        upload_berkas: data.uploadBerkas,
        ket: data.ket,
      }
      
      const response = await fetch('/api/mutasi-keluar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      
      const result = await response.json()
      
      if (!response.ok) throw new Error(result.error || 'Gagal mengupdate data')
      
      toast({
        title: 'Berhasil!',
        description: `Data mutasi keluar untuk ${data.nama} berhasil diupdate`,
      })
      onSuccess()
    } catch (error) {
      toast({
        title: 'Gagal!',
        description: 'Terjadi kesalahan saat mengupdate data',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Info Card - Data Siswa */}
        <div className="p-4 rounded-lg border-2 border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Data Siswa</span>
            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">Edit Mode</span>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-3">
            <FormItem>
              <FormLabel className="text-xs text-slate-600">NIPD</FormLabel>
              <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-md text-sm font-medium text-slate-700">
                {form.watch('nipd') || '-'}
              </div>
            </FormItem>
            
            <FormItem>
              <FormLabel className="text-xs text-slate-600">NISN</FormLabel>
              <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-md text-sm font-medium text-slate-700">
                {form.watch('nisn') || '-'}
              </div>
            </FormItem>
            
            <FormItem>
              <FormLabel className="text-xs text-slate-600">Nama Lengkap</FormLabel>
              <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-md text-sm font-medium text-slate-700">
                {form.watch('nama') || '-'}
              </div>
            </FormItem>
            
            <FormItem>
              <FormLabel className="text-xs text-slate-600 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Tempat Lahir
              </FormLabel>
              <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-md text-sm font-medium text-slate-700">
                {form.watch('tempatLahir') || '-'}
              </div>
            </FormItem>
            
            <FormItem>
              <FormLabel className="text-xs text-slate-600 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Tanggal Lahir
              </FormLabel>
              <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-md text-sm font-medium text-slate-700">
                {form.watch('tglLahir') ? new Date(form.watch('tglLahir')).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
              </div>
            </FormItem>
            
            <FormItem>
              <FormLabel className="text-xs text-slate-600">Rombel</FormLabel>
              <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-md text-sm font-medium text-slate-700">
                {form.watch('rombel') || '-'}
              </div>
            </FormItem>
          </div>
        </div>

        {/* Mutasi Details */}
        <div className="border-t pt-4">
          <div className="flex items-center gap-2 mb-3">
            <ArrowRightLeft className="w-4 h-4 text-teal-500" />
            <span className="text-sm font-medium text-slate-700">Detail Mutasi</span>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="ketMutasi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ket. Mutasi <span className="text-red-500">*</span></FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih keterangan" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ketMutasiOptions.map((ket) => (
                        <SelectItem key={ket} value={ket}>
                          {ket}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="tglMutasi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tanggal Mutasi <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Pindah Ke - Only accessible when Ket. Mutasi = "Mutasi" */}
        <div className={`p-4 rounded-lg border-2 transition-colors ${!isMutasi && ketMutasi ? 'border-red-200 bg-red-50/50' : 'border-slate-200 bg-slate-50'}`}>
          <div className="flex items-center gap-2 mb-3">
            {!isMutasi && ketMutasi ? (
              <Lock className="w-4 h-4 text-red-500" />
            ) : (
              <ArrowRightLeft className="w-4 h-4 text-slate-500" />
            )}
            <span className="text-sm font-medium text-slate-700">Pindah Ke</span>
            {!isMutasi && ketMutasi && (
              <span className="text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                🔒 Hanya bisa diisi jika Ket. Mutasi = "Mutasi"
              </span>
            )}
            {isMutasi && (
              <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                ✓ Dapat diisi
              </span>
            )}
          </div>
          
          <FormField
            control={form.control}
            name="pindahKe"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input 
                    placeholder={!isMutasi && ketMutasi ? "Field ini terkunci" : "Nama sekolah tujuan / keterangan lainnya"} 
                    {...field} 
                    disabled={!isMutasi && !!ketMutasi}
                    className={`bg-white ${!isMutasi && ketMutasi ? 'bg-slate-100 cursor-not-allowed' : ''}`}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="alasanMutasi"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Alasan Mutasi <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Jelaskan alasan mutasi keluar" 
                  className="min-h-[80px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="uploadBerkas"
          render={() => (
            <FormItem>
              <FormLabel>Upload Berkas</FormLabel>
              <FormControl>
                <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 hover:border-teal-300 transition-colors">
                  <Input 
                    type="file" 
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload-edit"
                    disabled={isUploading}
                  />
                  <label 
                    htmlFor="file-upload-edit" 
                    className="flex flex-col items-center justify-center cursor-pointer gap-2"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
                        <span className="text-sm text-teal-600">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-slate-400" />
                        <span className="text-sm text-slate-500">
                          {fileName || 'Klik untuk upload berkas (PDF, DOC, JPG, PNG)'}
                        </span>
                        {fileUrl && (
                          <span className="text-xs text-emerald-600 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> File berhasil diupload
                          </span>
                        )}
                      </>
                    )}
                  </label>
                </div>
              </FormControl>
              {fileUrl && (
                <a 
                  href={fileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
                >
                  <ExternalLink className="w-3 h-3" /> Lihat file di Google Drive
                </a>
              )}
              <p className="text-xs text-slate-500 mt-1">File akan disimpan di Google Drive</p>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Keterangan - Terkunci jika kelas != 1 */}
        <div className={`p-4 rounded-lg border-2 ${!canEditKeterangan ? 'border-red-200 bg-red-50/50' : 'border-slate-200 bg-slate-50'}`}>
          <div className="flex items-center gap-2 mb-3">
            {!canEditKeterangan ? (
              <Lock className="w-4 h-4 text-red-500" />
            ) : (
              <Users className="w-4 h-4 text-slate-500" />
            )}
            <span className="text-sm font-medium text-slate-700">Keterangan</span>
            {!canEditKeterangan && (
              <span className="text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                🔒 Terkunci - Hanya untuk user kelas 1
              </span>
            )}
            {canEditKeterangan && (
              <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                ✓ Dapat diedit
              </span>
            )}
          </div>
          
          <FormField
            control={form.control}
            name="ket"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input 
                    placeholder={!canEditKeterangan ? "Field ini terkunci" : "Keterangan tambahan (opsional)"} 
                    {...field} 
                    disabled={!canEditKeterangan}
                    className={`bg-white ${!canEditKeterangan ? 'bg-slate-100 cursor-not-allowed' : ''}`}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button 
            type="submit" 
            className="flex-1 bg-blue-500 hover:bg-blue-600"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : (
              'Update Data'
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
