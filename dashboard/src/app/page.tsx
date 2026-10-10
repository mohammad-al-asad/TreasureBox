"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import OverviewView from "@/components/OverviewView";

export default function OverviewPage() {
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white flex flex-col relative font-sans text-gray-900 selection:bg-[#E1BF62] selection:text-[#0D2823]">
      <div className="flex flex-1 h-screen overflow-hidden">
        {/* Responsive App Router Sidebar */}
        <Sidebar
          isOpenMobile={isMobileOpen}
          onCloseMobile={() => setIsMobileOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 h-screen overflow-y-auto bg-white">
          <OverviewView
            onNavigateToCreate={() => router.push("/create-hunt")}
            onNavigateToTreasures={() => router.push("/treasures")}
            onOpenMobileMenu={() => setIsMobileOpen(true)}
          />
        </main>
      </div>
    </div>
  );
}
