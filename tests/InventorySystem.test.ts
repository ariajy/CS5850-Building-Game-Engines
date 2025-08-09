import InventorySystem from '../src/ecs/systems/InventorySystem';

describe('InventorySystem', () => {
  let inventorySystem: InventorySystem;

  beforeEach(() => {
    inventorySystem = new InventorySystem();
  });

  describe('Perfume Management', () => {
    test('should initialize with empty inventory', () => {
      expect(inventorySystem.getPerfumeQuantity('lavender_perfume')).toBe(0);
      expect(inventorySystem.getPerfumeQuantity('rose_perfume')).toBe(0);
      expect(inventorySystem.getPerfumeQuantity('dream_perfume')).toBe(0);
    });

    test('should add perfume correctly', () => {
      inventorySystem.addPerfume('lavender_perfume', 5);
      expect(inventorySystem.getPerfumeQuantity('lavender_perfume')).toBe(5);
    });

    test('should add multiple perfumes correctly', () => {
      inventorySystem.addPerfume('lavender_perfume', 3);
      inventorySystem.addPerfume('rose_perfume', 2);
      inventorySystem.addPerfume('lavender_perfume', 2); // Add more to existing
      
      expect(inventorySystem.getPerfumeQuantity('lavender_perfume')).toBe(5);
      expect(inventorySystem.getPerfumeQuantity('rose_perfume')).toBe(2);
    });

    test('should remove perfume successfully when sufficient stock available', () => {
      inventorySystem.addPerfume('lavender_perfume', 10);
      const result = inventorySystem.removePerfume('lavender_perfume', 3);
      
      expect(result).toBe(true);
      expect(inventorySystem.getPerfumeQuantity('lavender_perfume')).toBe(7);
    });

    test('should fail to remove perfume when insufficient stock', () => {
      inventorySystem.addPerfume('lavender_perfume', 2);
      const result = inventorySystem.removePerfume('lavender_perfume', 5);
      
      expect(result).toBe(false);
      expect(inventorySystem.getPerfumeQuantity('lavender_perfume')).toBe(2);
    });

    test('should handle exact perfume removal', () => {
      inventorySystem.addPerfume('rose_perfume', 4);
      const result = inventorySystem.removePerfume('rose_perfume', 4);
      
      expect(result).toBe(true);
      expect(inventorySystem.getPerfumeQuantity('rose_perfume')).toBe(0);
    });

    test('should handle removing from non-existent perfume type', () => {
      const result = inventorySystem.removePerfume('nonexistent_perfume', 1);
      
      expect(result).toBe(false);
    });
  });

  describe('Perfume Inventory Overview', () => {
    test('should get complete perfume inventory', () => {
      inventorySystem.addPerfume('lavender_perfume', 3);
      inventorySystem.addPerfume('rose_perfume', 5);
      inventorySystem.addPerfume('dream_perfume', 1);
      
      const perfumes = inventorySystem.getPerfumes();
      
      expect(perfumes.lavender_perfume).toBe(3);
      expect(perfumes.rose_perfume).toBe(5);
      expect(perfumes.dream_perfume).toBe(1);
    });

    test('should return zero for unlisted perfume types', () => {
      inventorySystem.addPerfume('lavender_perfume', 2);
      
      expect(inventorySystem.getPerfumeQuantity('rose_perfume')).toBe(0);
      expect(inventorySystem.getPerfumeQuantity('dream_perfume')).toBe(0);
    });
  });

  describe('General Inventory Management', () => {
    test('should add items to general inventory', () => {
      inventorySystem.addItem('alcohol', 5);
      expect(inventorySystem.getQuantity('alcohol')).toBe(5);
    });

    test('should remove items from general inventory', () => {
      inventorySystem.addItem('lavender_oil', 10);
      const result = inventorySystem.removeItem('lavender_oil', 3);
      
      expect(result).toBe(true);
      expect(inventorySystem.getQuantity('lavender_oil')).toBe(7);
    });

    test('should fail to remove items when insufficient stock', () => {
      inventorySystem.addItem('rose_oil', 2);
      const result = inventorySystem.removeItem('rose_oil', 5);
      
      expect(result).toBe(false);
      expect(inventorySystem.getQuantity('rose_oil')).toBe(2);
    });

    test('should get complete general inventory', () => {
      inventorySystem.addItem('alcohol', 3);
      inventorySystem.addItem('lavender_oil', 5);
      
      const inventory = inventorySystem.getInventory();
      
      expect(inventory.alcohol).toBe(3);
      expect(inventory.lavender_oil).toBe(5);
    });
  });

  describe('Edge Cases', () => {
    test('should handle adding zero quantity perfume', () => {
      inventorySystem.addPerfume('lavender_perfume', 0);
      expect(inventorySystem.getPerfumeQuantity('lavender_perfume')).toBe(0);
    });

    test('should handle removing zero quantity perfume', () => {
      inventorySystem.addPerfume('lavender_perfume', 5);
      const result = inventorySystem.removePerfume('lavender_perfume', 0);
      
      expect(result).toBe(true);
      expect(inventorySystem.getPerfumeQuantity('lavender_perfume')).toBe(5);
    });

    test('should handle large quantities', () => {
      const largeQuantity = 999999;
      inventorySystem.addPerfume('lavender_perfume', largeQuantity);
      expect(inventorySystem.getPerfumeQuantity('lavender_perfume')).toBe(largeQuantity);
    });

    test('should handle case-sensitive perfume names', () => {
      inventorySystem.addPerfume('lavender_perfume', 3);
      
      expect(inventorySystem.getPerfumeQuantity('lavender_perfume')).toBe(3);
      expect(inventorySystem.getPerfumeQuantity('Lavender_Perfume')).toBe(0);
      expect(inventorySystem.getPerfumeQuantity('LAVENDER_PERFUME')).toBe(0);
    });

    test('should handle special characters in perfume names', () => {
      const specialName = 'special-perfume_123';
      inventorySystem.addPerfume(specialName, 2);
      expect(inventorySystem.getPerfumeQuantity(specialName)).toBe(2);
    });
  });

  describe('System Interface', () => {
    test('should run update method without errors', () => {
      expect(() => inventorySystem.update(16.67)).not.toThrow();
    });

    test('should maintain inventory state during updates', () => {
      inventorySystem.addPerfume('lavender_perfume', 5);
      inventorySystem.update(16.67);
      expect(inventorySystem.getPerfumeQuantity('lavender_perfume')).toBe(5);
    });
  });

  describe('Business Logic', () => {
    test('should track total perfume count across all types', () => {
      inventorySystem.addPerfume('lavender_perfume', 3);
      inventorySystem.addPerfume('rose_perfume', 5);
      inventorySystem.addPerfume('dream_perfume', 2);
      
      const perfumes = inventorySystem.getPerfumes();
      const totalCount = Object.values(perfumes).reduce((sum: number, count: number) => sum + count, 0);
      
      expect(totalCount).toBe(10);
    });

    test('should support rapid add/remove operations', () => {
      // Simulate rapid customer transactions
      inventorySystem.addPerfume('lavender_perfume', 10);
      
      expect(inventorySystem.removePerfume('lavender_perfume', 1)).toBe(true);
      expect(inventorySystem.removePerfume('lavender_perfume', 2)).toBe(true);
      expect(inventorySystem.removePerfume('lavender_perfume', 3)).toBe(true);
      
      expect(inventorySystem.getPerfumeQuantity('lavender_perfume')).toBe(4);
    });

    test('should handle concurrent perfume types', () => {
      const perfumeTypes = ['lavender_perfume', 'rose_perfume', 'dream_perfume'];
      
      perfumeTypes.forEach((type, index) => {
        inventorySystem.addPerfume(type, index + 1);
      });
      
      perfumeTypes.forEach((type, index) => {
        expect(inventorySystem.getPerfumeQuantity(type)).toBe(index + 1);
      });
    });

    test('should maintain separate inventories for items and perfumes', () => {
      inventorySystem.addItem('alcohol', 5);
      inventorySystem.addPerfume('lavender_perfume', 3);
      
      expect(inventorySystem.getQuantity('alcohol')).toBe(5);
      expect(inventorySystem.getPerfumeQuantity('lavender_perfume')).toBe(3);
      
      // Items and perfumes should not interfere with each other
      expect(inventorySystem.getPerfumeQuantity('alcohol')).toBe(0);
      expect(inventorySystem.getQuantity('lavender_perfume')).toBe(0);
    });
  });
});
