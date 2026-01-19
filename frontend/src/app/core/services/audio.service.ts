import { Injectable, signal } from '@angular/core';

export type SoundType = 'soft-bell' | 'chime' | 'nature' | 'bright' | 'none';

@Injectable({
  providedIn: 'root',
})
export class AudioService {
  private audioContext: AudioContext | null = null;
  private isMutedSignal = signal(false);

  isMuted = this.isMutedSignal.asReadonly();

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    return this.audioContext;
  }

  toggleMute(): void {
    this.isMutedSignal.update((muted) => !muted);
  }

  setMuted(muted: boolean): void {
    this.isMutedSignal.set(muted);
  }

  playPhaseSound(soundType: SoundType, phase: 'inhale' | 'exhale' | 'hold'): void {
    if (this.isMutedSignal() || soundType === 'none') return;

    switch (soundType) {
      case 'soft-bell':
        this.playSoftBell(phase);
        break;
      case 'chime':
        this.playChime(phase);
        break;
      case 'nature':
        this.playNature(phase);
        break;
      case 'bright':
        this.playBright(phase);
        break;
    }
  }

  playSessionComplete(): void {
    if (this.isMutedSignal()) return;
    this.playCompletionSound();
  }

  private playSoftBell(phase: 'inhale' | 'exhale' | 'hold'): void {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    // Different frequencies for different phases
    const frequencies: Record<string, number> = {
      inhale: 440,   // A4
      exhale: 330,   // E4
      hold: 392,     // G4
    };

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequencies[phase], now);

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(now);
    oscillator.stop(now + 0.8);
  }

  private playChime(phase: 'inhale' | 'exhale' | 'hold'): void {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    const frequencies: Record<string, number[]> = {
      inhale: [523, 659, 784],  // C5, E5, G5
      exhale: [392, 494, 587],  // G4, B4, D5
      hold: [440, 554, 659],    // A4, C#5, E5
    };

    frequencies[phase].forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, now);

      const startTime = now + i * 0.05;
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.03);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.6);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.6);
    });
  }

  private playNature(phase: 'inhale' | 'exhale' | 'hold'): void {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Softer, more natural sounds using filtered noise + tone
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    const settings: Record<string, { freq: number; filterFreq: number }> = {
      inhale: { freq: 220, filterFreq: 800 },
      exhale: { freq: 165, filterFreq: 600 },
      hold: { freq: 196, filterFreq: 700 },
    };

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(settings[phase].freq, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(settings[phase].filterFreq, now);
    filter.Q.setValueAtTime(1, now);

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.2, now + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(now);
    oscillator.stop(now + 0.5);
  }

  private playBright(phase: 'inhale' | 'exhale' | 'hold'): void {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    const frequencies: Record<string, number> = {
      inhale: 880,   // A5
      exhale: 659,   // E5
      hold: 784,     // G5
    };

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(frequencies[phase], now);

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.1, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(now);
    oscillator.stop(now + 0.3);
  }

  private playCompletionSound(): void {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Play a pleasant ascending arpeggio
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6

    notes.forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, now);

      const startTime = now + i * 0.15;
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.8);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.8);
    });
  }
}
