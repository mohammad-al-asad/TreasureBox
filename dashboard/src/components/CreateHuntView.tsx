"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  MapPin,
  Image as ImageIcon,
  ImagePlus,
  Video,
  Check,
  Menu,
  Upload,
  Eye,
  X,
  Compass,
  Sparkles,
  Lock,
  Coins,
  FileText,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { createHuntThunk, updateHuntThunk } from "@/redux/slices/huntsSlice";
import { dashboardApi, CabinetHuntDto, resolveMediaUrl } from "@/services/dashboardApi";
import InteractiveMapPickerModal from "./InteractiveMapPickerModal";

export interface MediaHintItem {
  id: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  fileName: string;
  description: string;
}

export interface HuntFormData {
  id?: string;
  name?: string;
  nameAr?: string;
  titleAr?: string;
  price?: string;
  capitalWorth?: string;
  difficulty?: "Easy" | "Medium" | "Hard";
  columns?: string;
  sequence?: string;
  stage1Pin?: string;
  stage2Pin?: string;
  spotImage?: string;
  hints?: MediaHintItem[];
}

interface CreateHuntViewProps {
  isEditMode?: boolean;
  initialData?: HuntFormData;
  onBackToTreasures: () => void;
  onOpenMobileMenu?: () => void;
}

export default function CreateHuntView({
  isEditMode = false,
  initialData,
  onBackToTreasures,
  onOpenMobileMenu,
}: CreateHuntViewProps) {
  const dispatch = useAppDispatch();
  const reduxHunts = useAppSelector((state) => state.hunts.items);
  const [isLoadingEditData, setIsLoadingEditData] = useState(false);

  const [treasureName, setTreasureName] = useState(() => initialData?.name || "");
  const [treasureNameAr, setTreasureNameAr] = useState(
    () => initialData?.titleAr || initialData?.nameAr || ""
  );
  const [price, setPrice] = useState(() => initialData?.price || "");
  const [isFreeExpedition, setIsFreeExpedition] = useState<boolean>(() => Number(initialData?.price) === 0 && initialData?.price !== undefined);
  const [capitalWorth, setCapitalWorth] = useState(() => initialData?.capitalWorth || "");
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">(
    () => initialData?.difficulty || "Medium"
  );
  const [columns, setColumns] = useState(() => initialData?.columns || "5");
  const [sequence, setSequence] = useState(() => initialData?.sequence || "");
  const [stage1Pin, setStage1Pin] = useState(() => initialData?.stage1Pin || "25.2644, 55.2982");
  const [locationName, setLocationName] = useState<string>("");
  const [huntStatus, setHuntStatus] = useState<"LIVE" | "DRAFT" | "IN_PROGRESS" | "FOUND">("LIVE");

  // Category state
  const [categories, setCategories] = useState<Array<{ _id: string; name: string; slug: string }>>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [newCatInput, setNewCatInput] = useState<string>("");
  const [isAddingNewCat, setIsAddingNewCat] = useState<boolean>(false);

  useEffect(() => {
    dashboardApi.getAllCategories()
      .then((cats) => {
        if (Array.isArray(cats)) setCategories(cats);
      })
      .catch((err) => console.warn("Failed to load categories:", err));
  }, []);

  // Spot Image state (Required)
  const [spotImage, setSpotImage] = useState<string>(() => initialData?.spotImage || "");
  const [spotImageName, setSpotImageName] = useState<string>("");

  // Clue & description states (Empty initial values, no auto text)
  const [clueHintEn, setClueHintEn] = useState("");
  const [clueHintAr, setClueHintAr] = useState("");
  const [descEn, setDescEn] = useState("");
  const [descAr, setDescAr] = useState("");
  const [cipherHintImage, setCipherHintImage] = useState<string>("");
  const [cipherHintImageName, setCipherHintImageName] = useState<string>("");

  // Additional Hint Videos / Media with individual descriptions
  const [mediaHints, setMediaHints] = useState<MediaHintItem[]>(
    () => initialData?.hints || []
  );

  // Modals and feedback state
  const [previewMediaUrl, setPreviewMediaUrl] = useState<string | null>(null);
  const [previewMediaType, setPreviewMediaType] = useState<"image" | "video">("image");
  const [previewMediaTitle, setPreviewMediaTitle] = useState<string>("");
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [customPinInput, setCustomPinInput] = useState(stage1Pin);
  const [published, setPublished] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingSpot, setIsUploadingSpot] = useState(false);
  const [isUploadingCipher, setIsUploadingCipher] = useState(false);
  const [isUploadingHintMedia, setIsUploadingHintMedia] = useState(false);

  const spotFileInputRef = useRef<HTMLInputElement | null>(null);
  const cipherHintFileInputRef = useRef<HTMLInputElement | null>(null);
  const hintMediaFileInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-populate all form fields & spot image in edit mode
  useEffect(() => {
    const editHuntId = initialData?.id;
    if (!isEditMode || !editHuntId) return;

    let isMounted = true;

    const populateData = (hunt: CabinetHuntDto) => {
      if (!isMounted) return;
      if (hunt.titleEn) setTreasureName(hunt.titleEn);
      if (hunt.titleAr) setTreasureNameAr(hunt.titleAr);
      if (hunt.status) setHuntStatus(hunt.status as any);
      if (hunt.price !== undefined) setPrice(String(hunt.price));
      if (hunt.capitalWorth) setCapitalWorth(hunt.capitalWorth);
      if (hunt.difficulty) {
        setDifficulty(
          hunt.difficulty === "EASY" ? "Easy" : hunt.difficulty === "HARD" ? "Hard" : "Medium"
        );
      }
      if (hunt.cipher?.barrelCount) setColumns(String(hunt.cipher.barrelCount));
      if (hunt.cipher?.targetSequence) setSequence(hunt.cipher.targetSequence);
      if (hunt.cipher?.cipherHintEn) setClueHintEn(hunt.cipher.cipherHintEn);
      if (hunt.cipher?.cipherHintAr) setClueHintAr(hunt.cipher.cipherHintAr);
      if (hunt.cipher?.cipherHintImage) {
        setCipherHintImage(hunt.cipher.cipherHintImage);
        setCipherHintImageName("Uploaded Clue Media");
      }
      if (hunt.descriptionEn) setDescEn(hunt.descriptionEn);
      if (hunt.descriptionAr) setDescAr(hunt.descriptionAr);

      const loadedSpot = hunt.spotImage || (hunt.images && hunt.images.length > 0 ? hunt.images[0] : "");
      if (loadedSpot) {
        setSpotImage(loadedSpot);
        setSpotImageName("Uploaded Spot Media");
      }

      if (hunt.stageOne?.coordinates) {
        const pin = `${hunt.stageOne.coordinates.latitude}, ${hunt.stageOne.coordinates.longitude}`;
        setStage1Pin(pin);
        setCustomPinInput(pin);
      }
      if (hunt.stageOne?.locationNameEn) {
        setLocationName(hunt.stageOne.locationNameEn);
      }
      if (hunt.category) {
        const catId = typeof hunt.category === "object" ? hunt.category._id : hunt.category;
        setSelectedCategory(catId);
      } else if (hunt.categoryName) {
        setSelectedCategory(hunt.categoryName);
      }

      // Populate media hints (videos and image clues)
      if (hunt.hints && hunt.hints.length > 0) {
        setMediaHints(
          hunt.hints.map((h, idx) => ({
            id: h._id || `hint-${idx}-${Date.now()}`,
            mediaUrl: h.mediaUrl || h.imageUrl || "",
            mediaType: (h.mediaType || (h.imageUrl?.startsWith("data:video") ? "video" : "image")) as "image" | "video",
            fileName: `Stage 1 media #${idx + 1}`,
            description: h.description || h.bodyEn || "",
          }))
        );
      } else if (hunt.videos && hunt.videos.length > 0) {
        setMediaHints(
          hunt.videos.map((v, idx) => ({
            id: `vid-${idx}-${Date.now()}`,
            mediaUrl: v.url,
            mediaType: "video",
            fileName: `Stage 1 video #${idx + 1}`,
            description: v.description || "",
          }))
        );
      }
    };

    // 1. Check if full data is already in Redux
    const foundInRedux = reduxHunts.find((h) => (h._id || h.id) === editHuntId);
    if (foundInRedux && (foundInRedux.spotImage || foundInRedux.images?.length)) {
      populateData(foundInRedux);
    } else {
      // 2. Fetch full expedition details from the backend endpoint
      setIsLoadingEditData(true);
      dashboardApi
        .getCabinetHuntById(editHuntId)
        .then((hunt) => {
          if (hunt) {
            populateData(hunt);
          }
        })
        .catch((err) => {
          console.error("Failed to load expedition for edit:", err);
        })
        .finally(() => {
          if (isMounted) {
            setIsLoadingEditData(false);
          }
        });
    }

    return () => {
      isMounted = false;
    };
  }, [isEditMode, initialData?.id, reduxHunts]);

  const handleSpotImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSpotImageName(file.name);
      setIsUploadingSpot(true);
      setErrorBanner(null);
      try {
        const uploadRes = await dashboardApi.uploadMediaFile(file);
        setSpotImage(uploadRes.filePath);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to upload spot image to server";
        setErrorBanner(msg);
      } finally {
        setIsUploadingSpot(false);
      }
    }
  };

  const removeSpotImage = () => {
    setSpotImage("");
    setSpotImageName("");
    if (spotFileInputRef.current) {
      spotFileInputRef.current.value = "";
    }
  };

  const handleCipherHintImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCipherHintImageName(file.name);
      setIsUploadingCipher(true);
      setErrorBanner(null);
      try {
        const uploadRes = await dashboardApi.uploadMediaFile(file);
        setCipherHintImage(uploadRes.filePath);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to upload clue hint image to server";
        setErrorBanner(msg);
      } finally {
        setIsUploadingCipher(false);
      }
    }
  };

  const removeCipherHintImage = () => {
    setCipherHintImage("");
    setCipherHintImageName("");
    if (cipherHintFileInputRef.current) {
      cipherHintFileInputRef.current.value = "";
    }
  };

  const handleAddHintMedia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isVideo = file.type.startsWith("video/");
      setIsUploadingHintMedia(true);
      setErrorBanner(null);
      try {
        const uploadRes = await dashboardApi.uploadMediaFile(file);
        const newItem: MediaHintItem = {
          id: `hint-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          mediaUrl: uploadRes.filePath,
          mediaType: isVideo ? "video" : "image",
          fileName: file.name,
          description: "",
        };
        setMediaHints((prev) => [...prev, newItem]);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to upload hint media to server";
        setErrorBanner(msg);
      } finally {
        setIsUploadingHintMedia(false);
        e.target.value = "";
      }
    }
  };

  const handleUpdateHintDescription = (id: string, description: string) => {
    setMediaHints((prev) =>
      prev.map((item) => (item.id === id ? { ...item, description } : item))
    );
  };

  const handleRemoveHintMedia = (id: string) => {
    setMediaHints((prev) => prev.filter((item) => item.id !== id));
  };

  const handlePublishOrSave = async () => {
    setErrorBanner(null);
    setIsSubmitting(true);

    try {
      const numericPrice = isFreeExpedition ? 0 : parseFloat(price.replace(/[^0-9.]/g, "")) || 0;
      const upperDifficulty: "EASY" | "MEDIUM" | "HARD" =
        difficulty === "Easy" ? "EASY" : difficulty === "Hard" ? "HARD" : "MEDIUM";
      const barrelCount = parseInt(columns, 10) || 5;

      // Parse coordinates or fallback to default coordinates if empty
      let lat = 25.2644;
      let lng = 55.2982;
      if (stage1Pin) {
        const parts = stage1Pin.split(",");
        if (parts.length === 2) {
          const parsedLat = parseFloat(parts[0].replace(/[^0-9.-]/g, ""));
          const parsedLng = parseFloat(parts[1].replace(/[^0-9.-]/g, ""));
          if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
            lat = parsedLat;
            lng = parsedLng;
          }
        }
      }

      const foundCat = categories.find((c) => c._id === selectedCategory);
      const resolvedTitle = treasureName.trim() || "Untitled Expedition";
      const resolvedTitleAr = treasureNameAr.trim() || resolvedTitle;
      const resolvedSpotImage = spotImage.trim();

      const payload: Partial<CabinetHuntDto> = {
        titleEn: resolvedTitle,
        titleAr: resolvedTitleAr,
        descriptionEn: descEn.trim(),
        descriptionAr: descAr.trim(),
        price: numericPrice,
        capitalWorth: capitalWorth.trim() || undefined,
        difficulty: upperDifficulty,
        status: isEditMode && huntStatus ? huntStatus : "LIVE",
        category: foundCat ? foundCat._id : (selectedCategory || undefined),
        categoryName: foundCat ? foundCat.name : (selectedCategory || undefined),
        spotImage: resolvedSpotImage,
        images: resolvedSpotImage ? [resolvedSpotImage] : [],
        videos: mediaHints
          .filter((h) => h.mediaType === "video")
          .map((h) => ({
            url: h.mediaUrl,
            description: h.description.trim(),
          })),
        hints: mediaHints.map((h, idx) => ({
          titleEn: `Hint ${idx + 1}`,
          titleAr: `Hint ${idx + 1}`,
          bodyEn: h.description.trim(),
          bodyAr: h.description.trim(),
          description: h.description.trim(),
          imageUrl: h.mediaUrl,
          mediaUrl: h.mediaUrl,
          mediaType: h.mediaType,
          order: idx + 1,
        })),
        cipher: {
          barrelCount: barrelCount,
          targetSequence: (sequence || "A".repeat(barrelCount))
            .padEnd(barrelCount, "A")
            .slice(0, barrelCount)
            .toUpperCase(),
          initialState: (sequence || "A".repeat(barrelCount))
            .padEnd(barrelCount, "A")
            .slice(0, barrelCount)
            .toUpperCase()
            .split(""),
          cipherHintEn: clueHintEn.trim(),
          cipherHintAr: clueHintAr.trim(),
          cipherHintImage: cipherHintImage || "",
        },
        stageOne: {
          coordinates: { latitude: lat, longitude: lng },
          locationNameEn: locationName.trim() || treasureName.trim() || "Stage 1 Landmark",
          locationNameAr: locationName.trim() || treasureName.trim() || "Stage 1 Landmark",
        },
        stageTwo: {
          coordinates: { latitude: lat, longitude: lng },
          locationNameEn: locationName.trim() || treasureName.trim() || "Treasure Spot",
          locationNameAr: locationName.trim() || treasureName.trim() || "Treasure Spot",
        },
      };

      let resultAction;
      if (isEditMode && initialData?.id) {
        resultAction = await dispatch(updateHuntThunk({ huntId: initialData.id, payload }));
      } else {
        resultAction = await dispatch(createHuntThunk(payload));
      }

      if (createHuntThunk.rejected.match(resultAction) || updateHuntThunk.rejected.match(resultAction)) {
        const errorMsg = (resultAction.payload as string) || "Failed to save expedition";
        setErrorBanner(errorMsg);
        setIsSubmitting(false);
        return;
      }

      setPublished(true);
      setTimeout(() => {
        onBackToTreasures();
      }, 800);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred";
      setErrorBanner(msg);
      setIsSubmitting(false);
    }
  };

  const maxSequenceLength = Number(columns) || 5;
  const currentPaddedSequence = (sequence || "")
    .padEnd(maxSequenceLength, "•")
    .slice(0, maxSequenceLength)
    .split("");

  return (
    <div className="min-h-full bg-[#FDFBF7] flex flex-col font-sans">
      {/* Top Sticky Header Bar */}
      <header className="sticky top-0 z-30 bg-[#FDFBF7]/95 backdrop-blur-md px-4 sm:px-8 md:px-10 pt-4 pb-5 border-b border-black/5 shadow-xs">
        {/* Mobile Top Row (< md) */}
        <div className="flex md:hidden items-center justify-between w-full mb-3">
          <div>
            {onOpenMobileMenu && (
              <button
                onClick={onOpenMobileMenu}
                className="text-[#0D2823] p-2 rounded-xl bg-white border border-gray-200 shadow-xs hover:bg-gray-50 cursor-pointer"
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
              className="w-9 h-9 rounded-full bg-white border border-gray-200 text-[#0D2823] flex items-center justify-center hover:bg-gray-50 shadow-xs transition-all cursor-pointer"
            >
              <Bell className="w-4 h-4" />
            </Link>
            <button
              onClick={handlePublishOrSave}
              disabled={published || isSubmitting}
              className="bg-[#D4AF37] hover:bg-[#C29F38] text-[#0D2823] font-semibold text-xs px-3.5 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              {published ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <span>{isEditMode ? "Save" : "Publish"}</span>
              )}
            </button>
          </div>
        </div>

        {/* Main Header Container (Desktop 1-Row Inline Alignment) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-[#B39345] font-bold">
                {isEditMode ? "TREASURES / EDIT EXPEDITION" : "TREASURES / NEW EXPEDITION"}
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#0D2823]/5 text-[#0D2823] border border-black/5">
                STAGE 1 & 2
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#0D2823] font-normal tracking-tight">
              {isEditMode ? "Edit treasure hunt" : "Create a new hunt"}
            </h1>
          </div>

          {/* Desktop Right Action Area */}
          <div className="hidden md:flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToTreasures}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <Link
              href="/notifications"
              title="Notifications"
              className="w-10 h-10 rounded-full bg-white border border-gray-200 text-[#0D2823] flex items-center justify-center hover:bg-gray-50 shadow-xs transition-all cursor-pointer"
            >
              <Bell className="w-4 h-4" />
            </Link>
            <button
              onClick={handlePublishOrSave}
              disabled={published || isSubmitting}
              className="bg-[#D4AF37] hover:bg-[#C29F38] text-[#0D2823] font-semibold text-sm px-6 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2 transform active:scale-95 disabled:opacity-70 cursor-pointer"
            >
              {published ? (
                <>
                  <Check className="w-4 h-4 text-[#0D2823]" />
                  <span>{isEditMode ? "Saved!" : "Published!"}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{isEditMode ? "Save Changes" : "Publish Hunt"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area - Balanced 2-Column Responsive Layout */}
      <main className="p-4 sm:p-8 md:p-10 w-full flex-1">
        {/* Exact Error Message Banner */}
        {errorBanner && (
          <div className="max-w-7xl mx-auto mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start justify-between shadow-xs gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="font-bold block text-rose-900 mb-0.5">Validation Error</span>
                <p className="leading-relaxed break-words font-mono text-xs">{errorBanner}</p>
              </div>
            </div>
            <button
              onClick={() => setErrorBanner(null)}
              className="text-rose-500 hover:text-rose-800 font-bold p-1 cursor-pointer shrink-0"
              title="Dismiss error"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Loading Edit Data Indicator */}
        {isLoadingEditData && (
          <div className="max-w-7xl mx-auto mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-center gap-3 shadow-xs">
            <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin shrink-0" />
            <span className="font-mono font-medium">Loading expedition data, spot media, and cipher settings...</span>
          </div>
        )}

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN (7 Cols): Core Hunt Details & Cipher Mechanics */}
          <div className="lg:col-span-7 space-y-6">
            {/* Card 1: The Basics */}
            <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-gray-200/80 space-y-6">
              <div className="flex items-center gap-2.5 pb-2 border-b border-gray-100">
                <Coins className="w-5 h-5 text-[#B39345]" />
                <h2 className="font-serif text-xl sm:text-2xl text-[#0D2823] font-normal">
                  The basics
                </h2>
              </div>

              {/* Treasure Name (English & Arabic) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-gray-500 mb-1.5 uppercase font-medium">
                    Treasure Name (English)
                  </label>
                  <input
                    type="text"
                    value={treasureName}
                    onChange={(e) => setTreasureName(e.target.value)}
                    placeholder="e.g. Lamborghini Aventador"
                    className="w-full bg-white text-gray-900 text-sm sm:text-base rounded-xl px-4 py-3 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] shadow-2xs font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-gray-500 mb-1.5 uppercase font-medium flex items-center justify-between">
                    <span>العنوان بالعربية (Arabic Title)</span>
                    <span className="text-[10px] text-gray-400 font-normal">اختياري</span>
                  </label>
                  <input
                    type="text"
                    dir="rtl"
                    value={treasureNameAr}
                    onChange={(e) => setTreasureNameAr(e.target.value)}
                    placeholder="مثال: لامبورغيني افنتادور"
                    className="w-full bg-white text-gray-900 text-sm sm:text-base rounded-xl px-4 py-3 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] shadow-2xs font-medium text-right"
                  />
                </div>
              </div>

              {/* Category Selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-mono text-gray-500 uppercase font-medium">
                    Treasure Category
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAddingNewCat(!isAddingNewCat)}
                    className="text-[11px] font-mono text-[#B39345] hover:underline font-semibold cursor-pointer"
                  >
                    {isAddingNewCat ? "Cancel" : "+ New Category"}
                  </button>
                </div>

                {isAddingNewCat ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newCatInput}
                      onChange={(e) => setNewCatInput(e.target.value)}
                      placeholder="e.g. Historic Souks, Desert Oases"
                      className="flex-1 bg-white text-gray-900 text-sm rounded-xl px-4 py-2.5 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        if (!newCatInput.trim()) return;
                        try {
                          const slug = newCatInput.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
                          const created = await dashboardApi.createCategory({ name: newCatInput.trim(), slug });
                          if (created && created._id) {
                            setCategories((prev) => [...prev, created]);
                            setSelectedCategory(created._id);
                            setNewCatInput("");
                            setIsAddingNewCat(false);
                          }
                        } catch (e: any) {
                          alert(e?.message || "Failed to create category");
                        }
                      }}
                      className="px-4 py-2.5 rounded-xl bg-[#0D2823] text-[#E1BF62] text-xs font-semibold hover:bg-[#153831] cursor-pointer shrink-0"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-white text-gray-900 text-sm rounded-xl px-4 py-3 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] shadow-2xs font-medium cursor-pointer"
                  >
                    <option value="">-- Select Expedition Category --</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Price, Capital Worth & Difficulty */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-mono text-gray-500 mb-1.5 uppercase font-medium">
                    Permit Price (KWD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-xs font-bold text-gray-500">
                      KWD
                    </span>
                    <input
                      type="text"
                      disabled={isFreeExpedition}
                      value={isFreeExpedition ? "0" : price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00"
                      className={`w-full bg-white text-gray-900 text-sm rounded-xl pl-14 pr-4 py-3 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] shadow-2xs font-mono font-medium ${
                        isFreeExpedition ? "opacity-60 bg-gray-50 cursor-not-allowed" : ""
                      }`}
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      id="freeHuntCheckbox"
                      checked={isFreeExpedition}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setIsFreeExpedition(checked);
                        if (checked) setPrice("0");
                      }}
                      className="w-4 h-4 rounded text-[#103B30] focus:ring-[#103B30] border-gray-300 cursor-pointer"
                    />
                    <label htmlFor="freeHuntCheckbox" className="text-xs font-medium text-emerald-800 cursor-pointer">
                      Free Expedition (No Permit Fee)
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-500 mb-1.5 uppercase font-medium">
                    Treasure Capital Worth
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-sm font-semibold text-amber-600">
                      💎
                    </span>
                    <input
                      type="text"
                      value={capitalWorth}
                      onChange={(e) => setCapitalWorth(e.target.value)}
                      placeholder="e.g. 500 KWD Gold"
                      className="w-full bg-white text-gray-900 text-sm rounded-xl pl-9 pr-4 py-3 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] shadow-2xs font-mono font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-500 mb-1.5 uppercase font-medium">
                    Difficulty Level
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["Easy", "Medium", "Hard"] as const).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setDifficulty(lvl)}
                        className={`py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                          difficulty === lvl
                            ? "bg-[#0D2823] text-white border-[#0D2823] shadow-xs"
                            : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Descriptions */}
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <div>
                  <label className="block text-xs font-mono text-gray-500 mb-1.5 uppercase font-medium">
                    Expedition Description (English)
                  </label>
                  <textarea
                    rows={3}
                    value={descEn}
                    onChange={(e) => setDescEn(e.target.value)}
                    placeholder="Enter description in English"
                    className="w-full bg-white text-gray-900 text-sm rounded-xl p-3.5 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] shadow-2xs leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-500 mb-1.5 uppercase font-medium">
                    Expedition Description (Arabic)
                  </label>
                  <textarea
                    rows={2}
                    dir="rtl"
                    value={descAr}
                    onChange={(e) => setDescAr(e.target.value)}
                    placeholder="Enter description in Arabic"
                    className="w-full bg-white text-gray-900 text-sm rounded-xl p-3.5 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] shadow-2xs leading-relaxed"
                  />
                </div>
              </div>
            </section>

            {/* Card 2: Cipher Control */}
            <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-gray-200/80 space-y-6">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <Lock className="w-5 h-5 text-[#B39345]" />
                  <div>
                    <h2 className="font-serif text-xl sm:text-2xl text-[#0D2823] font-normal">
                      Cipher Control
                    </h2>
                    <p className="text-xs text-gray-400">
                      Vault cylinders are encrypted and validated on the server.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-[#E1BF62]/20 text-[#0D2823] border border-[#E1BF62]/30">
                  {columns} CYLINDERS
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-mono text-gray-500 mb-1.5 uppercase font-medium">
                    Cylinder Count (Columns)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["5", "10", "15"] as const).map((colOpt) => (
                      <button
                        key={colOpt}
                        type="button"
                        onClick={() => {
                          setColumns(colOpt);
                          const maxLen = Number(colOpt) || 5;
                          if (sequence.length > maxLen) {
                            setSequence(sequence.slice(0, maxLen));
                          }
                        }}
                        className={`py-2.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
                          columns === colOpt
                            ? "bg-[#0D2823] text-[#E1BF62] border-[#0D2823] shadow-xs"
                            : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        {colOpt} cols
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-500 mb-1.5 uppercase font-medium">
                    Solution Key Sequence
                  </label>
                  <input
                    type="text"
                    value={sequence}
                    maxLength={maxSequenceLength}
                    onChange={(e) => setSequence(e.target.value.toUpperCase())}
                    placeholder="Enter key sequence"
                    className="w-full bg-white text-gray-900 text-sm rounded-xl px-4 py-3 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] shadow-2xs font-mono tracking-widest uppercase font-bold"
                  />
                </div>
              </div>

              {/* Visual Cylinder Preview Tiles */}
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80">
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-[11px] font-mono uppercase text-gray-500 font-bold">
                    Interactive Cylinder Preview ({sequence.length}/{maxSequenceLength} characters)
                  </p>
                  <span className="text-[10px] font-mono text-gray-400 font-semibold uppercase">
                    {maxSequenceLength} Cylinders
                  </span>
                </div>
                <div className="w-full bg-[#071714] p-2 sm:p-2.5 rounded-2xl border border-[#B39345]/30 shadow-inner flex items-center justify-center gap-1 sm:gap-1.5">
                  {currentPaddedSequence.map((char, idx) => (
                    <div
                      key={idx}
                      className={`flex-1 min-w-0 ${
                        maxSequenceLength === 5
                          ? "max-w-[56px] h-12 sm:h-14 text-base sm:text-lg"
                          : maxSequenceLength === 10
                          ? "max-w-[38px] h-10 sm:h-12 text-xs sm:text-sm"
                          : "max-w-[28px] h-9 sm:h-11 text-[11px] sm:text-xs"
                      } rounded-lg sm:rounded-xl flex items-center justify-center font-mono font-bold transition-all shadow-xs ${
                        char !== "•"
                          ? "bg-gradient-to-b from-[#143B34] via-[#0D2823] to-[#071714] text-[#E1BF62] border border-[#E1BF62]/50 ring-1 ring-[#E1BF62]/20"
                          : "bg-[#091F1B]/60 text-stone-500 border border-white/5"
                      }`}
                    >
                      <span className="truncate">{char}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cipher Clue Hints */}
              <div className="pt-4 border-t border-gray-100 space-y-4">
                <div>
                  <label className="block text-xs font-mono text-gray-500 mb-1.5 uppercase font-medium">
                    Cipher Clue Hint (English)
                  </label>
                  <input
                    type="text"
                    value={clueHintEn}
                    onChange={(e) => setClueHintEn(e.target.value)}
                    placeholder="Enter clue hint in English"
                    className="w-full bg-white text-gray-900 text-sm rounded-xl px-4 py-3 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-gray-500 mb-1.5 uppercase font-medium">
                    Cipher Clue Hint (Arabic)
                  </label>
                  <input
                    type="text"
                    dir="rtl"
                    value={clueHintAr}
                    onChange={(e) => setClueHintAr(e.target.value)}
                    placeholder="Enter clue hint in Arabic"
                    className="w-full bg-white text-gray-900 text-sm rounded-xl px-4 py-3 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] shadow-2xs"
                  />
                </div>

                {/* Cipher Clue Hint Image Upload */}
                <div>
                  <label className="block text-xs font-mono text-gray-500 mb-1.5 uppercase font-medium">
                    Cipher Clue Hint Image (Optional)
                  </label>
                  <input
                    type="file"
                    ref={cipherHintFileInputRef}
                    onChange={handleCipherHintImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  {isUploadingCipher ? (
                    <div className="bg-[#F6F4EE] border border-[#EAE6DC] rounded-xl p-4 flex items-center justify-center gap-3 text-stone-600">
                      <div className="w-4 h-4 border-2 border-[#B39345] border-t-transparent rounded-full animate-spin shrink-0" />
                      <span className="text-xs font-medium font-mono">Uploading clue image to server...</span>
                    </div>
                  ) : cipherHintImage ? (
                    <div className="bg-[#F6F4EE] border border-[#EAE6DC] rounded-xl p-3 flex items-center justify-between shadow-2xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-200 shrink-0 bg-black">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={resolveMediaUrl(cipherHintImage)}
                            alt="Cipher Clue Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-[#0D2823] truncate max-w-[180px] sm:max-w-[240px]">
                            {cipherHintImageName || "Clue Hint Image Attached"}
                          </p>
                          <button
                            type="button"
                            onClick={() => cipherHintFileInputRef.current?.click()}
                            className="text-[11px] text-[#B39345] hover:underline font-semibold cursor-pointer"
                          >
                            Replace Image
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewMediaUrl(cipherHintImage);
                            setPreviewMediaType("image");
                            setPreviewMediaTitle(cipherHintImageName || "Cipher Hint Clue Image");
                          }}
                          className="p-2 rounded-lg hover:bg-stone-200 text-stone-600 transition-colors cursor-pointer"
                          title="Preview Full Image"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={removeCipherHintImage}
                          className="p-2 rounded-lg hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                          title="Remove Image"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => cipherHintFileInputRef.current?.click()}
                      className="border border-dashed border-gray-300 hover:border-[#D4AF37] rounded-xl p-4 flex items-center justify-center gap-2.5 text-center cursor-pointer transition-colors bg-stone-50/70 hover:bg-stone-50"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#EAE5D7] text-[#B39345] flex items-center justify-center shrink-0">
                        <ImagePlus className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-medium text-gray-700">Upload clue hint image</p>
                        <p className="text-[11px] text-gray-400 font-mono">PNG, JPG, WebP visual clue photo</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN (5 Cols): Cyphertex Media, Treasure Hint Description, Location */}
          <div className="lg:col-span-5 space-y-6">
            {/* Card 3: CYPHERTEX MEDIA (Spot Image - Required) */}
            <section className="bg-[#0D2823] rounded-2xl p-6 sm:p-7 shadow-md border border-[#B39345]/30 space-y-4 text-white">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <h3 className="font-mono text-xs tracking-widest text-[#E1BF62] uppercase font-bold">
                  CYPHERTEX MEDIA
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#E1BF62]/20 text-[#E1BF62] border border-[#E1BF62]/30">
                  SPOT MEDIA
                </span>
              </div>

              <input
                type="file"
                ref={spotFileInputRef}
                onChange={handleSpotImageUpload}
                accept="image/*,video/*"
                className="hidden"
              />

              {isUploadingSpot ? (
                <div className="border-2 border-dashed border-[#E1BF62]/60 rounded-2xl p-7 flex flex-col items-center justify-center text-center bg-[#081B18]">
                  <div className="w-8 h-8 border-2 border-[#E1BF62] border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-sm font-semibold text-stone-100 mb-1">
                    Uploading spot media to server...
                  </p>
                  <p className="text-xs text-stone-400 font-mono">
                    Storing to relative disk path
                  </p>
                </div>
              ) : spotImage ? (
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden border border-[#E1BF62]/30 bg-black aspect-16/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={resolveMediaUrl(spotImage)}
                      alt="Spot Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewMediaUrl(spotImage);
                          setPreviewMediaType("image");
                          setPreviewMediaTitle("Spot Image Preview");
                        }}
                        className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors shadow-sm cursor-pointer"
                        title="View Full Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={removeSpotImage}
                        className="p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-sm cursor-pointer"
                        title="Remove Image"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-stone-300 font-mono">
                    <span className="truncate max-w-[200px]">{spotImageName || "Spot Media Loaded"}</span>
                    <button
                      type="button"
                      onClick={() => spotFileInputRef.current?.click()}
                      className="text-[#E1BF62] hover:underline font-semibold cursor-pointer"
                    >
                      Replace Media
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => spotFileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#B39345]/50 hover:border-[#E1BF62] rounded-2xl p-7 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-[#081B18]"
                >
                  <div className="w-14 h-14 rounded-full bg-[#E1BF62] text-[#0D2823] flex items-center justify-center mb-3 shadow-xs">
                    <ImagePlus className="w-7 h-7" />
                  </div>
                  <p className="text-sm font-semibold text-stone-100 mb-1">
                    Drop image or video here
                  </p>
                  <p className="text-xs text-stone-400 font-mono">
                    9:16 performs best in the hunter app
                  </p>
                </div>
              )}
            </section>

            {/* Card 4: Treasure Hint Description (Multiple Videos/Media with separate descriptions) */}
            <section className="bg-white rounded-2xl p-6 sm:p-7 shadow-xs border border-gray-200/80 space-y-5">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div>
                  <h2 className="font-serif text-xl text-[#0D2823] font-normal">
                    Treasure Hint Description
                  </h2>
                  <p className="text-xs text-gray-400 font-mono">
                    Stage 1 hint media with descriptions
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isUploadingHintMedia}
                  onClick={() => hintMediaFileInputRef.current?.click()}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#C5A059] hover:bg-[#B38F48] text-[#0D2823] font-semibold text-xs shadow-xs transition-all ${
                    isUploadingHintMedia ? "opacity-75 cursor-wait" : "cursor-pointer"
                  }`}
                >
                  {isUploadingHintMedia ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-[#0D2823] border-t-transparent rounded-full animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Media</span>
                    </>
                  )}
                </button>
              </div>

              <input
                type="file"
                ref={hintMediaFileInputRef}
                onChange={handleAddHintMedia}
                accept="video/*,image/*"
                className="hidden"
              />

              {mediaHints.length === 0 ? (
                <div
                  onClick={() => hintMediaFileInputRef.current?.click()}
                  className="border border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer hover:border-[#C5A059] transition-colors bg-stone-50/50"
                >
                  <Video className="w-6 h-6 text-gray-300 mx-auto mb-1.5" />
                  <p className="text-xs text-gray-500 font-medium">No hint videos or media added yet</p>
                  <p className="text-[11px] text-gray-400 font-mono">
                    Click &quot;Upload Media&quot; to add hint clips with individual descriptions
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {mediaHints.map((item, index) => (
                    <div key={item.id} className="space-y-2">
                      {/* Media Strip / Pill (As in Image 1 & 2) */}
                      <div className="bg-[#F6F4EE] border border-[#EAE6DC] rounded-xl px-4 py-3 flex items-center justify-between shadow-2xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-[#EAE5D7] text-[#B39345] flex items-center justify-center shrink-0">
                            {item.mediaType === "video" ? (
                              <Video className="w-3.5 h-3.5" />
                            ) : (
                              <ImageIcon className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <span className="text-xs font-medium text-[#0D2823] truncate">
                            {item.fileName || `Stage 1 ${item.mediaType} #${index + 1}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewMediaUrl(item.mediaUrl);
                              setPreviewMediaType(item.mediaType);
                              setPreviewMediaTitle(item.fileName || `Stage 1 ${item.mediaType} #${index + 1}`);
                            }}
                            className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-600 transition-colors cursor-pointer"
                            title="Preview Media"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveHintMedia(item.id)}
                            className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                            title="Remove Media"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Treasure Description Field (As in Image 1) */}
                      <div>
                        <label className="block text-[11px] font-mono text-gray-500 mb-1 font-medium">
                          Treasure description
                        </label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleUpdateHintDescription(item.id, e.target.value)}
                          placeholder="Enter description for this media"
                          className="w-full bg-white text-gray-900 text-sm rounded-xl px-4 py-2.5 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] shadow-2xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Card 5: Treasure location */}
            <section className="bg-white rounded-2xl p-6 sm:p-7 shadow-xs border border-gray-200/80 space-y-4">
              <div className="flex items-center justify-between pb-1 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Compass className="w-5 h-5 text-[#B39345]" />
                  <h2 className="font-serif text-xl text-[#0D2823] font-normal">
                    Treasure location
                  </h2>
                </div>
                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60 uppercase">
                  Field Pin
                </span>
              </div>

              {/* Direct Location / Area Tag Input */}
              <div>
                <label className="block text-xs font-mono text-gray-500 mb-1.5 uppercase font-medium">
                  Location / Area Tag (Near/Far Reference)
                </label>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="e.g. Dubai Historic Souk, Al Fahidi, Downtown"
                  className="w-full bg-white text-gray-900 text-sm rounded-xl px-4 py-2.5 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] shadow-2xs font-medium"
                />
                <p className="text-[11px] text-gray-400 font-mono mt-1">
                  This tag appears on the treasure card in the hunter mobile app so hunters know if it is near or far.
                </p>
              </div>

              <div className="bg-[#F6F4EE] border border-[#EAE6DC] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#0D2823] text-[#E1BF62] flex items-center justify-center shrink-0 shadow-xs">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-semibold text-xs sm:text-sm text-[#0D2823] block truncate">
                      {locationName.trim() || "Select location from map"}
                    </span>
                    <span className="text-[11px] font-mono text-gray-500 block truncate mt-0.5">
                      Coordinates: {stage1Pin || "25.2644, 55.2982"}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsMapModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-[#0D2823] hover:bg-[#1a443b] text-[#E1BF62] text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Set on map</span>
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Media Preview Modal (Supports Video and Image) */}
      <AnimatePresence>
        {previewMediaUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-5 max-w-lg w-full shadow-2xl border border-gray-200 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  {previewMediaType === "video" ? (
                    <Video className="w-4 h-4 text-[#B39345] shrink-0" />
                  ) : (
                    <ImageIcon className="w-4 h-4 text-[#B39345] shrink-0" />
                  )}
                  <h3 className="font-serif text-base text-[#0D2823] truncate">
                    {previewMediaTitle}
                  </h3>
                </div>
                <button
                  onClick={() => setPreviewMediaUrl(null)}
                  className="text-gray-400 hover:text-gray-700 p-1 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="rounded-xl overflow-hidden bg-black flex items-center justify-center max-h-[65vh]">
                {previewMediaType === "video" ||
                previewMediaUrl.startsWith("data:video") ||
                previewMediaUrl.endsWith(".mp4") ||
                previewMediaUrl.endsWith(".mov") ||
                previewMediaUrl.endsWith(".webm") ? (
                  <video
                    src={resolveMediaUrl(previewMediaUrl)}
                    controls
                    autoPlay
                    className="w-full max-h-[65vh] object-contain"
                  />
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={resolveMediaUrl(previewMediaUrl)}
                    alt={previewMediaTitle}
                    className="w-full max-h-[65vh] object-contain"
                  />
                )}
              </div>

              <button
                onClick={() => setPreviewMediaUrl(null)}
                className="w-full bg-[#D4AF37] hover:bg-[#C29F38] text-[#0D2823] font-semibold text-xs py-2.5 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Close Preview
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Interactive Map Picker Modal */}
      <InteractiveMapPickerModal
        isOpen={isMapModalOpen}
        initialLat={
          stage1Pin.includes(",")
            ? parseFloat(stage1Pin.split(",")[0].replace(/[^0-9.-]/g, "")) || 25.2644
            : 25.2644
        }
        initialLng={
          stage1Pin.includes(",")
            ? parseFloat(stage1Pin.split(",")[1].replace(/[^0-9.-]/g, "")) || 55.2982
            : 55.2982
        }
        initialLocationName={locationName}
        onClose={() => setIsMapModalOpen(false)}
        onSave={(coords, locName) => {
          setStage1Pin(`${coords.latitude}, ${coords.longitude}`);
          setLocationName(locName);
        }}
      />
    </div>
  );
}
