import Phaser from 'phaser'
import ShopScene from './scenes/ShopScene'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: '100%',
  height: '100%',
  parent: 'game-container', // 可选：用于将 canvas 添加到特定 DOM 容器
  scene: [ShopScene]
}
new Phaser.Game(config)
