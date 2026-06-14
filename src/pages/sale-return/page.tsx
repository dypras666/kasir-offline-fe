import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RotateCcw, Search, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { formatDate } from "@/lib/date"

interface SaleReturn {
  id: number
  return_number: string
  date: string
  reason: string | null
  total_refund: string
  refund_type: string
  status: string
  sale: { invoice_number: string; id: number }
  branch: { name: string } | null
  customer: { name: string } | null
  items: SaleReturnItem[]
  creator: { name: string } | null
}

interface SaleReturnItem {
  id: number
  product: { name: string; sku: string } | null
  unit: { name: string } | null
  qty_returned: number
  price: string
  subtotal: string
}

interface EligibleItem {
  id: number
  product_id: number
  product_name: string
  product_sku: string
  unit_name: string
  qty_original: number
  qty_returned: number
  qty_available: number
  price: number
  subtotal: number
}

export function SaleReturnPage() {
  const [returns, setReturns] = useState<SaleReturn[]>([])
  const [loading, setLoading] = useState(true)
  const [searchSale, setSearchSale] = useState("")
  const [saleId, setSaleId] = useState("")
  const [reason, setReason] = useState("")
  const [eligibleItems, setEligibleItems] = useState<EligibleItem[]>([])
  const [selectedItems, setSelectedItems] = useState<Record<number, number>>({})
  const [saleInfo, setSaleInfo] = useState<any>(null)
  const [loadingSale, setLoadingSale] = useState(false)
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const fetchReturns = async () => {
    try {
      const res: any = await api.get("/sales-returns")
      setReturns(res.data ?? res)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchReturns() }, [])

  const loadEligibleItems = async () => {
    if (!saleId?.trim()) return
    setLoadingSale(true)
    setEligibleItems([])
    setSelectedItems({})
    setSaleInfo(null)
    try {
      const res: any = await api.get(`/sales/${saleId}/eligible-items`)
      if (res.data) {
        setSaleInfo(res.data.sale)
        setEligibleItems(res.data.items.filter((i: EligibleItem) => i.qty_available > 0))
      }
    } catch (err: any) {
      toast.error(err?.message || "Gagal memuat data penjualan")
    } finally { setLoadingSale(false) }
  }

  const handleSubmit = async () => {
    if (!saleId || Object.keys(selectedItems).length === 0) {
      toast.error("Pilih minimal 1 item yang diretur")
      return
    }
    const items = Object.entries(selectedItems)
      .filter(([_, qty]) => qty > 0)
      .map(([saleItemId, qty]) => ({
        sale_item_id: Number(saleItemId),
        qty_returned: qty,
        reason: reason || null,
      }))
    if (items.length === 0) {
      toast.error("Isi jumlah retur minimal 1")
      return
    }
    setSubmitting(true)
    try {
      await api.post("/sales-return", { sale_id: Number(saleId), reason, items })
      toast.success("Retur berhasil diproses")
      setOpen(false)
      setSaleId("")
      setReason("")
      setSelectedItems({})
      setEligibleItems([])
      setSaleInfo(null)
      fetchReturns()
    } catch (err: any) {
      toast.error(err?.message || "Gagal memproses retur")
    } finally { setSubmitting(false) }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Retur Penjualan</h1>
          <p className="text-sm text-muted-foreground">Pengembalian barang dari pelanggan</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <RotateCcw className="mr-2 h-4 w-4" /> Buat Retur
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Buat Retur Penjualan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label>Cari Invoice / ID Penjualan</Label>
                  <Input
                    placeholder="Masukkan invoice number atau ID..."
                    value={searchSale}
                    onChange={(e) => setSearchSale(e.target.value)}
                  />
                </div>
                <Button onClick={() => { setSaleId(searchSale.trim()); loadEligibleItems() }} disabled={!searchSale.trim()}>
                  <Search className="h-4 w-4 mr-1" /> Cari
                </Button>
              </div>

              {loadingSale && <p className="text-sm text-muted-foreground">Memuat data penjualan...</p>}

              {saleInfo && (
                <div className="bg-muted p-3 rounded-md text-sm space-y-1">
                  <p><strong>Invoice:</strong> {saleInfo.invoice_number}</p>
                  <p><strong>Tanggal:</strong> {formatDate(saleInfo.date)}</p>
                  <p><strong>Pelanggan:</strong> {saleInfo.customer_name || "-"}</p>
                  <p><strong>Total:</strong> Rp {Number(saleInfo.total).toLocaleString()}</p>
                </div>
              )}

              {eligibleItems.length > 0 && (
                <div>
                  <Label className="mb-2 block">Item yang bisa diretur</Label>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produk</TableHead>
                        <TableHead>Satuan</TableHead>
                        <TableHead>Terjual</TableHead>
                        <TableHead>Sudah Retur</TableHead>
                        <TableHead>Sisa</TableHead>
                        <TableHead>Harga</TableHead>
                        <TableHead className="w-24">Jml Retur</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {eligibleItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <p className="font-medium">{item.product_name}</p>
                            <p className="text-xs text-muted-foreground">{item.product_sku}</p>
                          </TableCell>
                          <TableCell>{item.unit_name}</TableCell>
                          <TableCell>{item.qty_original}</TableCell>
                          <TableCell>{item.qty_returned}</TableCell>
                          <TableCell>{item.qty_available}</TableCell>
                          <TableCell>Rp {item.price.toLocaleString()}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={0}
                              max={item.qty_available}
                              step={1}
                              placeholder="0"
                              value={selectedItems[item.id] || ""}
                              onChange={(e) => {
                                const v = Math.min(Number(e.target.value) || 0, item.qty_available)
                                setSelectedItems(prev => ({ ...prev, [item.id]: v }))
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {eligibleItems.length === 0 && saleInfo && (
                <p className="text-sm text-yellow-600 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" /> Tidak ada item yang bisa diretur (semua sudah diretur atau penjualan dibatalkan)
                </p>
              )}

              <div>
                <Label>Alasan Retur</Label>
                <Textarea
                  placeholder="Opsional: alasan retur..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button onClick={handleSubmit} disabled={submitting || Object.keys(selectedItems).length === 0}>
                {submitting ? "Memproses..." : "Proses Retur"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Retur</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Pelanggan</TableHead>
                <TableHead>Total Refund</TableHead>
                <TableHead>Tipe Refund</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pembuat</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : returns.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                  <RotateCcw className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  Belum ada retur penjualan
                </TableCell></TableRow>
              ) : returns.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.return_number}</TableCell>
                  <TableCell>{formatDate(r.date)}</TableCell>
                  <TableCell className="font-mono text-xs">{r.sale?.invoice_number}</TableCell>
                  <TableCell>{r.customer?.name || "-"}</TableCell>
                  <TableCell className="font-bold text-red-500">Rp {Number(r.total_refund).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{r.refund_type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.status === 'completed' ? 'default' : 'outline'}>
                      {r.status === 'completed' ? 'Selesai' : r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.creator?.name || "-"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Detail</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
