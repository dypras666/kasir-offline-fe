import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { api } from "@/lib/api"
import { Loader2, Search, Building2, RefreshCw, Clock, DollarSign, Package, FileText, Pencil } from "lucide-react"
import { toast } from "sonner"
import { formatDate } from "@/lib/date"


interface AssetItem {
  id: number
  code: string
  name: string
  category: string
  purchase_date: string
  purchase_price: string
  salvage_value: string
  quantity: number
  unit_name: string
  useful_life_months: number
  status: string
  branch: { id: number; name: string } | null
  warehouse: { id: number; name: string } | null
  location_name: string
  total_purchase: number
}

export function AsetPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<AssetItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [depreciating, setDepreciating] = useState(false)
  const [deprecDate, setDeprecDate] = useState(new Date().toISOString().split('T')[0])

  const [formCode, setFormCode] = useState("")
  const [formName, setFormName] = useState("")
  const [formCategory, setFormCategory] = useState("peralatan")
  const [formPrice, setFormPrice] = useState("")
  const [formLife, setFormLife] = useState("60")
  const [formQty, setFormQty] = useState("1")
  const [formDate, setFormDate] = useState("")
  const [editingId, setEditingId] = useState<number | null>(null)

  const loadData = () => {
    setLoading(true)
    api.get<{ data: AssetItem[] }>("/fixed-assets")
      .then(r => setItems(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(loadData, [])

  const handleDepreciate = async () => {
    setDepreciating(true)
    try {
      const res = await api.post<{ message: string }>("/run-depreciation", { date: deprecDate })
      toast(res.message)
      loadData()
    } catch (err) {
      console.error(err)
    } finally {
      setDepreciating(false)
    }
  }

  const handleEdit = (item: AssetItem) => {
    setEditingId(item.id)
    setFormCode(item.code)
    setFormName(item.name)
    setFormCategory(item.category)
    setFormPrice(String(Number(item.purchase_price)))
    setFormLife(String(item.useful_life_months))
    setFormQty(String(item.quantity))
    setFormDate(item.purchase_date)
    setOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        code: formCode,
        name: formName,
        category: formCategory,
        purchase_price: Number(formPrice),
        useful_life_months: Number(formLife),
        quantity: Number(formQty),
        purchase_date: formDate,
      }
      if (editingId) {
        await api.put(`/fixed-assets/${editingId}`, payload)
      } else {
        await api.post("/fixed-assets", payload)
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

  const resetForm = () => {
    setEditingId(null)
    setFormCode("")
    setFormName("")
    setFormCategory("peralatan")
    setFormPrice("")
    setFormLife("60")
    setFormQty("1")
    setFormDate("")
  }

  const filtered = items.filter(i =>
    i.name?.toLowerCase().includes(search.toLowerCase()) ||
    i.category?.toLowerCase().includes(search.toLowerCase()) ||
    i.code?.toLowerCase().includes(search.toLowerCase())
  )

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { active: "bg-emerald-500/10 text-emerald-500", depreciated: "bg-blue-500/10 text-blue-500", disposed: "bg-red-500/10 text-red-500", service: "bg-amber-500/10 text-amber-500", lost: "bg-gray-600/10 text-gray-600", damaged: "bg-rose-600/10 text-rose-600" }
    return map[s] || "bg-gray-500/10 text-gray-500"
  }

  // Summary calculations
  const totalCount = items.length
  const totalPurchaseValue = items.reduce((sum, i) => sum + Number(i.total_purchase || 0), 0)
  const activeCount = items.filter(i => i.status === 'active' || i.status === 'depreciated').length
  const totalActivePurchaseValue = items
    .filter(i => i.status === 'active' || i.status === 'depreciated')
    .reduce((sum, i) => sum + Number(i.total_purchase || 0), 0)

  const formatRp = (v: number) => `Rp ${v.toLocaleString('id-ID')}`

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manajemen Aset Tetap</h1>
          <p className="text-sm text-muted-foreground">{items.length} aset terdaftar</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Input type="date" value={deprecDate} onChange={(e) => setDeprecDate(e.target.value)} className="flex-1 sm:w-40 sm:flex-none text-xs h-9" />
            <Button variant="outline" size="sm" onClick={handleDepreciate} disabled={depreciating} className="text-xs shrink-0">
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${depreciating ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Proses Penyusutan</span>
              <span className="sm:hidden">Penyusutan</span>
            </Button>
          </div>
          <Button size="sm" onClick={() => setOpen(true)} className="shrink-0">
            Tambah Aset
          </Button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Aset</p>
              <p className="text-xl font-bold">{totalCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Nilai Perolehan</p>
              <p className="text-xl font-bold">{formatRp(totalPurchaseValue)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <FileText className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Aset Aktif</p>
              <p className="text-xl font-bold">{activeCount}</p>
              <p className="text-[10px] text-muted-foreground">{formatRp(totalActivePurchaseValue)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Cari aset..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Dialog Tambah */}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "Edit" : "Tambah"} Aset</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Kode Aset</Label><Input value={formCode} onChange={(e) => setFormCode(e.target.value)} placeholder="AST-001" /></div>
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select value={formCategory} onChange={(e) => setFormCategory(e.target.value)}>
                  <option value="peralatan">Peralatan</option>
                  <option value="kendaraan">Kendaraan</option>
                  <option value="bangunan">Bangunan</option>
                  <option value="elektronik">Elektronik</option>
                  <option value="lainnya">Lainnya</option>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Nama Aset</Label><Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Laptop Pro" /></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Harga</Label><Input type="number" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} placeholder="12000000" /></div>
              <div className="space-y-2"><Label>Masa (bln)</Label><Input type="number" value={formLife} onChange={(e) => setFormLife(e.target.value)} placeholder="60" /></div>
              <div className="space-y-2"><Label>Jumlah</Label><Input type="number" value={formQty} onChange={(e) => setFormQty(e.target.value)} placeholder="1" /></div>
            </div>
            <div className="space-y-2"><Label>Tgl Perolehan</Label><Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} /></div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={saving || !formCode || !formName || !formPrice}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null} Simpan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{search ? "Tidak ditemukan" : "Belum ada aset tetap"}</p>
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((item, idx) => {
                const monthlyDep = item.useful_life_months > 0
                  ? (Number(item.purchase_price) - Number(item.salvage_value || 0)) / item.useful_life_months
                  : 0
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
                  >
                    <div
                      className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                      onClick={() => navigate(`/aset/${item.id}`)}
                    >
                      {/* Nomor urut */}
                      <span className="text-xs font-mono text-muted-foreground w-6 shrink-0 text-right">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground hidden sm:inline">{item.code}</span>
                          <span className="font-medium text-sm truncate">{item.name}</span>
                          <Badge className={`${statusBadge(item.status)} border-none text-[10px]`}>{item.status}</Badge>
                          <Badge variant="secondary" className="text-[10px] hidden sm:inline-flex">{item.category}</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                          <span className="font-medium">{formatRp(Number(item.purchase_price))}</span>
                          {item.quantity > 1 && <span>x{item.quantity}</span>}
                          <span>Peny: Rp {Math.round(monthlyDep).toLocaleString('id-ID')}/bln</span>
                          {item.location_name !== '-' && <span>📍 {item.location_name}</span>}
                          {item.purchase_date && <span>{formatDate(item.purchase_date)}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-1 ml-4">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleEdit(item) }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {item.useful_life_months} bln
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
