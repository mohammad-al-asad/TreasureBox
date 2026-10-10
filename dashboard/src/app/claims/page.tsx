"use client";

import React, { useState } from "react";
import Sidebar from "@/components/Sidebar";
import ClaimsRegisterView from "@/components/ClaimsRegisterView";

export default function ClaimsPage() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F6F5EF] flex flex-col relative font-sans text-gray-900 selection:bg-[#E1BF62] selection:text-[#0D2823]">
      <div className="flex flex-1 h-screen overflow-hidden">
        <Sidebar
          isOpenMobile={isMobileOpen}
          onCloseMobile={() => setIsMobileOpen(false)}
        />

        <main className="flex-1 h-screen overflow-y-auto">
          <ClaimsRegisterView
            onOpenMobileMenu={() => setIsMobileOpen(true)}
          />
        </main>
      </div>
    </div>
  );
}
