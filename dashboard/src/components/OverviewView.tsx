"use client";

import React, { useState, useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { Bell, Plus, Calendar, ChevronRight, TrendingUp, Menu } from "lucide-react";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchOverviewMetricsThunk } from "@/redux/slices/overviewSlice";
import { fetchCabinetHuntsThunk } from "@/redux/slices/huntsSlice";
import OperatorAvatar from "./OperatorAvatar";

interface OverviewViewProps {
  onNavigateToCreate: () => void;
  onNavigateToTreasures: () => void;
  onOpenMobileMenu?: () => void;
}

const emptySubscribe = () => () => {};

export default function OverviewView({
  onNavigateToCreate,
  onNavigateToTreasures,
  onOpenMobileMenu,
}: OverviewViewProps) {
  const dispatch = useAppDispatch();
  const { metrics, loading } = useAppSelector((state) => state.overview);
  const { items: reduxHunts } = useAppSelector((state) => state.hunts);
  const { user } = useAppSelector((state) => state.auth);

  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [headerTime, setHeaderTime] = useState("COMMAND ROOM");

  useEffect(() => {
    dispatch(fetchOverviewMetricsThunk());
    dispatch(fetchCabinetHuntsThunk(undefined));
  }, [dispatch]);

  const chartData = React.useMemo(() => {
    if (metrics.recentPayments && metrics.recentPayments.length > 0) {
      return (metrics.recentPayments as any[]).slice().reverse().map((p) => {
        const d = new Date(p.createdAt || Date.now());
        return {
          day: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          earnings: typeof p.amount === "number" ? p.amount : 0,
        };
      });
    }
    return [
      { day: "Start", earnings: 0 },
      { day: "Today", earnings: metrics.totalRevenue || 0 },
    ];
  }, [metrics.recentPayments, metrics.totalRevenue]);

  const hasChartActivity = chartData.some((d) => d.earnings > 0);
  const liveHunts = reduxHunts.filter((h) => h.status === "LIVE");
  const draftHunt = reduxHunts.find((h) => h.status === "DRAFT");


  useEffect(() => {
    const updateLiveTime = () => {
      const now = new Date();
      const dateStr = now
        .toLocaleDateString("en-US", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
        .toUpperCase();

      const timeStr = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });

      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      const region = timeZone.includes("/")
        ? timeZone.split("/")[1].replace(/_/g, " ").toUpperCase()
        : timeZone.toUpperCase();

      setHeaderTime(`${dateStr} · ${timeStr} (${region}) · COMMAND ROOM`);
    };

    updateLiveTime();
    const interval = setInterval(updateLiveTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-full bg-white flex flex-col">
      {/* Sticky Header Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 sm:px-8 md:px-10 pt-4 pb-5 border-b border-black/5 shadow-xs">
        {/* Mobile Top Row (< md screens only) */}
        <div className="flex md:hidden items-center justify-between w-full mb-3">
          <div>
            {onOpenMobileMenu && (
              <button
                onClick={onOpenMobileMenu}
                className="text-[#0D2823] p-2 rounded-xl bg-gray-50 border border-gray-200 shadow-xs hover:bg-gray-100 shrink-0 cursor-pointer"
                title="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <Link 
              href="/notifications"
              title="Notifications"
              className="w-9 h-9 rounded-full bg-gray-50 border border-gray-200/80 text-[#0D2823] flex items-center justify-center hover:bg-gray-100 shadow-sm transition-all cursor-pointer"
            >
              <Bell className="w-4 h-4" />
            </Link>
            <Link
              href="/settings/profile"
              title="Go to profile"
              className="hover:scale-105 transition-transform"
            >
              <OperatorAvatar size="sm" />
            </Link>
            <button
              onClick={onNavigateToCreate}
              className="bg-[#0D2823] hover:bg-[#123A33] text-white text-xs font-medium px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#E1BF62]" />
              <span>Create</span>
            </button>
          </div>
        </div>

        {/* Main Header Container (Desktop 1-Row Inline Alignment >= md) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-[#0D2823]/60 font-semibold mb-0.5 min-h-[16px]">
              {headerTime}
            </p>
            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#0D2823] font-normal tracking-tight">
              Good day, {user?.name ? user.name.split(" ")[0] : "Operator"}.
            </h1>
          </div>

          {/* Desktop Right Action Icons & Button (Inline with Name/Title) */}
          <div className="hidden md:flex items-center gap-3">
            <Link 
              href="/notifications"
              title="Notifications"
              className="w-10 h-10 rounded-full bg-gray-50 border border-gray-200/80 text-[#0D2823] flex items-center justify-center hover:bg-gray-100 shadow-sm transition-all cursor-pointer"
            >
              <Bell className="w-4 h-4" />
            </Link>
            <Link
              href="/settings/profile"
              title="Go to profile"
              className="hover:scale-105 transition-transform"
            >
              <OperatorAvatar size="md" />
            </Link>
            <button
              onClick={onNavigateToCreate}
              className="bg-[#0D2823] hover:bg-[#123A33] text-white text-sm font-medium px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-all transform active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#E1BF62]" />
              <span>Create a hunt</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <div className="p-4 sm:p-8 md:p-10 w-full space-y-6 sm:space-y-8 flex-1 bg-white">
        {/* Top 4 Stat Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Total Earnings (Gold Filled) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-[#E1BF62] text-[#0D2823] rounded-2xl p-5 sm:p-6 shadow-sm border border-[#D4AF37]/40 flex flex-col justify-between"
          >
            <div>
              <p className="text-[11px] font-mono uppercase tracking-widest text-[#0D2823]/70 font-semibold mb-2">
                TOTAL EARNINGS
              </p>
              <h3 className="font-serif text-3xl font-normal text-[#0D2823] tracking-tight">
                ${metrics.totalRevenue.toLocaleString()}
              </h3>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-medium text-[#0D2823]/80">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Live ledger balance</span>
            </div>
          </motion.div>

          {/* Card 2: Active Expeditions */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-200 flex flex-col justify-between"
          >
            <div>
              <p className="text-[11px] font-mono uppercase tracking-widest text-gray-500 font-semibold mb-2">
                ACTIVE EXPEDITIONS
              </p>
              <h3 className="font-serif text-3xl font-normal text-[#0D2823] tracking-tight">
                {metrics.activeHuntsCount}
              </h3>
            </div>
            <p className="mt-4 text-xs text-gray-500">
              {metrics.totalHuntsCount} total registered hunts
            </p>
          </motion.div>

          {/* Card 3: Found Treasures */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-200 flex flex-col justify-between"
          >
            <div>
              <p className="text-[11px] font-mono uppercase tracking-widest text-gray-500 font-semibold mb-2">
                FOUND TREASURES
              </p>
              <h3 className="font-serif text-3xl font-normal text-[#0D2823] tracking-tight">
                {metrics.foundHuntsCount}
              </h3>
            </div>
            <p className="mt-4 text-xs text-gray-500">
              Successfully solved by explorers
            </p>
          </motion.div>

          {/* Card 4: Pending Claims */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-200 flex flex-col justify-between"
          >
            <div>
              <p className="text-[11px] font-mono uppercase tracking-widest text-gray-500 font-semibold mb-2">
                PENDING CLAIMS
              </p>
              <h3 className="font-serif text-3xl font-normal text-[#0D2823] tracking-tight">
                {metrics.pendingClaimsCount}
              </h3>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-medium text-amber-700">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Awaiting operator review</span>
            </div>
          </motion.div>
        </div>


        {/* Middle Section: Chart & At a Glance */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Terrain Chart (2/3 width) */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-200 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[11px] font-mono uppercase tracking-widest text-gray-400 font-semibold mb-1">
                  REVENUE TERRAIN
                </p>
                <h2 className="font-serif text-xl sm:text-2xl text-[#0D2823] font-normal">
                  Earnings over time
                </h2>
              </div>
              <button className="flex items-center gap-2 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                <span>Real-time</span>
                <Calendar className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="h-48 sm:h-64 w-full">
              {!hasChartActivity ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200 text-center p-4">
                  <TrendingUp className="w-8 h-8 text-gray-300 mb-2" />
                  <p className="text-xs font-semibold text-[#0D2823]">No revenue activity yet</p>
                  <p className="text-[11px] text-gray-400 mt-1 max-w-sm">
                    Earnings terrain graph will dynamically populate as hunters complete access purchases.
                  </p>
                </div>
              ) : mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#E1BF62" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="#E1BF62" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="day" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: "#9CA3AF", fontSize: 11 }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: "#9CA3AF", fontSize: 11 }}
                      tickFormatter={(val) => `$${val}`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#0D2823", borderRadius: "12px", border: "none", color: "#fff", fontSize: "12px" }} 
                      itemStyle={{ color: "#E1BF62" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="earnings"
                      stroke="#D4AF37"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#goldGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full bg-gray-50/50 rounded-xl animate-pulse" />
              )}
            </div>
          </div>

          {/* At a Glance Dark Card (1/3 width) */}
          <div className="bg-[#0D2823] text-white rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 border border-[#E1BF62]/10 rounded-full pointer-events-none transform translate-x-10 -translate-y-10" />

            <div>
              <p className="text-[11px] font-mono uppercase tracking-widest text-[#E1BF62] font-semibold mb-1">
                AT A GLANCE
              </p>
              <h2 className="font-serif text-xl sm:text-2xl text-white font-normal mb-4">
                Hunt activity
              </h2>

              <div className="flex items-baseline gap-2 mb-6">
                <span className="font-serif text-3xl sm:text-4xl text-white font-normal">
                  {metrics.activeHuntsCount}
                </span>
                <span className="text-xs text-emerald-200/60 font-sans">active expeditions</span>
              </div>

              <div className="space-y-4">
                {liveHunts.length > 0 ? (
                  liveHunts.slice(0, 3).map((h) => (
                    <div key={h._id || h.id}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-emerald-100 font-medium truncate max-w-[170px]">{h.titleEn}</span>
                        <span className="text-emerald-200/70 font-mono capitalize">{h.difficulty.toLowerCase()}</span>
                      </div>
                      <p className="text-[10px] text-emerald-200/50 mb-1.5">
                        {h.price === 0 ? "Free admission" : `$${h.price} entry`}
                      </p>
                      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-[#E1BF62] rounded-full" style={{ width: "100%" }} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-center text-emerald-200/60 text-xs">
                    <p>No active expeditions published yet.</p>
                    <button
                      onClick={onNavigateToCreate}
                      className="mt-2 text-[#E1BF62] hover:underline font-medium text-[11px] cursor-pointer"
                    >
                      + Create new expedition
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Recently Found & Field Note */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-8">
          {/* Recently Found List (2/3 width) */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[11px] font-mono uppercase tracking-widest text-gray-400 font-semibold mb-1">
                  RECENTLY FOUND
                </p>
                <h2 className="font-serif text-xl sm:text-2xl text-[#0D2823] font-normal">
                  Latest claims
                </h2>
              </div>
              <button 
                onClick={onNavigateToTreasures}
                className="text-xs font-medium text-[#0D2823]/70 hover:text-[#0D2823] transition-colors cursor-pointer"
              >
                See all
              </button>
            </div>

            {metrics.recentClaims && metrics.recentClaims.length > 0 ? (
              <div className="space-y-3">
                {(metrics.recentClaims as any[]).slice(0, 3).map((claim) => {
                  const huntTitle = typeof claim.huntId === "object" && claim.huntId ? claim.huntId.titleEn : "Treasure Expedition";
                  const hunter = claim.hunterName || "Explorer";
                  const dateStr = claim.submittedAt ? new Date(claim.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Recent";
                  return (
                    <div key={claim._id || claim.id} className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200/70">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-700 to-amber-900 flex items-center justify-center text-white shadow-sm border border-amber-600/30 shrink-0">
                          <div className="w-4 h-4 border border-amber-300 rotate-45" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-[#0D2823]">{huntTitle}</h4>
                          <p className="text-xs text-gray-500">Found by {hunter} · {dateStr}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 rounded-xl bg-gray-50/60 border border-dashed border-gray-200 text-center flex flex-col items-center justify-center">
                <p className="text-xs font-semibold text-gray-600">No claims submitted yet</p>
                <p className="text-[11px] text-gray-400 mt-1">When hunters find treasures and upload photo proof, claims will appear here.</p>
              </div>
            )}
          </div>

          {/* Field Note Alert Card (1/3 width) */}
          {draftHunt ? (
            <div className="bg-amber-50/60 text-[#0D2823] rounded-2xl p-5 sm:p-6 shadow-sm border border-amber-200/80 flex flex-col justify-between">
              <div>
                <p className="text-[11px] font-mono uppercase tracking-widest text-[#0D2823]/60 font-semibold mb-2">
                  FIELD NOTE
                </p>
                <h2 className="font-serif text-lg sm:text-xl text-[#0D2823] font-normal mb-3">
                  1 draft needs attention
                </h2>
                <p className="text-xs text-[#0D2823]/70 leading-relaxed mb-6">
                  &quot;{draftHunt.titleEn}&quot; is currently in draft mode and not visible to mobile hunters. Finish and publish it when ready.
                </p>
              </div>

              <button 
                onClick={onNavigateToTreasures}
                className="text-xs font-medium text-[#0D2823] flex items-center gap-1.5 hover:underline cursor-pointer"
              >
                <span>View in cabinet</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="bg-emerald-50/60 text-[#0D2823] rounded-2xl p-5 sm:p-6 shadow-sm border border-emerald-200/80 flex flex-col justify-between">
              <div>
                <p className="text-[11px] font-mono uppercase tracking-widest text-[#0D2823]/60 font-semibold mb-2">
                  SYSTEM STATUS
                </p>
                <h2 className="font-serif text-lg sm:text-xl text-[#0D2823] font-normal mb-3">
                  All systems operational
                </h2>
                <p className="text-xs text-[#0D2823]/70 leading-relaxed mb-6">
                  All {metrics.activeHuntsCount} expeditions are currently active and running smoothly across explorer mobile apps.
                </p>
              </div>

              <button 
                onClick={onNavigateToTreasures}
                className="text-xs font-medium text-[#0D2823] flex items-center gap-1.5 hover:underline cursor-pointer"
              >
                <span>View cabinet inventory</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
