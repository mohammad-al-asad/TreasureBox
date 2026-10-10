"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  ChevronRight,
  Menu,
  CheckCircle2,
  XCircle,
  X,
  Trophy,
  Filter,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Clock,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchClaimsThunk, verifyOrRejectClaimThunk } from "@/redux/slices/claimsSlice";
import { ClaimRecordDto, resolveMediaUrl } from "@/services/dashboardApi";
import OperatorAvatar from "./OperatorAvatar";

interface ClaimsRegisterViewProps {
  onOpenMobileMenu?: () => void;
}

type FilterStatus = "ALL" | "PENDING_REVIEW" | "VERIFIED" | "REJECTED";

export default function ClaimsRegisterView({ onOpenMobileMenu }: ClaimsRegisterViewProps) {
  const dispatch = useAppDispatch();
  const { items: reduxClaims, loading } = useAppSelector((state) => state.claims);
  const { user } = useAppSelector((state) => state.auth);
  const [selectedClaim, setSelectedClaim] = useState<ClaimRecordDto | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("ALL");

  useEffect(() => {
    dispatch(fetchClaimsThunk(undefined));
  }, [dispatch]);

  const totalClaims = reduxClaims.length;
  const pendingCount = reduxClaims.filter((c) => c.status === "PENDING_REVIEW").length;
  const verifiedCount = reduxClaims.filter((c) => c.status === "VERIFIED").length;
  const rejectedCount = reduxClaims.filter((c) => c.status === "REJECTED").length;

  const filteredClaims = reduxClaims.filter((c) => {
    if (activeFilter === "ALL") return true;
    return c.status === activeFilter;
  });

  return (
    <div className="min-h-full bg-white flex flex-col font-sans">
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
          <div className="min-w-0">
            {/* Dynamic Status Header Badge */}
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-[#0D2823]/70 font-bold">
                HUNTER CONFIRMATIONS
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#0D2823]/5 text-[#0D2823] border border-black/5">
                {totalClaims} {totalClaims === 1 ? "RECORD" : "TOTAL"}
              </span>
              {pendingCount > 0 ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  {pendingCount} PENDING
                </span>
              ) : (
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  ALL VERIFIED
                </span>
              )}
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#0D2823] font-normal tracking-tight">
              Claims register
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

        {/* Filter Navigation Tabs */}
        <div className="flex items-center gap-2 pt-4 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveFilter("ALL")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer shrink-0 ${
              activeFilter === "ALL"
                ? "bg-[#0D2823] text-white shadow-xs font-semibold"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200/70"
            }`}
          >
            All Claims ({totalClaims})
          </button>
          <button
            onClick={() => setActiveFilter("PENDING_REVIEW")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer shrink-0 ${
              activeFilter === "PENDING_REVIEW"
                ? "bg-amber-600 text-white shadow-xs font-semibold"
                : "bg-amber-50 text-amber-900 border border-amber-200/60 hover:bg-amber-100"
            }`}
          >
            Pending Review ({pendingCount})
          </button>
          <button
            onClick={() => setActiveFilter("VERIFIED")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer shrink-0 ${
              activeFilter === "VERIFIED"
                ? "bg-emerald-700 text-white shadow-xs font-semibold"
                : "bg-emerald-50 text-emerald-900 border border-emerald-200/60 hover:bg-emerald-100"
            }`}
          >
            Verified ({verifiedCount})
          </button>
          <button
            onClick={() => setActiveFilter("REJECTED")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer shrink-0 ${
              activeFilter === "REJECTED"
                ? "bg-rose-700 text-white shadow-xs font-semibold"
                : "bg-rose-50 text-rose-900 border border-rose-200/60 hover:bg-rose-100"
            }`}
          >
            Rejected ({rejectedCount})
          </button>
        </div>
      </header>

      {/* Main Content Body */}
      <div className="p-4 sm:p-8 md:p-10 w-full space-y-6 flex-1 bg-white">
        {loading ? (
          <div className="py-16 text-center text-xs font-mono text-gray-400">
            Loading claims register...
          </div>
        ) : filteredClaims.length === 0 ? (
          /* Premium Empty State */
          <div className="bg-gradient-to-b from-stone-50/60 to-white rounded-3xl shadow-xs border border-gray-200/80 p-8 sm:p-16 text-center flex flex-col items-center justify-center min-h-[360px] max-w-2xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-700 mb-5 shadow-xs">
              <Trophy className="w-8 h-8 text-[#B39345]" />
            </div>
            <h3 className="font-serif text-2xl text-[#0D2823] font-normal mb-2 tracking-tight">
              {activeFilter === "ALL"
                ? "No treasure claims recorded yet"
                : `No ${activeFilter.toLowerCase().replace("_", " ")} claims`}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 max-w-md leading-relaxed mb-6">
              When hunters uncover hidden coordinates in the mobile app and submit their discovery proof photos, their records will stream here in real-time.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Real-time socket listening for new discoveries</span>
            </div>
          </div>
        ) : (
          /* Claims List Table / Card */
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden divide-y divide-gray-100"
          >
            {filteredClaims.map((c, index) => {
              const huntTitle =
                typeof c.huntId === "object" && c.huntId
                  ? c.huntId.titleEn
                  : "Treasure Expedition";
              const isVerified = c.status === "VERIFIED";
              const isRejected = c.status === "REJECTED";
              const isPending = c.status === "PENDING_REVIEW";

              return (
                <div
                  key={c._id || c.id || String(index)}
                  onClick={() => setSelectedClaim(c)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 hover:bg-gray-50/90 transition-colors cursor-pointer gap-4"
                >
                  <div className="flex items-start sm:items-center gap-4 min-w-0">
                    {/* Proof Photo or Gradient Avatar */}
                    {c.proofPhotoUrl ? (
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-black/10 shrink-0 shadow-2xs relative bg-gray-100 flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={resolveMediaUrl(c.proofPhotoUrl)}
                          alt="Proof"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            const fallback = e.currentTarget.parentElement?.querySelector(".fallback-icon");
                            if (fallback) (fallback as HTMLElement).style.display = "flex";
                          }}
                        />
                        <div className="fallback-icon hidden w-full h-full bg-gradient-to-br from-[#0D2823] to-[#1a443b] text-[#E1BF62] items-center justify-center font-bold text-sm">
                          <Trophy className="w-5 h-5" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0D2823] to-[#1a443b] text-[#E1BF62] flex items-center justify-center font-bold text-sm shrink-0 border border-[#E1BF62]/20">
                        <Trophy className="w-5 h-5" />
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm sm:text-base text-[#0D2823] truncate">
                          {huntTitle}
                        </h3>
                        {typeof c.huntId === "object" && c.huntId?.price !== undefined && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#0D2823]/5 text-[#0D2823] font-bold">
                            ${c.huntId.price}
                          </span>
                        )}
                        {typeof c.huntId === "object" && c.huntId?.difficulty && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/50 uppercase font-semibold">
                            {c.huntId.difficulty}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Claimed by <span className="font-medium text-gray-800">{c.hunterName}</span>
                        {c.hunterEmail && (
                          <span className="hidden md:inline font-mono text-gray-400">
                            {" "}
                            • {c.hunterEmail}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                    <div className="text-left sm:text-right">
                      <p className="text-[11px] font-mono text-gray-400">
                        {c.submittedAt
                          ? new Date(c.submittedAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            }) +
                            " · " +
                            c.submittedAt.slice(0, 10)
                          : "Recently"}
                      </p>
                      <span
                        className={`inline-block text-[10px] font-bold font-mono px-2 py-0.5 rounded-full mt-1 uppercase ${
                          isVerified
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300/60"
                            : isRejected
                            ? "bg-rose-100 text-rose-800 border border-rose-300/60"
                            : "bg-amber-100 text-amber-900 border border-amber-300/60"
                        }`}
                      >
                        {isVerified
                          ? "Verified"
                          : isRejected
                          ? "Rejected"
                          : "Pending Review"}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-[#0D2823] hover:text-white text-[#0D2823] text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <span>Review</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}

        {/* Subtext */}
        <p className="text-xs text-gray-400 leading-relaxed font-mono">
          All hunter submissions are validated with coordinates and timestamp evidence.
        </p>
      </div>

      {/* Claim Detail & Verification Modal */}
      <AnimatePresence>
        {selectedClaim && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-[#B39345] font-bold">
                    CLAIM VERIFICATION DOSSIER
                  </p>
                  <h3 className="text-lg font-bold text-[#0D2823]">
                    {typeof selectedClaim.huntId === "object" && selectedClaim.huntId
                      ? selectedClaim.huntId.titleEn
                      : "Expedition Treasure"}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedClaim(null)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                  title="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                {selectedClaim.proofPhotoUrl && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-mono uppercase text-gray-400 font-bold">
                        Submitted Photo Proof
                      </label>
                      <a
                        href={resolveMediaUrl(selectedClaim.proofPhotoUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-[#B39345] hover:text-[#8c712e] font-mono font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <span>View Full Size</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="w-full min-h-56 max-h-96 bg-gray-900/5 rounded-xl overflow-hidden border border-gray-200 shadow-xs relative flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={resolveMediaUrl(selectedClaim.proofPhotoUrl)}
                        alt="Proof"
                        className="w-full h-auto max-h-96 object-contain rounded-xl"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          const fallback = e.currentTarget.parentElement?.querySelector(".fallback-modal");
                          if (fallback) (fallback as HTMLElement).style.display = "flex";
                        }}
                      />
                      <div className="fallback-modal hidden flex-col items-center justify-center p-8 text-gray-400 gap-2">
                        <Trophy className="w-10 h-10 text-[#B39345]" />
                        <span className="text-xs font-mono">Proof preview unavailable</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Dossier Information Grid */}
                <div className="grid grid-cols-2 gap-3 bg-gray-50/90 p-4 rounded-xl text-xs border border-gray-100">
                  <div>
                    <span className="text-gray-400 block font-mono text-[10px] uppercase">HUNTER NAME</span>
                    <span className="font-semibold text-gray-900 text-sm">{selectedClaim.hunterName}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-mono text-[10px] uppercase">CLAIM STATUS</span>
                    <span
                      className={`inline-block font-bold font-mono px-2 py-0.5 rounded-full text-[10px] uppercase mt-0.5 ${
                        selectedClaim.status === "VERIFIED"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300/60"
                          : selectedClaim.status === "REJECTED"
                          ? "bg-rose-100 text-rose-800 border border-rose-300/60"
                          : "bg-amber-100 text-amber-900 border border-amber-300/60"
                      }`}
                    >
                      {selectedClaim.status}
                    </span>
                  </div>
                  {selectedClaim.hunterEmail && (
                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-gray-400 block font-mono text-[10px] uppercase">HUNTER EMAIL</span>
                      <span className="font-medium text-gray-800 font-mono break-all">{selectedClaim.hunterEmail}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-400 block font-mono text-[10px] uppercase">SUBMISSION TIME</span>
                    <span className="font-medium text-gray-700 font-mono">
                      {selectedClaim.submittedAt
                        ? new Date(selectedClaim.submittedAt).toLocaleString()
                        : "Recently"}
                    </span>
                  </div>
                  {typeof selectedClaim.huntId === "object" && selectedClaim.huntId && (
                    <>
                      <div>
                        <span className="text-gray-400 block font-mono text-[10px] uppercase">PERMIT VALUE</span>
                        <span className="font-bold text-[#0D2823] font-mono">
                          ${selectedClaim.huntId.price ?? 0}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block font-mono text-[10px] uppercase">DIFFICULTY</span>
                        <span className="font-semibold text-gray-700 uppercase font-mono">
                          {selectedClaim.huntId.difficulty || "STANDARD"}
                        </span>
                      </div>
                      {selectedClaim.huntId.stageOne?.coordinates && (
                        <div className="col-span-2">
                          <span className="text-gray-400 block font-mono text-[10px] uppercase">EXPEDITION COORDINATES</span>
                          <span className="font-mono text-gray-700 text-xs">
                            {selectedClaim.huntId.stageOne.coordinates.latitude}° N,{" "}
                            {selectedClaim.huntId.stageOne.coordinates.longitude}° E
                            {selectedClaim.huntId.stageOne.locationNameEn &&
                              ` (${selectedClaim.huntId.stageOne.locationNameEn})`}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const claimId = selectedClaim._id || selectedClaim.id || "";
                      dispatch(verifyOrRejectClaimThunk({ claimId, status: "VERIFIED" }));
                      setSelectedClaim(null);
                    }}
                    className="flex-1 py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve & Verify Treasure</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const claimId = selectedClaim._id || selectedClaim.id || "";
                      dispatch(verifyOrRejectClaimThunk({ claimId, status: "REJECTED" }));
                      setSelectedClaim(null);
                    }}
                    className="flex-1 py-3 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs flex items-center justify-center gap-2 border border-rose-200 cursor-pointer transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject Proof</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
