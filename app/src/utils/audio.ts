import * as Haptics from "expo-haptics";
import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from "expo-audio";

const successSource = require("../../assets/sounds/treasure-success.mp3");

// Created lazily once and reused so repeated plays don't allocate new native players
let successPlayer: AudioPlayer | null = null;

const getSuccessPlayer = async (): Promise<AudioPlayer> => {
  if (!successPlayer) {
    try {
      // Let the celebration sound play even when the iPhone ring/silent switch is on silent
      await setAudioModeAsync({ playsInSilentMode: true });
    } catch {
      // Audio mode is best-effort
    }
    successPlayer = createAudioPlayer(successSource);
  }
  return successPlayer;
};

/**
 * Plays the treasure success sound ("Explosion Prize")
 * and triggers success haptics.
 */
export const playTreasureUnlockSound = async (): Promise<void> => {
  // 1. Trigger celebratory device haptics
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // Safe haptics fallback
  }

  // 2. Play the success sound from the start
  try {
    const player = await getSuccessPlayer();
    await player.seekTo(0);
    player.play();
  } catch (err) {
    console.warn("[Audio] Could not play treasure success sound:", err);
  }
};
