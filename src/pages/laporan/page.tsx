import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function LaporanPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Laporan</h1>
        <p className="text-sm text-muted-foreground mt-1">Modul Laporan — coming soon</p>
      </div>
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Laporan</CardTitle>
          <CardDescription>Halaman ini sedang dalam pengembangan.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Fitur laporan akan tersedia di rilis berikutnya.</p>
        </CardContent>
      </Card>
    </div>
  )
}
