import { Audio } from 'expo-av';
import { useCallback } from 'react';

import { useSettingsStore } from '@/store/settingsStore';

type SoundType = 'correct' | 'wrong' | 'click';

// Frequencies (Hz) for synthesised tones via a short oscillator-style approach.
// expo-av doesn't support Web Audio API, so we use bundled asset URIs.
// We generate tones at runtime using a tiny PCM WAV encoded as base64.
function makeToneWav(frequency: number, durationMs: number, volume = 0.6): string {
  const sampleRate = 22050;
  const numSamples = Math.floor((sampleRate * durationMs) / 1000);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const envelope = Math.min(1, Math.min(t * 20, (durationMs / 1000 - t) * 20));
    const sample = Math.sin(2 * Math.PI * frequency * t) * volume * envelope * 32767;
    view.setInt16(44 + i * 2, sample, true);
  }

  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return `data:audio/wav;base64,${btoa(binary)}`;
}

const TONES: Record<SoundType, { frequency: number; duration: number }> = {
  correct: { frequency: 880, duration: 180 },
  wrong: { frequency: 220, duration: 250 },
  click: { frequency: 660, duration: 80 },
};

export function useSound() {
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);

  const play = useCallback(async (type: SoundType) => {
    if (!soundEnabled) return;
    try {
      const { frequency, duration } = TONES[type];
      const uri = makeToneWav(frequency, duration);
      const { sound } = await Audio.Sound.createAsync({ uri });
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) sound.unloadAsync();
      });
    } catch {
      // Sound is non-critical — silently ignore errors
    }
  }, [soundEnabled]);

  return { play };
}
