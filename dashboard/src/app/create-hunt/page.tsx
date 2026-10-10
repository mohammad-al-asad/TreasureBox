"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import CreateHuntView, { HuntFormData } from "@/components/CreateHuntView";

function CreateHuntContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const editId = searchParams.get("edit");
  const isEditMode = Boolean(editId);

  const rawDifficulty = searchParams.get("difficulty");
  const validDifficulty: HuntFormData["difficulty"] =
    rawDifficulty === "Easy" || rawDifficulty === "Medium" || rawDifficulty === "Hard"
      ? rawDifficulty
      : "Hard";

  const initialData: HuntFormData | undefined = isEditMode
    ? {
        id: editId || undefined,
        name: searchParams.get("name") || "",
        price: searchParams.get("price") || "",
        capitalWorth: searchParams.get("capitalWorth") || "",
        difficulty: validDifficulty,
        columns: searchParams.get("columns") || "5",
        sequence: searchParams.get("sequence") || "",
      }
    : undefined;

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col relative font-sans text-gray-900 selection:bg-[#E1BF62] selection:text-[#0D2823]">
      <div className="flex flex-1 h-screen overflow-hidden">
        <Sidebar
          isOpenMobile={isMobileOpen}
          onCloseMobile={() => setIsMobileOpen(false)}
        />

        <main className="flex-1 h-screen overflow-y-auto bg-[#FDFBF7]">
          <CreateHuntView
            isEditMode={isEditMode}
            initialData={initialData}
            onBackToTreasures={() => router.push("/treasures")}
            onOpenMobileMenu={() => setIsMobileOpen(true)}
          />
        </main>
      </div>
    </div>
  );
}

export default function CreateHuntPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center text-xs text-gray-400 font-mono">
          Loading hunt form...
        </div>
      }
    >
      <CreateHuntContent />
    </Suspense>
  );
}
