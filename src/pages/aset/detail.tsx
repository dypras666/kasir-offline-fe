import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api"
import { Loader2, ArrowLeft, Building2, Clock, DollarSign, Layers } from "lucide-react"
import { formatDate } from "@/lib/date"


interface AssetItem {
  id: number
  code: string
  name: string
  category: string
  purchase_date: string
  purchase_price: string
  salvage_value: string
  quantity: number
  unit_name: string
  useful_life_months: number
  status: string
  branch: { id: number; name: string } | null
  warehouse: { id: number; name: string } | null
  location_name: string
  total_purchase: number
  monthly_depreciation?: number
  accumulated_depreciation?: number
  net_book_value?: number
}

const statusBadge = (s: string) => {
  const map: Record<string, string> = { active: "bg-emerald-500/10 text-emerald-500", depreciated: "bg-blue-500/10 text-blue-500", disposed: "bg-red-500/10 text-red-500", service: "bg-amber-500/10 text-amber-500", lost: "bg-gray-600/10 text-gray-600", damaged: "bg-rose-600/10 text-rose-600" }
  return map[s] || "bg-gray-500/10 text-gray-500"
}

const formatRp = (v: number) => `Rp ${v.toLocaleString('id-ID')}`

export function AsetDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [item, setItem] = useState<AssetItem | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    api.get<{ data: AssetItem }>(`/fixed-assets/${id}`)
      .then(r => {
        // show endpoint returns wrapped differently
        setItem(r.data || r as any)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  if (!item) return <div className="flex items-center justify-center h-[60vh] text-muted-foreground">Aset tidak ditemukan</div>

  const monthlyDep = item.useful_life_months > 0
    ? (Number(item.purchase_price) - Number(item.salvage_value || 0)) / item.useful_life_months
    : 0

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-h-full overflow-y-auto">
      <header className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/aset')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{item.name}</h1>
            <Badge className={`${statusBadge(item.status)} border-none text-xs`}>{item.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{item.code} · {item.category}</p>
        </div>
      </header>

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Harga Perolehan</p>
              <p className="text-lg font-bold">{formatRp(Number(item.purchase_price))}</p>
              {item.quantity > 1 && <p className="text-[10px] text-muted-foreground">x{item.quantity} = {formatRp(Number(item.total_purchase))}</p>}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Masa Manfaat</p>
              <p className="text-lg font-bold">{item.useful_life_months} bln</p>
              <p className="text-[10px] text-muted-foreground">Peny: Rp {Math.round(monthlyDep).toLocaleString('id-ID')}/bln</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
              <Layers className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Nilai Buku Bersih</p>
              <p className="text-lg font-bold">{formatRp(item.net_book_value ?? 0)}</p>
              <p className="text-[10px] text-muted-foreground">Akum. Peny: {formatRp(item.accumulated_depreciation ?? 0)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <Building2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Lokasi</p>
              <p className="text-lg font-bold truncate">{item.location_name !== '-' ? item.location_name : 'Pusat'}</p>
              <p className="text-[10px] text-muted-foreground">{formatDate(item.purchase_date)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detail Info */}
      <Card>
        <CardHeader><CardTitle className="text-base">Informasi Aset</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div className="flex justify-between sm:block">
              <dt className="text-muted-foreground">Kode</dt>
              <dd className="font-medium sm:mt-0.5">{item.code}</dd>
            </div>
            <div className="flex justify-between sm:block">
              <dt className="text-muted-foreground">Kategori</dt>
              <dd className="font-medium sm:mt-0.5">{item.category}</dd>
            </div>
            <div className="flex justify-between sm:block">
              <dt className="text-muted-foreground">Jumlah</dt>
              <dd className="font-medium sm:mt-0.5">{item.quantity} {item.unit_name || 'unit'}</dd>
            </div>
            <div className="flex justify-between sm:block">
              <dt className="text-muted-foreground">Nilai Residu</dt>
              <dd className="font-medium sm:mt-0.5">{formatRp(Number(item.salvage_value || 0))}</dd>
            </div>
            <div className="flex justify-between sm:block">
              <dt className="text-muted-foreground">Tgl Perolehan</dt>
              <dd className="font-medium sm:mt-0.5">{formatDate(item.purchase_date)}</dd>
            </div>
            <div className="flex justify-between sm:block">
              <dt className="text-muted-foreground">Status</dt>
              <dd className="font-medium sm:mt-0.5">{item.status}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}
