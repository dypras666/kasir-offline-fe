import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/api"
import { Loader2, Search, HandCoins, ArrowDownLeft } from "lucide-react"

interface PaymentMethod {
  id: number
  name: string
}

interface PiutangItem {
  id: number
  invoice_number: string
  date: string
  due_date: string
  total_amount: string
  paid_amount: string
  status: string
  customer: { id: number; name: string } | null
  payments: Array<{ id: number; amount: string }>
}

export function PiutangPage() {
  const [items, setItems] = useState<PiutangItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [collectOpen, setCollectOpen] = useState(false)
  const [collectItem, setCollectItem] = useState<PiutangItem | null>(null)
  const [collectAmount, setCollectAmount] = useState("")
  const [payMethodId, setPayMethodId] = useState("")
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [saving, setSaving] = useState(false)

  const loadData = () => {
    setLoading(true)
    api.get<{ data: PiutangItem[] }>("/receivables")
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

  const handleCollect = async () => {
    if (!collectItem || !collectAmount) return
    setSaving(true)
    try {
      const payload: any = {
        amount: Number(collectAmount)
      }
      if (payMethodId) payload.payment_method_id = Number(payMethodId)

      await api.post(`/receivables/${collectItem.id}/receive-payment`, payload)
      setCollectOpen(false)
      setCollectItem(null)
      setCollectAmount("")
      setPayMethodId("")
      loadData()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const filtered = items.filter(i =>
    i.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
    i.invoice_number?.toLowerCase().includes(search.toLowerCase())
  )

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { unpaid: "bg-red-500/10 text-red-500", partial: "bg-amber-500/10 text-amber-500", paid: "bg-emerald-500/10 text-emerald-500", overdue: "bg-rose-600/10 text-rose-600" }
    return map[s] || "bg-gray-500/10 text-gray-500"
  }

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manajemen Piutang</h1>
          <p className="text-sm text-muted-foreground">{items.length} piutang tercatat</p>
        </div>
      </header>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Cari piutang..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <HandCoins className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{search ? "Tidak ditemukan" : "Belum ada piutang"}</p>
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((item) => {
                const remaining = Number(item.total_amount) - Number(item.paid_amount)
                return (
                  <div key={item.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{item.customer?.name || 'Tanpa Customer'}</span>
                        <Badge className={`${statusBadge(item.status)} border-none text-[10px]`}>{item.status}</Badge>
                        {item.invoice_number && <span className="text-xs text-muted-foreground shrink-0">#{item.invoice_number}</span>}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Rp {Number(item.total_amount).toLocaleString('id-ID')}
                        {remaining > 0 ? ` | Sisa: Rp ${remaining.toLocaleString('id-ID')}` : ''}
                        {item.due_date ? ` | Jatuh tempo: ${item.due_date}` : ''}
                      </div>
                    </div>
                    <div className="flex gap-1 ml-4 shrink-0">
                      {item.status !== 'paid' && remaining > 0 && (
                        <Button variant="outline" size="sm" className="text-xs" onClick={() => {
                          setCollectItem(item)
                          setCollectAmount(String(remaining))
                          setPayMethodId("")
                          setCollectOpen(true)
                        }}>
                          <ArrowDownLeft className="h-3 w-3 mr-1" /> Tagih
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

      <Dialog open={collectOpen} onOpenChange={setCollectOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Terima Pembayaran Piutang</DialogTitle></DialogHeader>
          {collectItem && (
            <div className="grid gap-4 py-4">
              <div className="text-sm space-y-1">
                <p><strong>Customer:</strong> {collectItem.customer?.name}</p>
                <p><strong>Invoice:</strong> #{collectItem.invoice_number}</p>
                <p><strong>Sisa:</strong> Rp {(Number(collectItem.total_amount) - Number(collectItem.paid_amount)).toLocaleString('id-ID')}</p>
              </div>
              <div className="space-y-2">
                <Label>Jumlah Tagih</Label>
                <Input type="number" value={collectAmount} onChange={(e) => setCollectAmount(e.target.value)} />
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
                <Button variant="outline" onClick={() => setCollectOpen(false)}>Batal</Button>
                <Button onClick={handleCollect} disabled={saving || !collectAmount}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null} Terima
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
