import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api"
import { Loader2, BookOpen, CheckCircle2, AlertTriangle } from "lucide-react"
import { formatDate } from "@/lib/date"


interface ClosingItem {
  id: number
  year: number
  status: string
  closed_at: string
  created_at: string
}

export function AkuntansiPage() {
  const [closings, setClosings] = useState<ClosingItem[]>([])
  const [loadingClosings, setLoadingClosings] = useState(true)
  const [closing, setClosing] = useState(false)
  const [year, setYear] = useState(new Date().getFullYear().toString())
  const [result, setResult] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  const loadClosings = () => {
    setLoadingClosings(true)
    api.get<{ data: ClosingItem[] }>("/closings")
      .then(r => setClosings(r.data || []))
      .catch(() => {})
      .finally(() => setLoadingClosings(false))
  }

  useEffect(loadClosings, [])

  const handleCloseBook = async () => {
    if (!confirm(`Tutup buku untuk tahun ${year}? Semua jurnal periode ini akan dikunci.`)) return
    setClosing(true)
    setResult(null)
    try {
      await api.post<ClosingItem>("/closings", { year: Number(year) })
      setResult({ type: 'success', message: `Buku tahun ${year} berhasil ditutup.` })
      loadClosings()
    } catch (err: any) {
      setResult({ type: 'error', message: err.message || "Gagal menutup buku" })
    } finally {
      setClosing(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Modul Akuntansi</h1>
        <p className="text-sm text-muted-foreground">Proses akhir periode dan manajemen jurnal.</p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Tutup Buku (Tahunan)
            </CardTitle>
            <CardDescription>
              Tutup semua transaksi untuk tahun tertentu. Periode yang sudah ditutup tidak bisa diedit.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tahun</Label>
              <Input type="number" value={year} onChange={(e) => setYear(e.target.value)} min={2020} max={2099} />
            </div>

            {result && (
              <div className={`flex items-start gap-3 p-3 rounded-lg text-sm ${
                result.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
              }`}>
                {result.type === 'success' ? <CheckCircle2 className="h-4 w-4 mt-0.5" /> : <AlertTriangle className="h-4 w-4 mt-0.5" />}
                <p>{result.message}</p>
              </div>
            )}

            <Button className="w-full" onClick={handleCloseBook} disabled={closing}>
              {closing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Tutup Buku
            </Button>
          </CardContent>
        </Card>

        {/* Riwayat Tutup Buku */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Riwayat Penutupan</CardTitle>
            <CardDescription>Tahun-tahun yang sudah ditutup</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingClosings ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : closings.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Belum ada penutupan buku.</p>
            ) : (
              <div className="divide-y">
                {closings.map(c => (
                  <div key={c.id} className="flex items-center justify-between py-2">
                    <span className="text-sm font-medium">{c.year}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant={c.status === 'closed' ? 'default' : 'secondary'} className="text-[10px]">{c.status}</Badge>
                      <span className="text-xs text-muted-foreground">{formatDate(c.closed_at || c.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
