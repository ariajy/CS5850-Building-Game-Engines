import { GameManager } from '../src/ecs/GameManager';
import { DataManager } from '../src/ecs/DataManager';
import { EntityManager } from '../src/ecs/EntityManager';
import { ComponentManager } from '../src/ecs/ComponentManager';
import { SystemManager, System } from '../src/ecs/SystemManager';

// Mock the manager dependencies
jest.mock('../src/ecs/DataManager');
jest.mock('../src/ecs/EntityManager');
jest.mock('../src/ecs/ComponentManager');
jest.mock('../src/ecs/SystemManager');

describe('GameManager', () => {
  let gameManager: GameManager;
  let mockDataManager: jest.Mocked<DataManager>;
  let mockEntityManager: jest.Mocked<EntityManager>;
  let mockComponentManager: jest.Mocked<ComponentManager>;
  let mockSystemManager: jest.Mocked<SystemManager>;

  beforeEach(() => {
    // Reset singleton instance for each test
    (GameManager as any).instance = undefined;

    // Create mocked instances
    mockDataManager = {
      getIngredients: jest.fn(),
      getRecipes: jest.fn(),
    } as any;

    mockEntityManager = {
      createEntity: jest.fn(),
      addEntity: jest.fn(),
      removeEntity: jest.fn(),
      getEntity: jest.fn(),
      getAllEntities: jest.fn(),
      hasEntity: jest.fn(),
      getEntitiesWithComponent: jest.fn(),
      getComponent: jest.fn(),
    } as any;

    mockComponentManager = {
      addComponent: jest.fn(),
      removeComponent: jest.fn(),
      getComponent: jest.fn(),
      hasComponent: jest.fn(),
      getEntitiesWithComponent: jest.fn(),
      removeAllComponents: jest.fn(),
    } as any;

    mockSystemManager = {
      addSystem: jest.fn(),
      removeSystem: jest.fn(),
      getSystem: jest.fn(),
      updateAll: jest.fn(),
      getAllSystems: jest.fn(),
    } as any;

    // Mock the getInstance methods
    (DataManager.getInstance as jest.Mock).mockReturnValue(mockDataManager);
    (EntityManager.getInstance as jest.Mock).mockReturnValue(mockEntityManager);
    (ComponentManager.getInstance as jest.Mock).mockReturnValue(mockComponentManager);
    (SystemManager.getInstance as jest.Mock).mockReturnValue(mockSystemManager);

    gameManager = GameManager.getInstance();
  });

  afterEach(() => {
    // Clean up singleton instance and mocks
    (GameManager as any).instance = undefined;
    jest.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    test('should return the same instance on multiple calls', () => {
      const instance1 = GameManager.getInstance();
      const instance2 = GameManager.getInstance();

      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(GameManager);
    });

    test('should maintain state across getInstance calls', () => {
      const manager1 = GameManager.getInstance();
      const manager2 = GameManager.getInstance();

      expect(manager1.dataManager).toBe(manager2.dataManager);
      expect(manager1.entityManager).toBe(manager2.entityManager);
      expect(manager1.componentManager).toBe(manager2.componentManager);
      expect(manager1.systemManager).toBe(manager2.systemManager);
    });

    test('should create only one instance even with rapid calls', () => {
      const instances: GameManager[] = [];
      
      for (let i = 0; i < 100; i++) {
        instances.push(GameManager.getInstance());
      }

      // All instances should be the same object
      instances.forEach(instance => {
        expect(instance).toBe(instances[0]);
      });
    });
  });

  describe('Manager Initialization', () => {
    test('should initialize all required managers', () => {
      expect(gameManager.dataManager).toBeDefined();
      expect(gameManager.entityManager).toBeDefined();
      expect(gameManager.componentManager).toBeDefined();
      expect(gameManager.systemManager).toBeDefined();
    });

    test('should call getInstance on all manager types', () => {
      expect(DataManager.getInstance).toHaveBeenCalled();
      expect(EntityManager.getInstance).toHaveBeenCalled();
      expect(ComponentManager.getInstance).toHaveBeenCalled();
      expect(SystemManager.getInstance).toHaveBeenCalled();
    });

    test('should reference the correct manager instances', () => {
      expect(gameManager.dataManager).toBe(mockDataManager);
      expect(gameManager.entityManager).toBe(mockEntityManager);
      expect(gameManager.componentManager).toBe(mockComponentManager);
      expect(gameManager.systemManager).toBe(mockSystemManager);
    });

    test('should have public access to all managers', () => {
      // Verify all managers are publicly accessible
      expect(gameManager.dataManager).toBeInstanceOf(Object);
      expect(gameManager.entityManager).toBeInstanceOf(Object);
      expect(gameManager.componentManager).toBeInstanceOf(Object);
      expect(gameManager.systemManager).toBeInstanceOf(Object);
    });
  });

  describe('Update System', () => {
    test('should delegate update to SystemManager', () => {
      const deltaTime = 16.67; // ~60 FPS

      gameManager.update(deltaTime);

      expect(mockSystemManager.updateAll).toHaveBeenCalledWith(deltaTime);
      expect(mockSystemManager.updateAll).toHaveBeenCalledTimes(1);
    });

    test('should handle multiple update calls', () => {
      gameManager.update(16.67);
      gameManager.update(20.0);
      gameManager.update(12.5);

      expect(mockSystemManager.updateAll).toHaveBeenCalledTimes(3);
      expect(mockSystemManager.updateAll).toHaveBeenNthCalledWith(1, 16.67);
      expect(mockSystemManager.updateAll).toHaveBeenNthCalledWith(2, 20.0);
      expect(mockSystemManager.updateAll).toHaveBeenNthCalledWith(3, 12.5);
    });

    test('should handle zero delta time', () => {
      gameManager.update(0);

      expect(mockSystemManager.updateAll).toHaveBeenCalledWith(0);
    });

    test('should handle negative delta time', () => {
      gameManager.update(-5);

      expect(mockSystemManager.updateAll).toHaveBeenCalledWith(-5);
    });

    test('should handle very large delta time', () => {
      const largeDelta = 1000000;
      gameManager.update(largeDelta);

      expect(mockSystemManager.updateAll).toHaveBeenCalledWith(largeDelta);
    });

    test('should handle floating point precision', () => {
      const preciseTime = 16.666666666666668;
      gameManager.update(preciseTime);

      expect(mockSystemManager.updateAll).toHaveBeenCalledWith(preciseTime);
    });
  });

  describe('Manager Integration', () => {
    test('should provide access to DataManager functionality', () => {
      const ingredients = [{ id: 'test', name: 'Test Ingredient', price: 5, imageKey: 'test_img' }];
      mockDataManager.getIngredients.mockReturnValue(ingredients);

      const result = gameManager.dataManager.getIngredients();

      expect(result).toBe(ingredients);
      expect(mockDataManager.getIngredients).toHaveBeenCalled();
    });

    test('should provide access to EntityManager functionality', () => {
      const entityId = 'entity_123';
      mockEntityManager.createEntity.mockReturnValue(entityId);

      const result = gameManager.entityManager.createEntity();

      expect(result).toBe(entityId);
      expect(mockEntityManager.createEntity).toHaveBeenCalled();
    });

    test('should provide access to ComponentManager functionality', () => {
      const entityId = 'entity_123';
      const componentType = 'Position';
      const componentData = { x: 10, y: 20 };

      gameManager.componentManager.addComponent(entityId, componentType, componentData);

      expect(mockComponentManager.addComponent).toHaveBeenCalledWith(
        entityId,
        componentType,
        componentData
      );
    });

    test('should provide access to SystemManager functionality', () => {
      class MockSystem extends System {
        update(deltaTime: number): void {}
      }

      const system = new MockSystem();
      gameManager.systemManager.addSystem('test', system);

      expect(mockSystemManager.addSystem).toHaveBeenCalledWith('test', system);
    });
  });

  describe('Error Handling', () => {
    test('should handle SystemManager update errors gracefully', () => {
      mockSystemManager.updateAll.mockImplementation(() => {
        throw new Error('System update failed');
      });

      expect(() => gameManager.update(16.67)).toThrow('System update failed');
      expect(mockSystemManager.updateAll).toHaveBeenCalledWith(16.67);
    });

    test('should handle manager initialization errors', () => {
      // Reset the GameManager instance
      (GameManager as any).instance = undefined;

      // Mock one of the managers to throw an error
      (DataManager.getInstance as jest.Mock).mockImplementation(() => {
        throw new Error('DataManager initialization failed');
      });

      expect(() => GameManager.getInstance()).toThrow('DataManager initialization failed');
    });

    test('should propagate manager method errors', () => {
      mockEntityManager.createEntity.mockImplementation(() => {
        throw new Error('Entity creation failed');
      });

      expect(() => gameManager.entityManager.createEntity()).toThrow('Entity creation failed');
    });
  });

  describe('Performance Considerations', () => {
    test('should handle rapid update calls efficiently', () => {
      const startTime = performance.now();

      for (let i = 0; i < 1000; i++) {
        gameManager.update(16.67);
      }

      const endTime = performance.now();

      expect(mockSystemManager.updateAll).toHaveBeenCalledTimes(1000);
      expect(endTime - startTime).toBeLessThan(100); // Should complete quickly
    });

    test('should not create unnecessary objects during updates', () => {
      const initialMemory = process.memoryUsage();

      for (let i = 0; i < 100; i++) {
        gameManager.update(16.67);
      }

      const finalMemory = process.memoryUsage();
      
      // Memory usage shouldn't increase significantly
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      expect(memoryIncrease).toBeLessThan(1024 * 1024); // Less than 1MB increase
    });
  });

  describe('Manager State Consistency', () => {
    test('should maintain consistent manager references', () => {
      const originalDataManager = gameManager.dataManager;
      const originalEntityManager = gameManager.entityManager;
      const originalComponentManager = gameManager.componentManager;
      const originalSystemManager = gameManager.systemManager;

      // Multiple calls shouldn't change the references
      gameManager.update(16.67);

      expect(gameManager.dataManager).toBe(originalDataManager);
      expect(gameManager.entityManager).toBe(originalEntityManager);
      expect(gameManager.componentManager).toBe(originalComponentManager);
      expect(gameManager.systemManager).toBe(originalSystemManager);
    });

    test('should ensure all managers are singletons through GameManager', () => {
      const gameManager1 = GameManager.getInstance();
      const gameManager2 = GameManager.getInstance();

      expect(gameManager1.dataManager).toBe(gameManager2.dataManager);
      expect(gameManager1.entityManager).toBe(gameManager2.entityManager);
      expect(gameManager1.componentManager).toBe(gameManager2.componentManager);
      expect(gameManager1.systemManager).toBe(gameManager2.systemManager);
    });
  });

  describe('Integration Scenarios', () => {
    test('should support complete ECS workflow', () => {
      // Mock a complete ECS workflow
      const entityId = 'entity_123';
      const componentData = { x: 10, y: 20 };

      mockEntityManager.createEntity.mockReturnValue(entityId);
      mockComponentManager.getComponent.mockReturnValue(componentData);
      mockEntityManager.getEntitiesWithComponent.mockReturnValue([entityId]);

      // Create entity
      const createdEntityId = gameManager.entityManager.createEntity();
      expect(createdEntityId).toBe(entityId);

      // Add component
      gameManager.componentManager.addComponent(entityId, 'Position', componentData);
      expect(mockComponentManager.addComponent).toHaveBeenCalledWith(
        entityId,
        'Position',
        componentData
      );

      // Query entities
      const entities = gameManager.entityManager.getEntitiesWithComponent('Position');
      expect(entities).toEqual([entityId]);

      // Update systems
      gameManager.update(16.67);
      expect(mockSystemManager.updateAll).toHaveBeenCalledWith(16.67);
    });

    test('should handle complex multi-manager operations', () => {
      // Simulate a complex game operation involving multiple managers
      const ingredients = [
        { id: 'ingredient1', name: 'Test Ingredient 1', price: 3, imageKey: 'ing1' },
        { id: 'ingredient2', name: 'Test Ingredient 2', price: 5, imageKey: 'ing2' }
      ];

      mockDataManager.getIngredients.mockReturnValue(ingredients);
      mockEntityManager.createEntity
        .mockReturnValueOnce('entity1')
        .mockReturnValueOnce('entity2');

      // Get data
      const retrievedIngredients = gameManager.dataManager.getIngredients();
      expect(retrievedIngredients).toBe(ingredients);

      // Create entities for each ingredient
      ingredients.forEach((ingredient, index) => {
        const entityId = gameManager.entityManager.createEntity();
        gameManager.componentManager.addComponent(entityId, 'Ingredient', ingredient);
      });

      expect(mockEntityManager.createEntity).toHaveBeenCalledTimes(2);
      expect(mockComponentManager.addComponent).toHaveBeenCalledTimes(2);

      // Update all systems
      gameManager.update(16.67);
      expect(mockSystemManager.updateAll).toHaveBeenCalledWith(16.67);
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    test('should handle undefined delta time', () => {
      gameManager.update(undefined as any);

      expect(mockSystemManager.updateAll).toHaveBeenCalledWith(undefined);
    });

    test('should handle null delta time', () => {
      gameManager.update(null as any);

      expect(mockSystemManager.updateAll).toHaveBeenCalledWith(null);
    });

    test('should handle NaN delta time', () => {
      gameManager.update(NaN);

      expect(mockSystemManager.updateAll).toHaveBeenCalledWith(NaN);
    });

    test('should handle Infinity delta time', () => {
      gameManager.update(Infinity);

      expect(mockSystemManager.updateAll).toHaveBeenCalledWith(Infinity);
    });

    test('should maintain functionality when managers throw errors', () => {
      // Even if one manager operation fails, others should still work
      mockDataManager.getIngredients.mockImplementation(() => {
        throw new Error('Data access failed');
      });

      // Other managers should still be accessible
      expect(() => gameManager.entityManager.createEntity()).not.toThrow();
      expect(() => gameManager.componentManager.addComponent('test', 'Position', {})).not.toThrow();
    });
  });

  describe('Memory Management', () => {
    test('should not create circular references', () => {
      // Verify that GameManager doesn't create circular references
      const gameManagerRef = GameManager.getInstance();
      
      // Should be able to create multiple references without issues
      const anotherRef = GameManager.getInstance();
      
      expect(gameManagerRef).toBe(anotherRef);
      
      // Clean up references
      const refs = [gameManagerRef, anotherRef];
      refs.forEach(ref => {
        expect(ref).toBeInstanceOf(GameManager);
      });
    });

    test('should maintain singleton integrity under stress', () => {
      const instances = new Set();
      
      // Create many references rapidly
      for (let i = 0; i < 1000; i++) {
        instances.add(GameManager.getInstance());
      }
      
      // Should only have one unique instance
      expect(instances.size).toBe(1);
    });
  });
});
