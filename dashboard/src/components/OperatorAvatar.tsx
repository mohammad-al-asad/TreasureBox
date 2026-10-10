"use client";

import React, { useState } from "react";
import { useAppSelector } from "@/redux/hooks";

interface OperatorAvatarProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  fallbackName?: string;
  overrideAvatar?: string;
}

const sizeClasses = {
  xs: "w-7 h-7 text-[10px]",
  sm: "w-9 h-9 text-xs",
  md: "w-10 h-10 text-xs sm:text-sm",
  lg: "w-14 h-14 text-lg",
  xl: "w-20 h-20 text-2xl",
};

export const getInitials = (displayName?: string): string => {
  if (!displayName || !displayName.trim()) return "OP";
  const parts = displayName.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return displayName.slice(0, 2).toUpperCase();
};

export default function OperatorAvatar({
  size = "sm",
  className = "",
  fallbackName,
  overrideAvatar,
}: OperatorAvatarProps) {
  const { user } = useAppSelector((state) => state.auth);
  const [imgError, setImgError] = useState(false);

  const effectiveAvatar = overrideAvatar !== undefined ? overrideAvatar : user?.avatar;
  const effectiveName = user?.name || fallbackName || "Operator";
  const initials = getInitials(effectiveName);

  if (effectiveAvatar && !imgError) {
    return (
      <div
        className={`relative rounded-full overflow-hidden border border-[#E1BF62]/30 shadow-xs shrink-0 bg-[#0D2823] flex items-center justify-center ${sizeClasses[size]} ${className}`}
      >
        <img
          src={effectiveAvatar}
          alt={effectiveName}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative rounded-full bg-[#0D2823] text-[#E1BF62] font-mono font-bold flex items-center justify-center border border-[#E1BF62]/30 shadow-xs shrink-0 select-none ${sizeClasses[size]} ${className}`}
    >
      {initials}
    </div>
  );
}
