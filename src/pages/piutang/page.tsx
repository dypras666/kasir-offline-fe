import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function PiutangPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Piutang</h1>
        <p className="text-sm text-muted-foreground mt-1">Modul Piutang — coming soon</p>
      </div>
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Piutang</CardTitle>
          <CardDescription>Halaman ini sedang dalam pengembangan.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Fitur piutang akan tersedia di rilis berikutnya.</p>
        </CardContent>
      </Card>
    </div>
  )
}
