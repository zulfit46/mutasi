'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { School, Lock, AlertCircle, Loader2 } from 'lucide-react'

interface LoginFormProps {
  onLogin: (password: string) => Promise<{ success: boolean; error?: string }>
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!password.trim()) {
      setError('Password harus diisi')
      return
    }

    setIsLoading(true)
    const result = await onLogin(password)
    setIsLoading(false)

    if (!result.success) {
      setError(result.error || 'Login gagal')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-white to-slate-100 p-4">
      <Card className="w-full max-w-md shadow-2xl border-slate-200">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
              <School className="w-10 h-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800">SMKN 1 Palopo</CardTitle>
          <CardDescription className="text-slate-500">
            Sistem Manajemen Mutasi Siswa
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  type="password"
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 text-lg border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-lg font-medium shadow-lg shadow-emerald-200"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Masuk'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            <p>Bagian Kesiswaan</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
