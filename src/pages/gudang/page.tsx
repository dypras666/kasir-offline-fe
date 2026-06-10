import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface Warehouse {
  id: number
  name: string
  address: string | null
  pic: string | null
  phone: string | null
  is_pusat: boolean
}

export function GudangPage() {
  const [data, setData] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Warehouse | null>(null)
  const [form, setForm] = useState({ name: "", address: "", pic: "", phone: "", is_pusat: false })

  const fetchData = async () => {
    try {
      const res: any = await api.get("/warehouses")
      setData(res.data ?? res)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editing) await api.put(`/warehouses/${editing.id}`, form)
      else await api.post("/warehouses", form)
      setOpen(false); setEditing(null); setForm({ name: "", address: "", pic: "", phone: "", is_pusat: false })
      fetchData()
    } catch { toast.error("Gagal menyimpan") }
  }

  const handleEdit = (item: Warehouse) => {
    setEditing(item); setForm({ name: item.name, address: item.address || "", pic: item.pic || "", phone: item.phone || "", is_pusat: Boolean(item.is_pusat) }); setOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus gudang?")) return
    try { await api.delete(`/warehouses/${id}`); fetchData() } catch { toast.error("Gagal menghapus") }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Gudang</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditing(null); setForm({ name: "", address: "", pic: "", phone: "", is_pusat: false }) }}>
              <Plus className="mr-2 h-4 w-4" /> Tambah Gudang
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Edit" : "Tambah"} Gudang</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nama Gudang</label>
                <Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">PIC</label>
                  <Input value={form.pic} onChange={e => setForm({ ...form, pic: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Telepon</label>
                  <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Alamat</label>
                <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_pusat} onChange={e => setForm({ ...form, is_pusat: e.target.checked })} className="h-4 w-4" />
                <span className="text-sm font-medium">Gudang Pusat</span>
              </label>
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
                <TableHead>Nama</TableHead>
                <TableHead>PIC</TableHead>
                <TableHead>Telepon</TableHead>
                <TableHead>Alamat</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center">Loading...</TableCell></TableRow>
              ) : data.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center">Belum ada data</TableCell></TableRow>
              ) : data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.pic || "-"}</TableCell>
                  <TableCell>{item.phone || "-"}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{item.address || "-"}</TableCell>
                  <TableCell>{item.is_pusat ? <Badge variant="default">Pusat</Badge> : <Badge variant="outline">Cabang</Badge>}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
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
