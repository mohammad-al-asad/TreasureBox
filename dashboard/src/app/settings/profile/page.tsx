"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import SettingsProfileView from "@/components/SettingsProfileView";

export default function SettingsProfilePage() {
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white flex flex-col relative font-sans text-gray-900 selection:bg-[#E1BF62] selection:text-[#0D2823]">
      <div className="flex flex-1 h-screen overflow-hidden">
        <Sidebar
          isOpenMobile={isMobileOpen}
          onCloseMobile={() => setIsMobileOpen(false)}
        />

        <main className="flex-1 h-screen overflow-y-auto bg-white">
          <SettingsProfileView
            initialTab="profile"
            onOpenMobileMenu={() => setIsMobileOpen(true)}
            onLogout={() => router.push("/login")}
          />
        </main>
      </div>
    </div>
  );
}
