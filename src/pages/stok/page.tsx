import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, SlidersHorizontal, ChevronDown, ChevronRight, Package, Store, Warehouse, TrendingUp, TrendingDown, DollarSign } from "lucide-react"
import { useShowFilters } from "@/hooks/useShowFilters"
import { formatMultiSatuan } from "@/lib/multi-unit"

interface Supplier {
  id: number
  name: string
}

interface MultiUnit {
  unit_name: string
  conversion: number
  qty: number
  price: number
}

interface StockPerLoc {
  branch_id: number | null
  warehouse_id: number | null
  stock: number
}

interface StockItem {
  id: number
  sku: string
  name: string
  barcode: string
  unit_name: string
  price: number
  stock: number
  stock_value: number
  supplier_name: string
  first_in: string | null
  last_in: string | null
  total_in: number
  total_out: number
  total_remaining: number
  multi_unit: MultiUnit[]
  stock_per_loc: StockPerLoc[]
}

interface StockReportResponse {
  data: StockItem[]
  current_page?: number
  last_page?: number
  total?: number
  per_page?: number
  totals: {
    total_products: number
    total_stock: number
    total_stock_value: number
    total_in: number
    total_out: number
  }
  suppliers: Supplier[]
}

export function StokPage() {
  const [report, setReport] = useState<StockReportResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [supplierId, setSupplierId] = useState("")
  const [branchId, setBranchId] = useState("")
  const [warehouseId, setWarehouseId] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [showFilters, toggleFilters] = useShowFilters(true)

  const [branches, setBranches] = useState<{id:number,name:string}[]>([])
  const [warehouses, setWarehouses] = useState<{id:number,name:string}[]>([])

  const [page, setPage] = useState(1)

  const loadLookups = async () => {
    try {
      const [bRes, wRes] = await Promise.all([
        api.get("/branches") as Promise<any>,
        api.get("/warehouses") as Promise<any>,
      ])
      if (Array.isArray(bRes?.data)) setBranches(bRes.data)
      else if (Array.isArray(bRes)) setBranches(bRes)
      if (Array.isArray(wRes?.data)) setWarehouses(wRes.data)
      else if (Array.isArray(wRes)) setWarehouses(wRes)
    } catch (e) {
      console.error("Failed to load branches/warehouses", e)
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", String(page))
      if (search) params.set("search", search)
      if (supplierId) params.set("supplier_id", supplierId)
      if (branchId) params.set("branch_id", branchId)
      if (warehouseId) params.set("warehouse_id", warehouseId)
      if (startDate) params.set("start_date", startDate)
      if (endDate) params.set("end_date", endDate)
      const qs = params.toString()
      const url = `/stock-report${qs ? `?${qs}` : ""}`
      const res: any = await api.get(url)
      setReport(res)
    } catch (err: any) {
      console.error(err)
      if (err?.status === 401 || err?.response?.status === 401) {
        localStorage.removeItem("token")
        window.location.href = "/login"
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLookups()
  }, [])

  useEffect(() => {
    fetchData()
  }, [page])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (page === 1) {
      fetchData()
    } else {
      setPage(1) // This will trigger fetchData via useEffect
    }
  }

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const data = report?.data ?? []
  const totals = report?.totals
  const suppliers = report?.suppliers ?? []

  const formatRp = (val: number) =>
    `Rp ${val.toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

  const formatDate = (d: string | null) => {
    if (!d) return "-"
    return new Date(d).toLocaleDateString("id-ID", { year: "numeric", month: "short", day: "numeric" })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stok</h1>
          <p className="text-sm text-muted-foreground">
            Laporan stok produk lengkap dengan filter, nominal rupiah & multi satuan
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950">
              <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Produk</p>
              <p className="text-xl font-bold">{totals?.total_products ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950">
              <TrendingDown className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Stok (Qty)</p>
              <p className="text-xl font-bold">{totals?.total_stock.toLocaleString("id-ID") ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950">
              <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Masuk</p>
              <p className="text-xl font-bold">{totals?.total_in.toLocaleString("id-ID") ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-950">
              <DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Nilai Stok (Rp)</p>
              <p className="text-xl font-bold">{formatRp(totals?.total_stock_value ?? 0)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground">Filter</h3>
            <Button variant="ghost" size="sm" onClick={toggleFilters} className="h-8 text-xs">
              <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" />
              {showFilters ? "Sembunyikan" : "Tampilkan"} Filter
            </Button>
          </div>
          {showFilters && (
            <form onSubmit={handleSearch} className="grid grid-cols-1 sm:flex sm:flex-wrap items-end gap-3 mt-3">
              <div className="relative w-full sm:flex-1 sm:min-w-[200px] sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama produk, SKU, barcode..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 w-full"
                />
              </div>
              <div className="w-full sm:min-w-[180px] sm:w-auto">
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={supplierId}
                  onChange={(e) => { setSupplierId(e.target.value); setPage(1) }}
                >
                  <option value="">Semua Supplier</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="w-full sm:min-w-[150px] sm:w-auto">
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={branchId}
                  onChange={(e) => {
                    setBranchId(e.target.value)
                    if (e.target.value) setWarehouseId("") // reset gudang jika pilih cabang
                    setPage(1)
                  }}
                >
                  <option value="">Semua Cabang</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div className="w-full sm:min-w-[150px] sm:w-auto">
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={warehouseId}
                  onChange={(e) => {
                    setWarehouseId(e.target.value)
                    if (e.target.value) setBranchId("") // reset cabang jika pilih gudang
                    setPage(1)
                  }}
                >
                  <option value="">Semua Gudang</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground px-1 sm:hidden">Dari</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => { setStartDate(e.target.value); setPage(1) }}
                    className="h-9 w-full sm:w-[150px]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground px-1 sm:hidden">Sampai</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => { setEndDate(e.target.value); setPage(1) }}
                    className="h-9 w-full sm:w-[150px]"
                  />
                </div>
              </div>
              <Button type="submit" size="sm" className="h-9 w-full sm:w-auto">Terapkan</Button>
            </form>
          )}
        </div>
      </Card>

      {/* Tabel Stok */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : data.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-2 opacity-20" />
              Tidak ada data stok
            </div>
          ) : (
            <div className="divide-y">
              {data.map((item, idx) => {
                const isExpanded = expanded.has(item.id)
                return (
                  <div key={item.id}>
                    {/* Main row */}
                    <div
                      className="flex flex-col sm:grid sm:grid-cols-12 items-start sm:items-center gap-2 sm:gap-4 px-4 sm:px-6 py-4 hover:bg-muted/50 transition-colors cursor-pointer border-b border-border/50 last:border-0"
                      onClick={() => toggleExpand(item.id)}
                    >
                      {/* Index - Desktop Only (Col 1) */}
                      <span className="hidden sm:block col-span-1 text-xs font-mono text-muted-foreground text-center">
                        {idx + 1 + (page - 1) * (report?.per_page || 15)}
                      </span>

                      {/* Product Name & Identity (Col 2-6) */}
                      <div className="col-span-12 sm:col-span-5 min-w-0 w-full">
                        <div className="flex items-start justify-between sm:justify-start gap-3">
                          <div className="min-w-0">
                            <p className="font-bold text-sm sm:text-base text-foreground leading-snug break-words">
                              {item.name}
                            </p>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] sm:text-xs text-muted-foreground mt-1">
                              <span className="font-mono bg-muted px-1 rounded">{item.sku}</span>
                              {item.barcode && <span className="font-mono">| {item.barcode}</span>}
                              <span className="hidden sm:inline">| {item.unit_name}</span>
                            </div>
                          </div>
                          
                          {/* Mobile Stock & Chevron (Only visible on mobile) */}
                          <div className="flex sm:hidden flex-col items-end shrink-0 pt-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-bold text-primary">{item.stock.toLocaleString("id-ID")}</span>
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                            <span className="text-[10px] text-muted-foreground uppercase">{item.unit_name}</span>
                          </div>

                          {/* Desktop Chevron (Only visible on desktop) */}
                          <div className="hidden sm:block shrink-0">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                        
                        {/* Mobile Summary Row (Hidden on desktop) */}
                        <div className="sm:hidden grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-border/30">
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase">Nilai Stok</p>
                              <p className="text-xs font-semibold">{formatRp(item.stock_value)}</p>
                            </div>
                            {item.multi_unit.length > 0 && (
                              <div className="text-right">
                                <p className="text-[10px] text-muted-foreground uppercase">Satuan</p>
                                <p className="text-xs font-semibold">{item.multi_unit.length} Multi Satuan</p>
                              </div>
                            )}
                        </div>
                      </div>

                      {/* Desktop Columns (Col 7-12) */}
                      
                      {/* Qty (Col 7-8) */}
                      <div className="hidden sm:block col-span-2 text-right px-2">
                        <p className="text-sm font-bold text-foreground">{item.stock.toLocaleString("id-ID")}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">{item.unit_name}</p>
                      </div>

                      {/* Value (Col 9-10) */}
                      <div className="hidden sm:block col-span-2 text-right px-2">
                        <p className="text-sm font-bold text-primary">{formatRp(item.stock_value)}</p>
                        <p className="text-[10px] text-muted-foreground truncate" title={item.supplier_name}>
                          {item.supplier_name}
                        </p>
                      </div>

                      {/* Flow & Badges (Col 11-12) */}
                      <div className="hidden sm:flex col-span-2 flex-col items-end gap-1 px-2">
                        <div className="flex flex-col items-end leading-none">
                          {item.total_in > 0 && (
                            <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                              +{item.total_in.toLocaleString("id-ID")}
                            </span>
                          )}
                          {item.total_out > 0 && (
                            <span className="text-[10px] font-medium text-red-500 dark:text-red-400">
                              -{item.total_out.toLocaleString("id-ID")}
                            </span>
                          )}
                        </div>
                        {item.multi_unit.length > 0 && (
                          <Badge variant="secondary" className="h-4 px-1.5 text-[9px] uppercase font-bold">
                            {item.multi_unit.length} Satuan
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="bg-muted/30 px-4 pb-4 space-y-3">
                        {/* Info umum */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
                          <div>
                            <p className="text-[10px] font-semibold uppercase text-muted-foreground">Supplier</p>
                            <p className="text-sm">{item.supplier_name || "-"}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold uppercase text-muted-foreground">Pertama Masuk</p>
                            <p className="text-sm">{formatDate(item.first_in)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold uppercase text-muted-foreground">Terakhir Masuk</p>
                            <p className="text-sm">{formatDate(item.last_in)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold uppercase text-muted-foreground">Sisa Stok</p>
                            <p className="text-sm font-semibold">{item.total_remaining.toLocaleString("id-ID")} {item.unit_name}</p>
                          </div>
                        </div>

                        {/* Multi Satuan */}
                        {item.multi_unit.length > 0 && (
                          <div>
                            <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-2 flex items-center gap-1.5">
                              <Package className="h-3 w-3" /> Multi Satuan
                            </p>
                            <p className="text-sm font-semibold">
                              {formatMultiSatuan(item.stock, item.multi_unit, item.unit_name)}
                            </p>
                          </div>
                        )}

                        {/* Stock per location */}
                        {item.stock_per_loc.length > 0 && (
                          <div>
                            <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-2 flex items-center gap-1.5">
                              <Warehouse className="h-3 w-3" /> Stok per Lokasi
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {item.stock_per_loc.map((loc, i) => (
                                <Badge key={i} variant="outline" className="text-xs gap-1">
                                  {loc.branch_id ? <Store className="h-3 w-3" /> : <Warehouse className="h-3 w-3" />}
                                  <span className="font-semibold">{loc.stock.toLocaleString("id-ID")}</span> {item.unit_name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
          {report?.last_page && report.last_page > 1 && (
            <div className="mt-6 flex items-center justify-between border-t pt-4">
              <div className="text-sm text-muted-foreground">
                Menampilkan halaman {page} dari {report.last_page} ({report.total} produk)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Sebelumnya
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= (report.last_page || 1)}
                  onClick={() => setPage((p) => Math.min(report.last_page || 1, p + 1))}
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
