'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Loader2, MapPin, School, Users } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const apiWilayah = "https://www.emsifa.com/api-wilayah-indonesia/api";

const formSchema = z.object({
  nisn: z.string().length(10, 'NISN harus 10 karakter'),
  namaSiswa: z.string().min(3, 'Nama minimal 3 karakter'),
  provinsi: z.string().min(1, 'Provinsi wajib dipilih'),
  kabKota: z.string().min(1, 'Kabupaten/Kota wajib dipilih'),
  kecamatan: z.string().min(1, 'Kecamatan wajib dipilih'),
  namaSekolah: z.string().min(3, 'Nama sekolah minimal 3 karakter'),
  rombelTujuan: z.string().min(1, 'Rombel tujuan wajib dipilih'),
})

type FormValues = z.infer<typeof formSchema>

interface Wilayah {
  id: string
  name: string
}

interface MutasiMasukFormProps {
  onSuccess: () => void
}

export default function MutasiMasukForm({ onSuccess }: MutasiMasukFormProps) {
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
  
  const { toast } = useToast()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nisn: '',
      namaSiswa: '',
      provinsi: '',
      kabKota: '',
      kecamatan: '',
      namaSekolah: '',
      rombelTujuan: '',
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

  // Fetch rombel options dari sheet walikelas
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
      } finally {
        setIsLoadingRombel(false)
      }
    }
    fetchRombel()
  }, [])

  // Fetch regencies when province changes
  useEffect(() => {
    if (selectedProvinsi) {
      setIsLoadingRegencies(true)
      setRegencies([])
      setDistricts([])
      form.setValue('kabKota', '')
      form.setValue('kecamatan', '')
      
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
  }, [selectedProvinsi, form])

  // Fetch districts when regency changes
  useEffect(() => {
    if (selectedKabKota) {
      setIsLoadingDistricts(true)
      setDistricts([])
      form.setValue('kecamatan', '')
      
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
  }, [selectedKabKota, form])

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
      // Get names from IDs
      const provinsiName = getProvinceName(data.provinsi)
      const kabKotaName = getRegencyName(data.kabKota)
      const kecamatanName = getDistrictName(data.kecamatan)
      
      const response = await fetch('/api/mutasi-masuk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nisn: data.nisn,
          namaSiswa: data.namaSiswa,
          provinsi: provinsiName,
          kabKota: kabKotaName,
          kecamatan: kecamatanName,
          namaSekolah: data.namaSekolah,
          rombelTujuan: data.rombelTujuan,
        }),
      })
      
      const result = await response.json()
      
      if (!response.ok) throw new Error(result.error || 'Gagal menyimpan data')
      
      toast({
        title: 'Berhasil!',
        description: result.message || 'Data mutasi masuk berhasil disimpan',
      })
      form.reset()
      setRegencies([])
      setDistricts([])
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
        {/* Info Card - Data Siswa */}
        <div className="p-4 rounded-lg border-2 border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Data Siswa Baru</span>
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="provinsi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-slate-600">Provinsi <span className="text-red-500">*</span></FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingProvinces}>
                    <FormControl>
                      <SelectTrigger className="bg-white w-full">
                        <SelectValue placeholder={isLoadingProvinces ? "Memuat..." : "Pilih Provinsi"} />
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
                  <FormLabel className="text-xs text-slate-600">Kab/Kota <span className="text-red-500">*</span></FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingRegencies || !selectedProvinsi}>
                    <FormControl>
                      <SelectTrigger className="bg-white w-full">
                        <SelectValue placeholder={
                          !selectedProvinsi ? "Pilih provinsi dulu" :
                          isLoadingRegencies ? "Memuat..." : "Pilih Kab/Kota"
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
                  <FormLabel className="text-xs text-slate-600">Kecamatan <span className="text-red-500">*</span></FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingDistricts || !selectedKabKota}>
                    <FormControl>
                      <SelectTrigger className="bg-white w-full">
                        <SelectValue placeholder={
                          !selectedKabKota ? "Pilih kab/kota dulu" :
                          isLoadingDistricts ? "Memuat..." : "Pilih Kecamatan"
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
              'Simpan Data'
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
