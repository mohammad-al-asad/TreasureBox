"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import Sidebar from "@/components/Sidebar";

const UserManagementView = dynamic(
  () => import("@/components/UserManagementView"),
  {
    ssr: false,
    loading: () => (
      <div className="p-8 text-center text-xs text-gray-400 font-mono">
        Loading hunter records...
      </div>
    ),
  }
);

export default function UsersPage() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white flex flex-col relative font-sans text-gray-900 selection:bg-[#E1BF62] selection:text-[#0D2823]">
      <div className="flex flex-1 h-screen overflow-hidden">
        <Sidebar
          isOpenMobile={isMobileOpen}
          onCloseMobile={() => setIsMobileOpen(false)}
        />

        <main className="flex-1 h-screen overflow-y-auto bg-white">
          <UserManagementView
            onOpenMobileMenu={() => setIsMobileOpen(true)}
          />
        </main>
      </div>
    </div>
  );
}
