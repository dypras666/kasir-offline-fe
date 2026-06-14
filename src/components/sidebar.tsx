import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useLocation, Link } from "react-router-dom"
import {
  LayoutDashboard,
  Package,
  CreditCard,
  HandCoins,
  Building2,
  BarChart3,
  Settings,
  LogOut,
  Store,
  Users,
  BookOpen,
  Landmark,
  ShoppingCart,
  RefreshCw,
  ArrowLeftRight,
  AlertTriangle,
  RotateCcw,
  Layers,
} from "lucide-react"

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Produk", icon: Package, href: "/produk" },
  { label: "Multi Satuan", icon: Layers, href: "/multi-satuan" },
  { label: "Pembelian", icon: ShoppingCart, href: "/purchasing" },
  { label: "Stok Opname", icon: RefreshCw, href: "/stok-opname" },
  { label: "Mutasi Stok", icon: ArrowLeftRight, href: "/mutasi-stok" },
  { label: "Lost Inventory", icon: AlertTriangle, href: "/lost-inventory" },
  { label: "Retur Penjualan", icon: RotateCcw, href: "/sale-return" },
  { label: "Hutang", icon: CreditCard, href: "/hutang" },
  { label: "Piutang", icon: HandCoins, href: "/piutang" },
  { label: "Aset", icon: Building2, href: "/aset" },
  { label: "Akuntansi", icon: BookOpen, href: "/akuntansi" },
  { label: "Laporan", icon: BarChart3, href: "/laporan" },
]

const adminItems = [
  { label: "Gudang", icon: Building2, href: "/gudang" },
  { label: "Cabang", icon: Store, href: "/cabang" },
  { label: "Supplier", icon: Users, href: "/supplier" },
  { label: "Pelanggan", icon: Users, href: "/pelanggan" },
  { label: "Akun (COA)", icon: Landmark, href: "/akun" },
  { label: "Pengguna", icon: Users, href: "/pengguna" },
  { label: "Pengaturan", icon: Settings, href: "/settings" },
]

export function Sidebar() {
  const location = useLocation()
  
  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex h-14 items-center gap-3 border-b px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <Store className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-lg font-bold tracking-tight">KOS</span>
      </div>

      {/* Nav */}
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="mb-4">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Menu Utama
          </p>
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = item.href === '/dashboard'
                ? location.pathname === '/dashboard'
                : location.pathname.startsWith(item.href)
              return (
                <Button
                  key={item.label}
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3",
                    isActive && "font-medium"
                  )}
                  asChild
                >
                  <Link to={item.href}>
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </Button>
              )
            })}
          </nav>
        </div>

        <div className="mb-4">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Master & Admin
          </p>
          <nav className="flex flex-col gap-1">
            {adminItems.map((item) => {
              const isActive = item.href === '/dashboard'
                ? location.pathname === '/dashboard'
                : location.pathname.startsWith(item.href)
              return (
                <Button
                  key={item.label}
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3",
                    isActive && "font-medium"
                  )}
                  asChild
                >
                  <Link to={item.href}>
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </Button>
              )
            })}
          </nav>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t p-4">
        <Button variant="ghost" className="w-full justify-start gap-3 text-red-500 hover:text-red-600">
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  )
}
