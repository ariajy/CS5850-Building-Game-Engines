import { System } from '../SystemManager';
import { Ingredient, Recipe } from '../types';
import { EntityManager } from '../EntityManager';

export default class RenderSystem extends System {
    private scene: Phaser.Scene;
    private entityManager: EntityManager;
    private customerTexts: Map<string, Phaser.GameObjects.Text> = new Map();
    private customerIndexMap: Map<string, number> = new Map();
    private removingCustomers: Set<string> = new Set();
    private currentMessages: Record<string, Phaser.GameObjects.Text> = {};

    constructor(scene: Phaser.Scene, entityManager: EntityManager) {
        super();
        this.scene = scene;
        this.entityManager = entityManager;
    }

    update(deltaTime: number): void {
        const allEntities = this.entityManager.getAllEntities();

        this.cleanupRemovedCustomers();
        
        allEntities.forEach((entity, entityId) => {
            if (entityId.startsWith('customer_') && !this.removingCustomers.has(entityId)) {
                this.renderNarrativeCustomer(entity, entityId);
            }
        });
    }

    private cleanupRemovedCustomers(): void {
        const allEntities = this.entityManager.getAllEntities();
        const existingCustomerIds = new Set<string>();
        
        allEntities.forEach((entity, entityId) => {
            if (entityId.startsWith('customer_')) {
                existingCustomerIds.add(entityId);
            }
        });

        this.customerTexts.forEach((text, customerId) => {
            if (!existingCustomerIds.has(customerId) && !this.removingCustomers.has(customerId)) {
                text.destroy();
                this.customerTexts.delete(customerId);
                this.customerIndexMap.delete(customerId);
            }
        });

        this.reindexCustomers();
    }

    private reindexCustomers(): void {
        const activeCustomers = Array.from(this.customerTexts.keys())
            .filter(id => !this.removingCustomers.has(id))
            .sort();

        this.customerIndexMap.clear();

        activeCustomers.forEach((customerId, newIndex) => {
            this.customerIndexMap.set(customerId, newIndex);
            const customerText = this.customerTexts.get(customerId);
            const entity = this.entityManager.getEntity(customerId);
            
            if (customerText && entity) {
                const positionComponent = entity.components.get("PositionComponent");
                if (positionComponent) {
                    const x = positionComponent.x;
                    const y = positionComponent.y + newIndex * 80;

                    this.scene.tweens.add({
                        targets: customerText,
                        x: x,
                        y: y,
                        duration: 800,
                        ease: 'Power1.easeInOut'
                    });
                }
            }
        });
    }

    fadeOutCustomer(customerId: string, onComplete: () => void): void {
        const customerText = this.customerTexts.get(customerId);
        
        if (!customerText) {
            onComplete();
            return;
        }

        this.removingCustomers.add(customerId);

        this.scene.tweens.add({
            targets: customerText,
            alpha: 0,
            y: customerText.y - 20,
            duration: 500,
            ease: 'Power1.easeOut',
            onComplete: () => {
                customerText.destroy();
                this.customerTexts.delete(customerId);
                this.customerIndexMap.delete(customerId);
                this.removingCustomers.delete(customerId);
                
                this.reindexCustomers();
                onComplete();
            }
        });
    }

    private renderNarrativeCustomer(entity: any, entityId: string): void {
        const customerComponent = entity.components.get("CustomerComponent");
        const orderComponent = entity.components.get("OrderComponent");
        const positionComponent = entity.components.get("PositionComponent");

        if (!customerComponent || !orderComponent || !positionComponent) return;

        let index = this.customerIndexMap.get(entityId);
        if (index === undefined) {
            index = this.customerIndexMap.size;
            this.customerIndexMap.set(entityId, index);
        }
        
        const x = positionComponent.x;
        const y = positionComponent.y + index * 80;

        let customerText = this.customerTexts.get(entityId);
        if (!customerText) {
            const storyText = orderComponent.narrative || "I'm looking for something special today...";
            
            customerText = this.scene.add.text(
                x,
                y,
                storyText,
                {
                    fontSize: "16px",
                    color: "#4a4a4a",
                    fontFamily: "Georgia, serif",
                    lineSpacing: 4,
                    wordWrap: {
                        width: 280,
                        useAdvancedWrap: true
                    },
                    padding: { x: 12, y: 8 },
                }
            ).setDepth(5).setAlpha(0);

            this.scene.tweens.add({
                targets: customerText,
                alpha: 1,
                y: customerText.y + 10,
                duration: 400,
                ease: 'Power1.easeOut'
            });

            this.customerTexts.set(entityId, customerText);
        }
    }

    public showWarmFeedback(message: string, type: 'success' | 'gentle' | 'experiment' = 'success'): void {
        if (this.currentMessages[type]) {
            this.currentMessages[type].destroy();
            delete this.currentMessages[type];
        }

        const colors = {
            success: "#2d8659",
            gentle: "#8b6f47",
            experiment: "#7a6b8f"
        };

        const yPositions = {
            success: 60,
            experiment: 100,
            gentle: 140
        };
        const yPosition = yPositions[type];

        const feedbackText = this.scene.add.text(
            this.scene.cameras.main.centerX,
            yPosition,
            message,
            {
                fontSize: "18px",
                color: colors[type],
                fontFamily: "Georgia, serif",
                align: 'center',
                wordWrap: {
                    width: 400,
                    useAdvancedWrap: true
                },
                padding: { x: 16, y: 12 },
            }
        ).setOrigin(0.5).setAlpha(0).setDepth(100);

        this.currentMessages[type] = feedbackText;

        this.scene.tweens.add({
            targets: feedbackText,
            alpha: 1,
            y: feedbackText.y + 15,
            duration: 800,
            ease: 'Power1.easeOut',
            onComplete: () => {
                this.scene.time.delayedCall(3000, () => {
                    this.scene.tweens.add({
                        targets: feedbackText,
                        alpha: 0,
                        y: feedbackText.y - 10,
                        duration: 800,
                        ease: 'Power1.easeIn',
                        onComplete: () => {
                            feedbackText.destroy();
                            if (this.currentMessages[type] === feedbackText) {
                                delete this.currentMessages[type];
                            }
                        }
                    });
                });
            }
        });
    }

    renderIngredients(ingredients: Ingredient[]): Record<string, Phaser.GameObjects.Text> {
        return {};
    }

    renderRecipes(recipes: Recipe[]): Record<string, Phaser.GameObjects.Text> {
        return {};
    }

    getStockTexts(): Record<string, Phaser.GameObjects.Text> {
        return {};
    }

    getPerfumeTexts(): Record<string, Phaser.GameObjects.Text> {
        return {};
    }
}