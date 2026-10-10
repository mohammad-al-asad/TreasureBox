"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  X,
  MapPin,
  Search,
  Crosshair,
  Compass,
  Check,
  Layers,
  Loader2,
} from "lucide-react";

interface InteractiveMapPickerModalProps {
  isOpen: boolean;
  initialLat?: number;
  initialLng?: number;
  initialLocationName?: string;
  onClose: () => void;
  onSave: (coordinates: { latitude: number; longitude: number }, locationName: string) => void;
}

declare global {
  interface Window {
    google?: any;
    initGoogleMapPicker?: () => void;
  }
}

export default function InteractiveMapPickerModal({
  isOpen,
  initialLat = 25.2644,
  initialLng = 55.2982,
  initialLocationName = "",
  onClose,
  onSave,
}: InteractiveMapPickerModalProps) {
  const [lat, setLat] = useState<number>(initialLat || 25.2644);
  const [lng, setLng] = useState<number>(initialLng || 55.2982);
  const [locationName, setLocationName] = useState<string>(initialLocationName || "");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);
  const [mapEngine, setMapEngine] = useState<"google" | "osm">("osm");
  const [isLocating, setIsLocating] = useState<boolean>(false);

  const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const googleMapInstanceRef = useRef<any>(null);
  const googleMarkerRef = useRef<any>(null);

  // Sync initial values
  useEffect(() => {
    if (isOpen) {
      setLat(initialLat || 25.2644);
      setLng(initialLng || 55.2982);
      setLocationName(initialLocationName || "");
      setSearchQuery("");
      setSearchResults([]);
    }
  }, [isOpen, initialLat, initialLng, initialLocationName]);

  // Check if Google Maps is available with API key
  useEffect(() => {
    if (!isOpen) return;

    if (googleApiKey && googleApiKey.trim().length > 5) {
      setMapEngine("google");
      loadGoogleMaps();
    } else {
      setMapEngine("osm");
    }
  }, [isOpen, googleApiKey]);

  // Load Google Maps Script dynamically if key exists
  const loadGoogleMaps = useCallback(() => {
    if (window.google?.maps) {
      initGoogleMap(lat, lng);
      return;
    }

    const existingScript = document.getElementById("google-maps-picker-script");
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "google-maps-picker-script";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleApiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initGoogleMap(lat, lng);
      };
      script.onerror = () => {
        setMapEngine("osm");
      };
      document.head.appendChild(script);
    } else {
      setTimeout(() => initGoogleMap(lat, lng), 500);
    }
  }, [googleApiKey, lat, lng]);

  const initGoogleMap = (centerLat: number, centerLng: number) => {
    if (!mapContainerRef.current || !window.google?.maps) return;

    const mapOptions = {
      center: { lat: centerLat, lng: centerLng },
      zoom: 14,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: false,
      styles: [
        { featureType: "poi", elementType: "labels", stylers: [{ visibility: "on" }] },
      ],
    };

    const map = new window.google.maps.Map(mapContainerRef.current, mapOptions);
    googleMapInstanceRef.current = map;

    const marker = new window.google.maps.Marker({
      position: { lat: centerLat, lng: centerLng },
      map: map,
      draggable: true,
      animation: window.google.maps.Animation.DROP,
      title: "Treasure Cache Location",
    });
    googleMarkerRef.current = marker;

    // Click map to reposition
    map.addListener("click", (e: any) => {
      const clickedLat = e.latLng.lat();
      const clickedLng = e.latLng.lng();
      updateMarkerPosition(clickedLat, clickedLng);
    });

    // Drag marker
    marker.addListener("dragend", (e: any) => {
      const newLat = e.latLng.lat();
      const newLng = e.latLng.lng();
      updateMarkerPosition(newLat, newLng);
    });
  };

  const updateMarkerPosition = (newLat: number, newLng: number) => {
    const fixedLat = parseFloat(newLat.toFixed(6));
    const fixedLng = parseFloat(newLng.toFixed(6));
    setLat(fixedLat);
    setLng(fixedLng);

    if (googleMarkerRef.current) {
      googleMarkerRef.current.setPosition({ lat: fixedLat, lng: fixedLng });
    }
    if (googleMapInstanceRef.current) {
      googleMapInstanceRef.current.panTo({ lat: fixedLat, lng: fixedLng });
    }
  };

  // OpenStreetMap Nominatim Geocoding Search
  const handleSearchPlaces = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery.trim()
        )}&limit=5`
      );
      const data = await res.json();
      setSearchResults(data || []);
    } catch (err) {
      console.warn("Geocoding search failed:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (result: { display_name: string; lat: string; lon: string }) => {
    const newLat = parseFloat(result.lat);
    const newLng = parseFloat(result.lon);
    if (!isNaN(newLat) && !isNaN(newLng)) {
      updateMarkerPosition(newLat, newLng);
      // Clean short location name from display name
      const shortName = result.display_name.split(",")[0] || result.display_name;
      if (!locationName.trim()) {
        setLocationName(shortName.trim());
      }
    }
    setSearchResults([]);
  };

  // Browser Geolocation
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const curLat = parseFloat(pos.coords.latitude.toFixed(6));
        const curLng = parseFloat(pos.coords.longitude.toFixed(6));
        updateMarkerPosition(curLat, curLng);
      },
      (err) => {
        setIsLocating(false);
        alert(`Could not fetch current location: ${err.message}`);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSaveAndConfirm = () => {
    const finalLocationName = locationName.trim() || `Location (${lat}, ${lng})`;
    onSave({ latitude: lat, longitude: lng }, finalLocationName);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50/80 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0D2823] flex items-center justify-center text-[#E1BF62] shadow-sm">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg sm:text-xl text-[#0D2823] font-semibold">
                Interactive Treasure Location Picker
              </h3>
              <p className="text-[11px] text-gray-500 font-mono">
                Click map, search or drag pin to assign exact expedition coordinates
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 font-sans">
          {/* Search Bar & Current Location Button */}
          <div className="space-y-1.5">
            <label className="block text-xs font-mono uppercase text-gray-500 font-semibold">
              Search City, Landmark or Address
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearchPlaces()}
                  placeholder="e.g. Al Fahidi, Dubai or Riyadh Historic District..."
                  className="w-full bg-white text-gray-900 text-xs sm:text-sm rounded-xl pl-9 pr-4 py-2.5 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] shadow-2xs font-medium"
                />
              </div>

              <button
                type="button"
                onClick={handleSearchPlaces}
                disabled={isSearching}
                className="px-4 py-2.5 rounded-xl bg-[#0D2823] hover:bg-[#153e37] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs transition-colors"
              >
                {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span>Search</span>
              </button>

              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isLocating}
                title="Use current GPS position"
                className="px-3 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#0D2823] text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                {isLocating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#B39345]" />
                ) : (
                  <Crosshair className="w-3.5 h-3.5 text-[#B39345]" />
                )}
                <span className="hidden sm:inline">GPS</span>
              </button>
            </div>

            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-1.5 space-y-1 mt-1 max-h-48 overflow-y-auto">
                {searchResults.map((res, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSearchResult(res)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-xs text-gray-800 flex items-start gap-2 cursor-pointer transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5 text-[#B39345] shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{res.display_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Interactive Visual Map View Container */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-gray-500 font-semibold flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#B39345]" />
                <span>Interactive Pin Selector</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/50 font-bold">
                {mapEngine === "google" ? "Google Maps Active" : "OpenStreetMap Active"}
              </span>
            </div>

            {mapEngine === "google" ? (
              <div
                ref={mapContainerRef}
                className="w-full h-64 sm:h-72 rounded-2xl overflow-hidden border border-gray-200 shadow-inner bg-gray-100"
              />
            ) : (
              /* OpenStreetMap Interactive Embed with Live Pointer Click */
              <div className="relative w-full h-64 sm:h-72 rounded-2xl overflow-hidden border border-gray-200 shadow-inner bg-[#EAE6DC]">
                <iframe
                  title="Interactive Map View"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.015}%2C${lat - 0.015}%2C${lng + 0.015}%2C${lat + 0.015}&layer=mapnik&marker=${lat}%2C${lng}`}
                  className="w-full h-full border-0 pointer-events-auto"
                />

                {/* Floating Map Helper Badge */}
                <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-black/5 shadow-md flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-[11px] font-mono font-bold text-[#0D2823]">
                    Lat: {lat.toFixed(4)}, Lng: {lng.toFixed(4)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Location Name & Exact Coordinates Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="sm:col-span-1">
              <label className="block text-[11px] font-mono uppercase text-gray-500 font-bold mb-1">
                Location / Area Name *
              </label>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g. Al Fahidi Historic Souk"
                className="w-full bg-white text-gray-900 text-xs rounded-xl px-3.5 py-2.5 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] font-medium shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-gray-500 font-bold mb-1">
                Exact Latitude
              </label>
              <input
                type="number"
                step="any"
                value={lat}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) updateMarkerPosition(val, lng);
                }}
                className="w-full bg-white text-gray-900 text-xs rounded-xl px-3.5 py-2.5 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] font-mono shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-gray-500 font-bold mb-1">
                Exact Longitude
              </label>
              <input
                type="number"
                step="any"
                value={lng}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) updateMarkerPosition(lat, val);
                }}
                className="w-full bg-white text-gray-900 text-xs rounded-xl px-3.5 py-2.5 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] font-mono shadow-2xs"
              />
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="p-3 bg-[#F8F5EE] rounded-2xl border border-[#E9E3D3] space-y-1.5">
            <span className="text-[11px] font-mono text-[#0D2823] font-bold block uppercase">
              Quick Historic Districts:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  updateMarkerPosition(25.2644, 55.2982);
                  setLocationName("Dubai Historic District");
                }}
                className="px-2.5 py-1 bg-white rounded-lg border border-gray-200 text-[11px] font-mono hover:border-[#D4AF37] cursor-pointer text-gray-800"
              >
                Dubai Historic Souk (25.2644, 55.2982)
              </button>
              <button
                type="button"
                onClick={() => {
                  updateMarkerPosition(24.7136, 46.6753);
                  setLocationName("Riyadh Historic Center");
                }}
                className="px-2.5 py-1 bg-white rounded-lg border border-gray-200 text-[11px] font-mono hover:border-[#D4AF37] cursor-pointer text-gray-800"
              >
                Riyadh Historic (24.7136, 46.6753)
              </button>
              <button
                type="button"
                onClick={() => {
                  updateMarkerPosition(21.4858, 39.1925);
                  setLocationName("Jeddah Al-Balad Ruins");
                }}
                className="px-2.5 py-1 bg-white rounded-lg border border-gray-200 text-[11px] font-mono hover:border-[#D4AF37] cursor-pointer text-gray-800"
              >
                Jeddah Al-Balad (21.4858, 39.1925)
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/60">
          <div className="flex items-center gap-2 text-xs font-mono text-gray-500 truncate mr-2">
            <MapPin className="w-3.5 h-3.5 text-[#B39345] shrink-0" />
            <span className="truncate">
              {locationName.trim() || "Unlabeled Spot"} • ({lat.toFixed(4)}, {lng.toFixed(4)})
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAndConfirm}
              className="bg-[#0D2823] hover:bg-[#1a443b] text-[#E1BF62] font-semibold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Apply Location Pin</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
