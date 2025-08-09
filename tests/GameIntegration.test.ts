/**
 * Simple integration test to verify core systems work together
 */

import { EconomySystem } from '../src/ecs/systems/EconomySystem';
import InventorySystem from '../src/ecs/systems/InventorySystem';

describe('Game Integration Tests', () => {
  describe('Economy and Inventory Integration', () => {
    test('should handle a complete transaction flow', () => {
      const economySystem = new EconomySystem();
      const inventorySystem = new InventorySystem();
      
      // Player starts with 100 gold
      expect(economySystem.getGold()).toBe(100);
      
      // Player buys ingredients
      const canAffordIngredient = economySystem.spendGold(10, 'Bought lavender oil');
      expect(canAffordIngredient).toBe(true);
      expect(economySystem.getGold()).toBe(90);
      
      // Player brews perfume
      inventorySystem.addPerfume('lavender_perfume', 1);
      expect(inventorySystem.getPerfumeQuantity('lavender_perfume')).toBe(1);
      
      // Player sells perfume
      const saleSuccess = inventorySystem.removePerfume('lavender_perfume', 1);
      expect(saleSuccess).toBe(true);
      expect(inventorySystem.getPerfumeQuantity('lavender_perfume')).toBe(0);
      
      // Player receives payment
      economySystem.addGold(20, 'Sold lavender perfume');
      expect(economySystem.getGold()).toBe(110);
      
      // Net profit: +10 gold
      expect(economySystem.getGold()).toBeGreaterThan(100);
    });

    test('should handle insufficient funds scenario', () => {
      const economySystem = new EconomySystem();
      const inventorySystem = new InventorySystem();
      
      // Try to spend more than available
      const canAffordExpensive = economySystem.spendGold(150, 'Expensive item');
      expect(canAffordExpensive).toBe(false);
      expect(economySystem.getGold()).toBe(100); // Should remain unchanged
      
      // Try to remove perfume that doesn't exist
      const canRemoveNonexistent = inventorySystem.removePerfume('nonexistent_perfume', 1);
      expect(canRemoveNonexistent).toBe(false);
    });

    test('should track transaction history', () => {
      const economySystem = new EconomySystem();
      
      economySystem.spendGold(25, 'Ingredient purchase');
      economySystem.addGold(40, 'Perfume sale');
      
      const history = economySystem.getTransactionHistory();
      expect(history).toHaveLength(2);
      expect(history[0].type).toBe('spend');
      expect(history[0].amount).toBe(25);
      expect(history[1].type).toBe('gain');
      expect(history[1].amount).toBe(40);
    });

    test('should support multiple perfume types', () => {
      const inventorySystem = new InventorySystem();
      
      inventorySystem.addPerfume('lavender_perfume', 3);
      inventorySystem.addPerfume('rose_perfume', 2);
      inventorySystem.addPerfume('dream_perfume', 1);
      
      const perfumes = inventorySystem.getPerfumes();
      expect(perfumes.lavender_perfume).toBe(3);
      expect(perfumes.rose_perfume).toBe(2);
      expect(perfumes.dream_perfume).toBe(1);
      
      // Sell some perfumes
      inventorySystem.removePerfume('lavender_perfume', 2);
      inventorySystem.removePerfume('rose_perfume', 1);
      
      expect(inventorySystem.getPerfumeQuantity('lavender_perfume')).toBe(1);
      expect(inventorySystem.getPerfumeQuantity('rose_perfume')).toBe(1);
      expect(inventorySystem.getPerfumeQuantity('dream_perfume')).toBe(1);
    });

    test('should handle target achievement', () => {
      const economySystem = new EconomySystem();
      let targetReached = false;
      
      economySystem.setOnTargetReached(() => {
        targetReached = true;
      });
      
      economySystem.setTarget(120);
      economySystem.addGold(20, 'Reach target'); // 100 + 20 = 120
      
      expect(targetReached).toBe(true);
      expect(economySystem.getGold()).toBe(120);
    });
  });

  describe('System Updates', () => {
    test('should run system updates without errors', () => {
      const economySystem = new EconomySystem();
      const inventorySystem = new InventorySystem();
      
      expect(() => economySystem.update(16.67)).not.toThrow();
      expect(() => inventorySystem.update(16.67)).not.toThrow();
    });

    test('should maintain state consistency across updates', () => {
      const economySystem = new EconomySystem();
      const inventorySystem = new InventorySystem();
      
      economySystem.addGold(50, 'Initial');
      inventorySystem.addPerfume('test_perfume', 3);
      
      // Run multiple update cycles
      for (let i = 0; i < 100; i++) {
        economySystem.update(16.67);
        inventorySystem.update(16.67);
      }
      
      expect(economySystem.getGold()).toBe(150); // 100 + 50
      expect(inventorySystem.getPerfumeQuantity('test_perfume')).toBe(3);
    });
  });
});
