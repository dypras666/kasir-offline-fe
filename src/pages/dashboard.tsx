import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Avatar } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Wallet, 
  Clock, 
  AlertTriangle, 
  Users, 
  Plus, 
  RefreshCw, 
  ArrowRight,
  Bell,
  Check,
  Database,
  Cloud,
  TrendingUp,
  PackageCheck,
} from "lucide-react"

const recentTransactions = [
  { id: "TRX-9483", customer: "Sutrisno", status: "success", total: "1.250.000", time: "2 menit lalu" },
  { id: "TRX-9482", customer: "Budi Santoso", status: "partial", total: "4.500.000", time: "15 menit lalu" },
  { id: "TRX-9481", customer: "Warung Berkah", status: "success", total: "850.000", time: "45 menit lalu" },
  { id: "TRX-9480", customer: "Toko Maju", status: "pending", total: "2.100.000", time: "1 jam lalu" },
]

const stats = [
  { label: "Total Penjualan", value: "Rp 45.280.000", change: "+12.5%", icon: Wallet, color: "emerald" },
  { label: "Hutang Jatuh Tempo", value: "Rp 12.450.000", change: "5 Invoice", icon: Clock, color: "amber" },
  { label: "Stok Rendah", value: "Kritis", change: "8 SKU", icon: AlertTriangle, color: "red" },
  { label: "Total Customer", value: "124", change: "+3 Hari ini", icon: Users, color: "indigo" },
]

const colorMap: Record<string, { bg: string; text: string; icon: string }> = {
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600", icon: "text-emerald-600" },
  amber: { bg: "bg-amber-50", text: "text-amber-600", icon: "text-amber-600" },
  red: { bg: "bg-red-50", text: "text-red-600", icon: "text-red-600" },
  indigo: { bg: "bg-indigo-50", text: "text-indigo-600", icon: "text-indigo-600" },
}

export function DashboardPage() {
  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ringkasan Operasional</h1>
          <p className="text-sm text-muted-foreground mt-1">
            <TrendingUp className="inline h-3.5 w-3.5 mr-1 text-emerald-500" />
            Semua modul aktif — 113 test passed
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">3</span>
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Avatar src="https://ui-avatars.com/api/?name=Azzura+VN&background=6366f1&color=fff" alt="Azzura VN" fallback="AV" />
          <span className="text-sm font-medium">Azzura VN</span>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const c = colorMap[stat.color]
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${c.bg}`}>
                  <stat.icon className={`h-5 w-5 ${c.icon}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <Badge variant="outline" className="text-[10px]">{stat.change}</Badge>
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Table */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Transaksi Terakhir</CardTitle>
              <CardDescription>4 transaksi dalam 1 jam terakhir</CardDescription>
            </div>
            <Button variant="ghost" size="sm">
              Lihat Semua <ArrowRight className="ml-2 h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Transaksi</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="text-right">Waktu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-medium">{tx.id}</TableCell>
                    <TableCell>{tx.customer}</TableCell>
                    <TableCell>
                      <Badge variant={tx.status === "success" ? "success" : tx.status === "partial" ? "warning" : "secondary"}>
                        {tx.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">Rp {tx.total}</TableCell>
                    <TableCell className="text-right text-muted-foreground text-xs">{tx.time}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Quick Actions + Status */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Aksi Cepat</CardTitle>
              <CardDescription>Fitur utama dalam satu klik</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-between" size="lg">
                Input Penjualan Baru
                <Plus className="h-4 w-4" />
              </Button>
              <Button variant="outline" className="w-full justify-between" size="lg">
                Update Stok
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="outline" className="w-full justify-between" size="lg">
                Bayar Hutang
                <Check className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status Sistem</CardTitle>
              <CardDescription>Koneksi & layanan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <Database className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-medium">Database</span>
                </div>
                <Badge variant="success" className="text-[10px] gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  Online
                </Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <Cloud className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Sync Cloud</span>
                </div>
                <Badge variant="secondary" className="text-[10px]">Idle</Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <PackageCheck className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-medium">Unit Tests</span>
                </div>
                <Badge variant="success" className="text-[10px]">113 Passed</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
