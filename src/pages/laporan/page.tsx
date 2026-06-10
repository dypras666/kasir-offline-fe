import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/lib/api"
import { Loader2, FileText, Scale, BookOpen, Banknote, Download, CheckCircle2, AlertTriangle } from "lucide-react"
import { formatDate } from "@/lib/date"


type AccountLine = { code: string; name: string; amount: number }
type Period = { from?: string; to: string }

interface IncomeData {
  period: Period
  revenue: { items: AccountLine[]; total: number }
  cogs: { items: AccountLine[]; total: number }
  gross_profit: number
  expenses: { items: AccountLine[]; total: number }
  net_profit: number
}

interface BalanceData {
  period: { to: string }
  assets: { items: AccountLine[]; total: number }
  liabilities: { items: AccountLine[]; total: number }
  equity: { items: AccountLine[]; total: number }
  retained_earnings: number
  total_assets: number
  total_liabilities_and_equity: number
  is_balanced: boolean
}

interface TrialData {
  accounts: Array<{ code: string; name: string; debit: number; credit: number }>
  total_debit: number
  total_credit: number
  is_balanced: boolean
}

interface CashflowData {
  period: Period
  operating: { items: AccountLine[]; total: number }
  investing: { items: AccountLine[]; total: number }
  financing: { items: AccountLine[]; total: number }
  summary: { net_operating: number; net_investing: number; net_financing: number; net_cash_flow: number }
}

const fmt = (v: number) => "Rp " + Math.round(v).toLocaleString("id-ID")

function Loader() {
  return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
}

function sectionAccounts(items: AccountLine[], title: string, total: number) {
  if (items.length === 0) return null
  return (
    <div className="mb-4">
      <h4 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">{title}</h4>
      <div className="divide-y border rounded-lg">
        {items.map((a, i) => (
          <div key={i} className="flex justify-between px-4 py-2 text-sm hover:bg-muted/50">
            <span><span className="text-xs font-mono text-muted-foreground mr-2">{a.code}</span>{a.name}</span>
            <span className="font-medium">{fmt(a.amount)}</span>
          </div>
        ))}
        <div className="flex justify-between px-4 py-2 text-sm font-bold bg-muted/30">
          <span>Total {title}</span>
          <span>{fmt(total)}</span>
        </div>
      </div>
    </div>
  )
}

/* ─── Laba Rugi ─── */
function IncomeStatement() {
  const [data, setData] = useState<IncomeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [from, setFrom] = useState(() => {
    const d = new Date(); d.setDate(1)
    return d.toISOString().split("T")[0]
  })
  const [to, setTo] = useState(() => new Date().toISOString().split("T")[0])

  const load = useCallback(() => {
    setLoading(true)
    api.get<{ data: IncomeData }>(`/reports/income-statement?from=${from}&to=${to}`)
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [from, to])

  useEffect(load, [load])

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3 flex-wrap">
        <div className="space-y-1"><Label className="text-xs">Dari</Label><Input type="date" value={from} onChange={e => setFrom(e.target.value)} className="w-40 h-9" /></div>
        <div className="space-y-1"><Label className="text-xs">Sampai</Label><Input type="date" value={to} onChange={e => setTo(e.target.value)} className="w-40 h-9" /></div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>Terapkan</Button>
      </div>

      {loading ? <Loader /> : !data ? (
        <p className="text-center text-muted-foreground py-8">Tidak ada data untuk periode ini</p>
      ) : (
        <Card>
          <CardContent className="p-4 space-y-2">
            <h3 className="text-lg font-bold mb-3">Laporan Laba Rugi</h3>
            <p className="text-xs text-muted-foreground mb-4">{from} — {to}</p>

            {sectionAccounts(data.revenue.items, "Pendapatan", data.revenue.total)}
            {sectionAccounts(data.cogs.items, "Harga Pokok Penjualan", data.cogs.total)}

            <div className="flex justify-between px-4 py-2 bg-muted/30 rounded-lg text-sm font-bold">
              <span>Laba Kotor</span>
              <span className={data.gross_profit >= 0 ? "text-emerald-500" : "text-red-500"}>{fmt(data.gross_profit)}</span>
            </div>

            {sectionAccounts(data.expenses.items, "Biaya Operasional", data.expenses.total)}

            <div className="flex justify-between px-4 py-3 bg-primary/10 rounded-lg text-base font-bold mt-2">
              <span>Laba Bersih</span>
              <span className={data.net_profit >= 0 ? "text-emerald-500" : "text-red-500"}>{fmt(data.net_profit)}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/* ─── Neraca ─── */
function BalanceSheet() {
  const [data, setData] = useState<BalanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [to, setTo] = useState(() => new Date().toISOString().split("T")[0])

  const load = useCallback(() => {
    setLoading(true)
    api.get<{ data: BalanceData }>(`/reports/balance-sheet?to=${to}`)
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [to])

  useEffect(load, [load])

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3 flex-wrap">
        <div className="space-y-1"><Label className="text-xs">Per Tanggal</Label><Input type="date" value={to} onChange={e => setTo(e.target.value)} className="w-40 h-9" /></div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>Terapkan</Button>
      </div>

      {loading ? <Loader /> : !data ? (
        <p className="text-center text-muted-foreground py-8">Tidak ada data</p>
      ) : (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Neraca</h3>
              {data.is_balanced && (
                <span className="flex items-center gap-1 text-xs text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
                  <CheckCircle2 className="h-3 w-3" /> Balance
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Per {to}</p>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                {sectionAccounts(data.assets.items, "Aktiva", data.assets.total)}
                <div className="flex justify-between px-4 py-3 bg-primary/10 rounded-lg text-sm font-bold">
                  <span>Total Aktiva</span>
                  <span>{fmt(data.total_assets)}</span>
                </div>
              </div>
              <div>
                {sectionAccounts(data.liabilities.items, "Kewajiban", data.liabilities.total)}
                {sectionAccounts(data.equity.items, "Modal", data.equity.total)}
                {data.retained_earnings !== 0 && (
                  <div className="flex justify-between px-4 py-2 text-sm border rounded-lg mb-2">
                    <span>Laba Ditahan</span>
                    <span className="font-medium">{fmt(data.retained_earnings)}</span>
                  </div>
                )}
                <div className="flex justify-between px-4 py-3 bg-primary/10 rounded-lg text-sm font-bold">
                  <span>Total Pasiva</span>
                  <span>{fmt(data.total_liabilities_and_equity)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/* ─── Neraca Saldo ─── */
function TrialBalance() {
  const [data, setData] = useState<TrialData | null>(null)
  const [loading, setLoading] = useState(true)
  const [to, setTo] = useState(() => new Date().toISOString().split("T")[0])

  const load = useCallback(() => {
    setLoading(true)
    api.get<{ data: TrialData }>(`/reports/trial-balance?to=${to}`)
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [to])

  useEffect(load, [load])

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3 flex-wrap">
        <div className="space-y-1"><Label className="text-xs">Per Tanggal</Label><Input type="date" value={to} onChange={e => setTo(e.target.value)} className="w-40 h-9" /></div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>Terapkan</Button>
      </div>

      {loading ? <Loader /> : !data ? (
        <p className="text-center text-muted-foreground py-8">Tidak ada data</p>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <h3 className="text-lg font-bold">Neraca Saldo</h3>
              {data.is_balanced ? (
                <span className="flex items-center gap-1 text-xs text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
                  <CheckCircle2 className="h-3 w-3" /> Balance
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-red-500 bg-red-500/10 px-2 py-1 rounded-full">
                  <AlertTriangle className="h-3 w-3" /> Unbalanced
                </span>
              )}
            </div>

            {data.accounts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Tidak ada akun dengan saldo</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left px-4 py-2 font-medium text-xs">Kode</th>
                      <th className="text-left px-4 py-2 font-medium text-xs">Nama Akun</th>
                      <th className="text-right px-4 py-2 font-medium text-xs">Debit</th>
                      <th className="text-right px-4 py-2 font-medium text-xs">Kredit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.accounts.map((a, i) => (
                      <tr key={i} className="hover:bg-muted/50">
                        <td className="px-4 py-2 text-xs font-mono text-muted-foreground">{a.code}</td>
                        <td className="px-4 py-2">{a.name}</td>
                        <td className="px-4 py-2 text-right">{a.debit > 0 ? fmt(a.debit) : "-"}</td>
                        <td className="px-4 py-2 text-right">{a.credit > 0 ? fmt(a.credit) : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t font-bold bg-muted/30">
                      <td colSpan={2} className="px-4 py-3 text-right">Total</td>
                      <td className="px-4 py-3 text-right">{fmt(data.total_debit)}</td>
                      <td className="px-4 py-3 text-right">{fmt(data.total_credit)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/* ─── Arus Kas ─── */
function CashflowReport() {
  const [data, setData] = useState<CashflowData | null>(null)
  const [loading, setLoading] = useState(true)
  const [from, setFrom] = useState(() => {
    const d = new Date(); d.setDate(1)
    return d.toISOString().split("T")[0]
  })
  const [to, setTo] = useState(() => new Date().toISOString().split("T")[0])

  const load = useCallback(() => {
    setLoading(true)
    api.get<{ data: CashflowData }>(`/cashflow?from=${from}&to=${to}`)
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [from, to])

  useEffect(load, [load])

  const section = (items: AccountLine[], title: string, total: number, color: string) => {
    if (items.length === 0) return null
    return (
      <div className="mb-4">
        <h4 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">{title}</h4>
        <div className="divide-y border rounded-lg">
          {items.map((a, i) => (
            <div key={i} className="flex justify-between px-4 py-2 text-sm hover:bg-muted/50">
              <span>{a.name}</span>
              <span className="font-medium">{fmt(a.amount)}</span>
            </div>
          ))}
          <div className={`flex justify-between px-4 py-2 text-sm font-bold ${color}`}>
            <span>Arus Kas {title}</span>
            <span>{fmt(total)}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3 flex-wrap">
        <div className="space-y-1"><Label className="text-xs">Dari</Label><Input type="date" value={from} onChange={e => setFrom(e.target.value)} className="w-40 h-9" /></div>
        <div className="space-y-1"><Label className="text-xs">Sampai</Label><Input type="date" value={to} onChange={e => setTo(e.target.value)} className="w-40 h-9" /></div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>Terapkan</Button>
      </div>

      {loading ? <Loader /> : !data ? (
        <p className="text-center text-muted-foreground py-8">Tidak ada data</p>
      ) : (
        <Card>
          <CardContent className="p-4 space-y-4">
            <h3 className="text-lg font-bold">Laporan Arus Kas</h3>
            <p className="text-xs text-muted-foreground">{from} — {to}</p>

            {section(data.operating.items, "Operasional", data.operating.total, "text-blue-500")}
            {section(data.investing.items, "Investasi", data.investing.total, "text-amber-500")}
            {section(data.financing.items, "Pendanaan", data.financing.total, "text-purple-500")}

            <div className="flex justify-between px-4 py-3 bg-primary/10 rounded-lg text-base font-bold mt-4">
              <span>Total Arus Kas Bersih</span>
              <span className={data.summary.net_cash_flow >= 0 ? "text-emerald-500" : "text-red-500"}>
                {fmt(data.summary.net_cash_flow)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/* ─── Buku Besar ─── */
interface LedgerEntry {
  id: number
  date: string
  description: string
  reference_no: string | null
  debit: number
  credit: number
  balance: number
}

interface AccountOption {
  id: number
  code: string
  name: string
}

function BukuBesar() {
  const [accounts, setAccounts] = useState<AccountOption[]>([])
  const [selected, setSelected] = useState("")
  const [entries, setEntries] = useState<LedgerEntry[]>([])
  const [loadingAccts, setLoadingAccts] = useState(true)
  const [loadingEntries, setLoadingEntries] = useState(false)
  const [from, setFrom] = useState(() => {
    const d = new Date(); d.setFullYear(d.getFullYear() - 1)
    return d.toISOString().split("T")[0]
  })
  const [to, setTo] = useState(() => new Date().toISOString().split("T")[0])

  useEffect(() => {
    api.get<{ data: AccountOption[] }>("/accounts?per_page=500")
      .then(r => setAccounts(r.data || []))
      .catch(() => {})
      .finally(() => setLoadingAccts(false))
  }, [])

  const loadLedger = () => {
    if (!selected) return
    setLoadingEntries(true)
    api.get<{ data: { entries: LedgerEntry[] } }>(`/accounts/${selected}/ledger?from=${from}&to=${to}`)
      .then(r => setEntries(r.data?.entries || []))
      .catch(() => setEntries([]))
      .finally(() => setLoadingEntries(false))
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4 items-end">
        <div className="space-y-1">
          <Label className="text-xs">Akun</Label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            value={selected}
            onChange={e => setSelected(e.target.value)}
          >
            <option value="">-- Pilih Akun --</option>
            {accounts.map(a => (
              <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1"><Label className="text-xs">Dari</Label><Input type="date" value={from} onChange={e => setFrom(e.target.value)} className="h-9" /></div>
        <div className="space-y-1"><Label className="text-xs">Sampai</Label><Input type="date" value={to} onChange={e => setTo(e.target.value)} className="h-9" /></div>
        <Button size="sm" onClick={loadLedger} disabled={!selected || loadingEntries}>
          {loadingEntries ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
          Tampilkan
        </Button>
      </div>

      {loadingAccts ? <Loader /> : !selected ? (
        <p className="text-center text-muted-foreground py-8">Pilih akun untuk melihat mutasi</p>
      ) : loadingEntries ? <Loader /> : entries.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">Tidak ada mutasi untuk periode ini</p>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-2 font-medium text-xs">Tanggal</th>
                    <th className="text-left px-4 py-2 font-medium text-xs">No. Referensi</th>
                    <th className="text-left px-4 py-2 font-medium text-xs">Deskripsi</th>
                    <th className="text-right px-4 py-2 font-medium text-xs">Debit</th>
                    <th className="text-right px-4 py-2 font-medium text-xs">Kredit</th>
                    <th className="text-right px-4 py-2 font-medium text-xs">Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {entries.map((e) => (
                    <tr key={e.id} className="hover:bg-muted/50">
                      <td className="px-4 py-2 text-xs text-muted-foreground">{formatDate(e.date)}</td>
                      <td className="px-4 py-2 text-xs font-mono text-muted-foreground">{e.reference_no || "-"}</td>
                      <td className="px-4 py-2">{e.description}</td>
                      <td className="px-4 py-2 text-right">{e.debit > 0 ? fmt(e.debit) : "-"}</td>
                      <td className="px-4 py-2 text-right">{e.credit > 0 ? fmt(e.credit) : "-"}</td>
                      <td className={`px-4 py-2 text-right font-medium ${e.balance >= 0 ? "" : "text-red-500"}`}>
                        {fmt(e.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/* ─── MAIN PAGE ─── */
export function LaporanPage() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Laporan Keuangan & Akuntansi</h1>
        <p className="text-sm text-muted-foreground">Laba rugi, neraca, neraca saldo, arus kas, dan buku besar.</p>
      </header>

      <Tabs defaultValue="income" className="w-full">
        <TabsList className="w-full flex-wrap h-auto">
          <TabsTrigger value="income" className="text-xs"><FileText className="h-3.5 w-3.5 mr-1.5" />Laba Rugi</TabsTrigger>
          <TabsTrigger value="balance" className="text-xs"><Scale className="h-3.5 w-3.5 mr-1.5" />Neraca</TabsTrigger>
          <TabsTrigger value="trial" className="text-xs"><BookOpen className="h-3.5 w-3.5 mr-1.5" />Neraca Saldo</TabsTrigger>
          <TabsTrigger value="cashflow" className="text-xs"><Banknote className="h-3.5 w-3.5 mr-1.5" />Arus Kas</TabsTrigger>
          <TabsTrigger value="ledger" className="text-xs"><Download className="h-3.5 w-3.5 mr-1.5" />Buku Besar</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="income"><IncomeStatement /></TabsContent>
          <TabsContent value="balance"><BalanceSheet /></TabsContent>
          <TabsContent value="trial"><TrialBalance /></TabsContent>
          <TabsContent value="cashflow"><CashflowReport /></TabsContent>
          <TabsContent value="ledger"><BukuBesar /></TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
