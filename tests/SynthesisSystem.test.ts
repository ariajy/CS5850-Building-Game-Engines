import SynthesisSystem from '../src/ecs/systems/SynthesisSystem';
import { Recipe } from '../src/ecs/types';

describe('SynthesisSystem', () => {
  let synthesisSystem: SynthesisSystem;
  let mockInventorySystem: any;

  beforeEach(() => {
    mockInventorySystem = {
      getQuantity: jest.fn(),
      removeItem: jest.fn(),
      addPerfume: jest.fn(),
    };

    synthesisSystem = new SynthesisSystem(mockInventorySystem);
  });

  describe('System Creation', () => {
    test('should create SynthesisSystem successfully', () => {
      expect(synthesisSystem).toBeInstanceOf(SynthesisSystem);
    });

    test('should accept inventory system in constructor', () => {
      const customInventory = { test: 'inventory' };
      const system = new SynthesisSystem(customInventory);
      
      expect(system).toBeInstanceOf(SynthesisSystem);
    });
  });

  describe('Update Method', () => {
    test('should handle update calls', () => {
      expect(() => synthesisSystem.update(16.67)).not.toThrow();
    });

    test('should handle various delta times', () => {
      const deltaTimes = [0, 16.67, 33.33, 1000];
      
      deltaTimes.forEach(delta => {
        expect(() => synthesisSystem.update(delta)).not.toThrow();
      });
    });
  });

  describe('Recipe Crafting Validation', () => {
    test('should check if recipe can be crafted with sufficient ingredients', () => {
      const recipe: Recipe = {
        name: 'Lavender Perfume',
        ingredients: {
          'lavender-oil': 2,
          'alcohol': 1
        }
      };

      mockInventorySystem.getQuantity.mockImplementation((id: string) => {
        if (id === 'lavender-oil') return 3; // Has enough
        if (id === 'alcohol') return 2; // Has enough
        return 0;
      });

      const canCraft = synthesisSystem.canCraft(recipe);
      
      expect(canCraft).toBe(true);
      expect(mockInventorySystem.getQuantity).toHaveBeenCalledWith('lavender-oil');
      expect(mockInventorySystem.getQuantity).toHaveBeenCalledWith('alcohol');
    });

    test('should check if recipe cannot be crafted with insufficient ingredients', () => {
      const recipe: Recipe = {
        name: 'Rose Perfume',
        ingredients: {
          'rose-oil': 3,
          'alcohol': 1
        }
      };

      mockInventorySystem.getQuantity.mockImplementation((id: string) => {
        if (id === 'rose-oil') return 1; // Not enough
        if (id === 'alcohol') return 1; // Has enough
        return 0;
      });

      const canCraft = synthesisSystem.canCraft(recipe);
      
      expect(canCraft).toBe(false);
    });

    test('should handle recipes with multiple ingredients', () => {
      const complexRecipe: Recipe = {
        name: 'Dream Perfume',
        ingredients: {
          'lavender-oil': 2,
          'rose-oil': 1,
          'sage': 1,
          'alcohol': 2
        }
      };

      mockInventorySystem.getQuantity.mockImplementation((id: string) => {
        const quantities: Record<string, number> = {
          'lavender-oil': 3,
          'rose-oil': 2,
          'sage': 1,
          'alcohol': 3
        };
        return quantities[id] || 0;
      });

      const canCraft = synthesisSystem.canCraft(complexRecipe);
      
      expect(canCraft).toBe(true);
      expect(mockInventorySystem.getQuantity).toHaveBeenCalledTimes(4);
    });

    test('should handle empty recipe ingredients', () => {
      const emptyRecipe: Recipe = {
        name: 'Empty Recipe',
        ingredients: {}
      };

      const canCraft = synthesisSystem.canCraft(emptyRecipe);
      
      expect(canCraft).toBe(true); // Empty recipe should be craftable
    });
  });

  describe('Recipe Crafting Execution', () => {
    test('should successfully craft recipe when ingredients are available', () => {
      const recipe: Recipe = {
        name: 'Lavender Perfume',
        ingredients: {
          'lavender-oil': 2,
          'alcohol': 1
        }
      };

      mockInventorySystem.getQuantity.mockImplementation((id: string) => {
        if (id === 'lavender-oil') return 3;
        if (id === 'alcohol') return 2;
        return 0;
      });

      const success = synthesisSystem.craft(recipe);
      
      expect(success).toBe(true);
      expect(mockInventorySystem.removeItem).toHaveBeenCalledWith('lavender-oil', 2);
      expect(mockInventorySystem.removeItem).toHaveBeenCalledWith('alcohol', 1);
      expect(mockInventorySystem.addPerfume).toHaveBeenCalledWith('Lavender Perfume', 1);
    });

    test('should fail to craft recipe when ingredients are insufficient', () => {
      const recipe: Recipe = {
        name: 'Rose Perfume',
        ingredients: {
          'rose-oil': 5,
          'alcohol': 1
        }
      };

      mockInventorySystem.getQuantity.mockImplementation((id: string) => {
        if (id === 'rose-oil') return 2; // Not enough
        if (id === 'alcohol') return 1;
        return 0;
      });

      const success = synthesisSystem.craft(recipe);
      
      expect(success).toBe(false);
      expect(mockInventorySystem.removeItem).not.toHaveBeenCalled();
      expect(mockInventorySystem.addPerfume).not.toHaveBeenCalled();
    });

    test('should handle complex recipe crafting', () => {
      const complexRecipe: Recipe = {
        name: 'Premium Blend',
        ingredients: {
          'lavender-oil': 3,
          'rose-oil': 2,
          'sage': 1,
          'alcohol': 4
        }
      };

      mockInventorySystem.getQuantity.mockImplementation((id: string) => {
        const quantities: Record<string, number> = {
          'lavender-oil': 5,
          'rose-oil': 3,
          'sage': 2,
          'alcohol': 6
        };
        return quantities[id] || 0;
      });

      const success = synthesisSystem.craft(complexRecipe);
      
      expect(success).toBe(true);
      expect(mockInventorySystem.removeItem).toHaveBeenCalledWith('lavender-oil', 3);
      expect(mockInventorySystem.removeItem).toHaveBeenCalledWith('rose-oil', 2);
      expect(mockInventorySystem.removeItem).toHaveBeenCalledWith('sage', 1);
      expect(mockInventorySystem.removeItem).toHaveBeenCalledWith('alcohol', 4);
      expect(mockInventorySystem.addPerfume).toHaveBeenCalledWith('Premium Blend', 1);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle null recipe gracefully', () => {
      expect(() => synthesisSystem.canCraft(null as any)).toThrow();
    });

    test('should handle undefined recipe gracefully', () => {
      expect(() => synthesisSystem.canCraft(undefined as any)).toThrow();
    });

    test('should handle recipe with zero quantity ingredients', () => {
      const zeroQuantityRecipe: Recipe = {
        name: 'Zero Recipe',
        ingredients: {
          'lavender-oil': 0,
          'alcohol': 1
        }
      };

      mockInventorySystem.getQuantity.mockReturnValue(5);

      const canCraft = synthesisSystem.canCraft(zeroQuantityRecipe);
      const success = synthesisSystem.craft(zeroQuantityRecipe);
      
      expect(canCraft).toBe(true);
      expect(success).toBe(true);
      expect(mockInventorySystem.removeItem).toHaveBeenCalledWith('lavender-oil', 0);
      expect(mockInventorySystem.removeItem).toHaveBeenCalledWith('alcohol', 1);
    });

    test('should handle inventory system returning negative quantities', () => {
      const recipe: Recipe = {
        name: 'Test Recipe',
        ingredients: {
          'test-ingredient': 1
        }
      };

      mockInventorySystem.getQuantity.mockReturnValue(-1);

      const canCraft = synthesisSystem.canCraft(recipe);
      
      expect(canCraft).toBe(false);
    });
  });

  describe('Performance and Optimization', () => {
    test('should handle multiple rapid canCraft checks', () => {
      const recipe: Recipe = {
        name: 'Performance Test',
        ingredients: {
          'ingredient1': 1,
          'ingredient2': 1
        }
      };

      mockInventorySystem.getQuantity.mockReturnValue(10);

      const startTime = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        synthesisSystem.canCraft(recipe);
      }
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      // Should complete 1000 checks in reasonable time
      expect(executionTime).toBeLessThan(100);
    });

    test('should handle multiple rapid craft operations', () => {
      const recipe: Recipe = {
        name: 'Rapid Craft Test',
        ingredients: {
          'ingredient1': 1
        }
      };

      mockInventorySystem.getQuantity.mockReturnValue(1000);

      const startTime = performance.now();
      
      for (let i = 0; i < 100; i++) {
        synthesisSystem.craft(recipe);
      }
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      expect(executionTime).toBeLessThan(50);
      expect(mockInventorySystem.addPerfume).toHaveBeenCalledTimes(100);
    });
  });

  describe('Integration with Inventory System', () => {
    test('should properly interact with inventory system methods', () => {
      const recipe: Recipe = {
        name: 'Integration Test',
        ingredients: {
          'test-ingredient': 2
        }
      };

      mockInventorySystem.getQuantity.mockReturnValue(5);

      // Test canCraft integration
      synthesisSystem.canCraft(recipe);
      expect(mockInventorySystem.getQuantity).toHaveBeenCalledWith('test-ingredient');

      // Test craft integration
      synthesisSystem.craft(recipe);
      expect(mockInventorySystem.removeItem).toHaveBeenCalledWith('test-ingredient', 2);
      expect(mockInventorySystem.addPerfume).toHaveBeenCalledWith('Integration Test', 1);
    });

    test('should respect inventory system responses', () => {
      const recipe: Recipe = {
        name: 'Respect Test',
        ingredients: {
          'rare-ingredient': 10
        }
      };

      // First call returns insufficient, second call returns sufficient
      mockInventorySystem.getQuantity
        .mockReturnValueOnce(5) // Not enough
        .mockReturnValueOnce(15); // Enough

      const firstCheck = synthesisSystem.canCraft(recipe);
      const secondCheck = synthesisSystem.canCraft(recipe);
      
      expect(firstCheck).toBe(false);
      expect(secondCheck).toBe(true);
    });
  });
});
