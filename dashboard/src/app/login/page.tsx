"use client";

import React from "react";
import { useRouter } from "next/navigation";
import LoginView from "@/components/LoginView";

export default function LoginPage() {
  const router = useRouter();

  return (
    <div suppressHydrationWarning className="min-h-screen bg-[#061814] flex flex-col font-sans text-white selection:bg-[#E1BF62] selection:text-[#0D2823]">
      <LoginView
        onLoginSuccess={() => {
          router.push("/");
        }}
      />
    </div>
  );
}
