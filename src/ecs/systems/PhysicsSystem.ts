import { System } from '../SystemManager';
import { Ingredient } from '../types';

export class PhysicsSystem extends System {
    private scene: Phaser.Scene;
    private cauldronX: number = 400;
    private cauldronY: number = 350;
    private cauldronRadius: number = 80;

    constructor(scene: Phaser.Scene) {
        super();
        this.scene = scene;
    }

    // Set cauldron area
    public setCauldronArea(x: number, y: number, radius: number): void {
        this.cauldronX = x;
        this.cauldronY = y;
        this.cauldronRadius = radius;
    }

    // Fly bottle to cauldron
    public flyBottleToCauldron(bottle: Phaser.GameObjects.Image, ingredient: Ingredient, onComplete: () => void): void {
        const startX = bottle.x;
        const startY = bottle.y;

        // Calculate flight path - use parabolic effect
        const midX = (startX + this.cauldronX) / 2;
        const midY = Math.min(startY, this.cauldronY) - 100; // 中间点往上

        // create parabolic flight
        this.createParabolicFlight(bottle, startX, startY, midX, midY, this.cauldronX, this.cauldronY, onComplete);
    }

    // Create parabolic flight animation
    private createParabolicFlight(
        bottle: Phaser.GameObjects.Image, 
        startX: number, startY: number,
        midX: number, midY: number,
        endX: number, endY: number,
        onComplete: () => void
    ): void {
        // flight to mid point
        this.scene.tweens.add({
            targets: bottle,
            x: midX,
            y: midY,
            duration: 400,
            ease: 'Power2.out',
            onComplete: () => {
                // flight from high point to cauldron
                this.scene.tweens.add({
                    targets: bottle,
                    x: endX,
                    y: endY,
                    duration: 300,
                    ease: 'Power2.in',
                    onComplete: () => {
                        // add splash effect
                        this.createSplashEffect(endX, endY);
                        onComplete();
                    }
                });
            }
        });

        // Add rotation animation
        this.scene.tweens.add({
            targets: bottle,
            rotation: Math.PI * 2,
            duration: 700,
            ease: 'Linear'
        });

        // Add scale animation (zoom in effect)
        this.scene.tweens.add({
            targets: bottle,
            scaleX: 0.2,
            scaleY: 0.2,
            duration: 700,
            ease: 'Power2'
        });
    }

    // Create splash effect
    private createSplashEffect(x: number, y: number): void {
        // Create several small circles as splash effect
        for (let i = 0; i < 6; i++) {
            const splash = this.scene.add.circle(x, y, 3, 0x87CEEB, 0.8)
                .setDepth(99);

            const angle = (Math.PI * 2 / 6) * i;
            const distance = 20 + Math.random() * 20;
            const targetX = x + Math.cos(angle) * distance;
            const targetY = y + Math.sin(angle) * distance;

            this.scene.tweens.add({
                targets: splash,
                x: targetX,
                y: targetY,
                alpha: 0,
                duration: 300 + Math.random() * 200,
                ease: 'Power2.out',
                onComplete: () => splash.destroy()
            });
        }

        // Add bubble effect
        this.createBubbleEffect(x, y);
    }

    // Create bubble effect
    private createBubbleEffect(x: number, y: number): void {
        const bubble = this.scene.add.circle(x, y, 8, 0xFFFFFF, 0.6)
            .setDepth(98);

        this.scene.tweens.add({
            targets: bubble,
            y: y - 30,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 0,
            duration: 500,
            ease: 'Power1.out',
            onComplete: () => bubble.destroy()
        });
    }

    // Check if point is within cauldron area
    public isInCauldron(x: number, y: number): boolean {
        const distance = Phaser.Math.Distance.Between(x, y, this.cauldronX, this.cauldronY);
        return distance <= this.cauldronRadius;
    }

    // Calculate distance between two points
    public getDistance(x1: number, y1: number, x2: number, y2: number): number {
        return Phaser.Math.Distance.Between(x1, y1, x2, y2);
    }

    // Create gravity effect (if needed for other objects to fall)
    public applyGravity(gameObject: Phaser.GameObjects.GameObject, targetY: number, callback?: () => void): void {
        this.scene.tweens.add({
            targets: gameObject,
            y: targetY,
            duration: 500,
            ease: 'Bounce.out',
            onComplete: callback
        });
    }

    // Add shake effect (e.g. when cauldron is finished)
    public shake(gameObject: Phaser.GameObjects.GameObject, intensity: number = 5, duration: number = 300): void {
        const positionableObject = gameObject as any; // Type assertion, since we know the passed object has position properties
        const originalX = positionableObject.x;
        const originalY = positionableObject.y;

        this.scene.tweens.add({
            targets: gameObject,
            x: originalX + intensity,
            duration: 50,
            yoyo: true,
            repeat: duration / 100,
            ease: 'Power2',
            onComplete: () => {
                positionableObject.setPosition(originalX, originalY);
            }
        });
    }

    update(deltaTime: number): void {
    }

    // Get cauldron information (for other systems to use)
    public getCauldronInfo(): { x: number, y: number, radius: number } {
        return {
            x: this.cauldronX,
            y: this.cauldronY,
            radius: this.cauldronRadius
        };
    }
}