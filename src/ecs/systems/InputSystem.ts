import { System } from '../SystemManager';
import { Ingredient, Recipe } from '../types';

export default class InputSystem extends System {
    private scene: Phaser.Scene;
    private inventorySystem: any;
    private synthesisSystem: any;
    private uiEventSystem: any;

    constructor(scene: Phaser.Scene, inventorySystem: any, synthesisSystem: any, uiEventSystem: any) {
        super();
        this.scene = scene;
        this.inventorySystem = inventorySystem;
        this.synthesisSystem = synthesisSystem;
        this.uiEventSystem = uiEventSystem;
    }

    update(deltaTime: number): void {
        // Input system doesn't need regular updates
    }

    setupBuyButton(item: Ingredient, buyBtn: Phaser.GameObjects.Text): void {
        buyBtn.setInteractive()
            .on('pointerdown', () => {
                this.inventorySystem.addItem(item.id, 1);
                this.uiEventSystem.updateStockText(item.id);
            });
    }

    setupCraftButton(recipe: Recipe, craftBtn: Phaser.GameObjects.Text): void {
        craftBtn.setInteractive()
            .on('pointerdown', () => {
                if (this.synthesisSystem.canCraft(recipe)) {
                    this.synthesisSystem.craft(recipe);
                    this.uiEventSystem.updateAllStockTexts(this.getIngredients());
                    this.uiEventSystem.updatePerfumeTexts();
                    this.uiEventSystem.showMessage(`${recipe.name} crafted!`, 'success');
                } else {
                    this.uiEventSystem.showMessage(`Not enough ingredients for ${recipe.name}`, 'error');
                }
            });
    }

    private getIngredients(): Ingredient[] {
        return [];
    }
}


