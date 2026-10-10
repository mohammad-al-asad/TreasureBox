"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppDispatch } from "@/redux/hooks";
import { fetchMeThunk, syncClientAuth } from "@/redux/slices/authSlice";
import { getStoredToken } from "@/services/dashboardApi";

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      if (pathname !== "/login") {
        router.replace("/login");
        setIsAuthorized(false);
      } else {
        setIsAuthorized(true);
      }
    } else {
      if (pathname === "/login") {
        router.replace("/");
        setIsAuthorized(false);
      } else {
        dispatch(syncClientAuth());
        dispatch(fetchMeThunk());
        setIsAuthorized(true);
      }
    }
  }, [pathname, router, dispatch]);

  // When visiting login page, render directly without obstruction
  if (pathname === "/login") {
    return <>{children}</>;
  }

  // Show a loading screen while verifying session on protected routes
  if (isAuthorized === null || isAuthorized === false) {
    return (
      <div
        suppressHydrationWarning
        className="w-full h-screen bg-[#061814] flex flex-col items-center justify-center text-white"
      >
        <div className="w-10 h-10 rounded-full border-2 border-[#E1BF62] border-t-transparent animate-spin mb-4" />
        <p className="font-mono text-xs text-[#E1BF62] uppercase tracking-widest">
          Verifying Command Room Access...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
