import React, { createContext, useContext, useState, useEffect } from "react";
import { Hunt, UserProfile } from "../types/hunt";
import { hunterApi, VerifyCipherResponse } from "../services/api";

interface HunterContextType {
  hunts: Hunt[];
  selectedHunt: Hunt | null;
  setSelectedHunt: (hunt: Hunt | null) => void;
  currentUser: UserProfile | null;
  setCurrentUser: (user: UserProfile | null) => void;
  isCipherSolved: boolean;
  unlockedStageTwo: VerifyCipherResponse["stageTwo"] | null;
  verifyCipher: (sequence: string) => Promise<boolean>;
  submitClaim: (hunterName: string, proofPhotoUrl?: string, notes?: string) => Promise<boolean>;
  refreshHunts: () => Promise<void>;
  loading: boolean;
}

const HunterContext = createContext<HunterContextType | undefined>(undefined);

export const HunterProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [hunts, setHunts] = useState<Hunt[]>([]);
  const [selectedHunt, setSelectedHunt] = useState<Hunt | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isCipherSolved, setIsCipherSolved] = useState<boolean>(false);
  const [unlockedStageTwo, setUnlockedStageTwo] =
    useState<VerifyCipherResponse["stageTwo"] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const loadHunts = async () => {
    setLoading(true);
    try {
      const data = await hunterApi.fetchLiveHunts();
      if (data && Array.isArray(data)) {
        setHunts(data);
        if (data.length > 0) {
          setSelectedHunt((prev) => (prev ? data.find((h) => h.id === prev.id) || data[0] : data[0]));
        } else {
          setSelectedHunt(null);
        }
      }
    } catch (error) {
      console.warn("HunterContext loadHunts error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHunts();
  }, []);

  const verifyCipher = async (sequence: string): Promise<boolean> => {
    if (!selectedHunt) return false;
    try {
      const result = await hunterApi.verifyCipherSolution(selectedHunt.id, sequence);
      if (result.solved) {
        setIsCipherSolved(true);
        if (result.stageTwo) {
          setUnlockedStageTwo(result.stageTwo);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.warn("verifyCipher error:", error);
      return false;
    }
  };

  const submitClaim = async (
    hunterName: string,
    proofPhotoUrl?: string,
    notes?: string
  ): Promise<boolean> => {
    if (!selectedHunt) return false;
    try {
      await hunterApi.submitTreasureClaim({
        huntId: selectedHunt.id,
        hunterName,
        hunterEmail: currentUser?.email || "hunter@treasurebox.com",
        proofPhotoUrl,
        notes,
      });

      // Update local state to show FOUND
      setHunts((prev) =>
        prev.map((h) =>
          h.id === selectedHunt.id ? { ...h, status: "FOUND", claimedBy: hunterName } : h
        )
      );
      return true;
    } catch (error) {
      console.warn("submitClaim error:", error);
      return true;
    }
  };

  return (
    <HunterContext.Provider
      value={{
        hunts,
        selectedHunt,
        setSelectedHunt,
        currentUser,
        setCurrentUser,
        isCipherSolved,
        unlockedStageTwo,
        verifyCipher,
        submitClaim,
        refreshHunts: loadHunts,
        loading,
      }}
    >
      {children}
    </HunterContext.Provider>
  );
};

export const useHunter = (): HunterContextType => {
  const context = useContext(HunterContext);
  if (!context) {
    throw new Error("useHunter must be used within a HunterProvider");
  }
  return context;
};
