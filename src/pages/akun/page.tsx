import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { api, type Account } from "@/lib/api"
import { Plus, Pencil, Trash2, Loader2, Search, Landmark, ChevronRight, ChevronDown } from "lucide-react"

const typeColors: Record<string, string> = {
  aset: "bg-blue-500/10 text-blue-500",
  kewajiban: "bg-amber-500/10 text-amber-500",
  modal: "bg-purple-500/10 text-purple-500",
  pendapatan: "bg-emerald-500/10 text-emerald-500",
  beban: "bg-red-500/10 text-red-500",
}

export function AkunPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [editItem, setEditItem] = useState<Account | null>(null)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  // Form
  const [formCode, setFormCode] = useState("")
  const [formName, setFormName] = useState("")
  const [formType, setFormType] = useState("aset")
  const [formParent, setFormParent] = useState("")
  const [formActive, setFormActive] = useState(true)

  const loadData = () => {
    setLoading(true)
    api.get<Account[]>("/accounts")
      .then(setAccounts)
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(loadData, [])

  const resetForm = () => {
    setEditItem(null)
    setFormCode("")
    setFormName("")
    setFormType("aset")
    setFormParent("")
    setFormActive(true)
  }

  const openEdit = (a: Account) => {
    setEditItem(a)
    setFormCode(a.code)
    setFormName(a.name)
    setFormType(a.type)
    setFormParent(a.parent_id ? String(a.parent_id) : "")
    setFormActive(!!a.is_active)
    setOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        code: formCode,
        name: formName,
        type: formType,
        is_active: formActive,
      }
      if (formParent) body.parent_id = Number(formParent)
      if (editItem) {
        await api.put(`/accounts/${editItem.id}`, body)
      } else {
        await api.post("/accounts", body)
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
    if (!confirm("Hapus akun ini?")) return
    try {
      await api.delete(`/accounts/${id}`)
      loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const toggleExpand = (id: number) => {
    const next = new Set(expanded)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setExpanded(next)
  }

  // Build tree
  const rootAccounts = accounts.filter((a) => !a.parent_id)
  const childrenOf = (parentId: number) => accounts.filter((a) => a.parent_id === parentId)

  const filtered = search
    ? accounts.filter((a) =>
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.code.toLowerCase().includes(search.toLowerCase())
      )
    : rootAccounts

  const renderTree = (items: Account[], depth = 0) => {
    return items.map((a) => {
      const hasChildren = accounts.some((c) => c.parent_id === a.id)
      const isExpanded = expanded.has(a.id)

      return (
        <div key={a.id}>
          <div
            className={`flex items-center gap-2 px-4 py-2.5 hover:bg-muted/50 transition-colors ${
              depth > 0 ? "border-l ml-4" : ""
            }`}
            style={{ paddingLeft: `${16 + depth * 24}px` }}
          >
            {hasChildren ? (
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => toggleExpand(a.id)}>
                {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </Button>
            ) : (
              <div className="w-5" />
            )}
            <span className="font-mono text-xs text-muted-foreground w-20">{a.code}</span>
            <span className="flex-1 text-sm font-medium">{a.name}</span>
            <Badge className={`${typeColors[a.type] ?? ""} border-none text-[10px]`}>
              {a.type}
            </Badge>
            {!a.is_active && <Badge variant="outline" className="text-[10px]">Nonaktif</Badge>}
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(a)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(a.id)}>
                <Trash2 className="h-3.5 w-3.5 text-red-500" />
              </Button>
            </div>
          </div>
          {hasChildren && isExpanded && renderTree(childrenOf(a.id), depth + 1)}
        </div>
      )
    })
  }

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Chart of Account</h1>
          <p className="text-sm text-muted-foreground">{accounts.length} akun terdaftar</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Akun
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editItem ? "Edit Akun" : "Tambah Akun"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kode Akun</Label>
                  <Input value={formCode} onChange={(e) => setFormCode(e.target.value)} placeholder="1-1000" />
                </div>
                <div className="space-y-2">
                  <Label>Tipe</Label>
                  <Select value={formType} onChange={(e) => setFormType(e.target.value)}>
                      <option value="aset">Aset</option>
                      <option value="kewajiban">Kewajiban</option>
                      <option value="modal">Modal</option>
                      <option value="pendapatan">Pendapatan</option>
                      <option value="beban">Beban</option>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Nama Akun</Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Kas Besar" />
              </div>
              <div className="space-y-2">
                <Label>Akun Induk (opsional)</Label>
                <Select value={formParent} onChange={(e) => setFormParent(e.target.value)}>
                    <option value="">Tidak ada (root)</option>
                    {accounts.filter((a) => !editItem || a.id !== editItem.id).map((a) => (
                        <option key={a.id} value={String(a.id)}>{a.code} - {a.name}</option>
                    ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex gap-2 h-10 p-1 bg-muted rounded-md">
                  <Button
                    variant={formActive ? "secondary" : "ghost"}
                    className="flex-1 h-full text-xs"
                    onClick={() => setFormActive(true)}
                  >Aktif</Button>
                  <Button
                    variant={!formActive ? "secondary" : "ghost"}
                    className="flex-1 h-full text-xs"
                    onClick={() => setFormActive(false)}
                  >Nonaktif</Button>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setOpen(false); resetForm() }}>Batal</Button>
              <Button onClick={handleSave} disabled={saving || !formName || !formCode}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editItem ? "Simpan" : "Tambah"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari akun..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <Landmark className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{search ? "Tidak ditemukan" : "Belum ada akun. Silakan tambah akun pertama."}</p>
            </div>
          ) : search ? (
            filtered.map((a) => (
              <div key={a.id} className="flex items-center gap-2 px-4 py-2.5 hover:bg-muted/50">
                <span className="font-mono text-xs text-muted-foreground w-20">{a.code}</span>
                <span className="flex-1 text-sm font-medium">{a.name}</span>
                <Badge className={`${typeColors[a.type] ?? ""} border-none text-[10px]`}>{a.type}</Badge>
                {!a.is_active && <Badge variant="outline" className="text-[10px]">Nonaktif</Badge>}
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(a)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(a.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            renderTree(rootAccounts)
          )}
        </CardContent>
      </Card>
    </div>
  )
}
