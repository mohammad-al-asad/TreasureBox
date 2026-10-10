"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SettingsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/settings/profile");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F6F5EF] flex items-center justify-center text-xs text-gray-400 font-mono">
      Redirecting to settings profile...
    </div>
  );
}
