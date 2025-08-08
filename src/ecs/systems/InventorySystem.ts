import { System } from '../SystemManager';
import { ComponentManager } from '../ComponentManager';

export default class InventorySystem extends System {
    private inventory: Record<string, number>;
    private perfumes: Record<string, number>;
  
    constructor() {
        super();
        this.inventory = {};
        this.perfumes = {};
    }

    update(deltaTime: number): void {
    }
  
    addItem(id: string, quantity: number = 1): void {
        if (this.inventory[id]) {
            this.inventory[id] += quantity;
        } else {
            this.inventory[id] = quantity;
        }
    }

    removeItem(id: string, quantity: number = 1): boolean {
        const current = this.inventory[id] || 0;
        if (current < quantity) return false;
        this.inventory[id] = current - quantity;
        return true;
    }
  
    getQuantity(id: string): number {
        return this.inventory[id] || 0;
    }
  
    getInventory(): Record<string, number> {
        return { ...this.inventory };
    }

    getPerfumes(): Record<string, number> {
        return { ...this.perfumes };
    }

    addPerfume(name: string, quantity: number = 1): void {
        this.perfumes[name] = (this.perfumes[name] || 0) + quantity;
    }
    
    getPerfumeQuantity(name: string): number {
        return this.perfumes[name] || 0;
    }

    removePerfume(perfumeName: string, quantity: number): boolean {
        const current = this.perfumes[perfumeName] || 0;
        if (current >= quantity) {
            this.perfumes[perfumeName] = current - quantity;
            return true;
        }
        return false;
    }
}