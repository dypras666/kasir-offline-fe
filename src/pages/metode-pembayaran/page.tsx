import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/api"
import { Plus, Pencil, Trash2, Loader2, Search, CreditCard, Landmark, Wallet } from "lucide-react"

interface Account {
  id: number
  code: string
  name: string
}

interface PaymentMethod {
  id: number
  name: string
  type: string
  account_id: number
  is_active: boolean
  balance: number
  account?: Account | null
}

export function MetodePembayaranPage() {
  const [items, setItems] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [editItem, setEditItem] = useState<PaymentMethod | null>(null)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [accounts, setAccounts] = useState<Account[]>([])

  // Form state
  const [formName, setFormName] = useState("")
  const [formType, setFormType] = useState("cash")
  const [formAccountId, setFormAccountId] = useState("")
  const [formActive, setFormActive] = useState(true)

  const loadData = () => {
    setLoading(true)
    api.get<{ data: PaymentMethod[] }>("/payment-methods")
      .then(r => setItems(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
    api.get<Account[]>("/accounts?per_page=999")
      .then(r => {
        const list = Array.isArray(r) ? r : (r as any).data || []
        setAccounts(list)
      })
      .catch(() => {})
  }, [])

  const resetForm = () => {
    setEditItem(null)
    setFormName("")
    setFormType("cash")
    setFormAccountId("")
    setFormActive(true)
  }

  const openEdit = (m: PaymentMethod) => {
    setEditItem(m)
    setFormName(m.name)
    setFormType(m.type)
    setFormAccountId(String(m.account_id))
    setFormActive(m.is_active)
    setOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const body = {
        name: formName,
        type: formType,
        account_id: Number(formAccountId),
        is_active: formActive,
      }
      if (editItem) {
        await api.put(`/payment-methods/${editItem.id}`, body)
      } else {
        await api.post("/payment-methods", body)
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
    if (!confirm("Hapus metode pembayaran ini?")) return
    try {
      await api.delete(`/payment-methods/${id}`)
      loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const filtered = items.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.type.toLowerCase().includes(search.toLowerCase())
  )

  const typeIcon = (t: string) => {
    switch (t) {
      case "cash": return <Wallet className="h-4 w-4" />
      case "bank": return <Landmark className="h-4 w-4" />
      default: return <CreditCard className="h-4 w-4" />
    }
  }

  const typeLabel = (t: string) => {
    const map: Record<string, string> = { cash: "Tunai", bank: "Bank", ewallet: "E-Wallet", credit_card: "Kartu Kredit" }
    return map[t] || t
  }

  const typeBadge = (t: string) => {
    const map: Record<string, string> = {
      cash: "bg-emerald-500/10 text-emerald-600",
      bank: "bg-blue-500/10 text-blue-600",
      ewallet: "bg-purple-500/10 text-purple-600",
      credit_card: "bg-amber-500/10 text-amber-600",
    }
    return map[t] || "bg-gray-500/10 text-gray-600"
  }

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Metode Pembayaran</h1>
          <p className="text-sm text-muted-foreground">{items.length} metode tercatat</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Metode
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editItem ? "Edit Metode" : "Tambah Metode Pembayaran"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nama Metode</Label>
                  <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="BCA / QRIS / Tunai" />
                </div>
                <div className="space-y-2">
                  <Label>Tipe</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                  >
                    <option value="cash">Tunai</option>
                    <option value="bank">Bank</option>
                    <option value="ewallet">E-Wallet</option>
                    <option value="credit_card">Kartu Kredit</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Akun COA</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  value={formAccountId}
                  onChange={(e) => setFormAccountId(e.target.value)}
                >
                  <option value="">Pilih Akun...</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                  ))}
                </select>
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
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setOpen(false); resetForm() }}>Batal</Button>
              <Button onClick={handleSave} disabled={saving || !formName || !formAccountId}>
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
        <Input placeholder="Cari metode..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metode</TableHead>
                <TableHead className="hidden md:table-cell">Tipe</TableHead>
                <TableHead className="hidden lg:table-cell">Akun COA</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="w-[100px] text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                    <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>{search ? "Tidak ditemukan" : "Belum ada metode pembayaran"}</p>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{typeIcon(m.type)}</span>
                        <span className="font-medium">{m.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge className={`${typeBadge(m.type)} border-none text-[10px]`}>
                        {typeLabel(m.type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                      {m.account ? `${m.account.code} - ${m.account.name}` : '-'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      <span className={m.balance >= 0 ? "text-emerald-600" : "text-red-600"}>
                        Rp {Number(m.balance).toLocaleString('id-ID')}
                      </span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge className={m.is_active
                        ? "bg-emerald-500/10 text-emerald-600 border-none"
                        : "bg-gray-500/10 text-gray-500 border-none"
                      }>
                        {m.is_active ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(m)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(m.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
