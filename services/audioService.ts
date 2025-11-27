export class AudioService {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  private getContext(): AudioContext {
    if (!this.ctx) {
      // @ts-ignore
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    // Resume context if it was suspended (browser policy)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(e => console.error("Audio resume failed", e));
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
  }

  public isMuted() {
    return this.muted;
  }

  public startBGM() {
    if (this.muted) return;
    // Just initialize context for now. 
    // In a full implementation, this would start a background loop.
    this.getContext();
  }

  public playCorrect() {
    if (this.muted) return;
    try {
      const ctx = this.getContext();
      const t = ctx.currentTime;
      
      // Cheerful ascending arpeggio (C Major)
      this.playTone(523.25, 'sine', t, 0.1, 0.1); // C5
      this.playTone(659.25, 'sine', t + 0.08, 0.1, 0.1); // E5
      this.playTone(783.99, 'sine', t + 0.16, 0.1, 0.1); // G5
      this.playTone(1046.50, 'sine', t + 0.24, 0.4, 0.05); // C6
    } catch (e) {
      // Audio context might not be available
    }
  }

  public playIncorrect() {
    if (this.muted) return;
    try {
      const ctx = this.getContext();
      const t = ctx.currentTime;
      
      // Soft error thud
      this.playTone(150, 'triangle', t, 0.15, 0.15); 
      this.playTone(110, 'triangle', t + 0.1, 0.3, 0.15);
    } catch (e) {}
  }

  public playHint() {
    if (this.muted) return;
    try {
      const ctx = this.getContext();
      const t = ctx.currentTime;
      
      // Magical "ding"
      this.playTone(880, 'sine', t, 0.1, 0.05);
      this.playTone(1760, 'sine', t + 0.05, 0.3, 0.02);
    } catch (e) {}
  }

  private playTone(freq: number, type: OscillatorType, startTime: number, duration: number, vol: number) {
    const ctx = this.getContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    
    // Simple envelope: Attack -> Release
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(vol, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    
    osc.stop(startTime + duration + 0.05); // Stop slightly after envelope finishes
  }
}

export const audioService = new AudioService();