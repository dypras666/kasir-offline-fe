import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Wallet,
  Clock,
  AlertTriangle,
  Users,
  Database,
  Cloud,
  TrendingUp,
  Loader2,
  Package,
  Building2,
  FileText,
  Ruler,
  Warehouse,
  PlusCircle,
} from "lucide-react"
import { api } from "@/lib/api"
import { formatMultiSatuan } from "@/lib/multi-unit"

// Backend shape
interface DashboardJson {
  stats: {
    total_branches: number
    total_users: number
    total_products: number
    total_customers: number
    total_accounts: number
    total_fixed_assets: number
    total_assets: number
    total_equity: number
    payable_outstanding: number
    payable_overdue: number
    receivable_outstanding: number
    receivable_overdue: number
  }
  recent_sales: Array<{
    id: number
    reference_no: string
    description: string
    total: number
    date: string
    branch: string | null
  }>
  low_stock_products: Array<{
    id: number
    name: string
    sku: string
    stock: number
    multi_unit?: Array<{ name: string; conversion: number }>
    unit_name?: string
  }>
}

function formatRupiah(n: number): string {
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)} jt`
  return `Rp ${n.toLocaleString('id-ID')}`
}

export function DashboardPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<DashboardJson | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.get<DashboardJson>('/dashboard')
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertTriangle className="h-12 w-12 text-red-500" />
        <p className="text-muted-foreground">Gagal memuat data: {error}</p>
        <Button onClick={() => window.location.reload()}>Coba Lagi</Button>
      </div>
    )
  }

  const s = data!.stats
  const stats = [
    { label: "Total Aset", value: formatRupiah(s.total_assets), change: `${s.total_fixed_assets} Aset Tetap`, icon: Wallet, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Hutang Jatuh Tempo", value: formatRupiah(s.payable_overdue), change: `Total ${formatRupiah(s.payable_outstanding)}`, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Piutang Jatuh Tempo", value: formatRupiah(s.receivable_overdue), change: `Total ${formatRupiah(s.receivable_outstanding)}`, icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/10" },
    { label: "Total Pelanggan", value: `${s.total_customers}`, change: `${s.total_products} Produk`, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
  ]

  const summaryCards = [
    { label: "Cabang", value: s.total_branches, icon: Building2, color: "text-violet-500", bg: "bg-violet-500/10" },
    { label: "Produk", value: s.total_products, icon: Package, color: "text-cyan-500", bg: "bg-cyan-500/10" },
    { label: "Akun (COA)", value: s.total_accounts, icon: FileText, color: "text-rose-500", bg: "bg-rose-500/10" },
    { label: "Pengguna", value: s.total_users, icon: Users, color: "text-indigo-500", bg: "bg-indigo-500/10" },
  ]

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8">
      {/* Header */}
      <header className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ringkasan Operasional</h1>
          <p className="text-sm text-muted-foreground mt-1">
            <TrendingUp className="inline h-3.5 w-3.5 mr-1 text-emerald-500" />
            Data real-time per cabang
          </p>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <Badge variant="outline" className="text-[10px]">{stat.change}</Badge>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Row */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.bg}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Sales */}
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Transaksi Terakhir</CardTitle>
              <CardDescription className="hidden sm:block">
                {(data?.recent_sales?.length ?? 0)} transaksi terbaru
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Ref</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">Tanggal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.recent_sales?.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-medium font-mono text-xs">{tx.reference_no}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{tx.description}</span>
                          {tx.branch && <span className="text-[10px] text-muted-foreground">{tx.branch}</span>}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium whitespace-nowrap">{formatRupiah(tx.total)}</TableCell>
                      <TableCell className="text-right text-muted-foreground text-xs hidden sm:table-cell">{tx.date}</TableCell>
                    </TableRow>
                  ))}
                  {(!data?.recent_sales || data.recent_sales.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        Belum ada transaksi
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Low Stock + Quick Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Stok Rendah</CardTitle>
              <CardDescription>Produk ≤ 5 unit</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data?.low_stock_products?.map((p) => (
                  <div key={p.id} className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{p.name}</span>
                      <span className="text-[10px] text-muted-foreground">{p.sku}</span>
                    </div>
                    <Badge variant={p.stock <= 0 ? "destructive" : "outline"} className="text-[10px] font-mono">
                      {formatMultiSatuan(p.stock, p.multi_unit, p.unit_name || "Pcs")}
                    </Badge>
                  </div>
                ))}
                {(!data?.low_stock_products || data.low_stock_products.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">Semua stok aman</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Master Data</CardTitle>
              <CardDescription>Kelola data utama</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Button className="justify-between" size="lg" onClick={() => navigate('/produk')}>
                Data Produk
                <Package className="h-4 w-4" />
              </Button>
              <Button variant="outline" className="justify-between" size="lg" onClick={() => navigate('/multi-satuan')}>
                Multi Satuan
                <Ruler className="h-4 w-4" />
              </Button>
              <Button variant="outline" className="justify-between" size="lg" onClick={() => navigate('/cabang')}>
                Cabang
                <Building2 className="h-4 w-4" />
              </Button>
              <Button variant="outline" className="justify-between" size="lg" onClick={() => navigate('/gudang')}>
                Gudang
                <Warehouse className="h-4 w-4" />
              </Button>
              <Button variant="outline" className="justify-between" size="lg" onClick={() => navigate('/supplier')}>
                Supplier
                <PlusCircle className="h-4 w-4" />
              </Button>
              <Button variant="outline" className="justify-between" size="lg" onClick={() => navigate('/pelanggan')}>
                Pelanggan
                <Users className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status Sistem</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <Database className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-medium">Database</span>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[10px]">Online</Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <Cloud className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Sync Cloud</span>
                </div>
                <Badge variant="secondary" className="text-[10px]">Idle</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
