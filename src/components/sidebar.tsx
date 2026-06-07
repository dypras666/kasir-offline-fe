import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
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
} from "lucide-react"

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/", active: true },
  { label: "Inventori", icon: Package, href: "/inventory" },
  { label: "Hutang", icon: CreditCard, href: "/hutang" },
  { label: "Piutang", icon: HandCoins, href: "/piutang" },
  { label: "Aset", icon: Building2, href: "/aset" },
  { label: "Laporan", icon: BarChart3, href: "/laporan" },
]

export function Sidebar() {
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
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <Button
              key={item.label}
              variant={item.active ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-3",
                item.active && "font-medium"
              )}
              asChild
            >
              <a href={item.href}>
                <item.icon className="h-4 w-4" />
                {item.label}
              </a>
            </Button>
          ))}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t p-4">
        <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground">
          <Settings className="h-4 w-4" />
          Settings
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-3 text-red-500 hover:text-red-600 mt-1">
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  )
}
