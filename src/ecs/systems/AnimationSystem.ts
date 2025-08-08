import { System } from '../SystemManager';

export default class AnimationSystem extends System {
    private scene: Phaser.Scene;

    constructor(scene: Phaser.Scene) {
        super();
        this.scene = scene;
    }

    update(deltaTime: number): void {
        // 系统更新逻辑（如果需要的话）
    }

    fadeInOut(target: any, duration: number = 300, hold: number = 1000): void {
        this.scene.tweens.add({
            targets: target,
            alpha: 1,
            duration: duration,
            yoyo: true,
            hold: hold,
            ease: "Power1"
        });
    }

    scalePulse(target: any, scale: number = 1.1, duration: number = 200): void {
        this.scene.tweens.add({
            targets: target,
            scaleX: scale,
            scaleY: scale,
            duration: duration,
            yoyo: true,
            ease: "Power1"
        });
    }

    slideIn(target: any, fromX: number, toX: number, duration: number = 500): void {
        target.setPosition(fromX, target.y);
        this.scene.tweens.add({
            targets: target,
            x: toX,
            duration: duration,
            ease: "Power2"
        });
    }

    bounce(target: any, duration: number = 300): void {
        this.scene.tweens.add({
            targets: target,
            y: target.y - 10,
            duration: duration,
            yoyo: true,
            ease: "Bounce"
        });
    }
}


