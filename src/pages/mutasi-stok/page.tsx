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
import { ArrowLeftRight, Plus, Loader2, Search, Trash2 } from "lucide-react"

interface TransferItem {
  product_id: number
  unit_id: number | null
  qty: number
  product_name?: string
  sku?: string
}

interface StockTransfer {
  id: number
  status: string
  transfer_date: string
  from_warehouse: { id: number; name: string } | null
  to_warehouse: { id: number; name: string } | null
  from_branch?: { id: number; name: string } | null
  to_branch?: { id: number; name: string } | null
  items: TransferItem[]
}

export function MutasiStokPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<StockTransfer[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [warehouses, setWarehouses] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
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
      const [res, wh, br, pr]: any = await Promise.all([
        api.get("/stock-transfers"),
        api.get("/warehouses"),
        api.get("/branches"),
        api.get("/stock-report?per_page=200"),
      ])
      setData(res.data ?? res)
      setWarehouses(wh.data ?? wh)
      setBranches(br.data ?? br)
      setProducts(pr.data ?? pr)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const filteredProducts = products.filter((p: any) =>
    p.name?.toLowerCase().includes(searchProd.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchProd.toLowerCase())
  )

  const addItem = (product: any) => {
    if (form.items.some(i => i.product_id === product.id)) return
    setForm({
      ...form,
      items: [...form.items, { product_id: product.id, unit_id: null, qty: 1, product_name: product.name, sku: product.sku }]
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

  const handleSave = async () => {
    if (!form.from_loc || !form.to_loc) return alert("Pilih lokasi asal & tujuan!")
    if (form.from_loc === form.to_loc && form.from_loc_type === form.to_loc_type)
      return alert("Lokasi asal & tujuan harus berbeda!")

    // Convert form to API fields
    const payload: any = {
      transfer_date: form.transfer_date,
      items: form.items,
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
                  if (!val) { setForm({...form, from_loc: "", from_loc_type: ""}); return }
                  const [type, id] = val.split("_")
                  setForm({...form, from_loc: id, from_loc_type: type as "warehouse"|"branch"})
                }}
              >
                <option value="">-- Pilih Asal --</option>
                <optgroup label="🏭 Gudang">
                  {warehouses.map(wh => <option key={`warehouse_${wh.id}`} value={`warehouse_${wh.id}`}>{wh.name}</option>)}
                </optgroup>
                <optgroup label="🏪 Cabang">
                  {branches.map(br => <option key={`branch_${br.id}`} value={`branch_${br.id}`}>{br.name}</option>)}
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
                  {warehouses.map(wh => <option key={`warehouse_${wh.id}`} value={`warehouse_${wh.id}`}>{wh.name}</option>)}
                </optgroup>
                <optgroup label="🏪 Cabang">
                  {branches.map(br => <option key={`branch_${br.id}`} value={`branch_${br.id}`}>{br.name}</option>)}
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
                  placeholder="Cari produk..."
                  value={searchProd}
                  onChange={e => setSearchProd(e.target.value)}
                />
              </div>
              {searchProd && (
                <div className="max-h-32 overflow-y-auto border-t mt-1 pt-1">
                  {filteredProducts.slice(0, 10).map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between px-1 py-1.5 hover:bg-muted/50 rounded cursor-pointer" onClick={() => addItem(p)}>
                      <div className="text-sm">
                        <span className="font-medium">{p.name}</span>
                        <span className="text-muted-foreground ml-2 font-mono text-xs">{p.sku}</span>
                      </div>
                      <Plus className="h-3 w-3 text-muted-foreground" />
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
                  <TableHead className="w-24 text-center">Jumlah</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {form.items.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Cari & pilih produk di atas</TableCell></TableRow>
                ) : form.items.map((item, idx) => (
                  <TableRow key={`${item.product_id}-${idx}`}>
                    <TableCell>
                      <div className="font-medium">{item.product_name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{item.sku}</div>
                    </TableCell>
                    <TableCell>
                      <Input type="number" min={1} className="h-8 text-center" value={item.qty} onChange={e => updateQty(idx, parseInt(e.target.value) || 1)} />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => removeItem(idx)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
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
