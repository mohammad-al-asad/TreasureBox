"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  Search,
  MoreVertical,
  Menu,
  Key,
  Trash2,
  CheckCircle2,
  XCircle,
  X,
  ExternalLink,
  Award,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  fetchUsersThunk,
  toggleUserStatusThunk,
  resetUserAccessThunk,
  revokeUserRecordThunk,
  clearNotice,
} from "@/redux/slices/usersSlice";
import { HunterUserDto } from "@/services/dashboardApi";
import OperatorAvatar from "./OperatorAvatar";

export type HunterUser = HunterUserDto;

interface UserManagementViewProps {
  onOpenMobileMenu?: () => void;
}

export default function UserManagementView({
  onOpenMobileMenu,
}: UserManagementViewProps) {
  const dispatch = useAppDispatch();
  const { items: hunters, loading, notice } = useAppSelector((state) => state.users);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<HunterUser | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchUsersThunk(undefined));
  }, [dispatch]);

  useEffect(() => {
    if (notice) {
      setActionSuccessMsg(notice);
      const timer = setTimeout(() => {
        setActionSuccessMsg(null);
        dispatch(clearNotice());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notice, dispatch]);

  const validHunters = hunters.filter(
    (h) => h.role !== "ADMIN" && h.role !== "SUPERADMIN"
  );

  const filteredHunters = validHunters.filter((hunter) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      hunter.name.toLowerCase().includes(q) ||
      hunter.email.toLowerCase().includes(q)
    );
  });

  const toggleUserStatus = (id: string) => {
    dispatch(toggleUserStatusThunk(id));
    setActiveMenuId(null);
  };

  const handleResetAccess = (email: string) => {
    dispatch(resetUserAccessThunk(email));
    setActiveMenuId(null);
  };

  const handleRevokeUser = (id: string) => {
    dispatch(revokeUserRecordThunk(id));
    setActiveMenuId(null);
    const selectedId = selectedUserForDetail?._id || selectedUserForDetail?.id;
    if (selectedId === id) {
      setSelectedUserForDetail(null);
    }
  };


  return (
    <div suppressHydrationWarning className="min-h-full bg-white flex flex-col">
      {/* Sticky Header Bar (matching ClaimsRegisterView pixel-for-pixel) */}
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
              HUNTERS · {validHunters.length} TOTAL
            </p>
            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#0D2823] font-normal tracking-tight">
              User management
            </h1>
          </div>

          {/* Desktop Right Action Icons (Inline with Title) */}
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
          </div>
        </div>
      </header>

      {/* Main Content Body (matching ClaimsRegisterView padding and full width) */}
      <div className="p-4 sm:p-8 md:p-10 w-full space-y-6 flex-1 bg-white">
        {/* Subheader & Search Bar Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-xl sm:text-2xl text-[#0D2823] font-normal">
              Your hunters
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Open a user record to review activity, revenue, and access.
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users"
              className="w-full pl-9.5 pr-4 py-2 bg-white text-gray-900 text-xs sm:text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E1BF62] shadow-xs placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Action Notice Banner */}
        <AnimatePresence>
          {actionSuccessMsg && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-medium text-emerald-800 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{actionSuccessMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hunters Table Card Container (matching Claims Card border and shadow-sm) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
        >
          <div suppressHydrationWarning className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-white">
                  <th className="py-4 px-6 text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-gray-400 font-bold">
                    USER
                  </th>
                  <th className="py-4 px-6 text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-gray-400 font-bold">
                    HUNTS
                  </th>
                  <th className="py-4 px-6 text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-gray-400 font-bold">
                    REVENUE
                  </th>
                  <th className="py-4 px-6 text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-gray-400 font-bold">
                    STATUS
                  </th>
                  <th className="py-4 px-6 text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-gray-400 font-bold text-right">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredHunters.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-14 text-center text-stone-500 font-mono text-xs sm:text-sm">
                      No registered hunters found. Users registered from the mobile app will automatically appear here.
                    </td>
                  </tr>
                ) : (
                  filteredHunters.map((hunter, index) => {
                    const isBottomRow =
                      filteredHunters.length > 2
                        ? index >= filteredHunters.length - 2
                        : index > 0;

                    const hunterId = hunter._id || hunter.id || "";

                    return (
                    <tr
                      key={hunterId}
                      className="hover:bg-gray-50 transition-colors group"
                    >
                      {/* User Avatar + Name + Email */}
                      <td className="py-4 px-6">
                        <div
                          onClick={() => setSelectedUserForDetail(hunter)}
                          className="flex items-center gap-3.5 cursor-pointer"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={hunter.avatar}
                            alt={hunter.name}
                            className="w-10 h-10 rounded-full object-cover border border-gray-200 shadow-xs group-hover:scale-105 transition-transform"
                          />
                          <div>
                            <span className="text-sm font-semibold text-[#0D2823] block group-hover:text-[#D4AF37] transition-colors">
                              {hunter.name}
                            </span>
                            <span className="text-xs text-gray-400 font-normal">
                              {hunter.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Hunts (Bought • Solved) */}
                      <td className="py-4 px-6 text-sm text-gray-600">
                        <span className="font-semibold text-gray-900">
                          {hunter.boughtCount}
                        </span>{" "}
                        bought •{" "}
                        <span className="font-semibold text-gray-900">
                          {hunter.solvedCount}
                        </span>{" "}
                        solved
                      </td>

                      {/* Revenue */}
                      <td className="py-4 px-6 text-sm font-semibold text-gray-900">
                        {hunter.revenue} KWD
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium border ${
                            hunter.status === "Active"
                              ? "bg-[#EDF7ED] text-[#2E7D32] border-[#C8E6C9]"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {hunter.status}
                        </span>
                      </td>

                      {/* Action Button With 3-Dots Dropdown */}
                      <td className="py-4 px-6 text-right relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(
                              activeMenuId === hunterId ? null : hunterId
                            );
                          }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#0D2823] hover:bg-gray-100 transition-colors ml-auto cursor-pointer"
                          title="Actions"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Interactive Dropdown Menu */}
                        {activeMenuId === hunterId && (
                          <>
                            {/* Click outside invisible backdrop */}
                            <div
                              className="fixed inset-0 z-40"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(null);
                              }}
                            />

                            <div
                              className={`absolute right-6 z-50 w-52 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 text-left text-xs text-gray-700 space-y-0.5 animate-in fade-in duration-100 ${
                                isBottomRow
                                  ? "bottom-11 origin-bottom-right"
                                  : "top-11 origin-top-right"
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedUserForDetail(hunter);
                                  setActiveMenuId(null);
                                }}
                                className="w-full px-3.5 py-2 flex items-center gap-2.5 hover:bg-gray-50 hover:text-[#0D2823] transition-colors cursor-pointer text-left"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-[#D4AF37]" />
                                <span>View Activity & Record</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => toggleUserStatus(hunterId)}
                                className="w-full px-3.5 py-2 flex items-center gap-2.5 hover:bg-gray-50 hover:text-[#0D2823] transition-colors cursor-pointer text-left"
                              >
                                {hunter.status === "Active" ? (
                                  <>
                                    <XCircle className="w-3.5 h-3.5 text-amber-600" />
                                    <span>Suspend User Access</span>
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Reactivate User</span>
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleResetAccess(hunter.email)}
                                className="w-full px-3.5 py-2 flex items-center gap-2.5 hover:bg-gray-50 hover:text-[#0D2823] transition-colors cursor-pointer text-left"
                              >
                                <Key className="w-3.5 h-3.5 text-blue-600" />
                                <span>Reset Password / Access</span>
                              </button>

                              <div className="border-t border-gray-100 my-1" />

                              <button
                                type="button"
                                onClick={() => handleRevokeUser(hunterId)}
                                className="w-full px-3.5 py-2 flex items-center gap-2.5 hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer text-left"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                <span>Revoke User Record</span>
                              </button>
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                }))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* Hunter Details / Activity Review Modal */}
      <AnimatePresence>
        {selectedUserForDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-gray-200 space-y-6"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedUserForDetail.avatar}
                    alt={selectedUserForDetail.name}
                    className="w-12 h-12 rounded-full object-cover border border-gray-200"
                  />
                  <div>
                    <h3 className="font-serif text-lg text-[#0D2823] font-semibold">
                      {selectedUserForDetail.name}
                    </h3>
                    <p className="text-xs text-gray-500 font-mono">
                      {selectedUserForDetail.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedUserForDetail(null)}
                  className="text-gray-400 hover:text-gray-700 p-1 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Stats Overview */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-center">
                  <span className="text-[10px] font-mono text-gray-400 uppercase block">
                    Total Spent
                  </span>
                  <span className="font-serif text-lg font-bold text-[#0D2823]">
                    {selectedUserForDetail.revenue} KWD
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-center">
                  <span className="text-[10px] font-mono text-gray-400 uppercase block">
                    Bought
                  </span>
                  <span className="font-serif text-lg font-bold text-[#0D2823]">
                    {selectedUserForDetail.boughtCount}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-center">
                  <span className="text-[10px] font-mono text-gray-400 uppercase block">
                    Solved
                  </span>
                  <span className="font-serif text-lg font-bold text-emerald-700">
                    {selectedUserForDetail.solvedCount}
                  </span>
                </div>
              </div>

              {/* Activity Timeline */}
              <div className="space-y-2">
                <p className="text-[11px] font-mono uppercase tracking-widest text-[#0D2823]/60 font-bold">
                  EXPEDITION ACTIVITY
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {(selectedUserForDetail.recentHunts || []).map((hunt, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-[#D4AF37]" />
                        <div>
                          <span className="font-semibold text-gray-800 block">
                            {hunt.title}
                          </span>
                          <span className="text-[11px] text-gray-400 font-mono">
                            {hunt.date}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            hunt.status === "Solved"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {hunt.status}
                        </span>
                        <span className="block text-gray-500 font-mono text-[11px] mt-0.5">
                          {hunt.amount} KWD
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-400">
                  Joined on {selectedUserForDetail.joinedDate}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedUserForDetail(null)}
                  className="bg-[#D4AF37] hover:bg-[#C29F38] text-[#0D2823] font-semibold text-xs px-5 py-2 rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Close Record
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
