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
import { Loader2, Upload, Search, User, MapPin, Calendar, Users, ArrowRightLeft, CheckCircle, Lock } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

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

interface MutasiKeluarFormProps {
  onSuccess: () => void
}

export default function MutasiKeluarForm({ onSuccess }: MutasiKeluarFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [fileName, setFileName] = useState<string>('')
  const [fileUrl, setFileUrl] = useState<string>('')
  const [foundSiswa, setFoundSiswa] = useState<boolean | null>(null)
  const [siswaData, setSiswaData] = useState<{
    nisn: string
    nama: string
    tempatLahir: string
    tglLahir: string
    rombel: string
  } | null>(null)
  const { toast } = useToast()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nipd: '',
      nisn: '',
      nama: '',
      tempatLahir: '',
      tglLahir: '',
      rombel: '',
      ketMutasi: '',
      pindahKe: '',
      tglMutasi: '',
      alasanMutasi: '',
      uploadBerkas: '',
    },
  })

  // Watch ketMutasi to conditionally enable/disable pindahKe
  const ketMutasi = form.watch('ketMutasi')
  const isMutasi = ketMutasi === 'Mutasi'

  // Search siswa by NIPD
  const searchSiswa = async (nipd: string) => {
    if (!nipd || nipd.length !== 7) {
      setFoundSiswa(null)
      setSiswaData(null)
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/mutasi-keluar?nipd=${encodeURIComponent(nipd)}`)
      const result = await response.json()

      if (result.success && result.data) {
        // Simpan data siswa untuk ditampilkan sebagai label
        setSiswaData({
          nisn: result.data.nisn || '',
          nama: result.data.nama || '',
          tempatLahir: result.data.tempat_lahir || '',
          tglLahir: result.data.tgl_lahir || '',
          rombel: result.data.rombel || ''
        })
        
        // Set hidden form values for submission
        form.setValue('nisn', result.data.nisn || '')
        form.setValue('nama', result.data.nama || '')
        form.setValue('tempatLahir', result.data.tempat_lahir || '')
        form.setValue('tglLahir', result.data.tgl_lahir || '')
        form.setValue('rombel', result.data.rombel || '')
        
        setFoundSiswa(true)
        
        toast({
          title: 'Data Ditemukan!',
          description: `Nama: ${result.data.nama} | Rombel: ${result.data.rombel}`,
        })
      } else {
        setFoundSiswa(false)
        setSiswaData(null)
        // Clear hidden form values
        form.setValue('nisn', '')
        form.setValue('nama', '')
        form.setValue('tempatLahir', '')
        form.setValue('tglLahir', '')
        form.setValue('rombel', '')
        
        toast({
          title: 'Data Tidak Ditemukan',
          description: 'NIPD tidak ditemukan di sheet Data',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error searching siswa:', error)
      setFoundSiswa(false)
      setSiswaData(null)
      toast({
        title: 'Error',
        description: 'Gagal mencari data siswa',
        variant: 'destructive',
      })
    } finally {
      setIsSearching(false)
    }
  }

  // Debounce search - trigger when NIPD is exactly 7 characters
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'nipd' && value.nipd && value.nipd.length === 7) {
        const timer = setTimeout(() => {
          searchSiswa(value.nipd as string)
        }, 500)
        return () => clearTimeout(timer)
      }
    })
    return () => subscription.unsubscribe()
  }, [form])

  // Clear pindahKe when ketMutasi changes to non-Mutasi
  useEffect(() => {
    if (!isMutasi) {
      form.setValue('pindahKe', '')
    }
  }, [isMutasi, form])

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
            
            // Upload to Google Drive via API with nisn_nama format
            const uploadResponse = await fetch('/api/upload-file', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                fileName: file.name,
                mimeType: file.type,
                fileData: base64Data,
                nisn: siswaData?.nisn || '',
                nama: siswaData?.nama || ''
              })
            })
            
            const uploadResult = await uploadResponse.json()
            
            if (uploadResult.success) {
              setFileUrl(uploadResult.fileUrl)
              form.setValue('uploadBerkas', uploadResult.fileUrl)
              toast({
                title: 'Upload Berhasil!',
                description: `File "${uploadResult.fileName}" berhasil diupload`,
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
      // Mapping field names dari camelCase ke snake_case sesuai format GAS
      const payload = {
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
      }
      
      const response = await fetch('/api/mutasi-keluar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      
      const result = await response.json()
      
      if (!response.ok) throw new Error(result.error || 'Gagal menyimpan data')
      
      toast({
        title: 'Berhasil!',
        description: `Data mutasi keluar untuk ${data.nama} berhasil disimpan`,
      })
      form.reset()
      setFileName('')
      setFileUrl('')
      setFoundSiswa(null)
      setSiswaData(null)
      onSuccess()
    } catch (error) {
      toast({
        title: 'Gagal!',
        description: 'Terjadi kesalahan saat menyimpan data',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* NIPD - Search Field */}
        <FormField
          control={form.control}
          name="nipd"
          render={({ field }) => (
            <FormItem>
              <FormLabel>NIPD <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <div className="relative">
                  <Input 
                    placeholder="Ketik NIPD (7 digit)" 
                    {...field} 
                    maxLength={7}
                    className={`pr-10 ${foundSiswa === true ? 'border-emerald-400 bg-emerald-50' : foundSiswa === false ? 'border-red-400 bg-red-50' : ''}`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isSearching ? (
                      <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                    ) : foundSiswa === true ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    ) : foundSiswa === false ? (
                      <Search className="w-4 h-4 text-red-400" />
                    ) : (
                      <Search className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>
              </FormControl>
              <p className="text-xs text-slate-500 mt-1">
                {isSearching ? 'Mencari data di sheet Data...' : 'Ketik 7 digit NIPD untuk mencari data siswa'}
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Info Card - Data Siswa (Label Display) */}
        <div className={`p-4 rounded-lg border-2 transition-colors ${foundSiswa === true ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Data Siswa</span>
            {foundSiswa === true && (
              <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Data ditemukan
              </span>
            )}
          </div>
          
          {siswaData ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* NISN */}
              <div className="flex flex-col gap-1">
                <span className="text-xs text-slate-500 font-medium">NISN</span>
                <span className="text-sm font-mono text-slate-800 bg-white px-3 py-2 rounded-md border border-slate-200">
                  {siswaData.nisn || '-'}
                </span>
              </div>
              
              {/* Nama */}
              <div className="flex flex-col gap-1">
                <span className="text-xs text-slate-500 font-medium">Nama Lengkap</span>
                <span className="text-sm font-semibold text-slate-800 bg-white px-3 py-2 rounded-md border border-slate-200">
                  {siswaData.nama || '-'}
                </span>
              </div>
              
              {/* Tempat Lahir */}
              <div className="flex flex-col gap-1">
                <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Tempat Lahir
                </span>
                <span className="text-sm text-slate-800 bg-white px-3 py-2 rounded-md border border-slate-200">
                  {siswaData.tempatLahir || '-'}
                </span>
              </div>
              
              {/* Tanggal Lahir */}
              <div className="flex flex-col gap-1">
                <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Tanggal Lahir
                </span>
                <span className="text-sm text-slate-800 bg-white px-3 py-2 rounded-md border border-slate-200">
                  {siswaData.tglLahir || '-'}
                </span>
              </div>
              
              {/* Rombel */}
              <div className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-xs text-slate-500 font-medium">Rombel</span>
                <span className="text-sm text-slate-800 bg-white px-3 py-2 rounded-md border border-slate-200 inline-flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-400" />
                  {siswaData.rombel || '-'}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400">
              <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Masukkan NIPD untuk menampilkan data siswa</p>
            </div>
          )}
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
        <div className={`p-4 rounded-lg border-2 transition-colors ${!isMutasi ? 'border-red-200 bg-red-50/50' : 'border-slate-200 bg-slate-50'}`}>
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
                    id="file-upload"
                    disabled={isUploading}
                  />
                  <label 
                    htmlFor="file-upload" 
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
              <p className="text-xs text-slate-500 mt-1">File akan disimpan di Google Drive</p>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3 pt-4">
          <Button 
            type="submit" 
            className="flex-1 bg-teal-500 hover:bg-teal-600"
            disabled={isLoading || !foundSiswa}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : (
              'Simpan Data'
            )}
          </Button>
        </div>
        
        {!foundSiswa && (
          <p className="text-xs text-center text-amber-600">
            Cari data siswa dengan NIPD terlebih dahulu sebelum menyimpan
          </p>
        )}
      </form>
    </Form>
  )
}
