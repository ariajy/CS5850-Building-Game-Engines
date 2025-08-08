import { System } from '../SystemManager';
import { Ingredient } from '../types';

export default class UIEventSystem extends System {
    private scene: Phaser.Scene;
    private stockTexts: Record<string, Phaser.GameObjects.Text> = {};
    private perfumeStockTexts: Record<string, Phaser.GameObjects.Text> = {};
    private inventorySystem: any;

    constructor(scene: Phaser.Scene, inventorySystem: any) {
        super();
        this.scene = scene;
        this.inventorySystem = inventorySystem;
    }

    update(deltaTime: number): void {
    }

    setStockTexts(stockTexts: Record<string, Phaser.GameObjects.Text>): void {
        this.stockTexts = stockTexts;
    }

    setPerfumeTexts(perfumeTexts: Record<string, Phaser.GameObjects.Text>): void {
        this.perfumeStockTexts = perfumeTexts;
    }

    updateStockText(id: string): void {
        const quantity = this.inventorySystem.getQuantity(id);
        const textObj = this.stockTexts[id];
        if (textObj) {
            this.stockTexts[id].setText(`Stock: ${quantity}`);
        }
    }

    updatePerfumeTexts(): void {
        Object.entries(this.perfumeStockTexts).forEach(([name, textObj]) => {
            textObj.setText(`Owned: ${this.inventorySystem.getPerfumeQuantity(name)}`);
        });
    }

    updateAllStockTexts(ingredients: Ingredient[]): void {
        ingredients.forEach((item: Ingredient) => {
            this.updateStockText(item.id);
        });
    }

    showMessage(text: string, type: "success" | "error"): void {
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
}


