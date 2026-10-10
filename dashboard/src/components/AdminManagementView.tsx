"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Bell,
  Search,
  MoreVertical,
  Menu,
  ShieldCheck,
  ShieldAlert,
  UserPlus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  Power,
  Calendar,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppSelector } from "@/redux/hooks";
import { dashboardApi, AdminUserDto } from "@/services/dashboardApi";
import OperatorAvatar from "./OperatorAvatar";

interface AdminManagementViewProps {
  onOpenMobileMenu?: () => void;
}

export default function AdminManagementView({
  onOpenMobileMenu,
}: AdminManagementViewProps) {
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const isSuperAdmin = currentUser?.role === "SUPERADMIN";

  const [admins, setAdmins] = useState<AdminUserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "SUPERADMIN" | "ADMIN">("ALL");

  // Notification and Error state
  const [notice, setNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createRole, setCreateRole] = useState<"ADMIN" | "SUPERADMIN">("ADMIN");
  const [showPassword, setShowPassword] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  // Delete Confirm State
  const [adminToDelete, setAdminToDelete] = useState<AdminUserDto | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Active action dropdown
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const data = await dashboardApi.getAllAdmins();
      setAdmins(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setErrorNotice(err?.message || "Failed to load administrators directory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const showSuccess = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 4000);
  };

  const showError = (msg: string) => {
    setErrorNotice(msg);
    setTimeout(() => setErrorNotice(null), 4000);
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      setCreateError("Only Super Admins possess authority to elevate new operators.");
      return;
    }

    if (!createName.trim() || !createEmail.trim()) {
      setCreateError("Operator name and email address are required.");
      return;
    }

    if (createPassword.length < 6) {
      setCreateError("Password must be at least 6 characters long.");
      return;
    }

    setCreateError("");
    setCreateLoading(true);

    try {
      const created = await dashboardApi.createNewAdmin({
        name: createName.trim(),
        email: createEmail.trim().toLowerCase(),
        password: createPassword,
        role: createRole,
      });

      setAdmins((prev) => [created, ...prev]);
      setIsCreateModalOpen(false);
      setCreateName("");
      setCreateEmail("");
      setCreatePassword("");
      setCreateRole("ADMIN");
      showSuccess(`Operator "${created.name}" successfully created with role ${created.role}.`);
    } catch (err: any) {
      setCreateError(err?.message || "Failed to create administrator account.");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleToggleStatus = async (admin: AdminUserDto) => {
    const adminId = admin._id || admin.id;
    if (!adminId) return;

    if (!isSuperAdmin) {
      showError("Only Super Admins can toggle operator access.");
      return;
    }

    if (currentUser?.id === adminId || currentUser?.email === admin.email) {
      showError("You cannot modify your own administrator account status.");
      return;
    }

    try {
      const updated = await dashboardApi.toggleAdminStatus(adminId);
      setAdmins((prev) =>
        prev.map((a) => ((a._id || a.id) === adminId ? { ...a, status: updated.status } : a))
      );
      showSuccess(`Status for ${admin.name} changed to ${updated.status}.`);
    } catch (err: any) {
      showError(err?.message || "Failed to update administrator status.");
    } finally {
      setActiveMenuId(null);
    }
  };

  const handleDeleteAdmin = async () => {
    if (!adminToDelete) return;
    const adminId = adminToDelete._id || adminToDelete.id;
    if (!adminId) return;

    if (!isSuperAdmin) {
      showError("Only Super Admins can revoke administrator accounts.");
      return;
    }

    if (currentUser?.id === adminId || currentUser?.email === adminToDelete.email) {
      showError("You cannot delete your own administrator account.");
      return;
    }

    setDeleteLoading(true);
    try {
      await dashboardApi.deleteAdmin(adminId);
      setAdmins((prev) => prev.filter((a) => (a._id || a.id) !== adminId));
      showSuccess(`Administrator "${adminToDelete.name}" was permanently removed.`);
      setAdminToDelete(null);
    } catch (err: any) {
      showError(err?.message || "Failed to delete administrator.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredAdmins = useMemo(() => {
    return admins.filter((admin) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        admin.name.toLowerCase().includes(q) ||
        admin.email.toLowerCase().includes(q);

      const matchesRole =
        roleFilter === "ALL" || admin.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [admins, searchQuery, roleFilter]);

  const totalCount = admins.length;
  const superAdminCount = admins.filter((a) => a.role === "SUPERADMIN").length;
  const activeCount = admins.filter((a) => a.status === "ACTIVE").length;

  return (
    <div suppressHydrationWarning className="min-h-full bg-white flex flex-col">
      {/* Sticky Header Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 sm:px-8 md:px-10 pt-4 pb-5 border-b border-black/5 shadow-xs">
        {/* Mobile Top Row */}
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
              className="relative p-2 rounded-xl text-gray-500 hover:text-gray-900 bg-gray-50 border border-gray-200 shadow-xs hover:bg-gray-100 transition-colors"
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

        {/* Main Header Content */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                COMMAND ROSTER
              </span>
              {isSuperAdmin ? (
                <span className="text-[11px] font-mono text-[#8C7335] bg-[#FBF8EF] px-2 py-0.5 rounded-md border border-[#E1BF62]/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-[#E1BF62]" />
                  <span>SUPERADMIN ACCESS</span>
                </span>
              ) : (
                <span className="text-[11px] font-mono text-gray-600 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-200 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-gray-400" />
                  <span>READ ONLY ACCESS</span>
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif text-[#0D2823] tracking-tight">
              Command Operators
            </h1>
            <p className="text-xs sm:text-sm text-gray-600">
              Manage platform administrators, credentials, and elevated clearance roles.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isSuperAdmin ? (
              <button
                onClick={() => {
                  setCreateError("");
                  setIsCreateModalOpen(true);
                }}
                className="bg-[#E1BF62] hover:bg-[#D4AF37] text-[#0D2823] font-medium text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-2 transition-all transform active:scale-98 cursor-pointer shrink-0"
              >
                <UserPlus className="w-4 h-4 text-[#0D2823]" />
                <span>Create Admin</span>
              </button>
            ) : (
              <div
                title="Only Super Admins can create new administrators"
                className="bg-gray-100 text-gray-400 font-medium text-xs sm:text-sm px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-not-allowed shrink-0 border border-gray-200"
              >
                <Lock className="w-4 h-4 text-gray-400" />
                <span>Create Admin</span>
              </div>
            )}

            <Link
              href="/notifications"
              className="hidden md:flex relative p-2.5 rounded-xl text-gray-500 hover:text-gray-900 bg-gray-50 border border-gray-200 shadow-xs hover:bg-gray-100 transition-colors shrink-0"
            >
              <Bell className="w-4 h-4" />
            </Link>
            <Link
              href="/settings/profile"
              title="Go to profile"
              className="hidden md:flex hover:scale-105 transition-transform shrink-0"
            >
              <OperatorAvatar size="md" />
            </Link>
          </div>
        </div>
      </header>

      {/* Body Content */}
      <div className="p-4 sm:p-8 md:p-10 space-y-6 flex-1">
        {/* Success Notice Banner */}
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-center gap-2 shadow-xs"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notice}</span>
          </motion.div>
        )}

        {/* Error Notice Banner */}
        {errorNotice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm flex items-center gap-2 shadow-xs"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorNotice}</span>
          </motion.div>
        )}

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-gray-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-mono uppercase text-gray-600 mb-1">
                Total Operators
              </p>
              <h3 className="text-2xl font-serif text-[#0D2823]">{totalCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#0D2823]/5 flex items-center justify-center text-[#0D2823]">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-gray-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-mono uppercase text-gray-600 mb-1">
                Super Admins
              </p>
              <h3 className="text-2xl font-serif text-[#8C7335]">{superAdminCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#E1BF62]/15 flex items-center justify-center text-[#8C7335]">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-gray-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-mono uppercase text-gray-600 mb-1">
                Active Clearance
              </p>
              <h3 className="text-2xl font-serif text-emerald-700">{activeCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Power className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#E1BF62] focus:bg-white transition-all shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Role Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl w-full sm:w-auto self-stretch sm:self-auto">
            {(["ALL", "SUPERADMIN", "ADMIN"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`flex-1 sm:flex-none text-xs font-mono px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  roleFilter === r
                    ? "bg-white text-[#0D2823] font-semibold shadow-xs"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                {r === "ALL" ? "All Roles" : r}
              </button>
            ))}
          </div>
        </div>

        {/* Operators Table */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-16 text-center text-gray-400 flex flex-col items-center justify-center gap-3 font-mono text-xs">
              <Loader2 className="w-6 h-6 animate-spin text-[#E1BF62]" />
              <span>Scanning operator directory...</span>
            </div>
          ) : filteredAdmins.length === 0 ? (
            <div className="p-16 text-center text-gray-400 font-mono text-xs">
              No administrator records match your criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50 text-[11px] font-mono uppercase text-gray-500 tracking-wider">
                    <th className="py-3 px-4 sm:px-6">Operator</th>
                    <th className="py-3 px-4">Role Clearance</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 hidden md:table-cell">Created Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
                  {filteredAdmins.map((admin) => {
                    const adminId = admin._id || admin.id || "";
                    const isSelf = currentUser?.id === adminId || currentUser?.email === admin.email;
                    const initials = admin.name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase();

                    return (
                      <tr
                        key={adminId}
                        className="hover:bg-gray-50/60 transition-colors group"
                      >
                        {/* Name & Email */}
                        <td className="py-4 px-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            <OperatorAvatar
                              size="sm"
                              overrideAvatar={admin.avatar}
                              fallbackName={admin.name}
                            />
                            <div>
                              <div className="font-medium text-gray-900 flex items-center gap-1.5">
                                <span>{admin.name}</span>
                                {isSelf && (
                                  <span className="text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.2 rounded">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 font-mono">
                                {admin.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Role Clearance */}
                        <td className="py-4 px-4">
                          {admin.role === "SUPERADMIN" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-[#FDFBF7] text-[#8C7335] border border-[#E1BF62]/40 shadow-2xs">
                              <ShieldAlert className="w-3 h-3 text-[#E1BF62]" />
                              <span>SUPERADMIN</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60 shadow-2xs">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              <span>ADMIN</span>
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4">
                          {admin.status === "ACTIVE" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span>Active</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-rose-50 text-rose-700 border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              <span>Disabled</span>
                            </span>
                          )}
                        </td>

                        {/* Created Date */}
                        <td className="py-4 px-4 hidden md:table-cell text-xs text-gray-500 font-mono">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <span>
                              {admin.createdAt
                                ? new Date(admin.createdAt).toLocaleDateString("en-GB")
                                : "—"}
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 text-right relative">
                          {isSuperAdmin ? (
                            <div className="inline-block text-left">
                              <button
                                onClick={() =>
                                  setActiveMenuId(
                                    activeMenuId === adminId ? null : adminId
                                  )
                                }
                                disabled={isSelf}
                                className={`p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors ${
                                  isSelf ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
                                }`}
                                title={isSelf ? "Self modification restricted" : "Manage operator"}
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>

                              {/* Dropdown Menu */}
                              {activeMenuId === adminId && (
                                <div className="absolute right-4 top-10 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1 text-xs">
                                  <button
                                    onClick={() => handleToggleStatus(admin)}
                                    className="w-full text-left px-3.5 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700 font-medium cursor-pointer"
                                  >
                                    <Power className="w-3.5 h-3.5 text-gray-400" />
                                    <span>
                                      {admin.status === "ACTIVE"
                                        ? "Disable Operator"
                                        : "Activate Operator"}
                                    </span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      setAdminToDelete(admin);
                                    }}
                                    className="w-full text-left px-3.5 py-2 hover:bg-rose-50 flex items-center gap-2 text-rose-600 font-medium cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                    <span>Revoke Account</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] font-mono text-gray-400">
                              Protected
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* CREATE ADMIN MODAL (SUPERADMIN ONLY) */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
            >
              {/* Modal Header */}
              <div className="px-6 py-5 bg-[#0D2823] text-white flex items-center justify-between border-b border-[#E1BF62]/20">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#E1BF62] text-[#0D2823] flex items-center justify-center font-bold">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg text-white">
                      Create Operator Account
                    </h3>
                    <p className="text-[11px] font-mono text-[#E1BF62] uppercase tracking-wider">
                      SUPERADMIN PROVISIONING
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-emerald-200/70 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body / Form */}
              <form onSubmit={handleCreateAdmin} className="p-6 space-y-4">
                {createError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{createError}</span>
                  </div>
                )}

                {/* Operator Name */}
                <div>
                  <label className="block text-xs font-mono text-gray-700 mb-1.5">
                    Operator Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tariq Al-Rashid"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E1BF62] focus:bg-white transition-all shadow-xs"
                  />
                </div>

                {/* Operator Email */}
                <div>
                  <label className="block text-xs font-mono text-gray-700 mb-1.5">
                    Operator Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. tariq@treasurebox.app"
                    value={createEmail}
                    onChange={(e) => setCreateEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E1BF62] focus:bg-white transition-all shadow-xs"
                  />
                </div>

                {/* Password with Eye Toggle */}
                <div>
                  <label className="block text-xs font-mono text-gray-700 mb-1.5">
                    Temporary Password (minimum 6 characters) *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={createPassword}
                      onChange={(e) => setCreatePassword(e.target.value)}
                      className="w-full pl-3.5 pr-11 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E1BF62] focus:bg-white transition-all shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Role Selection */}
                <div>
                  <label className="block text-xs font-mono text-gray-700 mb-1.5">
                    Assigned Clearance Role
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCreateRole("ADMIN")}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        createRole === "ADMIN"
                          ? "border-[#0D2823] bg-emerald-50/50 shadow-xs"
                          : "border-gray-200 bg-white hover:bg-gray-50 text-gray-600"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-semibold text-xs text-[#0D2823] mb-0.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>ADMIN</span>
                      </div>
                      <p className="text-[11px] text-gray-500">
                        Operational hunts & claims management.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCreateRole("SUPERADMIN")}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        createRole === "SUPERADMIN"
                          ? "border-[#E1BF62] bg-[#FDFBF7] shadow-xs"
                          : "border-gray-200 bg-white hover:bg-gray-50 text-gray-600"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-semibold text-xs text-[#8C7335] mb-0.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-[#E1BF62]" />
                        <span>SUPERADMIN</span>
                      </div>
                      <p className="text-[11px] text-gray-500">
                        Full command authority over operators & system.
                      </p>
                    </button>
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2.5 text-xs font-mono text-gray-600 hover:text-gray-900 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="px-5 py-2.5 bg-[#E1BF62] hover:bg-[#D4AF37] disabled:opacity-60 text-[#0D2823] font-medium text-xs sm:text-sm rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all"
                  >
                    {createLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Creating Operator...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Create Operator</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {adminToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-sm rounded-2xl shadow-xl border border-gray-200 p-6"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mb-4">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl text-[#0D2823] mb-2">
                Revoke Operator Clearance?
              </h3>
              <p className="text-xs text-gray-600 mb-6 leading-relaxed">
                Are you sure you want to permanently revoke credentials for{" "}
                <span className="font-semibold text-gray-900">
                  {adminToDelete.name}
                </span>{" "}
                ({adminToDelete.email})? This action cannot be undone.
              </p>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setAdminToDelete(null)}
                  disabled={deleteLoading}
                  className="px-4 py-2 text-xs font-mono text-gray-600 hover:text-gray-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAdmin}
                  disabled={deleteLoading}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white font-medium text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {deleteLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Revoking...</span>
                    </>
                  ) : (
                    <span>Revoke Operator</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
