import { useState, useEffect, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { api } from "@/lib/api"
import { useShowFilters } from "@/hooks/useShowFilters"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2, ArrowLeft, Save, Search, Warehouse, DollarSign, Calendar, Check, ChevronsUpDown, X, Eye, PackageCheck, RefreshCw, SlidersHorizontal } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { formatDate, formatDateTime } from "@/lib/date"


interface Supplier {
  id: number
  name: string
}

interface ProductUnit {
  id: number
  name: string
  conversion: number
  price: number
}

interface Product {
  id: number
  name: string
  sku: string
  cost_price: number
  units?: ProductUnit[]
}

interface WarehouseData {
  id: number
  name: string
}

interface PurchaseItem {
  product_id: number
  product_name: string
  product_sku: string
  qty: number            
  qty_display: number    
  cost_price: number     
  cost_display: number   
  warehouse_id: number
  unit_id?: number
  unit_name?: string
  conversion: number
  product_units: ProductUnit[]
}

interface WarehouseSection {
  warehouse_id: number
  warehouse_name: string
  items: PurchaseItem[]
}

interface PurchaseInvoice {
  id: number
  invoice_number: string
  invoice_date: string
  supplier: { name: string }
  total_amount: number
  payment_status: string
  status: string
  stock_mode: 'auto' | 'manual'
  processed_at: string | null
  items?: any[]
  payments?: any[]
}

interface PaymentMethod {
  id: number
  name: string
  type: string
}

interface PayableInvoice {
  id: number
  invoice_number: string
  amount: number
  paid_amount: number
  payments: any[]
}

// --- Supplier Combobox ---
function SupplierSearch({ value, onChange, placeholder = "Pilih Supplier..." }: { value: number, onChange: (id: number) => void, placeholder?: string }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedName, setSelectedName] = useState(placeholder)

  const fetchSuppliers = useCallback(async (q: string) => {
    setLoading(true)
    try {
      const res: any = await api.get(`/suppliers?search=${q}`)
      setSuppliers(res.data ?? res)
    } catch (err) { toast.error("Gagal cari supplier") }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => fetchSuppliers(query), 300)
    return () => clearTimeout(timer)
  }, [query, fetchSuppliers])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between font-normal">
          {value ? selectedName : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Cari supplier..." onValueChange={setQuery} />
          <CommandList>
            <CommandEmpty>{loading ? "Mencari..." : "Supplier tidak ditemukan."}</CommandEmpty>
            <CommandGroup>
              <CommandItem onSelect={() => { onChange(0); setSelectedName("Semua Supplier"); setOpen(false) }}>Semua Supplier</CommandItem>
              {suppliers.map((s) => (
                <CommandItem
                  key={s.id}
                  value={String(s.id)}
                  onSelect={() => {
                    onChange(s.id)
                    setSelectedName(s.name)
                    setOpen(false)
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === s.id ? "opacity-100" : "opacity-0")} />
                  {s.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export function PurchasingPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  
  const [view, setView] = useState<"list" | "create" | "detail">("list")
  const [data, setData] = useState<PurchaseInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Master Data
  const [products, setProducts] = useState<Product[]>([])
  const [warehouses, setWarehouses] = useState<WarehouseData[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])

  // Filters
  const [showFilters, toggleFilters] = useShowFilters(true)
  const [filters, setFilters] = useState({
    start_date: "",
    end_date: "",
    payment_status: "all",
    warehouse_id: "all",
    supplier_id: 0,
    payment_method_id: "all"
  })

  // Form State
  const [form, setForm] = useState({
    supplier_id: 0,
    invoice_number: "",
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: "",
    sections: [] as WarehouseSection[],
    pay_now: false,
    payment_method_id: 0,
    paid_amount: 0,
    reference_no: "",
    stock_mode: 'auto' as 'auto' | 'manual'
  })

  // Detail State
  const [detailItem, setDetailItem] = useState<PurchaseInvoice | null>(null)
  const [payableDetail, setPayableDetail] = useState<PayableInvoice | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentForm, setPaymentForm] = useState({ amount: 0, payment_method_id: 0, reference_no: "" })

  const [stats, setStats] = useState<any>({
    total_purchasing: 0, total_paid: 0, total_unpaid: 0, total_invoices: 0,
    sync: { is_synced: true, payments_synced: true, purchase_journals: 0, payment_journals: 0 }
  })

  const fetchStats = async () => {
    try {
      const res: any = await api.get("/purchase-invoices/stats")
      setStats(res.data ?? res)
    } catch (err) { console.error(err) }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.start_date) params.append('start_date', filters.start_date)
      if (filters.end_date) params.append('end_date', filters.end_date)
      if (filters.payment_status !== 'all') params.append('payment_status', filters.payment_status)
      if (filters.supplier_id) params.append('supplier_id', String(filters.supplier_id))
      if (filters.warehouse_id !== 'all') params.append('warehouse_id', filters.warehouse_id)
      if (filters.payment_method_id !== 'all') params.append('payment_method_id', filters.payment_method_id)

      const res: any = await api.get(`/purchase-invoices?${params.toString()}`)
      setData(res.data ?? res)
    } catch (err) { toast.error("Gagal muat data pembelian") }
    finally { setLoading(false) }
  }

  const fetchMaster = async () => {
    try {
      const [resP, resW, resPM]: any = await Promise.all([
        api.get("/products"),
        api.get("/warehouses"),
        api.get("/payment-methods")
      ])
      setProducts(resP.data ?? resP)
      setWarehouses(resW.data ?? resW)
      setPaymentMethods(resPM.data?.data ?? resPM.data ?? resPM)
    } catch (err) { toast.error("Gagal muat master data") }
  }

  const fetchDetail = async (id: number) => {
    setLoading(true)
    try {
      const resInv: any = await api.get(`/purchase-invoices/${id}`)
      setDetailItem(resInv.data ?? resInv)
      
      const resPayables: any = await api.get(`/payables`)
      const payables = resPayables.data?.data ?? resPayables.data ?? []
      const matchedPayable = payables.find((p: any) => p.invoice_number === (resInv.data?.invoice_number || resInv.invoice_number))
      
      if (matchedPayable) {
        const resPayableDetail: any = await api.get(`/payables/${matchedPayable.id}`)
        setPayableDetail(resPayableDetail.data ?? resPayableDetail)
      } else { setPayableDetail(null) }
    } catch (err) { toast.error("Gagal muat detail invoice") }
    finally { setLoading(false) }
  }

  useEffect(() => { 
    fetchData(); fetchStats(); fetchMaster();
  }, [])

  // Load detail if URL has :id
  useEffect(() => {
    if (id) {
      setView("detail")
      fetchDetail(Number(id))
    } else {
      if (view === "detail") setView("list")
      setDetailItem(null)
      setPayableDetail(null)
    }
  }, [id])

  useEffect(() => {
    fetchData()
  }, [filters])

  const addSection = (warehouseId: number) => {
    if (form.sections.some(s => s.warehouse_id === warehouseId)) return
    const w = warehouses.find(w => w.id === warehouseId)
    setForm(prev => ({
      ...prev,
      sections: [...prev.sections, { warehouse_id: warehouseId, warehouse_name: w?.name || "", items: [] }]
    }))
  }

  const addItem = (sectionIdx: number, p: Product) => {
    const units = p.units || []
    const defaultUnit = units[0] || null
    const conversion = defaultUnit ? defaultUnit.conversion : 1
    const costDisplay = defaultUnit && Number(defaultUnit.price) > 0 ? Number(defaultUnit.price) : Number(p.cost_price) * conversion
    
    setForm(prev => ({
      ...prev,
      sections: prev.sections.map((sec, si) => 
        si === sectionIdx ? {
          ...sec,
          items: [...sec.items, {
            product_id: p.id, product_name: p.name, product_sku: p.sku,
            qty: 1 * conversion, qty_display: 1, cost_price: costDisplay / conversion, cost_display: costDisplay,
            warehouse_id: sec.warehouse_id, unit_id: defaultUnit?.id, unit_name: defaultUnit?.name || "Pcs",
            conversion, product_units: units
          }]
        } : sec
      )
    }))
    toast.success(`Ditambahkan: ${p.name}`)
  }

  const updateItemField = (sectionIdx: number, itemIdx: number, field: string, value: any) => {
    setForm(prev => ({
      ...prev,
      sections: prev.sections.map((sec, si) => 
        si === sectionIdx ? {
          ...sec,
          items: sec.items.map((item, ii) => {
            if (ii !== itemIdx) return item
            if (field === 'unit_id') {
              const unit = item.product_units.find(u => u.id === Number(value))
              const conv = unit ? unit.conversion : 1
              const newCost = unit && Number(unit.price) > 0 ? Number(unit.price) : item.cost_display
              return { ...item, unit_id: unit?.id, unit_name: unit?.name, conversion: conv, qty: item.qty_display * conv, cost_display: newCost, cost_price: newCost / conv }
            }
            if (field === 'qty_display') {
              const q = Number(value) || 0
              return { ...item, qty_display: q, qty: q * item.conversion }
            }
            if (field === 'cost_display') {
              const c = Number(value) || 0
              return { ...item, cost_display: c, cost_price: item.conversion > 0 ? c / item.conversion : c }
            }
            return { ...item, [field]: value }
          })
        } : sec
      )
    }))
  }

  const calculateTotal = () => form.sections.reduce((t, s) => t + s.items.reduce((sub, i) => sub + (i.qty * i.cost_price), 0), 0)

  const handleSubmit = async () => {
    if (!form.supplier_id) return toast.error("Pilih supplier")
    if (form.sections.length === 0 || form.sections.every(s => s.items.length === 0)) return toast.error("Tambahkan minimal 1 item")
    
    setSubmitting(true)
    try {
      const total = calculateTotal()
      await api.post("/purchase-invoices", {
        ...form,
        total_amount: total,
        paid_amount: form.pay_now ? (form.paid_amount || total) : 0,
        items: form.sections.flatMap(s => s.items.map(i => ({
          product_id: i.product_id, qty: i.qty, cost_price: i.cost_price, warehouse_id: s.warehouse_id
        })))
      })
      toast.success("Invoice pembelian berhasil disimpan")
      setView("list"); fetchData(); fetchStats()
      setForm({ supplier_id: 0, invoice_number: "", invoice_date: new Date().toISOString().split('T')[0], due_date: "", sections: [], pay_now: false, payment_method_id: 0, paid_amount: 0, reference_no: "", stock_mode: 'auto' })
    } catch (err: any) { toast.error(err.message || "Gagal simpan invoice") }
    finally { setSubmitting(false) }
  }

  const handleProcessStock = async (id: number) => {
    try {
      await api.post(`/purchase-invoices/${id}/process-stock`)
      toast.success("Stok berhasil diproses ke gudang")
      fetchData(); fetchStats();
      if (view === "detail") fetchDetail(id)
    } catch (err: any) { toast.error(err.message || "Gagal proses stok") }
  }

  const handleReissueStock = async (id: number) => {
    try {
      await api.post(`/purchase-invoices/${id}/reissue-stock`)
      toast.success("Reissue stok berhasil — stok yang belum masuk telah ditambahkan")
      fetchData(); fetchStats();
      if (view === "detail") fetchDetail(id)
    } catch (err: any) { toast.error(err.message || "Gagal reissue stok") }
  }

  const handlePaymentSubmit = async () => {
    if (!payableDetail) return
    if (paymentForm.amount <= 0) return toast.error("Nominal tidak valid")
    try {
      await api.post(`/payables/${payableDetail.id}/pay`, {
        amount: paymentForm.amount,
        payment_method_id: paymentForm.payment_method_id || null,
        reference_no: paymentForm.reference_no
      })
      toast.success("Pembayaran berhasil")
      setShowPaymentModal(false); fetchDetail(detailItem!.id)
    } catch (err: any) { toast.error(err.message || "Gagal bayar") }
  }

  const resetFilters = () => {
    setFilters({ start_date: "", end_date: "", payment_status: "all", warehouse_id: "all", supplier_id: 0, payment_method_id: "all" })
  }

  if (view === "create") {
    const total = calculateTotal()
    return (
      <div className="p-6 space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => setView("list")}><ArrowLeft className="h-4 w-4" /></Button>
            <h1 className="text-3xl font-bold tracking-tight">Buat Invoice Baru</h1>
          </div>
          <Button onClick={handleSubmit} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700">
            {submitting ? "Menyimpan..." : <><Save className="mr-2 h-4 w-4" /> Simpan Invoice</>}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-lg">Informasi Dasar</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Supplier</label>
                  <SupplierSearch value={form.supplier_id} onChange={id => setForm({ ...form, supplier_id: id })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nomor Invoice</label>
                  <Input placeholder="INV/2026/..." value={form.invoice_number} onChange={e => setForm({ ...form, invoice_number: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tanggal</label>
                    <Input type="date" value={form.invoice_date} onChange={e => setForm({ ...form, invoice_date: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Jatuh Tempo</label>
                    <Input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
               <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center gap-2"><Warehouse className="h-5 w-5 text-amber-500" /> Mode Input Stok</CardTitle></CardHeader>
               <CardContent className="space-y-4">
                  <div className="flex flex-col gap-3">
                    <div className={cn("p-3 border rounded-lg cursor-pointer transition-all", form.stock_mode === 'auto' ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" : "hover:bg-muted")} onClick={() => setForm({...form, stock_mode: 'auto'})}>
                       <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-bold">Otomatis (Langsung)</span>
                          {form.stock_mode === 'auto' && <Check className="h-4 w-4 text-emerald-500" />}
                       </div>
                       <p className="text-[10px] text-muted-foreground leading-relaxed">Stok barang langsung ditambahkan ke gudang tujuan saat invoice disimpan.</p>
                    </div>
                    <div className={cn("p-3 border rounded-lg cursor-pointer transition-all", form.stock_mode === 'manual' ? "border-amber-500 bg-amber-50 dark:bg-amber-950/20" : "hover:bg-muted")} onClick={() => setForm({...form, stock_mode: 'manual'})}>
                       <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-bold">Cross-Check (Manual)</span>
                          {form.stock_mode === 'manual' && <Check className="h-4 w-4 text-amber-500" />}
                       </div>
                       <p className="text-[10px] text-muted-foreground leading-relaxed">Invoice disimpan tapi stok belum masuk. Perlu klik "Simpan Stok" setelah cek fisik selesai.</p>
                    </div>
                  </div>
               </CardContent>
            </Card>

            <Card className="border-emerald-100 dark:border-emerald-950">
              <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center gap-2"><DollarSign className="h-5 w-5 text-emerald-500" /> Pembayaran</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2 py-1">
                  <Checkbox id="pay_now" checked={form.pay_now} onCheckedChange={v => setForm({ ...form, pay_now: !!v, paid_amount: total })} />
                  <label htmlFor="pay_now" className="text-sm font-medium leading-none cursor-pointer">Bayar Sekarang (Lunas/DP)</label>
                </div>
                {form.pay_now && (
                  <div className="space-y-3 pt-2 animate-in slide-in-from-top-2 duration-300">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold">Nominal Bayar</label>
                      <Input type="number" value={form.paid_amount} onChange={e => setForm({ ...form, paid_amount: Number(e.target.value) })} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold">Metode</label>
                      <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm" value={form.payment_method_id} onChange={e => setForm({ ...form, payment_method_id: Number(e.target.value) })}>
                        <option value={0}>Pilih Metode...</option>
                        {paymentMethods.map(pm => <option key={pm.id} value={pm.id}>{pm.name}</option>)}
                      </select>
                    </div>
                  </div>
                )}
                <div className="pt-4 border-t space-y-2 text-sm">
                  <div className="flex justify-between"><span>Subtotal</span><span>Rp {total.toLocaleString()}</span></div>
                  <div className="flex justify-between font-bold text-lg text-emerald-600"><span>Total</span><span>Rp {total.toLocaleString()}</span></div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="py-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><Warehouse className="h-4 w-4" /> Distribusi Barang</CardTitle>
                <div className="flex gap-1.5">
                  {warehouses.map(w => (
                    <Button key={w.id} size="sm" variant={form.sections.some(s => s.warehouse_id === w.id) ? "default" : "outline"} onClick={() => addSection(w.id)}>{w.name}</Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-2">
                {form.sections.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground"><p>Pilih gudang di atas untuk mulai menambah barang</p></div>
                ) : form.sections.map((sec, si) => (
                  <div key={sec.warehouse_id} className="border rounded-lg overflow-hidden">
                    <div className="bg-muted/30 px-4 py-2 flex items-center justify-between border-b">
                      <span className="font-semibold text-sm">{sec.warehouse_name}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => setForm({ ...form, sections: form.sections.filter((_, i) => i !== si) })}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                    <div className="p-3 space-y-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Cari produk & Enter..." className="pl-9 h-9" onKeyDown={e => {
                          if (e.key === 'Enter') {
                            const p = products.find(x => x.name.toLowerCase().includes((e.target as any).value.toLowerCase()) || x.sku.toLowerCase().includes((e.target as any).value.toLowerCase()))
                            if (p) { addItem(si, p); (e.target as any).value = "" }
                            else toast.error("Produk tidak ditemukan")
                          }
                        }} />
                      </div>
                      <Table>
                        <TableHeader><TableRow><TableHead>Produk</TableHead><TableHead className="w-24">Unit</TableHead><TableHead className="w-16">Qty</TableHead><TableHead className="w-32">Harga</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {sec.items.map((item, ii) => (
                            <TableRow key={ii}>
                              <TableCell className="py-2"><div className="font-medium text-xs">{item.product_name}</div><div className="text-[10px] text-muted-foreground">{item.product_sku}</div></TableCell>
                              <TableCell className="py-2"><select className="h-7 w-full text-[10px] border rounded" value={item.unit_id} onChange={e => updateItemField(si, ii, 'unit_id', e.target.value)}>{item.product_units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></TableCell>
                              <TableCell className="py-2"><Input type="number" className="h-7 text-center px-1" value={item.qty_display} onChange={e => updateItemField(si, ii, 'qty_display', e.target.value)} /></TableCell>
                              <TableCell className="py-2"><Input type="number" className="h-7 px-2" value={item.cost_display} onChange={e => updateItemField(si, ii, 'cost_display', e.target.value)} /></TableCell>
                              <TableCell className="py-2 text-right font-mono text-xs">{(item.qty * item.cost_price).toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-emerald-200 dark:border-emerald-900 shadow-sm">
          <CardHeader className="pb-1"><CardTitle className="text-xs font-medium text-muted-foreground">Total Purchasing</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-emerald-600">Rp {Number(stats.total_purchasing).toLocaleString()}</p></CardContent>
        </Card>
        <Card className="border-blue-200 dark:border-blue-900 shadow-sm">
          <CardHeader className="pb-1"><CardTitle className="text-xs font-medium text-muted-foreground">Sudah Dibayar</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-blue-600">Rp {Number(stats.total_paid).toLocaleString()}</p></CardContent>
        </Card>
        <Card className="border-red-200 dark:border-red-900 shadow-sm">
          <CardHeader className="pb-1"><CardTitle className="text-xs font-medium text-muted-foreground">Belum Dibayar</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-red-600">Rp {Number(stats.total_unpaid).toLocaleString()}</p></CardContent>
        </Card>
        <Card className={cn("shadow-sm", stats.sync?.is_synced ? "border-green-200 dark:border-green-900" : "border-amber-200 dark:border-amber-900")}>
          <CardHeader className="pb-1"><CardTitle className="text-xs font-medium text-muted-foreground">Sync Akuntansi</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-2">
             <div className={cn("w-2 h-2 rounded-full", stats.sync?.is_synced ? "bg-green-500" : "bg-amber-500")} />
             <span className="font-bold text-sm">{stats.sync?.is_synced ? "Tersinkron" : "Perlu Review"}</span>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div><h1 className="text-3xl font-bold tracking-tight">Pembelian</h1><p className="text-sm text-muted-foreground">Riwayat dan pembuatan invoice pembelian supplier</p></div>
        <Button onClick={() => { setView("create"); fetchMaster() }}><Plus className="mr-2 h-4 w-4" /> Buat Invoice</Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-muted-foreground">Filter</h3>
            <Button variant="ghost" size="sm" onClick={toggleFilters} className="h-8 text-xs">
              <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" />
              {showFilters ? "Sembunyikan" : "Tampilkan"} Filter
            </Button>
          </div>
          {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap items-center gap-3 mt-2">
            <div className="flex items-center gap-2 border rounded-md px-2 py-1 bg-muted/20 w-full lg:w-auto">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input type="date" className="h-8 flex-1 lg:w-32 border-0 bg-transparent focus-visible:ring-0 text-xs" value={filters.start_date} onChange={e => setFilters({...filters, start_date: e.target.value})} />
              <span className="text-xs text-muted-foreground">s/d</span>
              <Input type="date" className="h-8 flex-1 lg:w-32 border-0 bg-transparent focus-visible:ring-0 text-xs" value={filters.end_date} onChange={e => setFilters({...filters, end_date: e.target.value})} />
            </div>

            <div className="w-full lg:w-48">
              <SupplierSearch value={filters.supplier_id} onChange={id => setFilters({...filters, supplier_id: id})} placeholder="Cari Supplier..." />
            </div>

            <select className="flex h-9 w-full lg:w-36 rounded-md border border-input bg-background px-3 py-1 text-xs" value={filters.payment_status} onChange={e => setFilters({...filters, payment_status: e.target.value})}>
              <option value="all">Semua Status</option>
              <option value="paid">Lunas</option>
              <option value="unpaid">Belum Lunas</option>
              <option value="partial">Parsial</option>
            </select>

            <select className="flex h-9 w-full lg:w-36 rounded-md border border-input bg-background px-3 py-1 text-xs" value={filters.warehouse_id} onChange={e => setFilters({...filters, warehouse_id: e.target.value})}>
              <option value="all">Semua Gudang</option>
              {warehouses.map(w => <option key={w.id} value={String(w.id)}>{w.name}</option>)}
            </select>

            <select className="flex h-9 w-full lg:w-40 rounded-md border border-input bg-background px-3 py-1 text-xs" value={filters.payment_method_id} onChange={e => setFilters({...filters, payment_method_id: e.target.value})}>
              <option value="all">Semua Metode</option>
              {paymentMethods.map(pm => <option key={pm.id} value={String(pm.id)}>{pm.name}</option>)}
            </select>

            <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground hover:text-red-500 w-full lg:w-auto justify-center"><X className="h-4 w-4 mr-1" /> Reset</Button>
          </div>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead className="w-12 text-center">No</TableHead><TableHead>No. Invoice</TableHead><TableHead>Tanggal</TableHead><TableHead>Supplier</TableHead><TableHead className="text-right">Total</TableHead><TableHead>Status Stok</TableHead><TableHead>Status Bayar</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={8} className="text-center py-10">Memuat data...</TableCell></TableRow> : data.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground italic">Tidak ada data ditemukan</TableCell></TableRow> : data.map((inv, idx) => (
                <TableRow key={inv.id}>
                  <TableCell className="text-center text-xs text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell className="font-mono text-xs">{inv.invoice_number}</TableCell>
                  <TableCell className="text-sm">{formatDate(inv.invoice_date)}</TableCell>
                  <TableCell className="text-sm font-medium">{inv.supplier?.name}</TableCell>
                  <TableCell className="text-right font-mono text-sm">Rp {Number(inv.total_amount).toLocaleString()}</TableCell>
                  <TableCell>
                    {inv.processed_at ? (
                       <Badge variant="outline" className="border-emerald-500 text-emerald-600 bg-emerald-50"><Check className="h-3 w-3 mr-1" /> Terinput</Badge>
                    ) : (
                       <Badge variant="outline" className="border-amber-500 text-amber-600 bg-amber-50 animate-pulse"><Calendar className="h-3 w-3 mr-1" /> Pending</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={inv.payment_status === 'paid' ? 'default' : inv.payment_status === 'partial' ? 'outline' : 'destructive'} className={inv.payment_status === 'paid' ? 'bg-emerald-500' : ''}>
                      {inv.payment_status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {!inv.processed_at && (
                         <Button variant="outline" size="sm" className="h-8 border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100" onClick={() => handleProcessStock(inv.id)}><PackageCheck className="h-4 w-4 mr-1" /> Simpan Stok</Button>
                      )}
                      <Button variant="ghost" size="sm" className="h-8" onClick={() => navigate(`/purchasing/${inv.id}`)}><Eye className="h-4 w-4 mr-1" /> Detail</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {view === "detail" && detailItem && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="fixed inset-y-0 right-0 w-full max-w-4xl bg-background border-l shadow-2xl p-4 md:p-6 overflow-y-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" onClick={() => navigate("/purchasing")}><ArrowLeft className="h-4 w-4" /></Button>
                <h2 className="text-xl md:text-2xl font-bold">Detail {detailItem.invoice_number}</h2>
              </div>
              <div className="flex gap-2 ml-9 sm:ml-0">
                 <Badge variant="outline" className={cn(detailItem.processed_at ? "border-emerald-500 text-emerald-600" : "border-amber-500 text-amber-600")}>
                   {detailItem.processed_at ? "Stok Terinput" : "Pending Stok"}
                 </Badge>
                 <Badge className="bg-blue-500">{detailItem.payment_status.toUpperCase()}</Badge>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
              <div className="p-4 border rounded-lg bg-muted/20">
                 <div className="text-[10px] text-muted-foreground uppercase font-semibold">Supplier</div>
                 <div className="text-base font-bold">{detailItem.supplier?.name}</div>
              </div>
              <div className="p-4 border rounded-lg bg-muted/20">
                 <div className="text-[10px] text-muted-foreground uppercase font-semibold">Tanggal</div>
                 <div className="text-base font-bold">{formatDate(detailItem.invoice_date)}</div>
              </div>
              <div className="p-4 border rounded-lg bg-muted/20">
                 <div className="text-[10px] text-muted-foreground uppercase font-semibold">Input Stok</div>
                 <div className="text-xs font-medium">{detailItem.stock_mode === 'auto' ? "Otomatis" : "Manual (Cek Fisik)"}</div>
              </div>
              <div className="p-4 border rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                 <div className="text-[10px] text-emerald-600 font-semibold uppercase">Total Invoice</div>
                 <div className="text-lg font-black text-emerald-600">Rp {Number(detailItem.total_amount).toLocaleString()}</div>
              </div>
            </div>

            {!detailItem.processed_at && (
               <div className="mb-6 p-4 border border-amber-200 bg-amber-50 dark:bg-amber-950/20 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-amber-800 dark:text-amber-400">Verifikasi Stok Pending</h4>
                    <p className="text-xs text-amber-700 dark:text-amber-500 leading-relaxed">Invoice sudah dicatat tapi stok belum masuk ke gudang. Klik tombol di samping setelah barang selesai dicek.</p>
                  </div>
                  <Button className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white" onClick={() => handleProcessStock(detailItem.id)}><PackageCheck className="mr-2 h-4 w-4" /> Simpan Stok Sekarang</Button>
               </div>
            )}

            {detailItem.processed_at && (
               <div className="mb-6 p-4 border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-emerald-800 dark:text-emerald-400">Stok Sudah Diproses</h4>
                    <p className="text-xs text-emerald-700 dark:text-emerald-500 leading-relaxed">Stok dari transaksi ini sudah diproses. Jika ada item yang stoknya tidak masuk (misalnya karena error sistem), klik Reissue Stok untuk mengisi data yang kurang.</p>
                  </div>
                  <Button variant="outline" className="w-full sm:w-auto border-emerald-600 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/40" onClick={() => handleReissueStock(detailItem.id)}><RefreshCw className="mr-2 h-4 w-4" /> Reissue Stok</Button>
               </div>
            )}
 
            <Card className="mb-6">
              <CardHeader className="py-3"><CardTitle className="text-sm">Rincian Barang</CardTitle></CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <Table className="min-w-[600px] md:min-w-full">
                   <TableHeader><TableRow><TableHead>Item</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Harga</TableHead><TableHead className="text-right">Subtotal</TableHead></TableRow></TableHeader>
                   <TableBody>
                     {detailItem.items?.map((it:any, idx:number) => (
                       <TableRow key={idx}>
                         <TableCell><div className="font-medium text-sm">{it.product?.name}</div><div className="text-[10px] text-muted-foreground">{it.product?.sku} • {it.warehouse?.name}</div></TableCell>
                         <TableCell className="text-right text-sm">{it.qty} Pcs</TableCell>
                         <TableCell className="text-right font-mono text-xs">Rp {Number(it.cost_price).toLocaleString()}</TableCell>
                         <TableCell className="text-right font-mono font-bold text-sm">Rp {(it.qty * it.cost_price).toLocaleString()}</TableCell>
                       </TableRow>
                     ))}
                   </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="border-blue-100 dark:border-blue-950">
               <CardHeader className="py-3 flex flex-row items-center justify-between border-b bg-blue-50/50 dark:bg-blue-950/20">
                 <CardTitle className="text-sm flex items-center gap-2"><DollarSign className="h-4 w-4" /> Ringkasan Pembayaran</CardTitle>
                 {payableDetail && (Number(payableDetail.amount) > Number(payableDetail.paid_amount)) && (
                   <Button size="sm" onClick={() => { setPaymentForm({ amount: Number(payableDetail.amount) - Number(payableDetail.paid_amount), payment_method_id: 0, reference_no: "" }); fetchMaster(); setShowPaymentModal(true) }}>Bayar Sisa Tagihan</Button>
                 )}
               </CardHeader>
               <CardContent className="pt-4 space-y-3">
                 {payableDetail ? (
                   <>
                     <div className="flex justify-between text-sm"><span>Sudah Dibayar</span><span className="font-bold text-emerald-600">Rp {Number(payableDetail.paid_amount).toLocaleString()}</span></div>
                     <div className="flex justify-between text-sm"><span>Sisa Tagihan</span><span className="font-bold text-red-500">Rp {(Number(payableDetail.amount) - Number(payableDetail.paid_amount)).toLocaleString()}</span></div>
                     
                     <div className="mt-4 pt-4 border-t">
                        <div className="text-xs font-bold uppercase text-muted-foreground mb-3">Riwayat Pembayaran</div>
                        {payableDetail.payments?.map((p:any, i:number) => (
                          <div key={i} className="flex justify-between items-center py-2 border-b last:border-0 text-xs">
                             <div className="flex items-center gap-2"><Calendar className="h-3 w-3" /> <span>{formatDateTime(p.created_at || p.date)}</span> <span className="text-muted-foreground">• {p.payment_method?.name || "Cash"} • {p.reference_no}</span></div>
                             <div className="font-bold">Rp {Number(p.amount).toLocaleString()}</div>
                          </div>
                        ))}
                     </div>
                   </>
                 ) : <p className="text-center text-muted-foreground py-6 italic text-sm">Data hutang/pembayaran belum tersedia</p>}
               </CardContent>
            </Card>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 animate-in zoom-in-95 duration-200">
           <Card className="w-full max-w-sm">
              <CardHeader><CardTitle>Catat Pembayaran</CardTitle><CardDescription>Input nominal dan metode pembayaran</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                 <div className="space-y-1.5"><label className="text-xs font-bold">Nominal</label><Input type="number" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: Number(e.target.value)})} /></div>
                 <div className="space-y-1.5"><label className="text-xs font-bold">Metode</label>
                   <select className="w-full h-9 border rounded px-3 text-sm" value={paymentForm.payment_method_id} onChange={e => setPaymentForm({...paymentForm, payment_method_id: Number(e.target.value)})}>
                     <option value={0}>Pilih Metode...</option>
                     {paymentMethods.map(pm => <option key={pm.id} value={pm.id}>{pm.name}</option>)}
                   </select>
                 </div>
                 <div className="space-y-1.5"><label className="text-xs font-bold">Referensi</label><Input placeholder="No. Transfer / Note" value={paymentForm.reference_no} onChange={e => setPaymentForm({...paymentForm, reference_no: e.target.value})} /></div>
                 <div className="flex justify-end gap-2 pt-2">
                    <Button variant="ghost" onClick={() => setShowPaymentModal(false)}>Batal</Button>
                    <Button onClick={handlePaymentSubmit}>Simpan Pembayaran</Button>
                 </div>
              </CardContent>
           </Card>
        </div>
      )}
    </div>
  )
}
