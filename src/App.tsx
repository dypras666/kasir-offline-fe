import { BrowserRouter, Routes, Route } from "react-router-dom"
import { DashboardPage } from "@/pages/dashboard"
import { HutangPage } from "@/pages/hutang/page"
import { PiutangPage } from "@/pages/piutang/page"
import { AsetPage } from "@/pages/aset/page"
import { LaporanPage } from "@/pages/laporan/page"
import { Sidebar } from "@/components/sidebar"

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-muted/30">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/hutang" element={<HutangPage />} />
            <Route path="/piutang" element={<PiutangPage />} />
            <Route path="/aset" element={<AsetPage />} />
            <Route path="/laporan" element={<LaporanPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
