"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Plus, Search, Eye, Edit, Trash2, X, Menu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchCabinetHuntsThunk, deleteHuntThunk } from "@/redux/slices/huntsSlice";
import { resolveMediaUrl } from "@/services/dashboardApi";
import OperatorAvatar from "./OperatorAvatar";


interface TreasureCabinetViewProps {
  onNavigateToCreate: () => void;
  onOpenMobileMenu?: () => void;
}

interface HuntItem {
  id: string;
  name: string;
  createdDate: string;
  price: string;
  difficulty: "Easy" | "Medium" | "Hard";
  status: "Live" | "In Progress" | "Draft" | "Found";
  category?: string;
  locationName?: string;
  activeHunter?: string;
  capitalWorth?: string;
  gradient: string;
  cipher?: string;
  stagePin?: string;
  spotImage?: string;
}

export default function TreasureCabinetView({
  onNavigateToCreate,
  onOpenMobileMenu,
}: TreasureCabinetViewProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { items: reduxHunts, loading } = useAppSelector((state) => state.hunts);
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchCabinetHuntsThunk(undefined));
  }, [dispatch]);

  const hunts: HuntItem[] = reduxHunts.map((h) => ({
    id: h._id || h.id || "",
    name: h.titleEn,
    createdDate: h.createdAt ? `Created ${h.createdAt.slice(0, 10)}` : "Created 2026",
    price: h.price === 0 ? "Free" : `${h.price} KWD`,
    difficulty: (h.difficulty === "EASY" ? "Easy" : h.difficulty === "HARD" ? "Hard" : "Medium") as "Easy" | "Medium" | "Hard",
    status: (h.status === "FOUND"
      ? "Found"
      : h.status === "IN_PROGRESS"
      ? "In Progress"
      : h.status === "DRAFT"
      ? "Draft"
      : "Live") as "Live" | "In Progress" | "Draft" | "Found",
    category: (typeof h.category === "object" && h.category ? h.category.name : h.categoryName) || "Historic Souks",
    locationName: h.stageOne?.locationNameEn || "",
    activeHunter: h.activeHunter?.hunterName,
    capitalWorth: h.capitalWorth,
    gradient:
      h.difficulty === "HARD"
        ? "from-amber-700 to-yellow-900"
        : h.difficulty === "EASY"
        ? "from-emerald-700 to-green-900"
        : "from-emerald-800 to-teal-950",
    cipher: h.cipher?.targetSequence || "Pending Sequence",
    stagePin: h.stageOne?.locationNameEn || "Mappable Point",
    spotImage: h.spotImage || (h.images && h.images.length > 0 ? h.images[0] : undefined),
  }));

  const [activeFilter, setActiveFilter] = useState<"All hunts" | "Live" | "In Progress" | "Draft" | "Found">("All hunts");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("All categories");
  const [searchQuery, setSearchQuery] = useState("");

  const uniqueCategories = Array.from(
    new Set(hunts.map((h) => h.category).filter(Boolean))
  ) as string[];

  // Modal States
  const [selectedHuntForView, setSelectedHuntForView] = useState<HuntItem | null>(null);
  const [selectedHuntForDelete, setSelectedHuntForDelete] = useState<HuntItem | null>(null);

  const filteredHunts = hunts.filter((hunt) => {
    const matchesFilter = activeFilter === "All hunts" || hunt.status === activeFilter;
    const matchesCategory =
      selectedCategoryFilter === "All categories" || hunt.category === selectedCategoryFilter;
    const matchesSearch =
      hunt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (hunt.category && hunt.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (hunt.locationName && hunt.locationName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesCategory && matchesSearch;
  });

  const handleDeleteConfirm = async () => {
    if (selectedHuntForDelete) {
      await dispatch(deleteHuntThunk(selectedHuntForDelete.id));
      setSelectedHuntForDelete(null);
    }
  };

  const handleEditClick = (hunt: HuntItem) => {
    router.push(`/create-hunt?edit=${hunt.id}&name=${encodeURIComponent(hunt.name)}&price=${encodeURIComponent(hunt.price)}&difficulty=${encodeURIComponent(hunt.difficulty)}${hunt.capitalWorth ? `&capitalWorth=${encodeURIComponent(hunt.capitalWorth)}` : ''}`);
  };


  return (
    <div className="min-h-full bg-white flex flex-col relative">
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
              <span>New</span>
            </button>
          </div>
        </div>

        {/* Main Header Container (Desktop 1-Row Inline Alignment >= md) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-[#0D2823]/60 font-semibold mb-0.5">
              INVENTORY · {hunts.length} TOTAL HUNTS
            </p>
            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#0D2823] font-normal tracking-tight">
              Treasure cabinet
            </h1>
          </div>

          {/* Desktop Right Action Icons & Button (Inline with Title) */}
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
              <span>New treasure</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Table */}
      <div className="p-4 sm:p-8 md:p-10 w-full space-y-6 pb-12 flex-1 bg-white">
        {/* Controls Bar: Filter Pills & Search */}
        {/* Controls Bar: Filter Pills, Category Dropdown & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Tabs & Category Filter */}
          <div className="flex items-center gap-3 overflow-x-auto pb-1 sm:pb-0">
            <div className="flex items-center gap-1.5 shrink-0">
              {(["All hunts", "Live", "In Progress", "Draft", "Found"] as const).map((filter) => {
                const isActive = activeFilter === filter;
                return (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                      isActive
                        ? "bg-[#0D2823] text-white shadow-sm"
                        : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {filter}
                  </button>
                );
              })}
            </div>

            {/* Category Dropdown Filter */}
            {uniqueCategories.length > 0 && (
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="bg-gray-50 text-gray-700 border border-gray-200 rounded-full px-3.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#E1BF62] cursor-pointer shrink-0"
              >
                <option value="All categories">All categories</option>
                {uniqueCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, category, location..."
              className="w-full bg-white text-gray-900 text-xs rounded-full pl-9 pr-4 py-2.5 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E1BF62] shadow-xs"
            />
          </div>
        </div>

        {/* Inventory Data Table */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead>
                <tr className="border-b border-gray-100 text-[11px] font-mono text-gray-400 uppercase tracking-widest bg-gray-50/50">
                  <th className="py-4 px-6 font-semibold">TREASURE</th>
                  <th className="py-4 px-6 font-semibold">CATEGORY</th>
                  <th className="py-4 px-6 font-semibold">PRICE</th>
                  <th className="py-4 px-6 font-semibold">DIFFICULTY</th>
                  <th className="py-4 px-6 font-semibold">STATUS</th>
                  <th className="py-4 px-6 font-semibold text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredHunts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-14 text-center text-stone-500 font-mono text-xs sm:text-sm">
                      No expedition hunts found in the cabinet. Click &quot;+ New Hunt&quot; to forge an expedition.
                    </td>
                  </tr>
                ) : (
                  filteredHunts.map((hunt) => (
                    <tr key={hunt.id} className="hover:bg-gray-50/70 transition-colors">
                      {/* Treasure Info */}
                      <td className="py-4 px-6">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden border border-amber-500/20 bg-[#0D2823] flex items-center justify-center text-white shadow-xs shrink-0">
                          {hunt.spotImage ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={resolveMediaUrl(hunt.spotImage)}
                              alt={hunt.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className={`w-full h-full bg-gradient-to-br ${hunt.gradient} flex items-center justify-center`}>
                              <div className="w-4 h-4 border border-amber-200/70 rotate-45 flex items-center justify-center">
                                <div className="w-1 h-1 bg-amber-200 rounded-full" />
                              </div>
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-[#0D2823] leading-snug">{hunt.name}</h4>
                          <p className="text-xs text-gray-400 flex items-center gap-1.5 flex-wrap mt-0.5">
                            <span>{hunt.createdDate}</span>
                            {hunt.locationName && (
                              <span className="text-stone-600 font-medium flex items-center gap-0.5">
                                • 📍 {hunt.locationName}
                              </span>
                            )}
                            {hunt.activeHunter && (
                              <span className="font-medium text-blue-600">• Hunter: {hunt.activeHunter}</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-4 px-6">
                      <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-medium bg-[#F6F4EE] text-[#0D2823] border border-[#EAE6DC]">
                        {hunt.category}
                      </span>
                    </td>

                    {/* Price & Capital Worth */}
                    <td className="py-4 px-6 font-medium text-[#0D2823]">
                      <div>{hunt.price}</div>
                      {hunt.capitalWorth ? (
                        <div className="text-[11px] font-mono text-amber-700 flex items-center gap-1 font-semibold mt-0.5">
                          <span>💎</span> {hunt.capitalWorth}
                        </div>
                      ) : null}
                    </td>

                    {/* Difficulty */}
                    <td className="py-4 px-6 text-gray-600 font-normal">
                      {hunt.difficulty}
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-6">
                      {hunt.status === "Live" && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100/80 text-emerald-800 border border-emerald-200/50">
                          Live
                        </span>
                      )}
                      {hunt.status === "In Progress" && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100/90 text-blue-800 border border-blue-200/60">
                          In Progress
                        </span>
                      )}
                      {hunt.status === "Draft" && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100/80 text-amber-800 border border-amber-200/50">
                          Draft
                        </span>
                      )}
                      {hunt.status === "Found" && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                          Found
                        </span>
                      )}
                    </td>

                    {/* Explicit Action Buttons: VIEW, EDIT, DELETE */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* VIEW BUTTON */}
                        <button
                          onClick={() => setSelectedHuntForView(hunt)}
                          className="p-2 text-gray-600 hover:text-[#0D2823] bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-all shadow-2xs cursor-pointer"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* EDIT BUTTON (Opens full Create Hunt form with all fields) */}
                        <button
                          onClick={() => handleEditClick(hunt)}
                          className="p-2 text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-all shadow-2xs cursor-pointer"
                          title="Edit treasure with full form"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {/* DELETE BUTTON */}
                        <button
                          onClick={() => setSelectedHuntForDelete(hunt)}
                          className="p-2 text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all shadow-2xs cursor-pointer"
                          title="Delete treasure"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* 1. VIEW MODAL */}
      <AnimatePresence>
        {selectedHuntForView && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedHuntForView(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11/12 max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl z-50 border border-gray-200 text-gray-900 space-y-6"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl overflow-hidden border border-amber-500/20 bg-[#0D2823] flex items-center justify-center text-white shrink-0">
                    {selectedHuntForView.spotImage ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={resolveMediaUrl(selectedHuntForView.spotImage)}
                        alt={selectedHuntForView.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${selectedHuntForView.gradient} flex items-center justify-center text-white`}>
                        <div className="w-4 h-4 border border-amber-200 rotate-45" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-serif text-xl text-[#0D2823] font-normal">
                      {selectedHuntForView.name}
                    </h3>
                    <p className="text-xs text-gray-500">{selectedHuntForView.createdDate}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedHuntForView(null)}
                  className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {selectedHuntForView.spotImage && (
                <div className="relative rounded-xl overflow-hidden border border-gray-200 aspect-16/9 bg-black shadow-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={resolveMediaUrl(selectedHuntForView.spotImage)}
                    alt={selectedHuntForView.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                  <span className="text-gray-400 block font-mono uppercase text-[10px]">PRICE</span>
                  <span className="font-bold text-[#0D2823] text-sm">{selectedHuntForView.price}</span>
                </div>
                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                  <span className="text-gray-400 block font-mono uppercase text-[10px]">DIFFICULTY</span>
                  <span className="font-bold text-[#0D2823] text-sm">{selectedHuntForView.difficulty}</span>
                </div>
                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                  <span className="text-gray-400 block font-mono uppercase text-[10px]">CIPHER CODE</span>
                  <span className="font-mono font-bold text-[#0D2823] text-sm">{selectedHuntForView.cipher || "N/A"}</span>
                </div>
                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                  <span className="text-gray-400 block font-mono uppercase text-[10px]">STAGE PIN</span>
                  <span className="font-mono font-bold text-[#0D2823] text-xs truncate block">{selectedHuntForView.stagePin || "N/A"}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedHuntForView(null)}
                  className="bg-[#0D2823] text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-xs hover:bg-[#123A33] cursor-pointer"
                >
                  Close details
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 2. DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {selectedHuntForDelete && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedHuntForDelete(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11/12 max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl z-50 border border-gray-200 text-gray-900 space-y-5"
            >
              <div className="flex items-center gap-3 text-rose-600">
                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="font-serif text-lg text-[#0D2823] font-normal">
                    Delete Treasure?
                  </h3>
                  <p className="text-xs text-gray-500">This action cannot be undone.</p>
                </div>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                Are you sure you want to permanently remove <strong className="text-[#0D2823]">{selectedHuntForDelete.name}</strong> from the treasure cabinet inventory?
              </p>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  onClick={() => setSelectedHuntForDelete(null)}
                  className="bg-gray-100 text-gray-700 text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Delete hunt
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
