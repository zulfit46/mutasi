'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Loader2, MapPin, School, Users, Eye, Lock } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'

const apiWilayah = "https://www.emsifa.com/api-wilayah-indonesia/api";

const formSchema = z.object({
  nisn: z.string().length(10, 'NISN harus 10 karakter'),
  namaSiswa: z.string().min(3, 'Nama minimal 3 karakter'),
  provinsi: z.string().optional(),
  kabKota: z.string().optional(),
  kecamatan: z.string().optional(),
  namaSekolah: z.string().min(3, 'Nama sekolah minimal 3 karakter'),
  rombelTujuan: z.string().min(1, 'Rombel tujuan wajib dipilih'),
  ket: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface Wilayah {
  id: string
  name: string
}

interface MutasiMasukEditFormProps {
  initialData: {
    no: number
    nisn: string
    nama_siswa: string
    provinsi: string
    kab_kota: string
    kecamatan: string
    nama_sekolah: string
    rombel_tujuan: string
    ket: string
  }
  rowIndex: number
  onSuccess: () => void
}

export default function MutasiMasukEditForm({ initialData, rowIndex, onSuccess }: MutasiMasukEditFormProps) {
  const { canEditKeterangan } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingRombel, setIsLoadingRombel] = useState(true)
  const [rombelOptions, setRombelOptions] = useState<string[]>([])
  
  // Wilayah state
  const [provinces, setProvinces] = useState<Wilayah[]>([])
  const [regencies, setRegencies] = useState<Wilayah[]>([])
  const [districts, setDistricts] = useState<Wilayah[]>([])
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(true)
  const [isLoadingRegencies, setIsLoadingRegencies] = useState(false)
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false)
  
  // Store original values for display
  const [originalProvinsi, setOriginalProvinsi] = useState(initialData.provinsi || '')
  const [originalKabKota, setOriginalKabKota] = useState(initialData.kab_kota || '')
  const [originalKecamatan, setOriginalKecamatan] = useState(initialData.kecamatan || '')
  
  // Track if user has selected new values
  const [hasNewProvinsi, setHasNewProvinsi] = useState(false)
  const [hasNewKabKota, setHasNewKabKota] = useState(false)
  const [hasNewKecamatan, setHasNewKecamatan] = useState(false)
  
  const { toast } = useToast()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nisn: initialData.nisn || '',
      namaSiswa: initialData.nama_siswa || '',
      provinsi: '',
      kabKota: '',
      kecamatan: '',
      namaSekolah: initialData.nama_sekolah || '',
      rombelTujuan: initialData.rombel_tujuan || '',
      ket: initialData.ket || '',
    },
  })

  // Watch for provinsi and kabKota changes
  const selectedProvinsi = form.watch('provinsi')
  const selectedKabKota = form.watch('kabKota')

  // Fetch provinces on mount
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const res = await fetch(`${apiWilayah}/provinces.json`)
        const data = await res.json()
        setProvinces(data)
      } catch (error) {
        console.error('Error fetching provinces:', error)
      } finally {
        setIsLoadingProvinces(false)
      }
    }
    fetchProvinces()
  }, [])

  // Fetch regencies when province is selected
  useEffect(() => {
    if (selectedProvinsi && hasNewProvinsi) {
      setIsLoadingRegencies(true)
      setRegencies([])
      setDistricts([])
      form.setValue('kabKota', '')
      form.setValue('kecamatan', '')
      setHasNewKabKota(false)
      setHasNewKecamatan(false)
      
      fetch(`${apiWilayah}/regencies/${selectedProvinsi}.json`)
        .then(res => res.json())
        .then(data => {
          setRegencies(data)
        })
        .catch(error => {
          console.error('Error fetching regencies:', error)
        })
        .finally(() => {
          setIsLoadingRegencies(false)
        })
    }
  }, [selectedProvinsi, hasNewProvinsi, form])

  // Fetch districts when regency is selected
  useEffect(() => {
    if (selectedKabKota && hasNewKabKota) {
      setIsLoadingDistricts(true)
      setDistricts([])
      form.setValue('kecamatan', '')
      setHasNewKecamatan(false)
      
      fetch(`${apiWilayah}/districts/${selectedKabKota}.json`)
        .then(res => res.json())
        .then(data => {
          setDistricts(data)
        })
        .catch(error => {
          console.error('Error fetching districts:', error)
        })
        .finally(() => {
          setIsLoadingDistricts(false)
        })
    }
  }, [selectedKabKota, hasNewKabKota, form])

  // Fetch rombel options
  useEffect(() => {
    const fetchRombel = async () => {
      try {
        const response = await fetch('/api/mutasi-masuk?action=getRombel')
        const data = await response.json()
        if (data.success && data.data) {
          setRombelOptions(data.data)
        } else {
          setRombelOptions([
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
          ])
        }
      } catch (error) {
        console.error('Error fetching rombel:', error)
      } finally {
        setIsLoadingRombel(false)
      }
    }
    fetchRombel()
  }, [])

  // Get province name by id
  const getProvinceName = (id: string) => {
    const province = provinces.find(p => p.id === id)
    return province ? province.name : ''
  }

  // Get regency name by id
  const getRegencyName = (id: string) => {
    const regency = regencies.find(r => r.id === id)
    return regency ? regency.name : ''
  }

  // Get district name by id
  const getDistrictName = (id: string) => {
    const district = districts.find(d => d.id === id)
    return district ? district.name : ''
  }

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true)
    try {
      // Use new values if selected, otherwise use original values
      const provinsiName = hasNewProvinsi ? getProvinceName(data.provinsi || '') : originalProvinsi
      const kabKotaName = hasNewKabKota ? getRegencyName(data.kabKota || '') : originalKabKota
      const kecamatanName = hasNewKecamatan ? getDistrictName(data.kecamatan || '') : originalKecamatan
      
      const response = await fetch('/api/mutasi-masuk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          row: rowIndex,
          nisn: data.nisn,
          namaSiswa: data.namaSiswa,
          provinsi: provinsiName,
          kabKota: kabKotaName,
          kecamatan: kecamatanName,
          namaSekolah: data.namaSekolah,
          rombelTujuan: data.rombelTujuan,
          ket: data.ket,
        }),
      })
      
      const result = await response.json()
      
      if (!response.ok) throw new Error(result.error || 'Gagal mengupdate data')
      
      toast({
        title: 'Berhasil!',
        description: 'Data mutasi masuk berhasil diupdate',
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
            <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">Edit Mode</span>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="nisn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-slate-600">NISN <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Masukkan NISN (10 digit)" {...field} maxLength={10} className="bg-white" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="namaSiswa"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-slate-600">Nama Siswa <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Nama lengkap siswa" {...field} className="bg-white" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Alamat Asal */}
        <div className="p-4 rounded-lg border-2 border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Alamat Asal</span>
          </div>
          
          {/* Current Data Display */}
          <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-medium text-blue-700">Data Tersimpan Saat Ini:</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <span className="text-xs text-blue-600">Provinsi:</span>
                <p className="font-medium text-blue-800 truncate">{originalProvinsi || '-'}</p>
              </div>
              <div>
                <span className="text-xs text-blue-600">Kab/Kota:</span>
                <p className="font-medium text-blue-800 truncate">{originalKabKota || '-'}</p>
              </div>
              <div>
                <span className="text-xs text-blue-600">Kecamatan:</span>
                <p className="font-medium text-blue-800 truncate">{originalKecamatan || '-'}</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500 mb-3">Pilih wilayah baru jika ingin mengubah (opsional):</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="provinsi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-slate-600">Provinsi Baru</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value)
                      setHasNewProvinsi(true)
                      const prov = provinces.find(p => p.id === value)
                      if (prov) {
                        setOriginalProvinsi(prov.name)
                      }
                    }} 
                    value={field.value} 
                    disabled={isLoadingProvinces}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-white w-full">
                        <SelectValue placeholder={isLoadingProvinces ? "Memuat..." : "Pilih Provinsi Baru (opsional)"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-60">
                      {provinces.map((province) => (
                        <SelectItem key={province.id} value={province.id}>
                          {province.name}
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
              name="kabKota"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-slate-600">Kab/Kota Baru</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value)
                      setHasNewKabKota(true)
                      const reg = regencies.find(r => r.id === value)
                      if (reg) {
                        setOriginalKabKota(reg.name)
                      }
                    }} 
                    value={field.value} 
                    disabled={isLoadingRegencies || !hasNewProvinsi}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-white w-full">
                        <SelectValue placeholder={
                          !hasNewProvinsi ? "Pilih provinsi dulu" :
                          isLoadingRegencies ? "Memuat..." : "Pilih Kab/Kota Baru (opsional)"
                        } />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-60">
                      {regencies.map((regency) => (
                        <SelectItem key={regency.id} value={regency.id}>
                          {regency.name}
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
              name="kecamatan"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel className="text-xs text-slate-600">Kecamatan Baru</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value)
                      setHasNewKecamatan(true)
                      const dist = districts.find(d => d.id === value)
                      if (dist) {
                        setOriginalKecamatan(dist.name)
                      }
                    }} 
                    value={field.value} 
                    disabled={isLoadingDistricts || !hasNewKabKota}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-white w-full">
                        <SelectValue placeholder={
                          !hasNewKabKota ? "Pilih kab/kota dulu" :
                          isLoadingDistricts ? "Memuat..." : "Pilih Kecamatan Baru (opsional)"
                        } />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-60">
                      {districts.map((district) => (
                        <SelectItem key={district.id} value={district.id}>
                          {district.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Asal Sekolah & Rombel */}
        <div className="p-4 rounded-lg border-2 border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2 mb-3">
            <School className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Asal Sekolah & Penempatan</span>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="namaSekolah"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-slate-600">Nama Sekolah Asal <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Nama sekolah asal" {...field} className="bg-white" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="rombelTujuan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-slate-600">Rombel Tujuan <span className="text-red-500">*</span></FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingRombel}>
                    <FormControl>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder={isLoadingRombel ? "Memuat..." : "Pilih rombel tujuan"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {rombelOptions.map((rombel) => (
                        <SelectItem key={rombel} value={rombel}>
                          {rombel}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

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
            className="flex-1 bg-emerald-500 hover:bg-emerald-600"
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
