import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { RefreshCw, Plus, Loader2 } from "lucide-react"
import { formatMultiSatuan } from "@/lib/multi-unit"

const nowLocal = () => {
  const d = new Date()
  const offset = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - offset).toISOString().slice(0, 16)
}

interface StokOpname {
  id: number
  kode_so: string
  tanggal: string
  warehouse?: { name: string }
  status: string
  keterangan: string | null
}

interface ItemRow {
  product_id: number
  product_name: string
  sku: string
  stok_sistem: number
  stok_fisik: number
  selisih: number
  unit_name: string
  multi_unit: { name: string; conversion: number }[]
}

export function StokOpnamePage() {
  const navigate = useNavigate()
  const [data, setData] = useState<StokOpname[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [warehouses, setWarehouses] = useState<any[]>([])
  const [fetchingProducts, setFetchingProducts] = useState(false)

  const [formData, setFormData] = useState({
    kode_so: `SO-${Date.now()}`,
    tanggal: nowLocal(),
    warehouse_id: "",
    keterangan: "",
    items: [] as ItemRow[]
  })

  const fetchData = async () => {
    try {
      const res: any = await api.get("/stok-opnames")
      setData(res.data ?? res)
      const resWh: any = await api.get("/warehouses")
      setWarehouses(resWh.data ?? resWh)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const loadProducts = async (whId: string) => {
    if (!whId) return
    setFetchingProducts(true)
    try {
      const res: any = await api.get(`/stock-report?warehouse_id=${whId}&per_page=100`)
      const list: ItemRow[] = (res.data ?? res).map((p: any) => ({
        product_id: p.id,
        product_name: p.name,
        sku: p.sku,
        stok_sistem: p.stock,
        stok_fisik: p.stock,
        selisih: 0,
        unit_name: p.unit_name || "pcs",
        multi_unit: (p.multi_unit || []).map((u: any) => ({
          name: u.unit_name,
          conversion: Number(u.conversion)
        }))
      }))
      setFormData(prev => ({ ...prev, items: list }))
    } catch (err) { console.error(err) }
    finally { setFetchingProducts(false) }
  }

  const handleSave = async () => {
    if (!formData.warehouse_id) return alert("Pilih gudang!")
    setSaving(true)
    try {
      await api.post("/stok-opnames", formData)
      setOpen(false)
      fetchData()
      setFormData({
        kode_so: `SO-${Date.now()}`,
        tanggal: nowLocal(),
        warehouse_id: "",
        keterangan: "",
        items: []
      })
    } catch (err) { console.error(err) }
    finally { setSaving(false) }
  }

  const updateItem = (index: number, fisik: number) => {
    const items = [...formData.items]
    const item = items[index]
    item.stok_fisik = fisik
    item.selisih = fisik - item.stok_sistem
    setFormData({ ...formData, items })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stok Opname</h1>
          <p className="text-sm text-muted-foreground">Penyesuaian stok fisik dengan sistem</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Opname Baru
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Ref No.</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Gudang</TableHead>
                <TableHead>Catatan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : data.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                  <RefreshCw className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  Belum ada data opname
                </TableCell></TableRow>
              ) : data.map((item, idx) => (
                <TableRow key={item.id}>
                  <TableCell className="text-xs font-mono text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell className="font-mono text-xs font-semibold">{item.kode_so}</TableCell>
                  <TableCell>{new Date(item.tanggal).toLocaleString("id-ID", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</TableCell>
                  <TableCell className="font-medium">{item.warehouse?.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{item.keterangan || "-"}</TableCell>
                  <TableCell>
                    {item.status === 'completed' ?
                      <Badge className="bg-emerald-500 text-white">Selesai</Badge> :
                      <Badge variant="outline">Draft</Badge>
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/stok-opname/${item.id}`)}>Lihat</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Stok Opname Baru</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Kode SO</Label>
              <Input value={formData.kode_so} disabled />
            </div>
            <div className="space-y-2">
              <Label>Tanggal</Label>
              <Input type="datetime-local" value={formData.tanggal} onChange={e => setFormData({...formData, tanggal: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Gudang</Label>
              <Select value={formData.warehouse_id} onChange={e => {
                const val = e.target.value
                setFormData({...formData, warehouse_id: val})
                loadProducts(val)
              }}>
                <option value="">-- Pilih Gudang --</option>
                {warehouses.map(wh => <option key={wh.id} value={wh.id}>{wh.name}</option>)}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Keterangan</Label>
              <Input placeholder="Opsional" value={formData.keterangan} onChange={e => setFormData({...formData, keterangan: e.target.value})} />
            </div>
          </div>

          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Produk</TableHead>
                  <TableHead className="w-32 text-center">Stok Sistem</TableHead>
                  <TableHead className="w-32 text-center">Stok Fisik</TableHead>
                  <TableHead className="w-32 text-center">Selisih</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fetchingProducts ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                ) : formData.items.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                    Pilih gudang untuk memuat produk
                  </TableCell></TableRow>
                ) : formData.items.map((item, idx) => (
                  <TableRow key={item.product_id}>
                    <TableCell>
                      <div className="font-medium">{item.product_name}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">{item.sku}</div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="font-mono">{item.stok_sistem}</div>
                      {item.multi_unit.length > 0 && (
                        <div className="text-[10px] text-blue-600 font-medium">
                          {formatMultiSatuan(item.stok_sistem, item.multi_unit, item.unit_name)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        className="h-8 text-center font-bold"
                        value={item.stok_fisik}
                        onChange={e => updateItem(idx, parseFloat(e.target.value) || 0)}
                      />
                      {item.multi_unit.length > 0 && (
                        <div className="text-[10px] text-blue-600 font-medium text-center mt-0.5">
                          {formatMultiSatuan(item.stok_fisik, item.multi_unit, item.unit_name)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className={`text-center font-mono font-bold ${
                      item.selisih > 0 ? 'text-emerald-600' : item.selisih < 0 ? 'text-red-600' : ''
                    }`}>
                      <div>{item.selisih > 0 ? `+${item.selisih}` : item.selisih}</div>
                      {item.multi_unit.length > 0 && item.selisih !== 0 && (
                        <div className="text-[10px] font-medium">
                          {item.selisih > 0 ? '+' : ''}{formatMultiSatuan(Math.abs(item.selisih), item.multi_unit, item.unit_name)}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={saving || formData.items.length === 0}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Simpan & Sesuaikan Stok
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
