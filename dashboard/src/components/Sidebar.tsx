"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutGrid, Package, FileText, Settings, DollarSign, LogOut, X, Users, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { logoutThunk } from "@/redux/slices/authSlice";
import OperatorAvatar from "./OperatorAvatar";

export type NavTab = "overview" | "treasures" | "create-hunt" | "claims" | "users" | "admins" | "earnings" | "settings";

interface SidebarProps {
  claimsCount?: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({
  claimsCount,
  isOpenMobile = false,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { metrics } = useAppSelector((state) => state.overview);

  const pendingClaims =
    typeof claimsCount === "number" ? claimsCount : metrics?.pendingClaimsCount || 0;

  const navItems: Array<{
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    href: string;
    badge?: number;
  }> = [
    { id: "overview", label: "Overview", icon: LayoutGrid, href: "/" },
    { id: "treasures", label: "Treasures", icon: Package, href: "/treasures" },
    { id: "claims", label: "Claims", icon: FileText, href: "/claims" },
    { id: "users", label: "Users", icon: Users, href: "/users" },
    { id: "admins", label: "Admins", icon: ShieldCheck, href: "/admins" },
    { id: "earnings", label: "Earnings", icon: DollarSign, href: "/earnings" },
    { id: "settings", label: "Settings", icon: Settings, href: "/settings/profile" },
  ];

  const handleLogout = async () => {
    await dispatch(logoutThunk());
    router.push("/login");
    if (onCloseMobile) onCloseMobile();
  };

  const sidebarContent = (
    <div className="w-full flex-1 flex flex-col justify-between h-full px-4 py-6 relative overflow-hidden text-white bg-[#0D2823]">
      {/* Background Decorative Rings */}
      <div className="absolute -top-16 -left-16 w-64 h-64 border border-[#E1BF62]/10 rounded-full pointer-events-none" />
      <div className="absolute top-20 -left-10 w-48 h-48 border border-[#E1BF62]/5 rounded-full pointer-events-none" />

      {/* Top Branding & Mobile Close */}
      <div className="relative z-10 w-full">
        <div className="flex items-center justify-between mb-8 px-1">
          <Link
            href="/"
            onClick={() => {
              if (onCloseMobile) onCloseMobile();
            }}
            className="flex items-center gap-3 cursor-pointer group"
          >
            {/* Circular Gold Icon matching user's logo image */}
            <div className="w-10 h-10 rounded-full bg-[#E1BF62] flex items-center justify-center text-[#0D2823] shadow-md group-hover:scale-105 transition-transform duration-200 shrink-0">
              <div className="w-5 h-5 border-2 border-[#0D2823] rotate-45 flex items-center justify-center rounded-xs">
                <div className="w-1.5 h-1.5 bg-[#0D2823] rounded-full" />
              </div>
            </div>
            <div>
              <h1 className="font-serif text-lg leading-none text-white tracking-wide">
                Treasure Box
              </h1>
              <p className="text-[10px] uppercase font-mono tracking-widest text-[#E1BF62] mt-1 font-medium">
                COMMAND ROOM
              </p>
            </div>
          </Link>

          {/* Close button on mobile drawer */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden text-emerald-200/70 hover:text-white p-2 rounded-lg hover:bg-white/10"
              title="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation List */}
        <div className="w-full">
          <p className="text-[11px] font-mono uppercase tracking-widest text-emerald-200/50 mb-3 px-3">
            NAVIGATE
          </p>
          <nav className="space-y-1.5 w-full">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.id === "treasures" && pathname === "/create-hunt") ||
                (item.id === "users" && pathname.startsWith("/users")) ||
                (item.id === "admins" && pathname.startsWith("/admins")) ||
                (item.id === "settings" && pathname.startsWith("/settings"));

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => {
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative ${
                    isActive
                      ? "text-[#0D2823] font-semibold bg-[#E1BF62] shadow-md"
                      : "text-emerald-100/70 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activePill"
                      className="absolute inset-0 bg-[#E1BF62] rounded-xl -z-10"
                      transition={{
                        type: "spring",
                        stiffness: 350,
                        damping: 30,
                      }}
                    />
                  )}
                  <div className="flex items-center gap-3 relative z-10">
                    <Icon
                      className={`w-4 h-4 ${isActive ? "text-[#0D2823]" : "text-emerald-200/70"}`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-mono font-medium relative z-10 ${
                        isActive
                          ? "bg-[#0D2823]/20 text-[#0D2823]"
                          : "bg-emerald-900/60 text-emerald-300 border border-emerald-700/40"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Footer Section with User Profile & Logout Icon */}
      <div className="relative z-10 w-full pt-4 border-t border-[#E1BF62]/20 flex items-center justify-between">
        <Link
          href="/settings/profile"
          className="flex items-center gap-3 group cursor-pointer flex-1 min-w-0 pr-2"
        >
          <OperatorAvatar size="sm" className="group-hover:scale-105 transition-transform" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white leading-tight group-hover:text-[#E1BF62] transition-colors truncate">
              {user?.name || "Command Operator"}
            </p>
            <p className="text-[11px] text-emerald-200/50 leading-tight truncate">
              {user?.role || "Administrator"}
            </p>
          </div>
        </Link>
        <button
          onClick={handleLogout}
          title="Logout"
          className="text-emerald-200/50 hover:text-rose-400 p-2 rounded-lg hover:bg-rose-950/40 border border-transparent hover:border-rose-900/30 transition-all cursor-pointer group shrink-0"
        >
          <LogOut className="w-4 h-4 group-hover:text-rose-400 transition-colors" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 bg-[#0D2823] shrink-0 border-r border-[#0A241F] z-40">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-over Drawer & Overlay */}
      <AnimatePresence>
        {isOpenMobile && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobile}
              className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-50"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="md:hidden fixed top-0 left-0 bottom-0 w-64 bg-[#0D2823] z-50 shadow-2xl flex flex-col"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
