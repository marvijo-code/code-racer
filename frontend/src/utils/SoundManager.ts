export class SoundManager {
  private audioContext: AudioContext | null = null;
  private engineOscillator: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private isEngineRunning: boolean = false;
  private masterVolume: number = 0;

  constructor() {
    this.initAudioContext();
  }

  private initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }

  private async resumeAudioContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  public async startEngine() {
    if (!this.audioContext || this.isEngineRunning) return;

    await this.resumeAudioContext();

    // Create engine sound using oscillators
    this.engineOscillator = this.audioContext.createOscillator();
    this.engineGain = this.audioContext.createGain();

    // Connect the nodes
    this.engineOscillator.connect(this.engineGain);
    this.engineGain.connect(this.audioContext.destination);

    // Set initial engine sound (idle)
    this.engineOscillator.type = 'sawtooth';
    this.engineOscillator.frequency.setValueAtTime(80, this.audioContext.currentTime);
    this.engineGain.gain.setValueAtTime(0.1 * this.masterVolume, this.audioContext.currentTime);

    this.engineOscillator.start();
    this.isEngineRunning = true;
  }

  public stopEngine() {
    if (this.engineOscillator && this.isEngineRunning) {
      this.engineOscillator.stop();
      this.engineOscillator = null;
      this.engineGain = null;
      this.isEngineRunning = false;
    }
  }

  public updateEngineSound(speed: number, maxSpeed: number) {
    if (!this.engineOscillator || !this.engineGain || !this.audioContext) return;

    const speedRatio = Math.abs(speed) / maxSpeed;
    
    // Engine frequency based on speed (80Hz idle to 300Hz max)
    const targetFreq = 80 + (speedRatio * 220);
    
    // Engine volume based on speed
    const targetVolume = (0.1 + speedRatio * 0.2) * this.masterVolume;

    // Smooth transitions
    const currentTime = this.audioContext.currentTime;
    this.engineOscillator.frequency.exponentialRampToValueAtTime(
      Math.max(targetFreq, 20), 
      currentTime + 0.1
    );
    this.engineGain.gain.linearRampToValueAtTime(targetVolume, currentTime + 0.1);
  }

  public playBrakeSound() {
    // Disabled - only engine sounds allowed
    return;
  }

  public playBoostSound() {
    // Disabled - only engine sounds allowed
    return;
  }

  public playCheckpointSound() {
    // Disabled - only engine sounds allowed
    return;
  }

  public setMasterVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  public getMasterVolume(): number {
    return this.masterVolume;
  }

  public destroy() {
    this.stopEngine();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Global sound manager instance
export const soundManager = new SoundManager(); 