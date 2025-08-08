import { System } from '../SystemManager';

export default class AudioSystem extends System {
    private scene: Phaser.Scene;
    private sounds: Map<string, Phaser.Sound.BaseSound> = new Map();
    private backgroundMusic?: Phaser.Sound.BaseSound;
    private isMuted: boolean = false;
    private musicVolume: number = 0.7;
    private sfxVolume: number = 0.3;

    constructor(scene: Phaser.Scene) {
        super();
        this.scene = scene;
    }

    update(deltaTime: number): void {
        // Audio system doesn't need regular updates
    }

    /**
     * preload all audio files
     */
    preloadAudio(): void {
        // Background music
        this.scene.load.audio('background_music', './src/assets/audio/background.wav');
        
        // Sound effects
        this.scene.load.audio('click_sound', './src/assets/audio/click.wav');
        this.scene.load.audio('success_sound', './src/assets/audio/success.wav');
        this.scene.load.audio('fail_sound', './src/assets/audio/fail.wav');
        this.scene.load.audio('cha_ching', './src/assets/audio/cha-ching.wav');
        this.scene.load.audio('win_music', './src/assets/audio/win.mp3');
    }

    /**
     * create all audio objects
     */
    createAudio(): void {
        // Create background music
        this.backgroundMusic = this.scene.sound.add('background_music', {
            volume: this.musicVolume,
            loop: true
        });

        // Create sound effects
        this.sounds.set('click', this.scene.sound.add('click_sound', { volume: this.sfxVolume }));
        this.sounds.set('success', this.scene.sound.add('success_sound', { volume: this.sfxVolume }));
        this.sounds.set('fail', this.scene.sound.add('fail_sound', { volume: this.sfxVolume }));
        this.sounds.set('cha_ching', this.scene.sound.add('cha_ching', { volume: this.sfxVolume }));
        this.sounds.set('win', this.scene.sound.add('win_music', { volume: this.musicVolume }));
    }

    /**
     * play background music
     */
    playBackgroundMusic(): void {
        if (this.backgroundMusic && !this.backgroundMusic.isPlaying && !this.isMuted) {
            this.backgroundMusic.play();
        }
    }

    /**
     * stop background music
     */
    stopBackgroundMusic(): void {
        if (this.backgroundMusic && this.backgroundMusic.isPlaying) {
            this.backgroundMusic.stop();
        }
    }

    /**
     * play click sound
     */
    playClickSound(): void {
        this.playSound('click');
    }

    /**
     * play success sound
     */
    playSuccessSound(): void {
        this.playSound('success');
    }

    /**
     * play fail sound
     */
    playFailSound(): void {
        this.playSound('fail');
    }

    /**
     * play money sound
     */
    playMoneySound(): void {
        this.playSound('cha_ching');
    }

    /**
     * play win music
     */
    playWinMusic(): void {
        this.stopBackgroundMusic();
        this.playSound('win');
    }

    /**
     * play specified sound effect
     */
    private playSound(soundKey: string): void {
        if (this.isMuted) return;
        
        const sound = this.sounds.get(soundKey);
        if (sound) {
            sound.play();
        }
    }

    /**
     * toggle mute state
     */
    toggleMute(): void {
        this.isMuted = !this.isMuted;
        
        if (this.isMuted) {
            this.stopBackgroundMusic();
            this.sounds.forEach(sound => {
                if (sound.isPlaying) {
                    sound.stop();
                }
            });
        } else {
            this.playBackgroundMusic();
        }
    }

    /**
     * set music volume
     */
    setMusicVolume(volume: number): void {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.backgroundMusic) {
            (this.backgroundMusic as any).setVolume(this.musicVolume);
        }
        
        const winSound = this.sounds.get('win');
        if (winSound) {
            (winSound as any).setVolume(this.musicVolume);
        }
    }

    /**
     * set sfx volume
     */
    setSfxVolume(volume: number): void {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        this.sounds.forEach((sound, key) => {
            if (key !== 'win') { // win music uses music volume
                (sound as any).setVolume(this.sfxVolume);
            }
        });
    }

    /**
     * get current music volume
     */
    getMusicVolume(): number {
        return this.musicVolume;
    }

    /**
     * get current sfx volume
     */
    getSfxVolume(): number {
        return this.sfxVolume;
    }

    /**
     * get current mute state
     */
    getIsMuted(): boolean {
        return this.isMuted;
    }

    /**
     * stop all sounds
     */
    stopAllSounds(): void {
        this.stopBackgroundMusic();
        this.sounds.forEach(sound => {
            if (sound.isPlaying) {
                sound.stop();
            }
        });
    }

    /**
     * destroy audio system
     */
    destroy(): void {
        this.stopAllSounds();
        this.sounds.clear();
        this.backgroundMusic = undefined;
    }
}
