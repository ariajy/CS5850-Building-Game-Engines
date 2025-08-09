import AudioSystem from '../src/ecs/systems/AudioSystem';

// Mock Phaser scene for testing
const mockScene = {
  load: {
    audio: jest.fn(),
  },
  sound: {
    add: jest.fn().mockReturnValue({
      play: jest.fn(),
      stop: jest.fn(),
      setVolume: jest.fn(),
      setMute: jest.fn(),
      isPlaying: false,
    }),
  },
} as any;

describe('AudioSystem', () => {
  let audioSystem: AudioSystem;

  beforeEach(() => {
    jest.clearAllMocks();
    audioSystem = new AudioSystem(mockScene);
  });

  describe('Audio Preloading', () => {
    test('should preload all audio files', () => {
      audioSystem.preloadAudio();
      
      expect(mockScene.load.audio).toHaveBeenCalledWith('background_music', './src/assets/audio/background.wav');
      expect(mockScene.load.audio).toHaveBeenCalledWith('click_sound', './src/assets/audio/click.wav');
      expect(mockScene.load.audio).toHaveBeenCalledWith('success_sound', './src/assets/audio/success.wav');
      expect(mockScene.load.audio).toHaveBeenCalledWith('fail_sound', './src/assets/audio/fail.wav');
      expect(mockScene.load.audio).toHaveBeenCalledWith('cha_ching', './src/assets/audio/cha-ching.wav');
      expect(mockScene.load.audio).toHaveBeenCalledWith('win_music', './src/assets/audio/win.mp3');
    });

    test('should call scene load audio for each sound type', () => {
      audioSystem.preloadAudio();
      
      expect(mockScene.load.audio).toHaveBeenCalledTimes(6);
    });
  });

  describe('Audio Creation', () => {
    test('should create audio objects when createAudio is called', () => {
      audioSystem.createAudio();
      
      expect(mockScene.sound.add).toHaveBeenCalledWith('background_music', { loop: true, volume: 0.7 });
      expect(mockScene.sound.add).toHaveBeenCalledWith('click_sound', { volume: 0.3 });
      expect(mockScene.sound.add).toHaveBeenCalledWith('success_sound', { volume: 0.3 });
      expect(mockScene.sound.add).toHaveBeenCalledWith('fail_sound', { volume: 0.3 });
      expect(mockScene.sound.add).toHaveBeenCalledWith('cha_ching', { volume: 0.3 });
      expect(mockScene.sound.add).toHaveBeenCalledWith('win_music', { volume: 0.7 });
    });

    test('should handle createAudio being called multiple times', () => {
      audioSystem.createAudio();
      audioSystem.createAudio();
      
      // Should still only create audio objects once per call
      expect(mockScene.sound.add).toHaveBeenCalledTimes(12); // 6 sounds × 2 calls
    });
  });

  describe('Sound Effects', () => {
    beforeEach(() => {
      audioSystem.createAudio();
      jest.clearAllMocks();
    });

    test('should play click sound', () => {
      const mockClickSound = { play: jest.fn() };
      mockScene.sound.add.mockReturnValue(mockClickSound);
      audioSystem.createAudio();
      
      audioSystem.playClickSound();
      
      // Should create new sound object and play it
      expect(mockScene.sound.add).toHaveBeenCalledWith('click_sound', { volume: 0.3 });
      expect(mockClickSound.play).toHaveBeenCalled();
    });

    test('should play success sound', () => {
      const mockSuccessSound = { play: jest.fn() };
      mockScene.sound.add.mockReturnValue(mockSuccessSound);
      audioSystem.createAudio();
      
      audioSystem.playSuccessSound();
      
      expect(mockScene.sound.add).toHaveBeenCalledWith('success_sound', { volume: 0.3 });
      expect(mockSuccessSound.play).toHaveBeenCalled();
    });

    test('should play fail sound', () => {
      const mockFailSound = { play: jest.fn() };
      mockScene.sound.add.mockReturnValue(mockFailSound);
      audioSystem.createAudio();
      
      audioSystem.playFailSound();
      
      expect(mockScene.sound.add).toHaveBeenCalledWith('fail_sound', { volume: 0.3 });
      expect(mockFailSound.play).toHaveBeenCalled();
    });

    test('should play money sound', () => {
      const mockMoneySound = { play: jest.fn() };
      mockScene.sound.add.mockReturnValue(mockMoneySound);
      audioSystem.createAudio();
      
      audioSystem.playMoneySound();
      
      expect(mockScene.sound.add).toHaveBeenCalledWith('cha_ching', { volume: 0.3 });
      expect(mockMoneySound.play).toHaveBeenCalled();
    });

    test('should play win music', () => {
      const mockWinMusic = { play: jest.fn() };
      mockScene.sound.add.mockReturnValue(mockWinMusic);
      audioSystem.createAudio();
      
      audioSystem.playWinMusic();
      
      expect(mockScene.sound.add).toHaveBeenCalledWith('win_music', { volume: 0.7 });
      expect(mockWinMusic.play).toHaveBeenCalled();
    });
  });

  describe('Volume Control', () => {
    test('should get current music volume', () => {
      expect(audioSystem.getMusicVolume()).toBe(0.7);
    });

    test('should get current sfx volume', () => {
      expect(audioSystem.getSfxVolume()).toBe(0.3);
    });

    test('should initialize with default volumes', () => {
      const newAudioSystem = new AudioSystem(mockScene);
      expect(newAudioSystem.getMusicVolume()).toBe(0.7);
      expect(newAudioSystem.getSfxVolume()).toBe(0.3);
    });
  });

  describe('Mute Functionality', () => {
    beforeEach(() => {
      audioSystem.createAudio();
    });

    test('should toggle mute on', () => {
      audioSystem.toggleMute();
      
      expect(audioSystem.getIsMuted()).toBe(true);
    });

    test('should toggle mute off', () => {
      // First toggle to mute
      audioSystem.toggleMute();
      // Second toggle to unmute
      audioSystem.toggleMute();
      
      expect(audioSystem.getIsMuted()).toBe(false);
    });

    test('should initialize as not muted', () => {
      expect(audioSystem.getIsMuted()).toBe(false);
    });

    test('should handle multiple mute toggles', () => {
      audioSystem.toggleMute(); // mute
      audioSystem.toggleMute(); // unmute
      audioSystem.toggleMute(); // mute again
      
      expect(audioSystem.getIsMuted()).toBe(true);
    });
  });

  describe('System Interface', () => {
    test('should run update method without errors', () => {
      expect(() => audioSystem.update(16.67)).not.toThrow();
    });

    test('should maintain audio state during updates', () => {
      audioSystem.setSfxVolume(0.5);
      audioSystem.update(16.67);
      expect(audioSystem.getSfxVolume()).toBe(0.5);
    });

    test('should handle null scene gracefully', () => {
      const nullSceneAudioSystem = new AudioSystem(null as any);
      
      expect(() => nullSceneAudioSystem.preloadAudio()).toThrow();
      expect(() => nullSceneAudioSystem.createAudio()).toThrow();
      expect(() => nullSceneAudioSystem.playClickSound()).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    test('should handle missing background music gracefully', () => {
      (audioSystem as any).backgroundMusic = null;
      
      expect(() => audioSystem.setSfxVolume(0.5)).not.toThrow();
      expect(() => audioSystem.toggleMute()).not.toThrow();
    });

    test('should handle scene sound errors gracefully', () => {
      const errorScene = {
        load: { audio: jest.fn() },
        sound: { add: jest.fn(() => { throw new Error('Sound creation failed'); }) }
      } as any;

      const errorAudioSystem = new AudioSystem(errorScene);
      
      expect(() => errorAudioSystem.createAudio()).toThrow();
      expect(() => errorAudioSystem.playClickSound()).not.toThrow();
    });
  });

  describe('Audio Configuration', () => {
    test('should use correct audio file paths', () => {
      audioSystem.preloadAudio();
      
      const expectedPaths = [
        './src/assets/audio/background.wav',
        './src/assets/audio/click.wav',
        './src/assets/audio/success.wav',
        './src/assets/audio/fail.wav',
        './src/assets/audio/cha-ching.wav',
        './src/assets/audio/win.mp3'
      ];
      
      expectedPaths.forEach(path => {
        expect(mockScene.load.audio).toHaveBeenCalledWith(
          expect.any(String),
          path
        );
      });
    });

    test('should configure background music with correct settings', () => {
      audioSystem.createAudio();
      
      expect(mockScene.sound.add).toHaveBeenCalledWith(
        'background_music',
        { loop: true, volume: 0.7 }
      );
    });

    test('should configure sound effects with appropriate volumes', () => {
      audioSystem.createAudio();
      
      const expectedVolumes = {
        'click_sound': 0.3,
        'success_sound': 0.3,
        'fail_sound': 0.3,
        'cha_ching': 0.3,
        'win_music': 0.7
      };
      
      Object.entries(expectedVolumes).forEach(([soundKey, volume]) => {
        expect(mockScene.sound.add).toHaveBeenCalledWith(
          soundKey,
          { volume }
        );
      });
    });
  });
});
