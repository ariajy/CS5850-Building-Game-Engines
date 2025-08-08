import Phaser from 'phaser'
import { EconomySystem } from '../ecs/systems/EconomySystem'
import AudioSystem from '../ecs/systems/AudioSystem'

export class HUD {
  private scene: Phaser.Scene
  private economy: EconomySystem
  private audioSystem?: AudioSystem
  private goldText!: Phaser.GameObjects.Text
  private muteButton?: Phaser.GameObjects.Text

  constructor(scene: Phaser.Scene, economySystem: EconomySystem, audioSystem?: AudioSystem) {
    this.scene = scene
    this.economy = economySystem
    this.audioSystem = audioSystem

    this.createGoldDisplay()
    if (this.audioSystem) {
      this.createSoundControls()
    }
  }

  private createGoldDisplay() {
    const gold = this.economy.getGold()
    const target = this.economy.getTarget()

    this.goldText = this.scene.add.text(1050, 20, `Gold: ${gold}/${target}`, {
      fontSize: '24px',
      color: '#FFD700',
      fontStyle: 'bold',
      padding: { x: 10, y: 5 }
    }).setScrollFactor(0)

    this.economy.setOnGoldChange((newGold: number) => {
      const target = this.economy.getTarget()
      this.goldText.setText(`Gold: ${newGold}/${target}`)
      
      if (newGold >= target) {
        this.goldText.setColor('#2d8659')
      } else if (newGold >= target * 0.8) {
        this.goldText.setColor('#DAA520')
        this.goldText.setColor('#FFD700')
      }
    })
  }

  private createSoundControls() {
    if (!this.audioSystem) return;

    this.muteButton = this.scene.add.text(20, 20, '🔊', {
      fontSize: '32px',
      color: '#FFD700',
      padding: { x: 5, y: 5 }
    })
    .setScrollFactor(0)
    .setInteractive()
    .on('pointerdown', () => {
      if (this.audioSystem) {
        this.audioSystem.toggleMute();
        this.updateMuteButton();
      }
    })
    .on('pointerover', () => {
      if (this.muteButton) {
        this.muteButton.setScale(1.2);
      }
    })
    .on('pointerout', () => {
      if (this.muteButton) {
        this.muteButton.setScale(1);
      }
    });

    this.updateMuteButton();
  }

  private updateMuteButton() {
    if (!this.muteButton || !this.audioSystem) return;
    
    if (this.audioSystem.getIsMuted()) {
      this.muteButton.setText('🔇');
      this.muteButton.setColor('#888888');
    } else {
      this.muteButton.setText('🔊');
      this.muteButton.setColor('#FFD700');
    }
  }
}
