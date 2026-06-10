import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/api"
import { useShowFilters } from "@/hooks/useShowFilters"
import { Loader2, Search, CreditCard, ArrowUpRight, Calendar, SlidersHorizontal, X } from "lucide-react"
import { formatDate } from "@/lib/date"


interface PaymentMethod {
  id: number
  name: string
}

interface SupplierOption {
  id: number
  name: string
}

interface PayableItem {
  id: number
  invoice_number: string
  date: string
  due_date: string
  amount: string
  paid_amount: string
  status: string
  supplier: SupplierOption | null
  payments: Array<{ id: number; amount: string; payment_method: string }>
}

export function HutangPage() {
  const [items, setItems] = useState<PayableItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [showFilters, toggleFilters] = useShowFilters(true)
  const [filters, setFilters] = useState({
    start_date: "",
    end_date: "",
    status: "all"
  })
  const [payOpen, setPayOpen] = useState(false)
  const [payItem, setPayItem] = useState<PayableItem | null>(null)
  const [payAmount, setPayAmount] = useState("")
  const [payMethodId, setPayMethodId] = useState("")
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [saving, setSaving] = useState(false)

  const loadData = () => {
    setLoading(true)
    api.get<{ data: PayableItem[] }>("/payables")
      .then(r => setItems(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
    api.get<{ data: PaymentMethod[] }>("/payment-methods")
      .then(r => setPaymentMethods(r.data || []))
      .catch(() => {})
  }, [])

  const handlePay = async () => {
    if (!payItem || !payAmount) return
    setSaving(true)
    try {
      const payload: any = {
        amount: Number(payAmount)
      }
      if (payMethodId) payload.payment_method_id = Number(payMethodId)

      await api.post(`/payables/${payItem.id}/pay`, payload)
      setPayOpen(false)
      setPayItem(null)
      setPayAmount("")
      setPayMethodId("")
      loadData()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const resetFilters = () => {
    setFilters({ start_date: "", end_date: "", status: "all" })
    setSearch("")
  }

  const filtered = items.filter(i => {
    const matchSearch = i.supplier?.name?.toLowerCase().includes(search.toLowerCase()) || 
                        i.invoice_number?.toLowerCase().includes(search.toLowerCase())

    let matchStatus = true
    if (filters.status !== "all") {
      matchStatus = i.status === filters.status
    }

    let matchDate = true
    if (filters.start_date || filters.end_date) {
      const itemDate = new Date(i.date)
      if (filters.start_date) {
        matchDate = matchDate && itemDate >= new Date(filters.start_date)
      }
      if (filters.end_date) {
        const endDate = new Date(filters.end_date)
        endDate.setHours(23, 59, 59, 999) // include whole day
        matchDate = matchDate && itemDate <= endDate
      }
    }

    return matchSearch && matchStatus && matchDate
  })

  const totalHutang = items.reduce((acc, curr) => acc + Number(curr.amount), 0)
  const sudahDibayar = items.reduce((acc, curr) => acc + Number(curr.paid_amount), 0)
  const belumDibayar = totalHutang - sudahDibayar

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { unpaid: "bg-red-500/10 text-red-500", partial: "bg-amber-500/10 text-amber-500", paid: "bg-emerald-500/10 text-emerald-500", overdue: "bg-rose-600/10 text-rose-600" }
    return map[s] || "bg-gray-500/10 text-gray-500"
  }

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manajemen Hutang</h1>
          <p className="text-sm text-muted-foreground">{items.length} hutang tercatat</p>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-blue-200 dark:border-blue-900 shadow-sm">
          <CardHeader className="pb-1"><CardTitle className="text-xs font-medium text-muted-foreground">Total Hutang</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-blue-600">Rp {totalHutang.toLocaleString('id-ID')}</p></CardContent>
        </Card>
        <Card className="border-emerald-200 dark:border-emerald-900 shadow-sm">
          <CardHeader className="pb-1"><CardTitle className="text-xs font-medium text-muted-foreground">Sudah Dibayar</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-emerald-600">Rp {sudahDibayar.toLocaleString('id-ID')}</p></CardContent>
        </Card>
        <Card className="border-red-200 dark:border-red-900 shadow-sm">
          <CardHeader className="pb-1"><CardTitle className="text-xs font-medium text-muted-foreground">Belum Dibayar</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-red-600">Rp {belumDibayar.toLocaleString('id-ID')}</p></CardContent>
        </Card>
      </div>

      {/* Filter Controls */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-muted-foreground">Filter & Cari</h3>
            <Button variant="ghost" size="sm" onClick={toggleFilters} className="h-8 text-xs">
              <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" />
              {showFilters ? "Sembunyikan" : "Tampilkan"} Filter
            </Button>
          </div>
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap items-center gap-3 mt-2">
              <div className="relative w-full lg:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Cari invoice/supplier..." className="pl-9 h-9 text-xs" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>

              <div className="flex items-center gap-2 border rounded-md px-2 py-1 bg-muted/20 w-full lg:w-auto">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Input type="date" className="h-8 flex-1 lg:w-32 border-0 bg-transparent focus-visible:ring-0 text-xs" value={filters.start_date} onChange={e => setFilters({...filters, start_date: e.target.value})} />
                <span className="text-xs text-muted-foreground">s/d</span>
                <Input type="date" className="h-8 flex-1 lg:w-32 border-0 bg-transparent focus-visible:ring-0 text-xs" value={filters.end_date} onChange={e => setFilters({...filters, end_date: e.target.value})} />
              </div>

              <select className="flex h-9 w-full lg:w-44 rounded-md border border-input bg-background px-3 py-1 text-xs" value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
                <option value="all">Semua Status</option>
                <option value="unpaid">Belum Dibayar (Unpaid)</option>
                <option value="partial">Parsial (Sebagian)</option>
                <option value="paid">Lunas (Paid)</option>
                <option value="overdue">Jatuh Tempo</option>
              </select>

              <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground hover:text-red-500 w-full lg:w-auto justify-center"><X className="h-4 w-4 mr-1" /> Reset</Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0 border-t">
          {filtered.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{search || filters.start_date || filters.end_date || filters.status !== "all" ? "Tidak ditemukan" : "Belum ada hutang"}</p>
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((item) => {
                const remaining = Number(item.amount) - Number(item.paid_amount)
                return (
                  <div key={item.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{item.supplier?.name || 'Tanpa Supplier'}</span>
                        <Badge className={`${statusBadge(item.status)} border-none text-[10px]`}>{item.status}</Badge>
                        {item.invoice_number && <span className="text-xs text-muted-foreground shrink-0">#{item.invoice_number}</span>}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Rp {Number(item.amount).toLocaleString('id-ID')}
                        {remaining > 0 ? ` | Sisa: Rp ${remaining.toLocaleString('id-ID')}` : ''}
                        {item.due_date ? ` | Jatuh tempo: ${formatDate(item.due_date)}` : ''}
                      </div>
                    </div>
                    <div className="flex gap-1 ml-4 shrink-0">
                      {item.status !== 'paid' && remaining > 0 && (
                        <Button variant="outline" size="sm" className="text-xs" onClick={() => { 
                          setPayItem(item); 
                          setPayAmount(String(remaining)); 
                          setPayMethodId("");
                          setPayOpen(true);
                        }}>
                          <ArrowUpRight className="h-3 w-3 mr-1" /> Bayar
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bayar Dialog */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Bayar Hutang</DialogTitle></DialogHeader>
          {payItem && (
            <div className="grid gap-4 py-4">
              <div className="text-sm space-y-1">
                <p><strong>Supplier:</strong> {payItem.supplier?.name}</p>
                <p><strong>Invoice:</strong> #{payItem.invoice_number}</p>
                <p><strong>Sisa:</strong> Rp {(Number(payItem.amount) - Number(payItem.paid_amount)).toLocaleString('id-ID')}</p>
              </div>
              <div className="space-y-2">
                <Label>Jumlah Bayar</Label>
                <Input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Metode Pembayaran</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  value={payMethodId}
                  onChange={(e) => setPayMethodId(e.target.value)}
                >
                  <option value="">Pilih Metode...</option>
                  {paymentMethods.map(pm => (
                    <option key={pm.id} value={pm.id}>{pm.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <Button variant="outline" onClick={() => setPayOpen(false)}>Batal</Button>
                <Button onClick={handlePay} disabled={saving || !payAmount || Number(payAmount) <= 0}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null} Bayar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
