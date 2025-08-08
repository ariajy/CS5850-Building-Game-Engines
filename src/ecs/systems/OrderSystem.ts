import { EntityManager } from '../EntityManager';
import InventorySystem from './InventorySystem';
import { EconomySystem } from './EconomySystem';
import { OrderComponent } from '../components/OrderComponent';
import { CustomerComponent } from '../components/CustomerComponent';

export class OrderSystem {
  private entityManager: EntityManager;
  private inventorySystem: InventorySystem;
  private economySystem: EconomySystem;

  constructor(
    entityManager: EntityManager,
    inventorySystem: InventorySystem,
    economySystem: EconomySystem
  ) {
    this.entityManager = entityManager;
    this.inventorySystem = inventorySystem;
    this.economySystem = economySystem;
  }

  public sellPerfume(perfumeName: string): { success: boolean; message: string } {
    const customerIds = this.entityManager.getEntitiesWithComponent("OrderComponent");

    if (customerIds.length === 0) {
      return { success: false, message: "No customer to sell to." };
    }

    const customerId = customerIds[0];
    const customerEntity = this.entityManager.getEntity(customerId);

    if (!customerEntity) {
      return { success: false, message: "Customer entity not found." };
    }

    const order = customerEntity.components.get("OrderComponent") as OrderComponent;

    if (order.perfumeName === perfumeName) {
      if (this.inventorySystem.getPerfumeQuantity(perfumeName) > 0) {
        this.inventorySystem.removePerfume(perfumeName, 1);
        this.economySystem.addGold(10); // Or dynamic price if needed
        this.entityManager.removeEntity(customerId); // Customer leaves
        return { success: true, message: "Sale successful! +10 gold" };
      } else {
        return { success: false, message: "You don't have this perfume." };
      }
    } else {
      return { success: false, message: "Wrong perfume. Customer is unhappy." };
    }
  }

  update(delta: number) {
    // Optional: handle timeout orders, etc.
  }
}