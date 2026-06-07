import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Wallet, 
  Clock, 
  AlertTriangle, 
  Users, 
  Plus, 
  RefreshCw, 
  ArrowRight,
  Database,
  Cloud,
  TrendingUp,
} from "lucide-react"

const recentTransactions = [
  { id: "TRX-9483", customer: "Sutrisno", status: "success", total: "1.250.000", time: "2 menit lalu" },
  { id: "TRX-9482", customer: "Budi Santoso", status: "partial", total: "4.500.000", time: "15 menit lalu" },
  { id: "TRX-9481", customer: "Warung Berkah", status: "success", total: "850.000", time: "45 menit lalu" },
  { id: "TRX-9480", customer: "Toko Maju", status: "pending", total: "2.100.000", time: "1 jam lalu" },
]

const stats = [
  { label: "Total Penjualan", value: "Rp 45.280.000", change: "+12.5%", icon: Wallet, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { label: "Hutang Jatuh Tempo", value: "Rp 12.450.000", change: "5 Invoice", icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
  { label: "Stok Rendah", value: "Kritis", change: "8 SKU", icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/10" },
  { label: "Total Customer", value: "124", change: "+3 Hari ini", icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
]

export function DashboardPage() {
  return (
    <div className="flex flex-col gap-8 p-4 md:p-8">
      {/* Header */}
      <header className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ringkasan Operasional</h1>
          <p className="text-sm text-muted-foreground mt-1">
            <TrendingUp className="inline h-3.5 w-3.5 mr-1 text-emerald-500" />
            Semua modul aktif — 113 test passed
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

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Table */}
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Transaksi Terakhir</CardTitle>
              <CardDescription className="hidden sm:block">4 transaksi dalam 1 jam terakhir</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-xs">
              Lihat Semua <ArrowRight className="ml-2 h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="hidden md:table-cell">Status</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">Waktu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-medium">{tx.id}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{tx.customer}</span>
                          <span className="text-[10px] text-muted-foreground md:hidden">{tx.status} • {tx.time}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant={tx.status === "success" ? "secondary" : "outline"} className={tx.status === "success" ? "bg-emerald-500/10 text-emerald-500 border-none" : ""}>
                          {tx.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium whitespace-nowrap">Rp {tx.total}</TableCell>
                      <TableCell className="text-right text-muted-foreground text-xs hidden sm:table-cell">{tx.time}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions + Status */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Aksi Cepat</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <Button className="justify-between" size="lg">
                Input Penjualan
                <Plus className="h-4 w-4" />
              </Button>
              <Button variant="outline" className="justify-between" size="lg">
                Update Stok
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="outline" className="justify-between" size="lg">
                Bayar Hutang
                <ArrowRight className="h-4 w-4" />
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
