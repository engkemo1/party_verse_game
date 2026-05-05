class AudioEngine {
  constructor() {
    this.music = null;
    this.enabled = true;
    this.currentMood = null;
    this.sfxMap = {
      round_start: "https://www.soundjay.com/buttons/sounds/button-2.mp3",
      correct: "https://www.soundjay.com/buttons/sounds/button-3.mp3",
      wrong: "https://www.soundjay.com/buttons/sounds/button-10.mp3",
      glitch: "https://www.soundjay.com/buttons/sounds/button-37.mp3",
    };
  }

  playSFX(name) {
    if (!this.enabled) return;
    try {
      const url = this.sfxMap[name] || `/sounds/sfx/${name}.mp3`;
      const audio = new Audio(url);
      audio.volume = 0.8;
      audio.play().catch(e => {});
    } catch (e) {}
  }

  playMusic(mood) {
    if (!this.enabled || this.currentMood === mood) return;
    
    if (this.music) {
      this.music.pause();
      this.music = null;
    }

    const musicMap = {
      lobby: "http://codeskulptor-demos.commondatastorage.googleapis.com/descent/background%20music.mp3",
      playing: "http://codeskulptor-demos.commondatastorage.googleapis.com/GalaxyInvaders/theme_01.mp3",
      final: "http://codeskulptor-demos.commondatastorage.googleapis.com/descent/got_item.mp3"
    };

    try {
      this.currentMood = mood;
      this.music = new Audio(musicMap[mood]);
      this.music.loop = true;
      this.music.volume = 0.25; // Slightly lower volume
      this.music.play().catch(e => {
        if (e.name !== 'AbortError') console.warn("Music play failed:", e);
      });
    } catch (e) {
      this.currentMood = null;
    }
  }

  stopMusic() {
    if (this.music) {
      this.music.pause();
      this.music = null;
    }
  }

  toggle(val) {
    this.enabled = val;
    if (!val) this.stopMusic();
  }
}

export const audioEngine = new AudioEngine();
