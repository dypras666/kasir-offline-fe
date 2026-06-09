import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useTheme } from "@/contexts/ThemeContext"
import { useAuth } from "@/contexts/AuthContext"
import {
  LayoutDashboard,
  Package,
  CreditCard,
  HandCoins,
  Building2,
  BarChart3,
  BookOpen,
  LogOut,
  Store,
  Menu,
  X,
  Sun,
  Moon,
  User,
  Users,
  Landmark,
  Truck,
  Contact,
  Warehouse,
  ShoppingCart,
  Layers,
  RefreshCw,
  ArrowLeftRight,
  AlertTriangle,
  Wallet,
  ChevronDown,
  ChevronRight,
  ClipboardList,
} from "lucide-react"

const mainItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Hutang", icon: CreditCard, href: "/hutang" },
  { label: "Piutang", icon: HandCoins, href: "/piutang" },
  { label: "Aset", icon: Building2, href: "/aset" },
  { label: "Akuntansi", icon: BookOpen, href: "/akuntansi" },
  { label: "Laporan", icon: BarChart3, href: "/laporan" },
]

const masterDataItems = [
  { label: "Produk", icon: Package, href: "/produk" },
  { label: "Satuan", icon: Layers, href: "/satuan" },
  { label: "Multi Satuan", icon: Layers, href: "/multi-satuan" },
  { label: "Stok", icon: ClipboardList, href: "/stok" },
  { label: "Pembelian", icon: ShoppingCart, href: "/purchasing" },
  { label: "Stok Opname", icon: RefreshCw, href: "/stok-opname" },
  { label: "Mutasi Stok", icon: ArrowLeftRight, href: "/mutasi-stok" },
  { label: "Lost Inventory", icon: AlertTriangle, href: "/lost-inventory" },
  { label: "Supplier", icon: Truck, href: "/supplier" },
  { label: "Pelanggan", icon: Contact, href: "/pelanggan" },
  { label: "Gudang", icon: Warehouse, href: "/gudang" },
]

const adminItems = [
  { label: "Cabang", icon: Store, href: "/cabang" },
  { label: "Akun (COA)", icon: Landmark, href: "/akun" },
  { label: "Metode Bayar", icon: Wallet, href: "/metode-pembayaran" },
  { label: "Pengguna", icon: Users, href: "/pengguna" },
]

function SidebarNav({ onNavClick }: { onNavClick?: () => void }) {
  const location = useLocation()
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/'
    return location.pathname.startsWith(href)
  }

  // Determine initial state based on active path
  const isMasterDataActive = masterDataItems.some(item => isActive(item.href))
  const isAdminActive = adminItems.some(item => isActive(item.href))

  const [masterOpen, setMasterOpen] = useState(isMasterDataActive || false)
  const [adminOpen, setAdminOpen] = useState(isAdminActive || false)

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-14 items-center gap-3 border-b px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <Store className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-lg font-bold tracking-tight">KOS</span>
      </div>

      {/* Nav */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          {mainItems.map((item) => (
            <Button
              key={item.href}
              variant={isActive(item.href) ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-3",
                isActive(item.href) && "font-medium"
              )}
              asChild
              onClick={onNavClick}
            >
              <Link to={item.href}>
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            </Button>
          ))}
        </nav>

        {/* Master Data section */}
        <div className="mt-4">
          <div 
            className="flex items-center justify-between mb-1 px-3 py-1 cursor-pointer group"
            onClick={() => setMasterOpen(!masterOpen)}
          >
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">
              Master Data
            </p>
            {masterOpen ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground" />
            )}
          </div>
          {masterOpen && (
            <nav className="flex flex-col gap-1">
              {masterDataItems.map((item) => (
                <Button
                  key={item.href}
                  variant={isActive(item.href) ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3",
                    isActive(item.href) && "font-medium"
                  )}
                  asChild
                  onClick={onNavClick}
                >
                  <Link to={item.href}>
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </Button>
              ))}
            </nav>
          )}
        </div>

        {/* Admin section */}
        <div className="mt-4">
          <div 
            className="flex items-center justify-between mb-1 px-3 py-1 cursor-pointer group"
            onClick={() => setAdminOpen(!adminOpen)}
          >
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">
              Admin
            </p>
            {adminOpen ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground" />
            )}
          </div>
          {adminOpen && (
            <nav className="flex flex-col gap-1">
              {adminItems.map((item) => (
                <Button
                  key={item.href}
                  variant={isActive(item.href) ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3",
                    isActive(item.href) && "font-medium"
                  )}
                  asChild
                  onClick={onNavClick}
                >
                  <Link to={item.href}>
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </Button>
              ))}
            </nav>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t p-4 space-y-2 shrink-0">
        {user && (
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        )}

        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {theme === "dark" ? "Mode Terang" : "Mode Gelap"}
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
          onClick={() => { logout(); onNavClick?.(); }}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  )
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r bg-card">
        <SidebarNav />
      </aside>

      {/* Mobile sheet */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-72 bg-card shadow-xl lg:hidden animate-in slide-in-from-left">
            <div className="flex justify-end p-2">
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <SidebarNav onNavClick={() => setMobileOpen(false)} />
          </div>
        </>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b bg-card px-4 lg:px-6 lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            <span className="font-bold">KOS</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-9 w-9"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            {user && (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-muted/10">
          {children}
        </main>
      </div>
    </div>
  )
}

export { SidebarNav }
