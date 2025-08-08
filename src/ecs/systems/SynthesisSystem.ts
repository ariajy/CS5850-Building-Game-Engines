import { System } from '../SystemManager';
import { Recipe } from '../types';

export default class SynthesisSystem extends System {
    private inventorySystem: any;

    constructor(inventorySystem: any) {
        super();
        this.inventorySystem = inventorySystem;
    }

    update(deltaTime: number): void {
    }

    canCraft(recipe: Recipe): boolean {
        return Object.entries(recipe.ingredients).every(
            ([id, qty]) => this.inventorySystem.getQuantity(id) >= qty
        );
    }
    
    craft(recipe: Recipe): boolean {
        if (!this.canCraft(recipe)) {
            return false;
        }

        Object.entries(recipe.ingredients).forEach(([id, qty]) => {
            this.inventorySystem.removeItem(id, qty);
        });
        this.inventorySystem.addPerfume(recipe.name, 1);
        return true;
    }
}

