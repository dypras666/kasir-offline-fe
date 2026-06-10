import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Plus } from "lucide-react"
import { toast } from "sonner"
import { formatDate } from "@/lib/date"


interface LostInventory {
  id: number
  reference_no: string
  date: string
  warehouse: { name: string }
  total_value: number
  status: string
}

export function LostInventoryPage() {
  const [data, setData] = useState<LostInventory[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const res: any = await api.get("/lost-inventories")
      setData(res.data ?? res)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lost Inventory</h1>
          <p className="text-sm text-muted-foreground">Pencatatan barang hilang, rusak, atau kadaluarsa</p>
        </div>
        <Button variant="destructive" onClick={() => toast("Form Lost Inventory Sedang Dibangun")}>
          <Plus className="mr-2 h-4 w-4" /> Lapor Barang Hilang
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ref No.</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Gudang</TableHead>
                <TableHead>Total Kerugian</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : data.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground"><AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-20" />Belum ada data barang hilang</TableCell></TableRow>
              ) : data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-xs">{item.reference_no}</TableCell>
                  <TableCell>{formatDate(item.date)}</TableCell>
                  <TableCell className="font-medium">{item.warehouse?.name}</TableCell>
                  <TableCell className="font-bold text-red-500">Rp {Number(item.total_value).toLocaleString()}</TableCell>
                  <TableCell>
                    {item.status === 'completed' ? 
                      <Badge variant="destructive">Selesai</Badge> : 
                      <Badge variant="outline">Draft</Badge>
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Detail</Button>
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
