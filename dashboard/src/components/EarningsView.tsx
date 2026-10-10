"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  TrendingUp,
  CreditCard,
  Download,
  Search,
  CheckCircle,
  Menu,
  DollarSign,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchTransactionsThunk } from "@/redux/slices/earningsSlice";
import OperatorAvatar from "./OperatorAvatar";

interface EarningsViewProps {
  onOpenMobileMenu?: () => void;
}

interface Transaction {
  id: string;
  txnCode: string;
  huntName: string;
  hunterName: string;
  hunterEmail: string;
  amount: string;
  method: "PayPal" | "Apple Pay" | "Credit Card";
  date: string;
  status: "Paid" | "Pending" | "Refunded";
}

export default function EarningsView({ onOpenMobileMenu }: EarningsViewProps) {
  const dispatch = useAppDispatch();
  const { items: liveTxns, loading } = useAppSelector((state) => state.earnings);
  const { user } = useAppSelector((state) => state.auth);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    dispatch(fetchTransactionsThunk());
  }, [dispatch]);

  const transactions: Transaction[] = (liveTxns || []).map((t, idx) => ({
    id: t._id || String(idx),
    txnCode: `#TXN-${(t._id || String(idx)).slice(-4).toUpperCase()}`,
    huntName: typeof t.huntId === "object" && t.huntId ? t.huntId.titleEn : "Treasure Expedition",
    hunterName: t.hunterName || "Hunter Explorer",
    hunterEmail: t.hunterEmail || "hunter@treasurebox.app",
    amount: `$${(t.amount || 0).toFixed(2)}`,
    method: "PayPal" as const,
    date: t.createdAt ? t.createdAt.slice(0, 16).replace("T", " · ") : "Recent",
    status: (t.status === "COMPLETED" ? "Paid" : t.status === "FAILED" ? "Refunded" : "Pending") as "Paid" | "Pending" | "Refunded",
  }));

  const completedTxns = (liveTxns || []).filter((t) => t.status === "COMPLETED");
  const totalRevenue = completedTxns.reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalSalesCount = completedTxns.length;
  const avgTicketPrice = totalSalesCount > 0 ? (totalRevenue / totalSalesCount).toFixed(2) : "0.00";
  const availablePayout = totalRevenue;

  const filteredTxns = transactions.filter(
    (t) =>
      t.huntName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.hunterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.txnCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          </div>
        </div>

        {/* Main Header Container (Desktop 1-Row Inline Alignment >= md) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-[#0D2823]/60 font-semibold mb-0.5">
              FINANCIAL TRANSACTIONS & REVENUE ANALYTICS
            </p>
            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#0D2823] font-normal tracking-tight">
              Earnings & Revenue
            </h1>
          </div>

          {/* Desktop Right Action Icons & Export (Inline with Title) */}
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
            <button className="bg-[#0D2823] hover:bg-[#123A33] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer">
              <Download className="w-3.5 h-3.5 text-[#E1BF62]" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <div className="p-4 sm:p-8 md:p-10 w-full space-y-6 sm:space-y-8 flex-1 bg-white">
        {/* Top 4 Financial Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Total Revenue (Gold Highlighted) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#E1BF62] text-[#0D2823] rounded-2xl p-5 sm:p-6 shadow-sm border border-[#D4AF37]/40 flex flex-col justify-between"
          >
            <div>
              <p className="text-[11px] font-mono uppercase tracking-widest text-[#0D2823]/70 font-semibold mb-2">
                TOTAL REVENUE
              </p>
              <h3 className="font-serif text-3xl font-normal text-[#0D2823] tracking-tight">
                ${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-medium text-[#0D2823]/80">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{totalSalesCount > 0 ? `${totalSalesCount} orders completed` : "Awaiting first order"}</span>
            </div>
          </motion.div>

          {/* Card 2: Sales This Month */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-200 flex flex-col justify-between"
          >
            <div>
              <p className="text-[11px] font-mono uppercase tracking-widest text-gray-500 font-semibold mb-2">
                THIS MONTH SALES
              </p>
              <h3 className="font-serif text-3xl font-normal text-[#0D2823] tracking-tight">
                ${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <p className="mt-4 text-xs text-gray-500">{totalSalesCount} ticket claims purchased</p>
          </motion.div>

          {/* Card 3: Avg Ticket Price */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-200 flex flex-col justify-between"
          >
            <div>
              <p className="text-[11px] font-mono uppercase tracking-widest text-gray-500 font-semibold mb-2">
                AVG TICKET PRICE
              </p>
              <h3 className="font-serif text-3xl font-normal text-[#0D2823] tracking-tight">
                ${avgTicketPrice}
              </h3>
            </div>
            <p className="mt-4 text-xs text-gray-500">Across all active hunts</p>
          </motion.div>

          {/* Card 4: Available Payout */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-200 flex flex-col justify-between"
          >
            <div>
              <p className="text-[11px] font-mono uppercase tracking-widest text-gray-500 font-semibold mb-2">
                AVAILABLE PAYOUT
              </p>
              <h3 className="font-serif text-3xl font-normal text-[#0D2823] tracking-tight">
                ${availablePayout.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-emerald-700">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>{availablePayout > 0 ? "Ready for transfer" : "No pending payout"}</span>
            </div>
          </motion.div>
        </div>

        {/* Financial Log Table Container */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl sm:text-2xl text-[#0D2823] font-normal">
              Transaction Ledger
            </h2>
            <div className="relative w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ledger..."
                className="w-full bg-white text-gray-900 text-xs rounded-full pl-9 pr-4 py-2.5 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E1BF62] shadow-xs"
              />
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-gray-100 text-[11px] font-mono text-gray-400 uppercase tracking-widest bg-gray-50/50">
                    <th className="py-4 px-6 font-semibold">TXN CODE</th>
                    <th className="py-4 px-6 font-semibold">HUNT PURCHASED</th>
                    <th className="py-4 px-6 font-semibold">HUNTER CUSTOMER</th>
                    <th className="py-4 px-6 font-semibold">METHOD</th>
                    <th className="py-4 px-6 font-semibold">AMOUNT</th>
                    <th className="py-4 px-6 font-semibold text-right">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredTxns.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <DollarSign className="w-8 h-8 text-gray-300" />
                          <p className="text-sm font-medium text-gray-600">No payment transactions recorded yet</p>
                          <p className="text-xs text-gray-400">Transactions will automatically show up when hunters purchase expedition access.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredTxns.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-4 px-6 font-mono text-xs font-semibold text-[#0D2823]">
                          {item.txnCode}
                        </td>
                        <td className="py-4 px-6 font-semibold text-[#0D2823]">
                          {item.huntName}
                        </td>
                        <td className="py-4 px-6">
                          <p className="font-semibold text-[#0D2823] text-xs">{item.hunterName}</p>
                          <p className="text-[11px] text-gray-400 font-mono">{item.hunterEmail}</p>
                        </td>
                        <td className="py-4 px-6 text-xs text-gray-600">
                          <span className="inline-flex items-center gap-1.5 bg-gray-100 px-2.5 py-1 rounded-lg border border-gray-200 font-medium">
                            <CreditCard className="w-3.5 h-3.5 text-gray-500" />
                            {item.method}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-bold text-[#0D2823]">
                          {item.amount}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
