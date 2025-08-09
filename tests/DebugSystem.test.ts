import { DebugSystem } from '../src/ecs/systems/DebugSystem';
import { EntityManager, Entity } from '../src/ecs/EntityManager';
import { DataManager } from '../src/ecs/DataManager';
import { System } from '../src/ecs/SystemManager';

describe('DebugSystem', () => {
  let debugSystem: DebugSystem;
  let mockEntityManager: jest.Mocked<EntityManager>;
  let mockDataManager: jest.Mocked<DataManager>;
  let originalConsoleLog: typeof console.log;

  beforeEach(() => {
    // Mock console.log to capture debug output
    originalConsoleLog = console.log;
    console.log = jest.fn();

    // Create mock managers
    mockEntityManager = {
      getAllEntities: jest.fn(),
      createEntity: jest.fn(),
      addEntity: jest.fn(),
      removeEntity: jest.fn(),
      getEntity: jest.fn(),
      hasEntity: jest.fn(),
      getEntitiesWithComponent: jest.fn(),
      getComponent: jest.fn(),
    } as any;

    mockDataManager = {
      getRecipes: jest.fn(),
      getIngredients: jest.fn(),
    } as any;

    debugSystem = new DebugSystem(mockEntityManager, mockDataManager);
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    jest.clearAllMocks();
  });

  describe('Inheritance and Construction', () => {
    test('should extend System class', () => {
      expect(debugSystem).toBeInstanceOf(System);
      expect(debugSystem).toBeInstanceOf(DebugSystem);
    });

    test('should store manager references', () => {
      expect(debugSystem['entityManager']).toBe(mockEntityManager);
      expect(debugSystem['dataManager']).toBe(mockDataManager);
    });

    test('should initialize with default timer values', () => {
      expect(debugSystem['debugTimer']).toBe(0);
      expect(debugSystem['debugInterval']).toBe(1000);
    });

    test('should handle null managers gracefully', () => {
      expect(() => {
        new DebugSystem(null as any, null as any);
      }).not.toThrow();
    });
  });

  describe('Update Method', () => {
    test('should accumulate debug timer', () => {
      debugSystem.update(100);
      expect(debugSystem['debugTimer']).toBe(100);

      debugSystem.update(200);
      expect(debugSystem['debugTimer']).toBe(300);

      debugSystem.update(150);
      expect(debugSystem['debugTimer']).toBe(450);
    });

    test('should not print debug info before interval', () => {
      debugSystem.update(500);
      expect(console.log).not.toHaveBeenCalled();

      debugSystem.update(400);
      expect(console.log).not.toHaveBeenCalled();
    });

    test('should print debug info when timer reaches interval', () => {
      mockDataManager.getRecipes.mockReturnValue([]);
      mockDataManager.getIngredients.mockReturnValue([]);
      mockEntityManager.getAllEntities.mockReturnValue(new Map());

      debugSystem.update(1000);

      expect(console.log).toHaveBeenCalled();
      expect(debugSystem['debugTimer']).toBe(0); // Timer should reset
    });

    test('should print debug info when timer exceeds interval', () => {
      mockDataManager.getRecipes.mockReturnValue([]);
      mockDataManager.getIngredients.mockReturnValue([]);
      mockEntityManager.getAllEntities.mockReturnValue(new Map());

      debugSystem.update(1500);

      expect(console.log).toHaveBeenCalled();
      expect(debugSystem['debugTimer']).toBe(0); // Timer should reset
    });

    test('should reset timer to zero after printing', () => {
      mockDataManager.getRecipes.mockReturnValue([]);
      mockDataManager.getIngredients.mockReturnValue([]);
      mockEntityManager.getAllEntities.mockReturnValue(new Map());

      debugSystem.update(1200);
      expect(debugSystem['debugTimer']).toBe(0);

      debugSystem.update(300);
      expect(debugSystem['debugTimer']).toBe(300);
    });

    test('should handle negative delta time', () => {
      debugSystem.update(-100);
      expect(debugSystem['debugTimer']).toBe(-100);
    });

    test('should handle zero delta time', () => {
      debugSystem.update(0);
      expect(debugSystem['debugTimer']).toBe(0);
    });

    test('should handle very large delta time', () => {
      mockDataManager.getRecipes.mockReturnValue([]);
      mockDataManager.getIngredients.mockReturnValue([]);
      mockEntityManager.getAllEntities.mockReturnValue(new Map());

      debugSystem.update(10000);

      expect(console.log).toHaveBeenCalled();
      expect(debugSystem['debugTimer']).toBe(0);
    });

    test('should handle multiple intervals in single update', () => {
      mockDataManager.getRecipes.mockReturnValue([]);
      mockDataManager.getIngredients.mockReturnValue([]);
      mockEntityManager.getAllEntities.mockReturnValue(new Map());

      // Update with 2.5 intervals worth of time
      debugSystem.update(2500);

      expect(console.log).toHaveBeenCalled();
      expect(debugSystem['debugTimer']).toBe(0); // Only triggers once per update
    });
  });

  describe('Debug Info Output', () => {
    beforeEach(() => {
      mockDataManager.getRecipes.mockReturnValue([]);
      mockDataManager.getIngredients.mockReturnValue([]);
      mockEntityManager.getAllEntities.mockReturnValue(new Map());
    });

    test('should print debug header', () => {
      debugSystem.update(1000);

      expect(console.log).toHaveBeenCalledWith('=== DEBUG SYSTEM INFO ===');
    });

    test('should print debug footer', () => {
      debugSystem.update(1000);

      expect(console.log).toHaveBeenCalledWith('========================');
    });

    test('should print DataManager information', () => {
      const mockRecipes = [
        { name: 'Recipe 1', ingredients: { 'ingredient1': 1, 'ingredient2': 2 } as Record<string, number> },
        { name: 'Recipe 2', ingredients: { 'ingredient3': 3 } as Record<string, number> }
      ];
      const mockIngredients = [
        { id: 'ingredient1', name: 'Ingredient 1', price: 5, imageKey: 'ingredient1' },
        { id: 'ingredient2', name: 'Ingredient 2', price: 10, imageKey: 'ingredient2' },
        { id: 'ingredient3', name: 'Ingredient 3', price: 15, imageKey: 'ingredient3' }
      ];

      mockDataManager.getRecipes.mockReturnValue(mockRecipes);
      mockDataManager.getIngredients.mockReturnValue(mockIngredients);

      debugSystem.update(1000);

      expect(console.log).toHaveBeenCalledWith('📊 DataManager: 2 recipes, 3 ingredients');
    });

    test('should print EntityManager information', () => {
      const mockEntities = new Map([
        ['entity1', { id: 'entity1', components: new Map() }],
        ['entity2', { id: 'entity2', components: new Map() }]
      ]);

      mockEntityManager.getAllEntities.mockReturnValue(mockEntities);

      debugSystem.update(1000);

      expect(console.log).toHaveBeenCalledWith('👥 EntityManager: 2 entities');
    });

    test('should print individual entity information', () => {
      const entity1Components = new Map([
        ['Position', { x: 100, y: 200 }],
        ['Health', { hp: 100 }]
      ]);
      const entity2Components = new Map([
        ['Velocity', { dx: 5, dy: -3 }]
      ]);

      const mockEntities = new Map([
        ['entity1', { id: 'entity1', components: entity1Components }],
        ['entity2', { id: 'entity2', components: entity2Components }]
      ]);

      mockEntityManager.getAllEntities.mockReturnValue(mockEntities);

      debugSystem.update(1000);

      expect(console.log).toHaveBeenCalledWith('  - Entity entity1: 2 components');
      expect(console.log).toHaveBeenCalledWith('    * Position:', { x: 100, y: 200 });
      expect(console.log).toHaveBeenCalledWith('    * Health:', { hp: 100 });
      expect(console.log).toHaveBeenCalledWith('  - Entity entity2: 1 components');
      expect(console.log).toHaveBeenCalledWith('    * Velocity:', { dx: 5, dy: -3 });
    });

    test('should handle empty data', () => {
      mockDataManager.getRecipes.mockReturnValue([]);
      mockDataManager.getIngredients.mockReturnValue([]);
      mockEntityManager.getAllEntities.mockReturnValue(new Map());

      debugSystem.update(1000);

      expect(console.log).toHaveBeenCalledWith('📊 DataManager: 0 recipes, 0 ingredients');
      expect(console.log).toHaveBeenCalledWith('👥 EntityManager: 0 entities');
    });

    test('should handle entities with no components', () => {
      const mockEntities = new Map([
        ['entity1', { id: 'entity1', components: new Map() }]
      ]);

      mockEntityManager.getAllEntities.mockReturnValue(mockEntities);

      debugSystem.update(1000);

      expect(console.log).toHaveBeenCalledWith('  - Entity entity1: 0 components');
    });

    test('should handle complex component data', () => {
      const complexComponent = {
        nested: {
          deep: {
            value: 42,
            array: [1, 2, 3]
          }
        },
        simpleValue: 'test'
      };

      const entityComponents = new Map([
        ['ComplexComponent', complexComponent]
      ]);

      const mockEntities = new Map([
        ['entity1', { id: 'entity1', components: entityComponents }]
      ]);

      mockEntityManager.getAllEntities.mockReturnValue(mockEntities);

      debugSystem.update(1000);

      expect(console.log).toHaveBeenCalledWith('    * ComplexComponent:', complexComponent);
    });
  });

  describe('Error Handling', () => {
    test('should handle DataManager methods throwing errors', () => {
      mockDataManager.getRecipes.mockImplementation(() => {
        throw new Error('Recipe fetch failed');
      });
      mockDataManager.getIngredients.mockReturnValue([]);
      mockEntityManager.getAllEntities.mockReturnValue(new Map());

      expect(() => {
        debugSystem.update(1000);
      }).toThrow('Recipe fetch failed');
    });

    test('should handle EntityManager methods throwing errors', () => {
      mockDataManager.getRecipes.mockReturnValue([]);
      mockDataManager.getIngredients.mockReturnValue([]);
      mockEntityManager.getAllEntities.mockImplementation(() => {
        throw new Error('Entity fetch failed');
      });

      expect(() => {
        debugSystem.update(1000);
      }).toThrow('Entity fetch failed');
    });

    test('should handle null return values from managers', () => {
      mockDataManager.getRecipes.mockReturnValue(null as any);
      mockDataManager.getIngredients.mockReturnValue(null as any);
      mockEntityManager.getAllEntities.mockReturnValue(null as any);

      expect(() => {
        debugSystem.update(1000);
      }).toThrow();
    });

    test('should handle undefined return values from managers', () => {
      mockDataManager.getRecipes.mockReturnValue(undefined as any);
      mockDataManager.getIngredients.mockReturnValue(undefined as any);
      mockEntityManager.getAllEntities.mockReturnValue(undefined as any);

      expect(() => {
        debugSystem.update(1000);
      }).toThrow();
    });

    test('should handle console.log throwing errors', () => {
      mockDataManager.getRecipes.mockReturnValue([]);
      mockDataManager.getIngredients.mockReturnValue([]);
      mockEntityManager.getAllEntities.mockReturnValue(new Map());

      console.log = jest.fn().mockImplementation(() => {
        throw new Error('Console error');
      });

      expect(() => {
        debugSystem.update(1000);
      }).toThrow('Console error');
    });
  });

  describe('Performance and Memory', () => {
    test('should handle large amounts of data efficiently', () => {
      const recipes = Array.from({ length: 1000 }, (_, i) => ({ 
        name: `Recipe ${i}`, 
        ingredients: { [`ingredient${i}`]: 1 } as Record<string, number>
      }));
      const ingredients = Array.from({ length: 500 }, (_, i) => ({ 
        id: `ingredient${i}`, 
        name: `Ingredient ${i}`,
        price: i + 1,
        imageKey: `ingredient${i}`
      }));
      
      const entities = new Map();
      for (let i = 0; i < 100; i++) {
        const components = new Map();
        for (let j = 0; j < 10; j++) {
          components.set(`Component${j}`, { value: j });
        }
        entities.set(`entity${i}`, { id: `entity${i}`, components });
      }

      mockDataManager.getRecipes.mockReturnValue(recipes);
      mockDataManager.getIngredients.mockReturnValue(ingredients);
      mockEntityManager.getAllEntities.mockReturnValue(entities);

      const startTime = performance.now();
      debugSystem.update(1000);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should complete quickly
    });

    test('should handle rapid updates efficiently', () => {
      mockDataManager.getRecipes.mockReturnValue([]);
      mockDataManager.getIngredients.mockReturnValue([]);
      mockEntityManager.getAllEntities.mockReturnValue(new Map());

      const startTime = performance.now();

      for (let i = 0; i < 100; i++) {
        debugSystem.update(999); // Just below threshold
      }

      debugSystem.update(1000); // Trigger debug output

      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100);
    });

    test('should not create memory leaks', () => {
      mockDataManager.getRecipes.mockReturnValue([]);
      mockDataManager.getIngredients.mockReturnValue([]);
      mockEntityManager.getAllEntities.mockReturnValue(new Map());

      const initialMemory = process.memoryUsage();

      for (let i = 0; i < 100; i++) {
        debugSystem.update(1000);
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      expect(memoryIncrease).toBeLessThan(1024 * 1024); // Less than 1MB increase
    });
  });

  describe('Timer Behavior', () => {
    test('should handle fractional delta times', () => {
      debugSystem.update(16.67); // ~60 FPS
      expect(debugSystem['debugTimer']).toBeCloseTo(16.67, 2);

      debugSystem.update(33.33); // ~30 FPS
      expect(debugSystem['debugTimer']).toBeCloseTo(50, 1);
    });

    test('should accumulate time across multiple updates', () => {
      // Set up mocks for when debug output is triggered
      mockDataManager.getRecipes.mockReturnValue([]);
      mockDataManager.getIngredients.mockReturnValue([]);
      mockEntityManager.getAllEntities.mockReturnValue(new Map());

      const deltas = [100, 200, 150, 300, 250];
      let expectedTotal = 0;

      deltas.forEach(delta => {
        debugSystem.update(delta);
        expectedTotal += delta;
        if (expectedTotal < 1000) {
          expect(debugSystem['debugTimer']).toBe(expectedTotal);
        } else {
          // Timer resets after 1000ms
          expect(debugSystem['debugTimer']).toBe(0);
          expectedTotal = 0; // Reset expected total as well
        }
      });
    });

    test('should trigger debug output at exactly 1000ms', () => {
      mockDataManager.getRecipes.mockReturnValue([]);
      mockDataManager.getIngredients.mockReturnValue([]);
      mockEntityManager.getAllEntities.mockReturnValue(new Map());

      debugSystem.update(999);
      expect(console.log).not.toHaveBeenCalled();

      debugSystem.update(1);
      expect(console.log).toHaveBeenCalled();
    });

    test('should handle multiple debug intervals', () => {
      mockDataManager.getRecipes.mockReturnValue([]);
      mockDataManager.getIngredients.mockReturnValue([]);
      mockEntityManager.getAllEntities.mockReturnValue(new Map());

      // First interval
      debugSystem.update(1000);
      expect(console.log).toHaveBeenCalled();
      expect(debugSystem['debugTimer']).toBe(0);

      jest.clearAllMocks();

      // Second interval
      debugSystem.update(1000);
      expect(console.log).toHaveBeenCalled();
      expect(debugSystem['debugTimer']).toBe(0);
    });
  });

  describe('Integration Scenarios', () => {
    test('should work with realistic game data', () => {
      const recipes = [
        { name: 'Lavender Perfume', ingredients: { 'lavender-oil': 2, 'alcohol': 1 } as Record<string, number> },
        { name: 'Rose Perfume', ingredients: { 'rose-oil': 2, 'alcohol': 1 } as Record<string, number> }
      ];

      const ingredients = [
        { id: 'lavender-oil', name: 'Lavender Oil', price: 3, imageKey: 'lavender_oil' },
        { id: 'rose-oil', name: 'Rose Oil', price: 3, imageKey: 'rose_oil' },
        { id: 'alcohol', name: 'Alcohol', price: 1, imageKey: 'alcohol' }
      ];

      const playerComponents = new Map([
        ['Position', { x: 400, y: 300 }],
        ['Inventory', { items: ['lavender-oil', 'alcohol'], gold: 50 }]
      ]);

      const customerComponents = new Map([
        ['Customer', { patience: 80, status: 'waiting' }],
        ['Order', { recipeId: 'lavender-perfume', status: 'pending' }],
        ['Position', { x: 600, y: 200 }]
      ]);

      const entities = new Map([
        ['player', { id: 'player', components: playerComponents }],
        ['customer_0', { id: 'customer_0', components: customerComponents }]
      ]);

      mockDataManager.getRecipes.mockReturnValue(recipes);
      mockDataManager.getIngredients.mockReturnValue(ingredients);
      mockEntityManager.getAllEntities.mockReturnValue(entities);

      debugSystem.update(1000);

      expect(console.log).toHaveBeenCalledWith('📊 DataManager: 2 recipes, 3 ingredients');
      expect(console.log).toHaveBeenCalledWith('👥 EntityManager: 2 entities');
      expect(console.log).toHaveBeenCalledWith('  - Entity player: 2 components');
      expect(console.log).toHaveBeenCalledWith('  - Entity customer_0: 3 components');
    });

    test('should support debugging game state changes', () => {
      const initialEntities = new Map([
        ['player', { id: 'player', components: new Map([['Gold', { amount: 0 }]]) }]
      ]);

      mockDataManager.getRecipes.mockReturnValue([]);
      mockDataManager.getIngredients.mockReturnValue([]);
      mockEntityManager.getAllEntities.mockReturnValue(initialEntities);

      // First debug output
      debugSystem.update(1000);
      expect(console.log).toHaveBeenCalledWith('👥 EntityManager: 1 entities');

      jest.clearAllMocks();

      // Simulate game state change
      const updatedEntities = new Map([
        ['player', { id: 'player', components: new Map([['Gold', { amount: 50 }]]) }],
        ['customer_0', { id: 'customer_0', components: new Map([['Order', { status: 'pending' }]]) }]
      ]);

      mockEntityManager.getAllEntities.mockReturnValue(updatedEntities);

      // Second debug output
      debugSystem.update(1000);
      expect(console.log).toHaveBeenCalledWith('👥 EntityManager: 2 entities');
      expect(console.log).toHaveBeenCalledWith('    * Gold:', { amount: 50 });
    });
  });
});
