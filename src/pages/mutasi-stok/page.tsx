import { useState, useEffect, useCallback } from "react"
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
import { ArrowLeftRight, Plus, Loader2, Search, Trash2 } from "lucide-react"

interface MultiUnit {
  id: number
  unit_name: string
  conversion: number
  qty: number
}

interface TransferItem {
  product_id: number
  unit_id: number | null
  qty: number
  product_name?: string
  sku?: string
  stock_available?: number
  multi_unit?: MultiUnit[]
  base_unit_name?: string
}

interface StockTransfer {
  id: number
  status: string
  transfer_date: string
  from_warehouse: { id: number; name: string } | null
  to_warehouse: { id: number; name: string } | null
  from_branch?: { id: number; name: string } | null
  to_branch?: { id: number; name: string } | null
  items: any[]
}

interface SourceProduct {
  id: number
  name: string
  sku: string
  stock: number
  multi_unit: MultiUnit[]
  unit_name: string
}

export function MutasiStokPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<StockTransfer[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [warehouses, setWarehouses] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [sourceProducts, setSourceProducts] = useState<SourceProduct[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [searchProd, setSearchProd] = useState("")

  const [form, setForm] = useState({
    from_loc: "",
    to_loc: "",
    from_loc_type: "" as "warehouse" | "branch" | "",
    to_loc_type: "" as "warehouse" | "branch" | "",
    transfer_date: new Date().toISOString().split("T")[0],
    items: [] as TransferItem[],
  })

  const fetchData = async () => {
    try {
      const [res, wh, br]: any = await Promise.all([
        api.get("/stock-transfers"),
        api.get("/warehouses"),
        api.get("/branches"),
      ])
      setData(res.data ?? res)
      setWarehouses(wh.data ?? wh)
      setBranches(br.data ?? br)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const loadSourceProducts = useCallback(async (type: string, id: string) => {
    if (!type || !id) { setSourceProducts([]); return }
    setLoadingProducts(true)
    const param = type === 'warehouse' ? `warehouse_id=${id}` : `branch_id=${id}`
    try {
      const res: any = await api.get(`/stock-report?${param}&per_page=999`)
      const list: SourceProduct[] = (res.data ?? res).map((p: any) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        stock: p.stock,
        multi_unit: p.multi_unit || [],
        unit_name: p.unit_name
      }))
      setSourceProducts(list)
    } catch (err) { console.error(err) }
    finally { setLoadingProducts(false) }
  }, [])

  const filteredProducts = sourceProducts.filter((p: any) =>
    p.name?.toLowerCase().includes(searchProd.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchProd.toLowerCase())
  ).filter(p => p.stock > 0)

  const addItem = (product: SourceProduct) => {
    if (form.items.some(i => i.product_id === product.id)) return
    setForm({
      ...form,
      items: [
        ...form.items,
        {
          product_id: product.id,
          unit_id: null,
          qty: 1,
          product_name: product.name,
          sku: product.sku,
          stock_available: product.stock,
          base_unit_name: product.unit_name,
          multi_unit: product.multi_unit
        }
      ]
    })
    setSearchProd("")
  }

  const removeItem = (idx: number) => {
    setForm({ ...form, items: form.items.filter((_, i) => i !== idx) })
  }

  const updateQty = (idx: number, qty: number) => {
    const items = [...form.items]
    items[idx].qty = qty
    setForm({ ...form, items })
  }

  const updateUnit = (idx: number, unitId: string) => {
    const items = [...form.items]
    items[idx].unit_id = unitId ? parseInt(unitId) : null
    setForm({ ...form, items })
  }

  const getStockForUnit = (item: TransferItem) => {
    if (!item.unit_id) return item.stock_available || 0
    const unit = item.multi_unit?.find(u => u.id === item.unit_id)
    if (!unit) return 0
    return unit.qty // Ini sudah dihitung di backend (total_stock / conversion)
  }

  const handleSave = async () => {
    if (!form.from_loc || !form.to_loc) return alert("Pilih lokasi asal & tujuan!")
    if (form.from_loc === form.to_loc && form.from_loc_type === form.to_loc_type)
      return alert("Lokasi asal & tujuan harus berbeda!")

    // Validasi stok
    for (const item of form.items) {
      const avail = getStockForUnit(item)
      if (item.qty > avail) {
        return alert(`Stok ${item.product_name} tidak mencukupi! Tersedia: ${avail}, diminta: ${item.qty}`)
      }
    }

    const payload: any = {
      transfer_date: form.transfer_date,
      items: form.items.map(({ stock_available, multi_unit, base_unit_name, product_name, sku, ...rest }) => rest),
    }

    if (form.from_loc_type === "warehouse") {
      payload.from_warehouse_id = parseInt(form.from_loc)
      payload.from_branch_id = null
    } else {
      payload.from_branch_id = parseInt(form.from_loc)
      payload.from_warehouse_id = null
    }

    if (form.to_loc_type === "warehouse") {
      payload.to_warehouse_id = parseInt(form.to_loc)
      payload.to_branch_id = null
    } else {
      payload.to_branch_id = parseInt(form.to_loc)
      payload.to_warehouse_id = null
    }

    setSaving(true)
    try {
      await api.post("/stock-transfers", payload)
      setOpen(false)
      setForm({
        from_loc: "", to_loc: "",
        from_loc_type: "", to_loc_type: "",
        transfer_date: new Date().toISOString().split("T")[0],
        items: [],
      })
      setSourceProducts([])
      fetchData()
    } catch (err: any) { alert(err?.message || err) }
    finally { setSaving(false) }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mutasi Stok</h1>
          <p className="text-sm text-muted-foreground">Transfer barang antar gudang atau cabang</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Buat Transfer
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Dari</TableHead>
                <TableHead>Ke</TableHead>
                <TableHead>Jumlah Item</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : data.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                  <ArrowLeftRight className="h-12 w-12 mx-auto mb-2 opacity-20" />Belum ada data mutasi
                </TableCell></TableRow>
              ) : data.map((item, idx) => (
                <TableRow key={item.id}>
                  <TableCell className="text-xs font-mono text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell>{item.transfer_date}</TableCell>
                  <TableCell className="font-medium">
                    {item.from_warehouse?.name || item.from_branch?.name || "-"}
                    {item.from_warehouse && <Badge variant="outline" className="ml-1 text-[9px] px-1">Gudang</Badge>}
                    {item.from_branch && <Badge variant="outline" className="ml-1 text-[9px] px-1">Cabang</Badge>}
                  </TableCell>
                  <TableCell className="font-medium">
                    {item.to_warehouse?.name || item.to_branch?.name || "-"}
                    {item.to_warehouse && <Badge variant="outline" className="ml-1 text-[9px] px-1">Gudang</Badge>}
                    {item.to_branch && <Badge variant="outline" className="ml-1 text-[9px] px-1">Cabang</Badge>}
                  </TableCell>
                  <TableCell className="text-center">{item.items?.length ?? 0}</TableCell>
                  <TableCell>
                    {item.status === "completed" ? (
                      <Badge className="bg-emerald-500 text-white">Selesai</Badge>
                    ) : item.status === "pending" ? (
                      <Badge variant="outline" className="border-amber-400 text-amber-600">Pending</Badge>
                    ) : (
                      <Badge variant="destructive">{item.status}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/mutasi-stok/${item.id}`)}>Detail</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog Buat Transfer */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Buat Transfer Stok</DialogTitle></DialogHeader>
          <div className="grid grid-cols-3 gap-4 py-4">
            <div className="space-y-2">
              <Label>Tanggal Transfer</Label>
              <Input type="date" value={form.transfer_date} onChange={e => setForm({...form, transfer_date: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Lokasi Asal</Label>
              <Select
                value={form.from_loc_type ? `${form.from_loc_type}_${form.from_loc}` : ""}
                onChange={e => {
                  const val = e.target.value
                  if (!val) { setForm({...form, from_loc: "", from_loc_type: ""}); setSourceProducts([]); return }
                  const [type, id] = val.split("_")
                  setForm({...form, from_loc: id, from_loc_type: type as "warehouse"|"branch"})
                  loadSourceProducts(type, id)
                }}
              >
                <option value="">-- Pilih Asal --</option>
                <optgroup label="🏭 Gudang">
                  {warehouses
                    .filter(wh => !(form.to_loc_type === "warehouse" && form.to_loc === String(wh.id)))
                    .map(wh => <option key={`warehouse_${wh.id}`} value={`warehouse_${wh.id}`}>{wh.name}</option>)}
                </optgroup>
                <optgroup label="🏪 Cabang">
                  {branches
                    .filter(br => !(form.to_loc_type === "branch" && form.to_loc === String(br.id)))
                    .map(br => <option key={`branch_${br.id}`} value={`branch_${br.id}`}>{br.name}</option>)}
                </optgroup>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Lokasi Tujuan</Label>
              <Select
                value={form.to_loc_type ? `${form.to_loc_type}_${form.to_loc}` : ""}
                onChange={e => {
                  const val = e.target.value
                  if (!val) { setForm({...form, to_loc: "", to_loc_type: ""}); return }
                  const [type, id] = val.split("_")
                  setForm({...form, to_loc: id, to_loc_type: type as "warehouse"|"branch"})
                }}
              >
                <option value="">-- Pilih Tujuan --</option>
                <optgroup label="🏭 Gudang">
                  {warehouses
                    .filter(wh => !(form.from_loc_type === "warehouse" && form.from_loc === String(wh.id)))
                    .map(wh => <option key={`warehouse_${wh.id}`} value={`warehouse_${wh.id}`}>{wh.name}</option>)}
                </optgroup>
                <optgroup label="🏪 Cabang">
                  {branches
                    .filter(br => !(form.from_loc_type === "branch" && form.from_loc === String(br.id)))
                    .map(br => <option key={`branch_${br.id}`} value={`branch_${br.id}`}>{br.name}</option>)}
                </optgroup>
              </Select>
            </div>
          </div>

          {/* Cari & Tambah Produk */}
          <div className="border rounded-md">
            <div className="p-2 border-b">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <input
                  className="flex-1 bg-transparent outline-none text-sm"
                  placeholder={!form.from_loc_type ? "Pilih lokasi asal dulu..." : "Cari produk..."}
                  value={searchProd}
                  disabled={!form.from_loc_type}
                  onChange={e => setSearchProd(e.target.value)}
                />
                {loadingProducts && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
              {form.from_loc_type && searchProd && !loadingProducts && (
                <div className="max-h-48 overflow-y-auto border-t mt-1 pt-1">
                  {filteredProducts.length === 0 ? (
                    <div className="text-xs text-muted-foreground px-1 py-2">Tidak ada produk dengan stok tersedia</div>
                  ) : filteredProducts.slice(0, 10).map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between px-1 py-1.5 hover:bg-muted/50 rounded cursor-pointer" onClick={() => addItem(p)}>
                      <div className="text-sm">
                        <span className="font-medium">{p.name}</span>
                        <span className="text-muted-foreground ml-2 font-mono text-xs">{p.sku}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-emerald-600 font-semibold">Stok: {p.stock} {p.unit_name}</span>
                        <Plus className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Daftar Item */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produk</TableHead>
                  <TableHead className="w-40">Satuan</TableHead>
                  <TableHead className="w-16 text-center">Stok</TableHead>
                  <TableHead className="w-24 text-center">Transfer</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {form.items.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Pilih lokasi asal & cari produk di atas</TableCell></TableRow>
                ) : form.items.map((item, idx) => {
                  const avail = getStockForUnit(item)
                  return (
                    <TableRow key={`${item.product_id}-${idx}`}>
                      <TableCell>
                        <div className="font-medium">{item.product_name}</div>
                        <div className="text-xs text-muted-foreground font-mono">{item.sku}</div>
                      </TableCell>
                      <TableCell>
                        <Select
                          className="h-8 text-xs"
                          value={item.unit_id?.toString() || ""}
                          onChange={e => updateUnit(idx, e.target.value)}
                        >
                          <option value="">{item.base_unit_name} (Dasar)</option>
                          {item.multi_unit?.map(u => (
                            <option key={u.id} value={u.id}>{u.unit_name} (1:{u.conversion})</option>
                          ))}
                        </Select>
                      </TableCell>
                      <TableCell className="text-center font-mono text-sm font-semibold text-emerald-600">
                        {avail}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={1}
                          max={avail}
                          className={`h-8 text-center ${item.qty > avail ? 'border-red-500 text-red-500' : ''}`}
                          value={item.qty}
                          onChange={e => updateQty(idx, parseInt(e.target.value) || 1)}
                        />
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => removeItem(idx)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={saving || form.items.length === 0}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowLeftRight className="mr-2 h-4 w-4" />}
              Simpan Transfer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
