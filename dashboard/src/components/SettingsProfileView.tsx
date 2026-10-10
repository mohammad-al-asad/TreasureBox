"use client";

import React, { useState, useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  Bell,
  Menu,
  LogOut,
  Check,
  User,
  ShieldCheck,
  FileText,
  Lock,
  Info,
  Save,
  AlertCircle,
  Camera,
  Trash2,
  Upload,
  Loader2,
  MessageSquare,
  Send,
  Phone,
  Mail,
  Globe,
} from "lucide-react";
import { dashboardApi } from "@/services/dashboardApi";
import { motion, AnimatePresence } from "framer-motion";
import "react-quill-new/dist/quill.snow.css";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchLegalDocThunk, updateLegalDocThunk } from "@/redux/slices/settingsSlice";
import {
  changePasswordThunk,
  logoutThunk,
  updateProfileThunk,
  uploadProfileAvatarThunk,
} from "@/redux/slices/authSlice";
import OperatorAvatar from "./OperatorAvatar";

// Dynamically import ReactQuill to prevent SSR hydration mismatch
const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 bg-gray-50 animate-pulse rounded-xl flex items-center justify-center text-xs text-gray-400 font-mono">
      Loading Rich Text Editor...
    </div>
  ),
});

export type SettingsTab = "profile" | "security" | "terms" | "privacy" | "about" | "contact";

interface SettingsProfileViewProps {
  initialTab?: SettingsTab;
  onOpenMobileMenu?: () => void;
  onLogout?: () => void;
}

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ align: [] }],
    ["clean"],
  ],
};

const quillFormats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "list",
  "align",
];

const emptySubscribe = () => () => {};

export default function SettingsProfileView({
  initialTab = "profile",
  onOpenMobileMenu,
  onLogout,
}: SettingsProfileViewProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { terms, privacy, about } = useAppSelector((state) => state.settings);

  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  // Profile Form States (Email & Role are permanent and immutable)
  const [name, setName] = useState(user?.name || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || "");
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileUpdating, setProfileUpdating] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [profileError, setProfileError] = useState("");
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Security Form States
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [passSaved, setPassSaved] = useState(false);
  const [passUpdating, setPassUpdating] = useState(false);
  const [passError, setPassError] = useState("");

  // Rich Text Editor HTML States
  const [termsContent, setTermsContent] = useState("");
  const [privacyContent, setPrivacyContent] = useState("");
  const [aboutContent, setAboutContent] = useState("");
  const [termsSaved, setTermsSaved] = useState(false);
  const [privacySaved, setPrivacySaved] = useState(false);
  const [aboutSaved, setAboutSaved] = useState(false);
  const [docUpdating, setDocUpdating] = useState<string | null>(null);
  const [docError, setDocError] = useState<string | null>(null);

  // Contact & Social Channel States
  const [whatsapp, setWhatsapp] = useState("");
  const [telegram, setTelegram] = useState("");
  const [instagram, setInstagram] = useState("");
  const [twitter, setTwitter] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [supportPhone, setSupportPhone] = useState("");
  const [workingHoursEn, setWorkingHoursEn] = useState("");
  const [workingHoursAr, setWorkingHoursAr] = useState("");
  const [contactSaved, setContactSaved] = useState(false);
  const [contactUpdating, setContactUpdating] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchLegalDocThunk("TERMS"));
    dispatch(fetchLegalDocThunk("PRIVACY"));
    dispatch(fetchLegalDocThunk("ABOUT"));

    // Fetch dynamic contact and social channels
    dashboardApi.getContactSettings().then((res) => {
      if (res) {
        setWhatsapp(res.whatsapp || "");
        setTelegram(res.telegram || "");
        setInstagram(res.instagram || "");
        setTwitter(res.twitter || "");
        setTiktok(res.tiktok || "");
        setSupportEmail(res.email || "");
        setSupportPhone(res.phone || "");
        setWorkingHoursEn(res.workingHoursEn || "");
        setWorkingHoursAr(res.workingHoursAr || "");
      }
    }).catch(() => {});
  }, [dispatch]);

  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
    if (user?.avatar !== undefined) {
      setAvatar(user.avatar);
      setAvatarPreview(user.avatar);
    }
  }, [user]);

  useEffect(() => {
    if (terms?.content) setTermsContent(terms.content);
    if (privacy?.content) setPrivacyContent(privacy.content);
    if (about?.content) setAboutContent(about.content);
  }, [terms, privacy, about]);

  const handleTabClick = (tabId: SettingsTab) => {
    setActiveTab(tabId);
    router.push(`/settings/${tabId}`);
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setProfileError("Please select a valid image file (PNG, JPG, WEBP, GIF)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setProfileError("Image size must be less than 5MB");
      return;
    }

    setProfileError("");
    setUploadingAvatar(true);

    // Instant local preview
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setAvatarPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);

    // Upload via Multer endpoint to backend with Redux Toolkit
    const formData = new FormData();
    formData.append("avatar", file);

    const action = await dispatch(uploadProfileAvatarThunk(formData));
    setUploadingAvatar(false);

    if (uploadProfileAvatarThunk.fulfilled.match(action)) {
      setAvatar(action.payload.avatar || "");
      setAvatarPreview(action.payload.avatar || "");
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } else {
      setProfileError((action.payload as string) || "Failed to upload image via multer");
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatar("");
    setAvatarPreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    await dispatch(updateProfileThunk({ name: name.trim() || user?.name || "Operator", avatar: "" }));
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError("");
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setProfileError("Full Name must be at least 2 characters long");
      return;
    }
    setProfileUpdating(true);
    const action = await dispatch(updateProfileThunk({ name: trimmed, avatar }));
    setProfileUpdating(false);

    if (updateProfileThunk.fulfilled.match(action)) {
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } else {
      setProfileError((action.payload as string) || "Failed to update profile details");
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError("");
    if (!currentPass) {
      setPassError("Please enter your current password");
      return;
    }
    if (newPass !== confirmPass) {
      setPassError("New passwords do not match");
      return;
    }
    if (newPass.length < 8) {
      setPassError("New password must be at least 8 characters long");
      return;
    }

    setPassUpdating(true);
    const action = await dispatch(
      changePasswordThunk({ currentPassword: currentPass, newPassword: newPass })
    );
    setPassUpdating(false);

    if (changePasswordThunk.fulfilled.match(action)) {
      setPassSaved(true);
      setCurrentPass("");
      setNewPass("");
      setConfirmPass("");
      setTimeout(() => setPassSaved(false), 3000);
    } else {
      setPassError((action.payload as string) || "Failed to update password");
    }
  };

  const handleDocSave = async (tab: "terms" | "privacy" | "about") => {
    setDocError(null);
    setDocUpdating(tab);
    if (tab === "terms") {
      const action = await dispatch(updateLegalDocThunk({ type: "TERMS", content: termsContent }));
      if (updateLegalDocThunk.fulfilled.match(action)) {
        setTermsSaved(true);
        setTimeout(() => setTermsSaved(false), 2500);
      } else {
        setDocError((action.payload as string) || "Failed to publish Terms & Conditions");
      }
    } else if (tab === "privacy") {
      const action = await dispatch(updateLegalDocThunk({ type: "PRIVACY", content: privacyContent }));
      if (updateLegalDocThunk.fulfilled.match(action)) {
        setPrivacySaved(true);
        setTimeout(() => setPrivacySaved(false), 2500);
      } else {
        setDocError((action.payload as string) || "Failed to publish Privacy Policy");
      }
    } else if (tab === "about") {
      const action = await dispatch(updateLegalDocThunk({ type: "ABOUT", content: aboutContent }));
      if (updateLegalDocThunk.fulfilled.match(action)) {
        setAboutSaved(true);
        setTimeout(() => setAboutSaved(false), 2500);
      } else {
        setDocError((action.payload as string) || "Failed to publish About Us");
      }
    }
    setDocUpdating(null);
  };

  const settingsTabs = [
    { id: "profile", label: "Profile Info", icon: User },
    { id: "security", label: "Change Password", icon: Lock },
    { id: "contact", label: "Contact & Social", icon: MessageSquare },
    { id: "terms", label: "Terms & Conditions", icon: FileText },
    { id: "privacy", label: "Privacy Policy", icon: ShieldCheck },
    { id: "about", label: "About Us", icon: Info },
  ];

  return (
    <div className="min-h-full bg-white flex flex-col text-gray-900">
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
              className="cursor-pointer hover:scale-105 transition-transform"
            >
              <OperatorAvatar size="sm" overrideAvatar={avatarPreview || user?.avatar} />
            </Link>
          </div>
        </div>

        {/* Main Header Container (Desktop 1-Row Inline Alignment >= md) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-[#0D2823]/60 font-semibold mb-0.5">
              ACCOUNT / ADMINISTRATOR
            </p>
            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#0D2823] font-normal tracking-tight">
              Settings & Control
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
              className="cursor-pointer hover:scale-105 transition-transform"
            >
              <OperatorAvatar size="md" overrideAvatar={avatarPreview || user?.avatar} />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Body - FULL SCREEN GRID LAYOUT WITH LEFT VERTICAL SIDEBAR TABS */}
      <div suppressHydrationWarning className="p-4 sm:p-8 md:p-10 w-full flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 bg-white">
        {/* Left Column: Vertical Navigation Tab Buttons (3 cols) */}
        <div suppressHydrationWarning className="lg:col-span-3 space-y-2">
          <p className="text-[11px] font-mono uppercase tracking-widest text-gray-400 font-semibold px-3 mb-2">
            SETTINGS CATEGORIES
          </p>
          <div suppressHydrationWarning className="space-y-1.5">
            {settingsTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id as SettingsTab)}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 text-left cursor-pointer ${
                    isActive
                      ? "bg-[#0D2823] text-[#E1BF62] shadow-md border border-[#0D2823]"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200/70"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-[#E1BF62]" : "text-gray-500"}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Full-Width Panel Content (9 cols) */}
        <div suppressHydrationWarning className="lg:col-span-9 w-full">
          {!mounted ? (
            <div className="w-full h-96 bg-gray-50/60 animate-pulse rounded-2xl border border-gray-200" />
          ) : (
            <AnimatePresence mode="wait">
            {/* TAB 1: PROFILE INFO */}
            {activeTab === "profile" && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden w-full"
              >
                {/* Profile Header Banner */}
                <div className="p-6 sm:p-8 flex items-center gap-4 border-b border-gray-100 bg-gray-50">
                  <OperatorAvatar size="lg" className="border-2 border-[#E1BF62]/40" overrideAvatar={avatarPreview || user?.avatar} />
                  <div>
                    <h2 className="text-xl font-bold text-[#0D2823]">{user?.name || name || "Operator"}</h2>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">
                      {user?.email || "No email available"} · {user?.role || "ADMIN"}
                    </p>
                  </div>
                </div>

                {/* Form Section */}
                <form onSubmit={handleProfileSave} className="p-6 sm:p-8 space-y-6">
                  <div>
                    <h3 className="font-serif text-xl text-[#0D2823] font-normal mb-1">
                      Personal & Operator Details
                    </h3>
                    <p className="text-xs text-gray-500">
                      Update your personal display information. Security and credential identifiers remain locked by governance.
                    </p>
                  </div>

                  {profileError && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>{profileError}</span>
                    </div>
                  )}

                  {profileSaved && (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Profile updated successfully!</span>
                    </div>
                  )}

                  {/* Photo Upload Section */}
                  <div className="p-5 bg-gray-50/90 rounded-2xl border border-gray-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                    <div className="flex items-center gap-4">
                      <OperatorAvatar size="xl" className="border-2 border-[#0D2823]/20" overrideAvatar={avatarPreview || user?.avatar} />

                      <div>
                        <h4 className="text-sm font-bold text-[#0D2823]">Operator Profile Photo</h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Upload image via Multer (PNG, JPG, WEBP or GIF up to 5MB).
                        </p>
                        {uploadingAvatar ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full mt-1.5 font-medium animate-pulse">
                            <Loader2 className="w-2.5 h-2.5 animate-spin text-amber-600" /> Uploading via Multer...
                          </span>
                        ) : avatarPreview ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full mt-1.5 font-medium">
                            <Check className="w-2.5 h-2.5 text-emerald-600" /> Active Profile Photo
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-stretch sm:self-auto">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarFileChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        disabled={uploadingAvatar}
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 sm:flex-none bg-white hover:bg-gray-50 text-[#0D2823] text-xs font-semibold px-4 py-2.5 rounded-xl border border-gray-200 shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer hover:border-[#0D2823] disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {uploadingAvatar ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0D2823]" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Camera className="w-3.5 h-3.5 text-[#0D2823]" />
                            <span>{avatarPreview ? "Change Photo" : "Upload Photo"}</span>
                          </>
                        )}
                      </button>

                      {avatarPreview && (
                        <button
                          type="button"
                          disabled={uploadingAvatar}
                          onClick={handleRemoveAvatar}
                          className="bg-white hover:bg-rose-50 text-rose-700 text-xs font-semibold px-3 py-2.5 rounded-xl border border-rose-200 shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                          title="Remove photo"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span className="hidden sm:inline">Remove</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-mono text-gray-500 mb-1.5">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter full name"
                        required
                        className="w-full bg-white text-gray-900 text-sm rounded-xl px-4 py-3 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E1BF62] shadow-xs"
                      />
                      <p className="text-[11px] text-gray-400 mt-1 font-mono">
                        Visible display name across the command center.
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-mono text-gray-500">
                          Email address
                        </label>
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
                          <Lock className="w-2.5 h-2.5 text-amber-600" />
                          Permanent (Cannot be changed)
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="email"
                          value={user?.email || ""}
                          readOnly
                          disabled
                          className="w-full bg-gray-100/90 text-gray-500 text-sm rounded-xl pl-4 pr-10 py-3 border border-gray-200 cursor-not-allowed select-none shadow-none font-medium"
                        />
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                          <Lock className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1 font-mono">
                        Assigned operator email address cannot be modified.
                      </p>
                    </div>

                    <div className="md:col-span-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-mono text-gray-500">
                          Role / Designation
                        </label>
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                          <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                          System Assigned
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          value={user?.role || "ADMIN"}
                          readOnly
                          disabled
                          className="w-full bg-gray-100/90 text-gray-500 text-sm rounded-xl pl-4 pr-10 py-3 border border-gray-200 cursor-not-allowed select-none shadow-none font-medium"
                        />
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1 font-mono">
                        Security privileges are assigned by system administrators.
                      </p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={profileUpdating}
                    className="bg-[#0D2823] hover:bg-[#123A33] text-white font-medium text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2 transform active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {profileUpdating ? (
                      <span>Saving changes...</span>
                    ) : profileSaved ? (
                      <>
                        <Check className="w-4 h-4 text-[#E1BF62]" />
                        <span>Saved!</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 text-[#E1BF62]" />
                        <span>Save changes</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Session Footer Callout */}
                <div className="bg-gray-50 border-t border-gray-200 p-6 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-mono uppercase tracking-widest text-[#0D2823]/60 font-semibold mb-0.5">
                      SESSION
                    </p>
                    <p className="text-xs text-[#0D2823]/80">Signed in on this device.</p>
                  </div>

                  {onLogout && (
                    <button
                      onClick={onLogout}
                      className="text-xs font-semibold text-rose-900 hover:underline flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log out</span>
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* TAB 2: CHANGE PASSWORD */}
            {activeTab === "security" && (
              <motion.div
                key="security"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 space-y-6 w-full"
              >
                <div>
                  <h3 className="font-serif text-2xl text-[#0D2823] font-normal mb-1">
                    Security & Password
                  </h3>
                  <p className="text-xs text-gray-500">
                    Update your account password to ensure your operator command room remains secure.
                  </p>
                </div>

                {passError && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{passError}</span>
                  </div>
                )}

                {passSaved && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Password successfully updated!</span>
                  </div>
                )}

                <form onSubmit={handlePasswordSave} className="space-y-4 max-w-xl">
                  <div>
                    <label className="block text-xs font-mono text-gray-500 mb-1.5">
                      Current password
                    </label>
                    <input
                      type="password"
                      value={currentPass}
                      onChange={(e) => setCurrentPass(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-white text-gray-900 text-sm rounded-xl px-4 py-3 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E1BF62] shadow-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono text-gray-500 mb-1.5">
                        New password
                      </label>
                      <input
                        type="password"
                        value={newPass}
                        onChange={(e) => setNewPass(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full bg-white text-gray-900 text-sm rounded-xl px-4 py-3 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E1BF62] shadow-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-gray-500 mb-1.5">
                        Confirm new password
                      </label>
                      <input
                        type="password"
                        value={confirmPass}
                        onChange={(e) => setConfirmPass(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full bg-white text-gray-900 text-sm rounded-xl px-4 py-3 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E1BF62] shadow-xs"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={passUpdating}
                    className="bg-[#0D2823] hover:bg-[#123A33] text-white font-medium text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2 transform active:scale-95 cursor-pointer mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {passUpdating ? (
                      <span>Updating password...</span>
                    ) : passSaved ? (
                      <>
                        <Check className="w-4 h-4 text-[#E1BF62]" />
                        <span>Password Updated!</span>
                      </>
                    ) : (
                      <span>Update password</span>
                    )}
                  </button>
                </form>
              </motion.div>
            )}

            {/* TAB 3: TERMS & CONDITIONS (REACT-QUILL RICH TEXT EDITOR) */}
            {activeTab === "terms" && (
              <motion.div
                key="terms"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 space-y-5 w-full"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-serif text-2xl text-[#0D2823] font-normal mb-0.5">
                      Terms & Conditions Editor
                    </h3>
                    <p className="text-xs text-gray-400 font-mono">Edit and publish live Terms & Conditions document</p>
                  </div>
                  <button
                    onClick={() => handleDocSave("terms")}
                    disabled={docUpdating === "terms"}
                    className="bg-[#0D2823] hover:bg-[#123A33] text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed self-start sm:self-auto"
                  >
                    {docUpdating === "terms" ? (
                      <span>Publishing...</span>
                    ) : termsSaved ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#E1BF62]" />
                        <span>Published!</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5 text-[#E1BF62]" />
                        <span>Save Document</span>
                      </>
                    )}
                  </button>
                </div>

                {docError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{docError}</span>
                  </div>
                )}

                {/* ReactQuill Package Editor */}
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs bg-white">
                  <ReactQuill
                    theme="snow"
                    value={termsContent}
                    onChange={setTermsContent}
                    modules={quillModules}
                    formats={quillFormats}
                    className="min-h-[260px]"
                  />
                </div>
              </motion.div>
            )}

            {/* TAB 4: PRIVACY POLICY (REACT-QUILL RICH TEXT EDITOR) */}
            {activeTab === "privacy" && (
              <motion.div
                key="privacy"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 space-y-5 w-full"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-serif text-2xl text-[#0D2823] font-normal mb-0.5">
                      Privacy Policy Editor
                    </h3>
                    <p className="text-xs text-gray-400 font-mono">Edit and publish Privacy & Security Policy</p>
                  </div>
                  <button
                    onClick={() => handleDocSave("privacy")}
                    disabled={docUpdating === "privacy"}
                    className="bg-[#0D2823] hover:bg-[#123A33] text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed self-start sm:self-auto"
                  >
                    {docUpdating === "privacy" ? (
                      <span>Publishing...</span>
                    ) : privacySaved ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#E1BF62]" />
                        <span>Published!</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5 text-[#E1BF62]" />
                        <span>Save Document</span>
                      </>
                    )}
                  </button>
                </div>

                {docError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{docError}</span>
                  </div>
                )}

                {/* ReactQuill Package Editor */}
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs bg-white">
                  <ReactQuill
                    theme="snow"
                    value={privacyContent}
                    onChange={setPrivacyContent}
                    modules={quillModules}
                    formats={quillFormats}
                    className="min-h-[260px]"
                  />
                </div>
              </motion.div>
            )}

            {/* TAB 5: ABOUT US (REACT-QUILL RICH TEXT EDITOR) */}
            {activeTab === "about" && (
              <motion.div
                key="about"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 space-y-5 w-full text-gray-900"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-serif text-2xl text-[#0D2823] font-normal mb-0.5">
                      About Us Editor
                    </h3>
                    <p className="text-xs text-gray-400 font-mono">Edit platform overview & company details</p>
                  </div>
                  <button
                    onClick={() => handleDocSave("about")}
                    disabled={docUpdating === "about"}
                    className="bg-[#0D2823] hover:bg-[#123A33] text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed self-start sm:self-auto"
                  >
                    {docUpdating === "about" ? (
                      <span>Publishing...</span>
                    ) : aboutSaved ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#E1BF62]" />
                        <span>Published!</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5 text-[#E1BF62]" />
                        <span>Save Document</span>
                      </>
                    )}
                  </button>
                </div>

                {docError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{docError}</span>
                  </div>
                )}

                {/* ReactQuill Package Editor */}
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs bg-white text-gray-900">
                  <ReactQuill
                    theme="snow"
                    value={aboutContent}
                    onChange={setAboutContent}
                    modules={quillModules}
                    formats={quillFormats}
                    className="min-h-[260px]"
                  />
                </div>
              </motion.div>
            )}

            {/* TAB 6: CONTACT & SOCIAL CHANNELS */}
            {activeTab === "contact" && (
              <motion.div
                key="contact"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 space-y-6 w-full text-gray-900"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-serif text-2xl text-[#0D2823] font-normal mb-0.5">
                      Contact & Social Channels
                    </h3>
                    <p className="text-xs text-gray-400 font-mono">
                      Configure Telegram, WhatsApp, social links and customer support details
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      setContactError(null);
                      setContactUpdating(true);
                      try {
                        await dashboardApi.updateContactSettings({
                          whatsapp: whatsapp.trim(),
                          telegram: telegram.trim(),
                          instagram: instagram.trim(),
                          twitter: twitter.trim(),
                          tiktok: tiktok.trim(),
                          email: supportEmail.trim(),
                          phone: supportPhone.trim(),
                          workingHoursEn: workingHoursEn.trim(),
                          workingHoursAr: workingHoursAr.trim(),
                        });
                        setContactSaved(true);
                        setTimeout(() => setContactSaved(false), 2500);
                      } catch (err: unknown) {
                        setContactError(err instanceof Error ? err.message : "Failed to update contact settings");
                      } finally {
                        setContactUpdating(false);
                      }
                    }}
                    disabled={contactUpdating}
                    className="bg-[#0D2823] hover:bg-[#123A33] text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed self-start sm:self-auto"
                  >
                    {contactUpdating ? (
                      <span>Saving Channels...</span>
                    ) : contactSaved ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#E1BF62]" />
                        <span>Saved Successfully!</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5 text-[#E1BF62]" />
                        <span>Save Channels</span>
                      </>
                    )}
                  </button>
                </div>

                {contactError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{contactError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* WhatsApp */}
                  <div>
                    <label className="block text-xs font-mono text-gray-600 mb-1.5 uppercase font-medium">
                      WhatsApp Number / URL
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3 text-emerald-600">
                        <MessageSquare className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        placeholder="+971 50 889 1234 or https://wa.me/..."
                        className="w-full bg-white text-gray-900 text-sm rounded-xl pl-10 pr-4 py-2.5 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                      />
                    </div>
                  </div>

                  {/* Telegram */}
                  <div>
                    <label className="block text-xs font-mono text-gray-600 mb-1.5 uppercase font-medium">
                      Telegram Channel / Bot Link
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3 text-sky-500">
                        <Send className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        value={telegram}
                        onChange={(e) => setTelegram(e.target.value)}
                        placeholder="https://t.me/treasureboxapp"
                        className="w-full bg-white text-gray-900 text-sm rounded-xl pl-10 pr-4 py-2.5 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                      />
                    </div>
                  </div>

                  {/* Instagram */}
                  <div>
                    <label className="block text-xs font-mono text-gray-600 mb-1.5 uppercase font-medium">
                      Instagram Profile URL
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3 text-pink-500">
                        <Globe className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        value={instagram}
                        onChange={(e) => setInstagram(e.target.value)}
                        placeholder="https://instagram.com/treasurebox"
                        className="w-full bg-white text-gray-900 text-sm rounded-xl pl-10 pr-4 py-2.5 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                      />
                    </div>
                  </div>

                  {/* Twitter / X */}
                  <div>
                    <label className="block text-xs font-mono text-gray-600 mb-1.5 uppercase font-medium">
                      X (Twitter) Profile URL
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3 text-gray-800">
                        <Globe className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        value={twitter}
                        onChange={(e) => setTwitter(e.target.value)}
                        placeholder="https://x.com/treasurebox"
                        className="w-full bg-white text-gray-900 text-sm rounded-xl pl-10 pr-4 py-2.5 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                      />
                    </div>
                  </div>

                  {/* TikTok */}
                  <div>
                    <label className="block text-xs font-mono text-gray-600 mb-1.5 uppercase font-medium">
                      TikTok Profile URL
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3 text-black">
                        <Globe className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        value={tiktok}
                        onChange={(e) => setTiktok(e.target.value)}
                        placeholder="https://tiktok.com/@treasurebox"
                        className="w-full bg-white text-gray-900 text-sm rounded-xl pl-10 pr-4 py-2.5 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                      />
                    </div>
                  </div>

                  {/* Support Email */}
                  <div>
                    <label className="block text-xs font-mono text-gray-600 mb-1.5 uppercase font-medium">
                      Support Email
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3 text-amber-600">
                        <Mail className="w-4 h-4" />
                      </span>
                      <input
                        type="email"
                        value={supportEmail}
                        onChange={(e) => setSupportEmail(e.target.value)}
                        placeholder="support@treasurebox.app"
                        className="w-full bg-white text-gray-900 text-sm rounded-xl pl-10 pr-4 py-2.5 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                      />
                    </div>
                  </div>

                  {/* Support Phone */}
                  <div>
                    <label className="block text-xs font-mono text-gray-600 mb-1.5 uppercase font-medium">
                      Hotline Phone
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3 text-emerald-600">
                        <Phone className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        value={supportPhone}
                        onChange={(e) => setSupportPhone(e.target.value)}
                        placeholder="+971 50 889 1234"
                        className="w-full bg-white text-gray-900 text-sm rounded-xl pl-10 pr-4 py-2.5 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                      />
                    </div>
                  </div>

                  {/* Working Hours */}
                  <div>
                    <label className="block text-xs font-mono text-gray-600 mb-1.5 uppercase font-medium">
                      Working Hours (English)
                    </label>
                    <input
                      type="text"
                      value={workingHoursEn}
                      onChange={(e) => setWorkingHoursEn(e.target.value)}
                      placeholder="Daily: 9:00 AM – 10:00 PM (GST)"
                      className="w-full bg-white text-gray-900 text-sm rounded-xl px-4 py-2.5 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
