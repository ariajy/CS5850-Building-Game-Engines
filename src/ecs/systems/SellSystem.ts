import { System } from '../SystemManager';
import { EntityManager } from '../EntityManager';
import { OrderComponent } from '../components/OrderComponent';
import { EconomySystem } from './EconomySystem';
import InventorySystem from './InventorySystem';
import AudioSystem from './AudioSystem';

export class SellSystem extends System {
    private scene: Phaser.Scene;
    private entityManager: EntityManager;
    private economySystem: EconomySystem;
    private inventorySystem: InventorySystem;
    private audioSystem?: AudioSystem;
    private dragSystem: any;

    private readonly ORDER_AREA = {
        x: 800,
        y: 100,
        width: 300,
        height: 400
    };

    constructor(
        scene: Phaser.Scene, 
        entityManager: EntityManager, 
        economySystem: EconomySystem,
        inventorySystem: InventorySystem
    ) {
        super();
        this.scene = scene;
        this.entityManager = entityManager;
        this.economySystem = economySystem;
        this.inventorySystem = inventorySystem;

        this.scene.events.on('dragEnd', this.handleDragEnd, this);
    }

    setAudioSystem(audioSystem: AudioSystem): void {
        this.audioSystem = audioSystem;
    }

    setDragSystem(dragSystem: any): void {
        this.dragSystem = dragSystem;
    }

    private handleDragEnd(event: { entityId: string; perfumeName: string; position: { x: number; y: number } }): void {
        const { entityId, perfumeName, position } = event;

        if (this.isInOrderArea(position)) {
            const matchingCustomer = this.findMatchingOrder(perfumeName);
            
            if (matchingCustomer) {
                this.completeSale(matchingCustomer, perfumeName, entityId);
            } else {
                const anyCustomer = this.findAnyWaitingCustomer();
                if (anyCustomer) {
                    this.handleWrongPerfume(anyCustomer, perfumeName, entityId);
                } else {
                    this.showMessage("No customer wants this perfume!", "error");
                    if (this.dragSystem) {
                        this.dragSystem.cancelDrop(entityId);
                    }
                }
            }
        } else {
            if (this.dragSystem) {
                this.dragSystem.cancelDrop(entityId);
            }
        }
    }

    private isInOrderArea(position: { x: number; y: number }): boolean {
        return position.x >= this.ORDER_AREA.x &&
               position.x <= this.ORDER_AREA.x + this.ORDER_AREA.width &&
               position.y >= this.ORDER_AREA.y &&
               position.y <= this.ORDER_AREA.y + this.ORDER_AREA.height;
    }

    private findMatchingOrder(perfumeName: string): string | null {
        const customers = this.entityManager.getEntitiesWithComponent('OrderComponent');
        
        for (const customerId of customers) {
            const entity = this.entityManager.getEntity(customerId);
            if (!entity) continue;

            const order = entity.components.get('OrderComponent') as OrderComponent;
            if (order && order.perfumeName === perfumeName && order.status === 'pending') {
                return customerId;
            }
        }
        
        return null;
    }

    private findAnyWaitingCustomer(): string | null {
        const customers = this.entityManager.getEntitiesWithComponent('OrderComponent');
        
        for (const customerId of customers) {
            const entity = this.entityManager.getEntity(customerId);
            if (!entity) continue;

            const order = entity.components.get('OrderComponent') as OrderComponent;
            if (order && order.status === 'pending') {
                return customerId;
            }
        }
        
        return null;
    }

    private handleWrongPerfume(customerId: string, perfumeName: string, draggedEntityId: string): void {
        const disappointmentMessages = [
            "Oh, this isn't what I ordered... but thank you for trying!",
            "Hmm, this is lovely but not quite what I need today.",
            "I appreciate the effort, but I was hoping for something different.",
            "This smells nice, but it's not what I requested.",
            "Thank you, but this isn't the perfume I was looking for."
        ];

        const randomMessage = disappointmentMessages[Math.floor(Math.random() * disappointmentMessages.length)];
        this.showGentleMessage(randomMessage);

        if (this.dragSystem) {
            this.dragSystem.confirmDrop(draggedEntityId);
        }

        this.entityManager.removeEntity(customerId);

        this.inventorySystem.removePerfume(perfumeName, 1);

        this.scene.events.emit('inventoryChanged');
    }

    private completeSale(customerId: string, perfumeName: string, draggedEntityId: string): void {
        if (this.inventorySystem.getPerfumeQuantity(perfumeName) <= 0) {
            this.showMessage("No perfume in stock!", "error");
            if (this.dragSystem) {
                this.dragSystem.cancelDrop(draggedEntityId);
            }
            return;
        }

        if (!this.inventorySystem.removePerfume(perfumeName, 1)) {
            this.showMessage("Failed to remove from inventory!", "error");
            if (this.dragSystem) {
                this.dragSystem.cancelDrop(draggedEntityId);
            }
            return;
        }

        const salePrice = 20;
        this.economySystem.addGold(salePrice, `Sold ${perfumeName}`);

        if (this.audioSystem) {
            this.audioSystem.playMoneySound();
        }

        this.showMoneyAnimation(salePrice);

        const entity = this.entityManager.getEntity(customerId);
        if (entity) {
            const order = entity.components.get('OrderComponent') as OrderComponent;
            if (order) {
                order.status = 'completed';
            }
        }

        if (this.dragSystem) {
            this.dragSystem.confirmDrop(draggedEntityId);
        }

        this.entityManager.removeEntity(customerId);

        this.scene.events.emit('inventoryChanged');
    }

    private showMessage(text: string, type: "success" | "error"): void {
        const color = type === "success" ? "#00ff00" : "#ff0000";
        const message = this.scene.add.text(this.scene.cameras.main.centerX, 50, text, {
            fontSize: "24px",
            color,
        }).setOrigin(0.5).setAlpha(0);

        this.scene.tweens.add({
            targets: message,
            alpha: 1,
            duration: 300,
            yoyo: true,
            hold: 1000,
            ease: "Power1",
            onComplete: () => message.destroy()
        });
    }

    private showGentleMessage(text: string): void {
        const message = this.scene.add.text(this.scene.cameras.main.centerX, 160, text, {
            fontSize: "16px",
            color: "#8b6f47",
            fontFamily: "Georgia, serif",
            align: 'center',
            wordWrap: { width: 400 },
            padding: { x: 12, y: 8 }
        }).setOrigin(0.5).setAlpha(0);

        this.scene.tweens.add({
            targets: message,
            alpha: 1,
            y: message.y + 10,
            duration: 800,
            ease: "Power1.easeOut",
            onComplete: () => {
                this.scene.time.delayedCall(3000, () => {
                    this.scene.tweens.add({
                        targets: message,
                        alpha: 0,
                        duration: 800,
                        onComplete: () => message.destroy()
                    });
                });
            }
        });
    }

    private showMoneyAnimation(amount: number): void {
        const startX = this.scene.cameras.main.width - 120;
        const startY = 60;

        const moneyText = this.scene.add.text(startX, startY, `+${amount} gold`, {
            fontSize: "20px",
            color: "#FFD700",
            fontFamily: "Arial Black",
            fontStyle: "bold",
            strokeThickness: 2
        }).setOrigin(0.5).setAlpha(0);

        const coinEffect = this.scene.add.circle(startX - 30, startY, 4, 0xFFD700)
            .setAlpha(0);

        this.scene.tweens.add({
            targets: moneyText,
            alpha: 1,
            scaleX: 1.2,
            scaleY: 1.2,
            y: startY - 30,
            duration: 800,
            ease: "Back.easeOut",
            onComplete: () => {
                this.scene.tweens.add({
                    targets: moneyText,
                    alpha: 0,
                    y: moneyText.y - 20,
                    duration: 600,
                    ease: "Power1.easeIn",
                    onComplete: () => moneyText.destroy()
                });
            }
        });

        this.scene.tweens.add({
            targets: coinEffect,
            alpha: 0.8,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 400,
            ease: "Power2.easeOut",
            onComplete: () => {
                this.scene.tweens.add({
                    targets: coinEffect,
                    alpha: 0,
                    scaleX: 0.5,
                    scaleY: 0.5,
                    duration: 400,
                    ease: "Power2.easeIn",
                    onComplete: () => coinEffect.destroy()
                });
            }
        });
    }

    update(deltaTime: number): void {
    }
}