import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Pencil, Layers } from "lucide-react"
import { Select } from "@/components/ui/select"

interface Product {
  id: number
  name: string
  sku: string
}

interface ProductUnit {
  id: number
  product_id: number
  product?: Product
  name: string
  conversion: number
  price: number
  barcode: string | null
}

export function MultiSatuanPage() {
  const [data, setData] = useState<ProductUnit[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<ProductUnit | null>(null)
  const [form, setForm] = useState({ product_id: "", name: "", conversion: 1, price: 0, barcode: "" })

  const fetchData = async () => {
    try {
      const [resUnits, resProds]: any = await Promise.all([
        api.get("/product-units"),
        api.get("/products")
      ])
      setData(resUnits.data ?? resUnits)
      setProducts(resProds.data ?? resProds)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = { ...form, product_id: Number(form.product_id) }
      if (editing) await api.put(`/product-units/${editing.id}`, payload)
      else await api.post("/product-units", payload)
      setOpen(false); setEditing(null); setForm({ product_id: "", name: "", conversion: 1, price: 0, barcode: "" })
      fetchData()
    } catch { alert("Gagal menyimpan") }
  }

  const handleEdit = (item: ProductUnit) => {
    setEditing(item)
    setForm({ product_id: String(item.product_id), name: item.name, conversion: item.conversion, price: item.price, barcode: item.barcode || "" })
    setOpen(true)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Multi Satuan</h1>
          <p className="text-sm text-muted-foreground">Konversi satuan produk (Lusin, Box, Pack, dll)</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditing(null); setForm({ product_id: "", name: "", conversion: 1, price: 0, barcode: "" }) }}>
              <Plus className="mr-2 h-4 w-4" /> Tambah Satuan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Edit" : "Tambah"} Satuan Produk</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Produk</label>
                <Select value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value })}>
                  <option value="">Pilih Produk</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nama Satuan</label>
                  <Input required placeholder="Box / Dus" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Konversi (ke Pcs)</label>
                  <Input type="number" required value={form.conversion} onChange={e => setForm({ ...form, conversion: Number(e.target.value) })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Harga Khusus (Opsional)</label>
                  <Input type="number" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Barcode Satuan</label>
                  <Input value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })} />
                </div>
              </div>
              <Button type="submit" className="w-full">Simpan</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produk</TableHead>
                <TableHead>Satuan</TableHead>
                <TableHead>Isi (Konversi)</TableHead>
                <TableHead>Harga</TableHead>
                <TableHead>Barcode</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : data.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground"><Layers className="h-12 w-12 mx-auto mb-2 opacity-20" />Belum ada data satuan khusus</TableCell></TableRow>
              ) : data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.product?.name || item.product_id}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.conversion} pcs</TableCell>
                  <TableCell>Rp {Number(item.price).toLocaleString()}</TableCell>
                  <TableCell className="font-mono text-xs">{item.barcode || "-"}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}><Pencil className="h-4 w-4" /></Button>
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
