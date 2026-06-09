import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { api, type Branch } from "@/lib/api"
import { Plus, Pencil, Trash2, Loader2, Search, Store } from "lucide-react"

export function CabangPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [editItem, setEditItem] = useState<Branch | null>(null)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formName, setFormName] = useState("")
  const [formCode, setFormCode] = useState("")
  const [formType, setFormType] = useState("cabang")
  const [formPhone, setFormPhone] = useState("")
  const [formAddress, setFormAddress] = useState("")
  const [formActive, setFormActive] = useState(true)

  const loadData = () => {
    setLoading(true)
    api.get<Branch[]>("/branches")
      .then(setBranches)
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(loadData, [])

  const resetForm = () => {
    setEditItem(null)
    setFormName("")
    setFormCode("")
    setFormType("cabang")
    setFormPhone("")
    setFormAddress("")
    setFormActive(true)
  }

  const openEdit = (b: Branch) => {
    setEditItem(b)
    setFormName(b.name)
    setFormCode(b.code)
    setFormType(b.type)
    setFormPhone(b.phone)
    setFormAddress(b.address)
    setFormActive(!!b.is_active)
    setOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const body = {
        name: formName,
        code: formCode,
        type: formType,
        phone: formPhone,
        address: formAddress,
        is_active: formActive,
      }
      if (editItem) {
        await api.put(`/branches/${editItem.id}`, body)
      } else {
        await api.post("/branches", body)
      }
      setOpen(false)
      resetForm()
      loadData()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus cabang ini?")) return
    try {
      await api.delete(`/branches/${id}`)
      loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const filtered = branches.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.code?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Data Cabang</h1>
          <p className="text-sm text-muted-foreground">Kelola semua cabang toko</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Cabang
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editItem ? "Edit Cabang" : "Tambah Cabang"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nama Cabang</Label>
                  <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Cabang Pusat" />
                </div>
                <div className="space-y-2">
                  <Label>Kode</Label>
                  <Input value={formCode} onChange={(e) => setFormCode(e.target.value)} placeholder="CBG-PST" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipe</Label>
                  <Select value={formType} onChange={(e) => setFormType(e.target.value)}>
                      <option value="pusat">Pusat</option>
                      <option value="cabang">Cabang</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <div className="flex gap-2 h-10 p-1 bg-muted rounded-md">
                    <Button 
                      variant={formActive ? "secondary" : "ghost"} 
                      className="flex-1 h-full text-xs"
                      onClick={() => setFormActive(true)}
                    >
                      Aktif
                    </Button>
                    <Button 
                      variant={!formActive ? "secondary" : "ghost"} 
                      className="flex-1 h-full text-xs"
                      onClick={() => setFormActive(false)}
                    >
                      Nonaktif
                    </Button>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Telepon</Label>
                <Input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="0721-123456" />
              </div>
              <div className="space-y-2">
                <Label>Alamat</Label>
                <Input value={formAddress} onChange={(e) => setFormAddress(e.target.value)} placeholder="Jl. Merdeka No. 1" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setOpen(false); resetForm() }}>Batal</Button>
              <Button onClick={handleSave} disabled={saving || !formName}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editItem ? "Simpan" : "Tambah"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari cabang..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead className="hidden md:table-cell">Tipe</TableHead>
                <TableHead className="hidden md:table-cell">Telepon</TableHead>
                <TableHead className="hidden lg:table-cell">Alamat</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-mono text-xs">{b.code}</TableCell>
                  <TableCell className="font-medium">{b.name}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="outline">{b.type}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{b.phone}</TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground max-w-[200px] truncate">{b.address}</TableCell>
                  <TableCell>
                    <Badge className={b.is_active ? "bg-emerald-500/10 text-emerald-500 border-none" : ""}>
                      {b.is_active ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(b)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(b.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    <Store className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    Belum ada cabang
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
