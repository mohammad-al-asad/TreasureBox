import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

/**
 * Plays a triumphant antique brass treasure unlock chime chord
 * (C5 -> E5 -> G5 -> C6 high arpeggio with warm resonant decay)
 * Uses Web Audio API on web/hybrid platforms and triggers success haptics.
 */
export const playTreasureUnlockSound = async (): Promise<void> => {
  // 1. Trigger celebratory device haptics
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // Safe haptics fallback
  }

  // 2. Synthesize victory chord via Web Audio API if available
  try {
    if (typeof window !== "undefined") {
      const AudioCtx =
        (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        if (ctx.state === "suspended") {
          await ctx.resume();
        }

        const now = ctx.currentTime;
        // Frequencies for a grand golden chime: C5, E5, G5, C6
        const notes = [523.25, 659.25, 783.99, 1046.5];

        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);

          // Natural acoustic bell/chime envelope
          const startTime = now + idx * 0.08;
          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(0.28, startTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.2);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(startTime);
          osc.stop(startTime + 1.25);
        });

        // Add a subtle brass chime harmonic overtone
        const overtone = ctx.createOscillator();
        const overtoneGain = ctx.createGain();
        overtone.type = "triangle";
        overtone.frequency.setValueAtTime(1318.51, now + 0.24); // E6 sparkle

        overtoneGain.gain.setValueAtTime(0, now + 0.24);
        overtoneGain.gain.linearRampToValueAtTime(0.15, now + 0.26);
        overtoneGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

        overtone.connect(overtoneGain);
        overtoneGain.connect(ctx.destination);

        overtone.start(now + 0.24);
        overtone.stop(now + 1.45);
      }
    }
  } catch (err) {
    console.warn("[Audio] Could not synthesize unlock chime:", err);
  }
};
