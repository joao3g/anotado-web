import { useState } from "react";
import { Outlet } from "react-router";
import { Sidebar } from "../components/Sidebar";
import { MobileTopBar } from "../components/MobileTopBar";

export default function AppLayout() {
  // Sidebar drawer on small screens (< lg)
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <div className="flex flex-col flex-1 min-w-0 lg:ml-70">
        <MobileTopBar onMenuClick={() => setDrawerOpen(true)} />

        <main className="flex-1 min-w-0 px-4 pt-4 pb-24 md:px-8 lg:px-12 lg:pb-8 xl:px-36 xl:pt-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
