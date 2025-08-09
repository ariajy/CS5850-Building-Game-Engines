import { ExpiredEntitySystem } from '../src/ecs/systems/ExpiredEntitySystem';
import { EntityManager, Entity } from '../src/ecs/EntityManager';
import { ExpiredComponent } from '../src/ecs/components/ExpiredComponent';
import { System } from '../src/ecs/SystemManager';

describe('ExpiredEntitySystem', () => {
  let expiredEntitySystem: ExpiredEntitySystem;
  let mockEntityManager: jest.Mocked<EntityManager>;
  let mockRenderSystem: any;

  beforeEach(() => {
    // Mock EntityManager
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

    // Mock RenderSystem
    mockRenderSystem = {
      fadeOutCustomer: jest.fn()
    };

    expiredEntitySystem = new ExpiredEntitySystem(mockEntityManager);

    jest.clearAllMocks();
  });

  describe('Construction and Inheritance', () => {
    test('should extend System class', () => {
      expect(expiredEntitySystem).toBeInstanceOf(System);
      expect(expiredEntitySystem).toBeInstanceOf(ExpiredEntitySystem);
    });

    test('should store entity manager reference', () => {
      expect(expiredEntitySystem['entityManager']).toBe(mockEntityManager);
    });

    test('should initialize with null render system', () => {
      expect(expiredEntitySystem['renderSystem']).toBeNull();
    });

    test('should handle null entity manager gracefully', () => {
      expect(() => {
        new ExpiredEntitySystem(null as any);
      }).not.toThrow();
    });
  });

  describe('Render System Management', () => {
    test('should set render system reference', () => {
      expiredEntitySystem.setRenderSystem(mockRenderSystem);
      expect(expiredEntitySystem['renderSystem']).toBe(mockRenderSystem);
    });

    test('should handle null render system', () => {
      expiredEntitySystem.setRenderSystem(null);
      expect(expiredEntitySystem['renderSystem']).toBeNull();
    });

    test('should handle undefined render system', () => {
      expiredEntitySystem.setRenderSystem(undefined);
      expect(expiredEntitySystem['renderSystem']).toBeUndefined();
    });

    test('should replace existing render system', () => {
      const firstRenderSystem = { fadeOutCustomer: jest.fn() };
      const secondRenderSystem = { fadeOutCustomer: jest.fn() };

      expiredEntitySystem.setRenderSystem(firstRenderSystem);
      expect(expiredEntitySystem['renderSystem']).toBe(firstRenderSystem);

      expiredEntitySystem.setRenderSystem(secondRenderSystem);
      expect(expiredEntitySystem['renderSystem']).toBe(secondRenderSystem);
    });
  });

  describe('Update Method - Basic Functionality', () => {
    test('should handle update with no expired entities', () => {
      mockEntityManager.getEntitiesWithComponent.mockReturnValue([]);

      expect(() => {
        expiredEntitySystem.update(100);
      }).not.toThrow();

      expect(mockEntityManager.getEntitiesWithComponent).toHaveBeenCalledWith('expired');
    });

    test('should process entities with expired components', () => {
      mockEntityManager.getEntitiesWithComponent.mockReturnValue(['entity1', 'entity2']);
      
      const expiredComponent1: ExpiredComponent = { remainingTime: 1000 };
      const expiredComponent2: ExpiredComponent = { remainingTime: 500 };

      mockEntityManager.getComponent
        .mockReturnValueOnce(expiredComponent1)
        .mockReturnValueOnce(expiredComponent2);

      expiredEntitySystem.update(100);

      expect(mockEntityManager.getComponent).toHaveBeenCalledWith('entity1', 'expired');
      expect(mockEntityManager.getComponent).toHaveBeenCalledWith('entity2', 'expired');
      expect(expiredComponent1.remainingTime).toBe(900);
      expect(expiredComponent2.remainingTime).toBe(400);
    });

    test('should handle null expired components', () => {
      mockEntityManager.getEntitiesWithComponent.mockReturnValue(['entity1']);
      mockEntityManager.getComponent.mockReturnValue(null);

      expect(() => {
        expiredEntitySystem.update(100);
      }).not.toThrow();

      expect(mockEntityManager.removeEntity).not.toHaveBeenCalled();
    });

    test('should handle undefined expired components', () => {
      mockEntityManager.getEntitiesWithComponent.mockReturnValue(['entity1']);
      mockEntityManager.getComponent.mockReturnValue(undefined);

      expect(() => {
        expiredEntitySystem.update(100);
      }).not.toThrow();

      expect(mockEntityManager.removeEntity).not.toHaveBeenCalled();
    });

    test('should handle variable delta times', () => {
      const expiredComponent: ExpiredComponent = { remainingTime: 1000 };
      mockEntityManager.getEntitiesWithComponent.mockReturnValue(['entity1']);
      mockEntityManager.getComponent.mockReturnValue(expiredComponent);

      // Test different delta values
      expiredEntitySystem.update(0);
      expect(expiredComponent.remainingTime).toBe(1000);

      expiredEntitySystem.update(16.67);
      expect(expiredComponent.remainingTime).toBeCloseTo(983.33, 1);

      expiredEntitySystem.update(500);
      expect(expiredComponent.remainingTime).toBeCloseTo(483.33, 1);
    });

    test('should handle negative delta times', () => {
      const expiredComponent: ExpiredComponent = { remainingTime: 1000 };
      mockEntityManager.getEntitiesWithComponent.mockReturnValue(['entity1']);
      mockEntityManager.getComponent.mockReturnValue(expiredComponent);

      expiredEntitySystem.update(-100);
      expect(expiredComponent.remainingTime).toBe(1100);
    });
  });

  describe('Entity Removal - Without Render System', () => {
    test('should remove entity immediately when time expires without render system', () => {
      const expiredComponent: ExpiredComponent = { remainingTime: 50 };
      mockEntityManager.getEntitiesWithComponent.mockReturnValue(['entity1']);
      mockEntityManager.getComponent.mockReturnValue(expiredComponent);

      expiredEntitySystem.update(100);

      expect(expiredComponent.remainingTime).toBe(-50);
      expect(mockEntityManager.removeEntity).toHaveBeenCalledWith('entity1');
    });

    test('should remove multiple expired entities', () => {
      const expiredComponent1: ExpiredComponent = { remainingTime: 50 };
      const expiredComponent2: ExpiredComponent = { remainingTime: 75 };
      const expiredComponent3: ExpiredComponent = { remainingTime: 150 };

      mockEntityManager.getEntitiesWithComponent.mockReturnValue(['entity1', 'entity2', 'entity3']);
      mockEntityManager.getComponent
        .mockReturnValueOnce(expiredComponent1)
        .mockReturnValueOnce(expiredComponent2)
        .mockReturnValueOnce(expiredComponent3);

      expiredEntitySystem.update(100);

      expect(mockEntityManager.removeEntity).toHaveBeenCalledWith('entity1');
      expect(mockEntityManager.removeEntity).toHaveBeenCalledWith('entity2');
      expect(mockEntityManager.removeEntity).not.toHaveBeenCalledWith('entity3');
      expect(mockEntityManager.removeEntity).toHaveBeenCalledTimes(2);
    });

    test('should handle exact expiration time', () => {
      const expiredComponent: ExpiredComponent = { remainingTime: 100 };
      mockEntityManager.getEntitiesWithComponent.mockReturnValue(['entity1']);
      mockEntityManager.getComponent.mockReturnValue(expiredComponent);

      expiredEntitySystem.update(100);

      expect(expiredComponent.remainingTime).toBe(0);
      expect(mockEntityManager.removeEntity).toHaveBeenCalledWith('entity1');
    });

    test('should not remove entity if time has not expired', () => {
      const expiredComponent: ExpiredComponent = { remainingTime: 150 };
      mockEntityManager.getEntitiesWithComponent.mockReturnValue(['entity1']);
      mockEntityManager.getComponent.mockReturnValue(expiredComponent);

      expiredEntitySystem.update(100);

      expect(expiredComponent.remainingTime).toBe(50);
      expect(mockEntityManager.removeEntity).not.toHaveBeenCalled();
    });
  });

  describe('Entity Removal - With Render System', () => {
    beforeEach(() => {
      expiredEntitySystem.setRenderSystem(mockRenderSystem);
    });

    test('should use render system fade out when available', () => {
      const expiredComponent: ExpiredComponent = { remainingTime: 50 };
      mockEntityManager.getEntitiesWithComponent.mockReturnValue(['entity1']);
      mockEntityManager.getComponent.mockReturnValue(expiredComponent);

      expiredEntitySystem.update(100);

      expect(mockRenderSystem.fadeOutCustomer).toHaveBeenCalledWith('entity1', expect.any(Function));
      expect(mockEntityManager.removeEntity).not.toHaveBeenCalled(); // Should be called by callback
    });

    test('should execute callback to remove entity after fade out', () => {
      const expiredComponent: ExpiredComponent = { remainingTime: 50 };
      mockEntityManager.getEntitiesWithComponent.mockReturnValue(['entity1']);
      mockEntityManager.getComponent.mockReturnValue(expiredComponent);

      // Mock fadeOutCustomer to immediately call the callback
      mockRenderSystem.fadeOutCustomer.mockImplementation((entityId: string, callback: Function) => {
        callback();
      });

      expiredEntitySystem.update(100);

      expect(mockRenderSystem.fadeOutCustomer).toHaveBeenCalledWith('entity1', expect.any(Function));
      expect(mockEntityManager.removeEntity).toHaveBeenCalledWith('entity1');
    });

    test('should handle render system without fadeOutCustomer method', () => {
      const renderSystemWithoutFade = {};
      expiredEntitySystem.setRenderSystem(renderSystemWithoutFade);

      const expiredComponent: ExpiredComponent = { remainingTime: 50 };
      mockEntityManager.getEntitiesWithComponent.mockReturnValue(['entity1']);
      mockEntityManager.getComponent.mockReturnValue(expiredComponent);

      expiredEntitySystem.update(100);

      expect(mockEntityManager.removeEntity).toHaveBeenCalledWith('entity1');
    });

    test('should handle render system with null fadeOutCustomer', () => {
      const renderSystemWithNullFade = { fadeOutCustomer: null };
      expiredEntitySystem.setRenderSystem(renderSystemWithNullFade);

      const expiredComponent: ExpiredComponent = { remainingTime: 50 };
      mockEntityManager.getEntitiesWithComponent.mockReturnValue(['entity1']);
      mockEntityManager.getComponent.mockReturnValue(expiredComponent);

      expiredEntitySystem.update(100);

      expect(mockEntityManager.removeEntity).toHaveBeenCalledWith('entity1');
    });

    test('should handle multiple entities with render system', () => {
      const expiredComponent1: ExpiredComponent = { remainingTime: 50 };
      const expiredComponent2: ExpiredComponent = { remainingTime: 25 };

      mockEntityManager.getEntitiesWithComponent.mockReturnValue(['entity1', 'entity2']);
      mockEntityManager.getComponent
        .mockReturnValueOnce(expiredComponent1)
        .mockReturnValueOnce(expiredComponent2);

      expiredEntitySystem.update(100);

      expect(mockRenderSystem.fadeOutCustomer).toHaveBeenCalledWith('entity1', expect.any(Function));
      expect(mockRenderSystem.fadeOutCustomer).toHaveBeenCalledWith('entity2', expect.any(Function));
      expect(mockRenderSystem.fadeOutCustomer).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle EntityManager errors gracefully', () => {
      mockEntityManager.getEntitiesWithComponent.mockImplementation(() => {
        throw new Error('EntityManager error');
      });

      expect(() => {
        expiredEntitySystem.update(100);
      }).toThrow('EntityManager error');
    });

    test('should handle getComponent errors', () => {
      mockEntityManager.getEntitiesWithComponent.mockReturnValue(['entity1']);
      mockEntityManager.getComponent.mockImplementation(() => {
        throw new Error('Component error');
      });

      expect(() => {
        expiredEntitySystem.update(100);
      }).toThrow('Component error');
    });

    test('should handle removeEntity errors', () => {
      const expiredComponent: ExpiredComponent = { remainingTime: 50 };
      mockEntityManager.getEntitiesWithComponent.mockReturnValue(['entity1']);
      mockEntityManager.getComponent.mockReturnValue(expiredComponent);
      mockEntityManager.removeEntity.mockImplementation(() => {
        throw new Error('Remove entity error');
      });

      expect(() => {
        expiredEntitySystem.update(100);
      }).toThrow('Remove entity error');
    });

    test('should handle render system fadeOut errors', () => {
      expiredEntitySystem.setRenderSystem(mockRenderSystem);
      
      const expiredComponent: ExpiredComponent = { remainingTime: 50 };
      mockEntityManager.getEntitiesWithComponent.mockReturnValue(['entity1']);
      mockEntityManager.getComponent.mockReturnValue(expiredComponent);
      
      mockRenderSystem.fadeOutCustomer.mockImplementation(() => {
        throw new Error('Fade out error');
      });

      expect(() => {
        expiredEntitySystem.update(100);
      }).toThrow('Fade out error');
    });

    test('should handle corrupted expired component data', () => {
      const corruptedComponent = { remainingTime: 'invalid' } as any;
      mockEntityManager.getEntitiesWithComponent.mockReturnValue(['entity1']);
      mockEntityManager.getComponent.mockReturnValue(corruptedComponent);

      expect(() => {
        expiredEntitySystem.update(100);
      }).not.toThrow();

      // String - number results in NaN, not concatenation
      expect(isNaN(corruptedComponent.remainingTime)).toBe(true);
    });

    test('should handle missing remainingTime property', () => {
      const componentWithoutTime = {} as ExpiredComponent;
      mockEntityManager.getEntitiesWithComponent.mockReturnValue(['entity1']);
      mockEntityManager.getComponent.mockReturnValue(componentWithoutTime);

      expect(() => {
        expiredEntitySystem.update(100);
      }).not.toThrow();

      expect(componentWithoutTime.remainingTime).toBeNaN();
    });

    test('should handle very large delta times', () => {
      const expiredComponent: ExpiredComponent = { remainingTime: 1000 };
      mockEntityManager.getEntitiesWithComponent.mockReturnValue(['entity1']);
      mockEntityManager.getComponent.mockReturnValue(expiredComponent);

      expiredEntitySystem.update(Number.MAX_SAFE_INTEGER);

      expect(expiredComponent.remainingTime).toBeLessThan(0);
      expect(mockEntityManager.removeEntity).toHaveBeenCalledWith('entity1');
    });

    test('should handle infinite delta times', () => {
      const expiredComponent: ExpiredComponent = { remainingTime: 1000 };
      mockEntityManager.getEntitiesWithComponent.mockReturnValue(['entity1']);
      mockEntityManager.getComponent.mockReturnValue(expiredComponent);

      expiredEntitySystem.update(Infinity);

      expect(expiredComponent.remainingTime).toBe(-Infinity);
      expect(mockEntityManager.removeEntity).toHaveBeenCalledWith('entity1');
    });
  });

  describe('Performance Tests', () => {
    test('should handle many expired entities efficiently', () => {
      const entityIds = Array.from({ length: 1000 }, (_, i) => `entity-${i}`);
      const expiredComponents = entityIds.map(() => ({ remainingTime: 100 }));

      mockEntityManager.getEntitiesWithComponent.mockReturnValue(entityIds);
      mockEntityManager.getComponent.mockImplementation((id, componentName) => {
        const index = entityIds.indexOf(id);
        return expiredComponents[index];
      });

      const startTime = performance.now();
      expiredEntitySystem.update(50);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should complete quickly
      expect(mockEntityManager.removeEntity).not.toHaveBeenCalled(); // None should expire
    });

    test('should handle frequent updates efficiently', () => {
      const expiredComponent: ExpiredComponent = { remainingTime: 10000 };
      mockEntityManager.getEntitiesWithComponent.mockReturnValue(['entity1']);
      mockEntityManager.getComponent.mockReturnValue(expiredComponent);

      const startTime = performance.now();

      for (let i = 0; i < 1000; i++) {
        expiredEntitySystem.update(1);
      }

      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100);
      expect(expiredComponent.remainingTime).toBe(9000);
    });

    test('should handle rapid entity expiration efficiently', () => {
      const entityIds = Array.from({ length: 100 }, (_, i) => `entity-${i}`);
      const expiredComponents = entityIds.map(() => ({ remainingTime: 10 }));

      mockEntityManager.getEntitiesWithComponent.mockReturnValue(entityIds);
      mockEntityManager.getComponent.mockImplementation((id, componentName) => {
        const index = entityIds.indexOf(id);
        return expiredComponents[index];
      });

      const startTime = performance.now();
      expiredEntitySystem.update(100); // All should expire
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100);
      expect(mockEntityManager.removeEntity).toHaveBeenCalledTimes(100);
    });

    test('should not create memory leaks', () => {
      const initialMemory = process.memoryUsage();

      for (let i = 0; i < 100; i++) {
        const expiredComponent: ExpiredComponent = { remainingTime: 50 };
        mockEntityManager.getEntitiesWithComponent.mockReturnValue([`entity-${i}`]);
        mockEntityManager.getComponent.mockReturnValue(expiredComponent);
        expiredEntitySystem.update(100);
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      expect(memoryIncrease).toBeLessThan(1024 * 1024); // Less than 1MB increase
    });
  });

  describe('Integration Scenarios', () => {
    test('should support realistic customer expiration flow', () => {
      // Customer with patience running out
      const customerComponent: ExpiredComponent = { remainingTime: 200 };
      mockEntityManager.getEntitiesWithComponent.mockReturnValue(['customer_0']);
      mockEntityManager.getComponent.mockReturnValue(customerComponent);

      // Customer gets impatient over time
      expiredEntitySystem.update(50);
      expect(customerComponent.remainingTime).toBe(150);

      expiredEntitySystem.update(100);
      expect(customerComponent.remainingTime).toBe(50);

      // Customer finally leaves
      expiredEntitySystem.update(75);
      expect(customerComponent.remainingTime).toBe(-25);
      expect(mockEntityManager.removeEntity).toHaveBeenCalledWith('customer_0');
    });

    test('should work with animated customer departure', () => {
      expiredEntitySystem.setRenderSystem(mockRenderSystem);

      const customerComponent: ExpiredComponent = { remainingTime: 100 };
      mockEntityManager.getEntitiesWithComponent.mockReturnValue(['customer_0']);
      mockEntityManager.getComponent.mockReturnValue(customerComponent);

      // Simulate animated fade out
      let fadeCallback: Function | undefined;
      mockRenderSystem.fadeOutCustomer.mockImplementation((entityId: string, callback: Function) => {
        fadeCallback = callback;
      });

      expiredEntitySystem.update(150); // Customer expires

      expect(mockRenderSystem.fadeOutCustomer).toHaveBeenCalledWith('customer_0', expect.any(Function));
      expect(mockEntityManager.removeEntity).not.toHaveBeenCalled();

      // Animation completes
      if (fadeCallback) {
        fadeCallback();
      }
      expect(mockEntityManager.removeEntity).toHaveBeenCalledWith('customer_0');
    });

    test('should handle mixed entity lifetimes', () => {
      const component1: ExpiredComponent = { remainingTime: 100 };
      const component2: ExpiredComponent = { remainingTime: 200 };
      const component3: ExpiredComponent = { remainingTime: 300 };

      mockEntityManager.getEntitiesWithComponent.mockReturnValue(['entity1', 'entity2', 'entity3']);
      mockEntityManager.getComponent
        .mockReturnValueOnce(component1)
        .mockReturnValueOnce(component2)
        .mockReturnValueOnce(component3);

      // First update - only entity1 expires
      expiredEntitySystem.update(150);

      expect(component1.remainingTime).toBe(-50);
      expect(component2.remainingTime).toBe(50);
      expect(component3.remainingTime).toBe(150);
      expect(mockEntityManager.removeEntity).toHaveBeenCalledWith('entity1');
      expect(mockEntityManager.removeEntity).toHaveBeenCalledTimes(1);

      // Reset for next update
      jest.clearAllMocks();
      mockEntityManager.getEntitiesWithComponent.mockReturnValue(['entity2', 'entity3']);
      mockEntityManager.getComponent
        .mockReturnValueOnce(component2)
        .mockReturnValueOnce(component3);

      // Second update - entity2 expires
      expiredEntitySystem.update(100);

      expect(component2.remainingTime).toBe(-50);
      expect(component3.remainingTime).toBe(50);
      expect(mockEntityManager.removeEntity).toHaveBeenCalledWith('entity2');
      expect(mockEntityManager.removeEntity).toHaveBeenCalledTimes(1);
    });

    test('should support game state where all customers leave', () => {
      const entities = ['customer_0', 'customer_1', 'customer_2'];
      const components = entities.map(() => ({ remainingTime: 50 }));

      mockEntityManager.getEntitiesWithComponent.mockReturnValue(entities);
      mockEntityManager.getComponent.mockImplementation((id, componentName) => {
        const index = entities.indexOf(id);
        return components[index];
      });

      expiredEntitySystem.update(100); // All customers expire

      expect(mockEntityManager.removeEntity).toHaveBeenCalledTimes(3);
      expect(mockEntityManager.removeEntity).toHaveBeenCalledWith('customer_0');
      expect(mockEntityManager.removeEntity).toHaveBeenCalledWith('customer_1');
      expect(mockEntityManager.removeEntity).toHaveBeenCalledWith('customer_2');
    });
  });
});
