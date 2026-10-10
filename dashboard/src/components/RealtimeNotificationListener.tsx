"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { DollarSign, Trophy, Bell, X, ExternalLink, Sparkles } from "lucide-react";
import { useAppDispatch } from "@/redux/hooks";
import { addRealtimeNotification } from "@/redux/slices/notificationsSlice";
import { addRealtimeClaim, fetchClaimsThunk } from "@/redux/slices/claimsSlice";
import { getSocket } from "@/services/socket";
import { NotificationItemDto, ClaimRecordDto } from "@/services/dashboardApi";

interface ActiveToast {
  id: string;
  title: string;
  message: string;
  type: "PAYMENT" | "TREASURE" | "GENERAL";
  actionHref?: string;
  actionLabel?: string;
}

export default function RealtimeNotificationListener() {
  const dispatch = useAppDispatch();
  const [toasts, setToasts] = useState<ActiveToast[]>([]);
  const processedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const socket = getSocket();

    const handleNewClaim = (data: unknown) => {
      if (!data) return;
      dispatch(addRealtimeClaim(data as ClaimRecordDto));
    };

    const handleNewNotification = (data: unknown) => {
      const payload = data as {
        _id?: string;
        title?: string;
        message?: string;
        body?: string;
        type?: string;
        createdAt?: string;
        data?: Record<string, unknown>;
      };

      const title = payload.title || "New System Notification";
      const message = payload.message || payload.body || "A new update has been received.";
      const id = payload._id || `toast-${Date.now()}-${Math.random()}`;

      // Prevent duplicate notification processing (strict deduplication)
      if (processedIdsRef.current.has(id)) {
        return;
      }
      processedIdsRef.current.add(id);
      setTimeout(() => {
        processedIdsRef.current.delete(id);
      }, 15000);

      const typeStr = (payload.type || "").toUpperCase();

      let toastType: "PAYMENT" | "TREASURE" | "GENERAL" = "GENERAL";
      let actionHref: string | undefined = "/notifications";
      let actionLabel: string | undefined = "View Details";

      if (typeStr.includes("PAYMENT") || title.toLowerCase().includes("payment")) {
        toastType = "PAYMENT";
        actionHref = "/earnings";
        actionLabel = "View Earnings";
      } else if (
        typeStr.includes("TREASURE") ||
        typeStr.includes("CLAIM") ||
        title.toLowerCase().includes("treasure")
      ) {
        toastType = "TREASURE";
        actionHref = "/claims";
        actionLabel = "Review Claims";
        // Also refresh claims list for complete sync
        dispatch(fetchClaimsThunk(undefined));
      }

      // 1. Dispatch to Redux state
      const dto: NotificationItemDto = {
        _id: id,
        title,
        message,
        body: message,
        createdAt: payload.createdAt || new Date().toISOString(),
        type: toastType,
        read: false,
      };
      dispatch(addRealtimeNotification(dto));

      // 2. Add floating animated toast with deduplication
      const newToast: ActiveToast = {
        id,
        title,
        message,
        type: toastType,
        actionHref,
        actionLabel,
      };

      setToasts((prev) => {
        if (prev.some((t) => t.id === id)) return prev;
        return [newToast, ...prev.slice(0, 3)];
      });

      // Auto dismiss after 7 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 7000);
    };

    socket.on("claim:new", handleNewClaim);
    socket.on("notification:new", handleNewNotification);

    return () => {
      socket.off("claim:new", handleNewClaim);
      socket.off("notification:new", handleNewNotification);
    };
  }, [dispatch]);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <aside
      aria-label="Real-time notifications"
      className="fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none"
    >
      <AnimatePresence>
        {toasts.map((toast) => {
          const isPayment = toast.type === "PAYMENT";
          const isTreasure = toast.type === "TREASURE";

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className={`pointer-events-auto rounded-2xl p-4 shadow-2xl backdrop-blur-md border border-black/10 flex flex-col gap-2.5 transition-all ${
                isPayment
                  ? "bg-[#0D2823] text-white border-[#E1BF62]/40"
                  : isTreasure
                  ? "bg-[#14231E] text-white border-emerald-400/40"
                  : "bg-white text-[#1C2522] border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                      isPayment
                        ? "bg-[#E1BF62] text-[#0D2823]"
                        : isTreasure
                        ? "bg-emerald-500 text-white"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {isPayment ? (
                      <DollarSign className="w-5 h-5 font-bold" />
                    ) : isTreasure ? (
                      <Trophy className="w-5 h-5" />
                    ) : (
                      <Bell className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold uppercase tracking-wider text-[#E1BF62]">
                        {isPayment
                          ? "Payment Success"
                          : isTreasure
                          ? "Discovery Alert"
                          : "Live Alert"}
                      </span>
                      <Sparkles className="w-3 h-3 text-[#E1BF62] animate-pulse" />
                    </div>
                    <h4 className="text-sm font-bold leading-snug">{toast.title}</h4>
                  </div>
                </div>

                <button
                  onClick={() => removeToast(toast.id)}
                  className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  title="Dismiss notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p
                className={`text-xs leading-relaxed ${
                  isPayment || isTreasure ? "text-white/80" : "text-gray-600"
                }`}
              >
                {toast.message}
              </p>

              {toast.actionHref && (
                <div className="pt-1 flex justify-end">
                  <Link
                    href={toast.actionHref}
                    onClick={() => removeToast(toast.id)}
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      isPayment
                        ? "bg-[#E1BF62] text-[#0D2823] hover:bg-[#ebd083]"
                        : isTreasure
                        ? "bg-emerald-500 text-white hover:bg-emerald-600"
                        : "bg-gray-900 text-white hover:bg-black"
                    }`}
                  >
                    <span>{toast.actionLabel || "View"}</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </aside>
  );
}
