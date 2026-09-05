/**
 * Trade Gate Sound Effect System
 * Synthesized with Web Audio API for zero network overhead, instant latency,
 * and elegant, restrained futuristic micro-feedback.
 */

export type SoundEvent =
  | 'checkbox_check'
  | 'checkbox_uncheck'
  | 'tab_switch'
  | 'button_click'
  | 'data_saved'
  | 'warning'
  | 'gate_locked'
  | 'gate_approved'
  | 'approval_expired'
  | 'offline_mode'
  | 'online_restored'
  | 'csv_export_completed'
  | 'ai_response_ready';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private volume: number = 0.35; // Default 35%
  private isInitialized: boolean = false;

  constructor() {
    // Load persisted sound preferences from localStorage if available
    try {
      const savedEnabled = localStorage.getItem('trade_gate_sound_enabled');
      if (savedEnabled !== null) {
        this.soundEnabled = savedEnabled === 'true';
      }
      const savedVol = localStorage.getItem('trade_gate_sound_volume');
      if (savedVol !== null) {
        const parsed = parseFloat(savedVol);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
          this.volume = parsed;
        }
      }
    } catch {
      // Storage unavailable, use defaults
    }

    // Attach passive user interaction listeners to resume audio context
    if (typeof window !== 'undefined') {
      const unlockAudio = () => {
        this.initContext();
        window.removeEventListener('pointerdown', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
      };
      window.addEventListener('pointerdown', unlockAudio, { passive: true });
      window.addEventListener('keydown', unlockAudio, { passive: true });
      window.addEventListener('touchstart', unlockAudio, { passive: true });
    }
  }

  private initContext(): AudioContext | null {
    if (this.ctx && this.ctx.state !== 'closed') {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    }

    try {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
        this.isInitialized = true;
      }
    } catch {
      this.ctx = null;
    }
    return this.ctx;
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  public setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    try {
      localStorage.setItem('trade_gate_sound_enabled', String(enabled));
    } catch {}
  }

  public getVolume(): number {
    return this.volume;
  }

  public setVolume(vol: number): void {
    const clamped = Math.max(0, Math.min(1, vol));
    this.volume = clamped;
    try {
      localStorage.setItem('trade_gate_sound_volume', String(clamped));
    } catch {}
  }

  public play(event: SoundEvent): void {
    if (!this.soundEnabled || this.volume <= 0) return;

    try {
      const ctx = this.initContext();
      if (!ctx) return;

      if (ctx.state === 'suspended') {
        ctx.resume().then(() => {
          this.renderSound(ctx, event);
        }).catch(() => {});
      } else {
        this.renderSound(ctx, event);
      }
    } catch {
      // Audio failed, fail silently without breaking the UI
    }
  }

  private renderSound(ctx: AudioContext, event: SoundEvent): void {
    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(this.volume, now);
    masterGain.connect(ctx.destination);

    switch (event) {
      case 'checkbox_check': {
        // Soft click/tick sound: gentle high tick (1350Hz -> 850Hz over 25ms)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1350, now);
        osc.frequency.exponentialRampToValueAtTime(850, now + 0.025);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.035);
        break;
      }

      case 'checkbox_uncheck': {
        // Very subtle soft downward tick (650Hz -> 420Hz, 20ms)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(650, now);
        osc.frequency.exponentialRampToValueAtTime(420, now + 0.02);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.03);
        break;
      }

      case 'tab_switch': {
        // Tiny soft transition sound: subtle dual airy micro-tone
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(540, now);
        osc1.frequency.exponentialRampToValueAtTime(680, now + 0.04);

        gain1.gain.setValueAtTime(0.18, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

        osc1.connect(gain1);
        gain1.connect(masterGain);
        osc1.start(now);
        osc1.stop(now + 0.05);
        break;
      }

      case 'button_click': {
        // Minimal tactile click (420Hz fast damped tap)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.02);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.03);
        break;
      }

      case 'data_saved': {
        // Short soft confirmation sound: ascending pure harmonics (587Hz -> 880Hz)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, now); // D5
        gain1.gain.setValueAtTime(0.25, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880.0, now + 0.035); // A5
        gain2.gain.setValueAtTime(0.0, now);
        gain2.gain.setValueAtTime(0.22, now + 0.035);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc1.connect(gain1);
        gain1.connect(masterGain);
        osc2.connect(gain2);
        gain2.connect(masterGain);

        osc1.start(now);
        osc1.stop(now + 0.07);
        osc2.start(now + 0.035);
        osc2.stop(now + 0.13);
        break;
      }

      case 'warning': {
        // Subtle two-tone warning sound: soft minor interval (440Hz -> 415Hz)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(440, now);
        gain1.gain.setValueAtTime(0.22, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.06);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(415.3, now + 0.065); // Ab4
        gain2.gain.setValueAtTime(0.0, now);
        gain2.gain.setValueAtTime(0.2, now + 0.065);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc1.connect(gain1);
        gain1.connect(masterGain);
        osc2.connect(gain2);
        gain2.connect(masterGain);

        osc1.start(now);
        osc1.stop(now + 0.07);
        osc2.start(now + 0.065);
        osc2.stop(now + 0.16);
        break;
      }

      case 'gate_locked': {
        // Low, soft notification tone: restrained soft thud/drop (220Hz -> 150Hz)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.09);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.11);
        break;
      }

      case 'gate_approved': {
        // APPROVAL SOUND:
        // "When Gate changes from LOCKED to APPROVED FOR EXECUTION, play a short, elegant, futuristic confirmation sound.
        // Combine with existing visual unlock animation. Satisfying but restrained. Do NOT use casino-like winning sounds."
        // A three-chord futuristic harmonic chime (C5 523Hz + G5 784Hz + high C6 1046Hz) with smooth fade
        const chords = [
          { freq: 523.25, start: 0, dur: 0.22, gainVal: 0.22 },
          { freq: 659.25, start: 0.04, dur: 0.22, gainVal: 0.20 },
          { freq: 783.99, start: 0.08, dur: 0.26, gainVal: 0.24 },
          { freq: 1046.5, start: 0.12, dur: 0.30, gainVal: 0.22 },
        ];

        chords.forEach(({ freq, start, dur, gainVal }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + start);

          gain.gain.setValueAtTime(0.0, now);
          gain.gain.setValueAtTime(0.0, now + start);
          gain.gain.linearRampToValueAtTime(gainVal, now + start + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);

          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(now + start);
          osc.stop(now + start + dur + 0.02);
        });
        break;
      }

      case 'approval_expired': {
        // Subtle notification sound (descending tone 440Hz -> 310Hz)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(310, now + 0.14);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.16);
        break;
      }

      case 'offline_mode': {
        // Soft warm notification tone (320Hz -> 260Hz)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(260, now + 0.1);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.12);
        break;
      }

      case 'online_restored': {
        // Short upbeat confirmation sound (600Hz -> 880Hz)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);

        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      }

      case 'csv_export_completed': {
        // High crisp double-chime (784Hz -> 1046Hz) indicating file export
        [
          { freq: 784, start: 0, dur: 0.08 },
          { freq: 1046, start: 0.09, dur: 0.12 },
        ].forEach(({ freq, start, dur }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + start);
          gain.gain.setValueAtTime(0.25, now + start);
          gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(now + start);
          osc.stop(now + start + dur + 0.01);
        });
        break;
      }

      case 'ai_response_ready': {
        // Futuristic gentle soft-spark chime (523Hz -> 659Hz -> 784Hz soft arpeggio)
        [
          { freq: 523, start: 0, dur: 0.06 },
          { freq: 659, start: 0.05, dur: 0.07 },
          { freq: 784, start: 0.10, dur: 0.12 },
        ].forEach(({ freq, start, dur }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + start);
          gain.gain.setValueAtTime(0.18, now + start);
          gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(now + start);
          osc.stop(now + start + dur + 0.01);
        });
        break;
      }
    }
  }
}

export const soundEngine = new SoundEngine();
