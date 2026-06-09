/** Procedural sounds via Web Audio API */
export class AudioManager {
  constructor() {
    this.ctx = null;
    this.unlocked = false;
    this.stepAccumulator = 0;
    this.leftFoot = true;
    this.stepSpacing = 0.38;
  }

  _ensureContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.unlocked = true;
  }

  unlock() {
    this._ensureContext();
  }

  /** Play footsteps based on how far the player actually moved */
  updateFootsteps(isMoving, distanceMoved) {
    if (!this.unlocked || !isMoving || distanceMoved <= 0) {
      this.stepAccumulator = 0;
      return;
    }

    this.stepAccumulator += distanceMoved;
    while (this.stepAccumulator >= this.stepSpacing) {
      this.stepAccumulator -= this.stepSpacing;
      this.playFootstep();
      this.leftFoot = !this.leftFoot;
    }
  }

  /** Mall tile footstep — filtered noise + low thump */
  playFootstep() {
    this._ensureContext();
    const t = this.ctx.currentTime;
    const foot = this.leftFoot ? 0 : 1;

    // Low thump
    const thump = this.ctx.createOscillator();
    const thumpGain = this.ctx.createGain();
    thump.type = 'sine';
    thump.frequency.setValueAtTime(90 + foot * 12 + Math.random() * 15, t);
    thump.frequency.exponentialRampToValueAtTime(45, t + 0.06);
    thumpGain.gain.setValueAtTime(0.0001, t);
    thumpGain.gain.exponentialRampToValueAtTime(0.22, t + 0.005);
    thumpGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    thump.connect(thumpGain);
    thumpGain.connect(this.ctx.destination);
    thump.start(t);
    thump.stop(t + 0.1);

    // Scuff / tile scrape (band-passed noise)
    const bufferSize = this.ctx.sampleRate * 0.06;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(700 + foot * 80 + Math.random() * 200, t);
    filter.Q.setValueAtTime(0.8, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.0001, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.12, t + 0.004);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.055);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start(t);
    noise.stop(t + 0.06);
  }

  /** Sharp alarm when an angry customer catches the player */
  playCatchAlert() {
    this._ensureContext();
    const t = this.ctx.currentTime;

    // Descending buzzer
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.35);

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.35, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);

    osc.start(t);
    osc.stop(t + 0.42);

    // Second punch layer
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(440, t + 0.05);
    osc2.frequency.exponentialRampToValueAtTime(110, t + 0.3);
    gain2.gain.setValueAtTime(0.0001, t + 0.05);
    gain2.gain.exponentialRampToValueAtTime(0.15, t + 0.07);
    gain2.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    osc2.start(t + 0.05);
    osc2.stop(t + 0.38);
  }
}
