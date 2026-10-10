"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Info,
  ArrowRight,
  Menu,
  DollarSign,
  Trophy,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  fetchNotificationsThunk,
} from "@/redux/slices/notificationsSlice";
import OperatorAvatar from "./OperatorAvatar";

interface NotificationsViewProps {
  onOpenMobileMenu?: () => void;
}

export default function NotificationsView({
  onOpenMobileMenu,
}: NotificationsViewProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { items: liveNotifs, loading, loadingMore, pagination } = useAppSelector(
    (state) => state.notifications,
  );

  useEffect(() => {
    dispatch(fetchNotificationsThunk({ page: 1, limit: 20 }));
  }, [dispatch]);

  const notifications = (liveNotifs || []).map((n) => {
    const titleLower = (n.title || "").toLowerCase();
    const typeStr = (n.type || "").toUpperCase();
    const isPayment = typeStr.includes("PAYMENT") || titleLower.includes("payment");
    const isTreasure =
      typeStr.includes("TREASURE") ||
      typeStr.includes("CLAIM") ||
      titleLower.includes("treasure") ||
      titleLower.includes("discovered");

    let icon = Info;
    let type: "info" | "warning" | "success" = "info";
    let actionText = "View";
    let actionHref = "/";

    if (isPayment) {
      icon = DollarSign;
      type = "success";
      actionText = "View Earnings";
      actionHref = "/earnings";
    } else if (isTreasure) {
      icon = Trophy;
      type = "warning";
      actionText = "Review Claims";
      actionHref = "/claims";
    }

    let timeFormatted = "Recently";
    if (n.createdAt) {
      try {
        const date = new Date(n.createdAt);
        timeFormatted =
          date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) +
          " • " +
          date.toLocaleDateString();
      } catch {
        timeFormatted = n.createdAt.slice(0, 10);
      }
    }

    return {
      id: n._id,
      title: n.title,
      message: n.message || n.body || "",
      time: timeFormatted,
      type,
      icon,
      actionText,
      actionHref,
    };
  });

  const hasMore = pagination.page < pagination.totalPages;

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

        {/* Main Header Container */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-[#0D2823]/60 font-semibold mb-0.5">
              SYSTEM ALERTS &amp; ACTIVITY
            </p>
            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#0D2823] font-normal tracking-tight">
              Notifications
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Pagination summary badge */}
            {pagination.total > 0 && (
              <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-mono text-[#0D2823]/60 bg-gray-50 border border-gray-200 rounded-full px-3 py-1.5">
                <span className="font-semibold text-[#0D2823]">
                  {notifications.length}
                </span>
                &nbsp;of&nbsp;
                <span className="font-semibold text-[#0D2823]">
                  {pagination.total}
                </span>
                &nbsp;notifications
              </span>
            )}

            {/* Desktop Right Action Icons */}
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
        </div>
      </header>

      {/* Main Content Body */}
      <div className="p-4 sm:p-8 md:p-10 w-full space-y-4 flex-1 bg-white">
        {loading ? (
          /* Initial loading skeleton */
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden divide-y divide-gray-100">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-5 flex items-center gap-4 animate-pulse">
                <div className="w-10 h-10 rounded-xl bg-gray-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-gray-100 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#0D2823] mb-4">
              <Bell className="w-6 h-6 text-[#0D2823]" />
            </div>
            <h3 className="font-serif text-xl text-[#0D2823] font-normal mb-1">
              No notifications yet
            </h3>
            <p className="text-xs text-gray-500 max-w-sm">
              All expedition actions, hunter claim alerts, and system broadcasts
              will be displayed here as they happen.
            </p>
          </div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden divide-y divide-gray-100"
            >
              {notifications.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/80 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          item.type === "warning"
                            ? "bg-amber-100 text-amber-800 border border-amber-300/60"
                            : item.type === "success"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300/60"
                              : "bg-blue-100 text-blue-800 border border-blue-300/60"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-sm sm:text-base text-[#0D2823]">
                            {item.title}
                          </h3>
                          <span className="text-[11px] font-mono text-gray-400">
                            {item.time}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                          {item.message}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => router.push(item.actionHref)}
                      className="self-end sm:self-auto text-xs font-semibold text-[#0D2823] hover:text-[#D4AF37] flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                    >
                      <span>{item.actionText}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </motion.div>

            {/* Pagination Footer — show whenever there are items */}
            {notifications.length > 0 && (
              <div className="flex flex-col items-center gap-3 pt-2">
                <div className="flex items-center gap-1.5">
                  {/* Prev button */}
                  <button
                    onClick={() => {
                      if (pagination.page <= 1 || loadingMore) return;
                      dispatch(fetchNotificationsThunk({ page: pagination.page - 1, limit: pagination.limit }));
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    disabled={pagination.page <= 1 || loadingMore}
                    className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-[#0D2823] hover:bg-gray-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    title="Previous page"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  {/* Page number pills */}
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                    .filter((p) => {
                      // Show: first, last, current ±1, and ellipsis markers
                      return (
                        p === 1 ||
                        p === pagination.totalPages ||
                        Math.abs(p - pagination.page) <= 1
                      );
                    })
                    .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                      if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) {
                        acc.push("…");
                      }
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, idx) =>
                      p === "…" ? (
                        <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-gray-400 text-sm select-none">
                          …
                        </span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => {
                            if (p === pagination.page || loadingMore) return;
                            dispatch(fetchNotificationsThunk({ page: p as number, limit: pagination.limit }));
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          disabled={loadingMore}
                          className={`w-8 h-8 rounded-lg border text-sm font-semibold transition-all cursor-pointer disabled:cursor-not-allowed ${
                            p === pagination.page
                              ? "bg-[#0D2823] text-white border-[#0D2823] shadow-sm"
                              : "bg-white text-[#0D2823] border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                          }`}
                        >
                          {loadingMore && p === pagination.page ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" />
                          ) : (
                            p
                          )}
                        </button>
                      )
                    )}

                  {/* Next button */}
                  <button
                    onClick={() => {
                      if (pagination.page >= pagination.totalPages || loadingMore) return;
                      dispatch(fetchNotificationsThunk({ page: pagination.page + 1, limit: pagination.limit }));
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    disabled={pagination.page >= pagination.totalPages || loadingMore}
                    className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-[#0D2823] hover:bg-gray-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    title="Next page"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                <p className="text-[11px] font-mono text-gray-400">
                  Page {pagination.page} of {pagination.totalPages} &nbsp;·&nbsp; {pagination.total} total
                </p>
              </div>
            )}

            {/* All loaded indicator (single page, no prev/next needed) */}
            {pagination.totalPages <= 1 && pagination.total > 0 && (
              <p className="text-center text-[11px] font-mono text-gray-400 pt-2">
                All {pagination.total} notifications loaded
              </p>
            )}

          </>
        )}
      </div>
    </div>
  );
}
