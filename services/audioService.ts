class AudioService {
  private ctx: AudioContext | null = null;
  private droneNode: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private volume: number = 0.5;

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      this.masterGain.gain.value = this.volume;
    }
    if (this.ctx.state === 'suspended') {
        this.ctx.resume();
    }
  }

  resume() {
    this.init();
    if(this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
    }
  }

  setVolume(vol: number) {
      this.volume = vol;
      if (this.masterGain) this.masterGain.gain.setValueAtTime(vol, this.ctx?.currentTime || 0);
  }

  // --- WINDOWS STYLE SOUNDS ---

  playStartup() {
      this.init();
      if(!this.ctx || !this.masterGain) return;
      const t = this.ctx.currentTime;
      // Retro celestial chord
      const freqs = [130.81, 196.00, 261.63, 329.63, 392.00, 523.25]; // C Major add9 ish
      freqs.forEach((f, i) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          osc.type = 'sine';
          osc.frequency.value = f;
          gain.gain.setValueAtTime(0, t);
          gain.gain.linearRampToValueAtTime(0.1, t + 0.5 + (i*0.1));
          gain.gain.exponentialRampToValueAtTime(0.001, t + 4);
          osc.connect(gain);
          gain.connect(this.masterGain!);
          osc.start(t);
          osc.stop(t + 4);
      });
  }

  playChord() { // "Error" sound
      this.init();
      if(!this.ctx || !this.masterGain) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, t); // Low square
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.4);
  }

  playDing() { // "Asterisk" sound
      this.init();
      if(!this.ctx || !this.masterGain) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, t);
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.6);
  }

  playNotify() {
      this.init();
      if(!this.ctx || !this.masterGain) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.linearRampToValueAtTime(600, t + 0.1);
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.linearRampToValueAtTime(0, t + 0.2);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.2);
  }

  // --- GAME SOUNDS ---

  playUiClick() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(2000, t);
    gain.gain.setValueAtTime(0.05, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  playWindowOpen() {
    this.playNotify();
  }

  playError() {
    this.playChord();
  }

  playHDDNoise() {
     this.init();
     if (!this.ctx || !this.masterGain) return;
     if (Math.random() > 0.4) return;
     const t = this.ctx.currentTime;
     const bufferSize = this.ctx.sampleRate * 0.05;
     const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
     const data = buffer.getChannelData(0);
     for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
     const noise = this.ctx.createBufferSource();
     noise.buffer = buffer;
     const filter = this.ctx.createBiquadFilter();
     filter.type = 'bandpass';
     filter.frequency.value = 2000;
     noise.connect(filter);
     filter.connect(this.masterGain);
     noise.start(t);
  }

  playAmbientDrone() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    this.stopDrone();
    this.droneNode = this.ctx.createOscillator();
    this.gainNode = this.ctx.createGain();
    this.droneNode.type = 'sine'; 
    this.droneNode.frequency.setValueAtTime(60, this.ctx.currentTime); // Mains hum
    
    // Add LFO for "computer fan" fluctuation
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.5;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 2;
    lfo.connect(lfoGain);
    lfoGain.connect(this.droneNode.frequency);
    lfo.start();

    this.droneNode.connect(this.gainNode);
    this.gainNode.connect(this.masterGain);
    this.gainNode.gain.setValueAtTime(0.1, this.ctx.currentTime);
    this.droneNode.start();
  }

  stopDrone() {
    if (this.droneNode) {
      try { this.droneNode.stop(); } catch(e){}
      this.droneNode = null;
    }
  }

  playFootstep(isRunning: boolean, isCrouching: boolean) {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    const bufferSize = this.ctx.sampleRate * 0.05; // Shorter
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for(let i=0; i<bufferSize; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = isRunning ? 400 : (isCrouching ? 100 : 200);

    const gain = this.ctx.createGain();
    const volume = isRunning ? 0.4 : (isCrouching ? 0.05 : 0.2);
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(t);
  }

  playGlitch() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.linearRampToValueAtTime(1000, t + 0.2);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.2);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  playPickup() {
      this.playDing();
  }

  playGeneratorStart() {
      this.playGlitch();
  }

  playHeartbeat(bpm: number) {
      this.init();
      if (!this.ctx || !this.masterGain) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(60, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.1);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.8, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.1);
  }

  playThermalToggle() {
      this.playUiClick();
  }

  playWhisper() {
      // White noise burst
      this.init();
      if(!this.ctx || !this.masterGain) return;
      const t = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 1.0;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.1, t+0.5);
      gain.gain.linearRampToValueAtTime(0, t+1);
      noise.connect(gain);
      gain.connect(this.masterGain);
      noise.start(t);
  }

  playProximityStatic(intensity: number) {
      this.playHDDNoise();
  }
}

export const audioService = new AudioService();