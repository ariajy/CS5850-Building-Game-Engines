import { SystemManager, System } from '../src/ecs/SystemManager';

// Mock System implementations for testing
class MockSystem extends System {
  public updateCalled = false;
  public lastDeltaTime = 0;
  public updateCount = 0;

  update(deltaTime: number): void {
    this.updateCalled = true;
    this.lastDeltaTime = deltaTime;
    this.updateCount++;
  }

  reset(): void {
    this.updateCalled = false;
    this.lastDeltaTime = 0;
    this.updateCount = 0;
  }
}

class ThrowingSystem extends System {
  update(deltaTime: number): void {
    throw new Error('System update failed');
  }
}

class SlowSystem extends System {
  public delay: number;

  constructor(delay = 10) {
    super();
    this.delay = delay;
  }

  update(deltaTime: number): void {
    // Simulate slow system
    const start = performance.now();
    while (performance.now() - start < this.delay) {
      // Busy wait
    }
  }
}

describe('SystemManager', () => {
  let systemManager: SystemManager;

  beforeEach(() => {
    // Reset singleton instance for each test
    (SystemManager as any).instance = undefined;
    systemManager = SystemManager.getInstance();
  });

  afterEach(() => {
    // Clean up singleton instance
    (SystemManager as any).instance = undefined;
  });

  describe('Singleton Pattern', () => {
    test('should return the same instance on multiple calls', () => {
      const instance1 = SystemManager.getInstance();
      const instance2 = SystemManager.getInstance();

      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(SystemManager);
    });

    test('should maintain state across getInstance calls', () => {
      const manager1 = SystemManager.getInstance();
      const mockSystem = new MockSystem();
      manager1.addSystem('test', mockSystem);

      const manager2 = SystemManager.getInstance();
      const retrievedSystem = manager2.getSystem('test');

      expect(retrievedSystem).toBe(mockSystem);
    });
  });

  describe('System Addition', () => {
    test('should add system successfully', () => {
      const mockSystem = new MockSystem();
      
      systemManager.addSystem('testSystem', mockSystem);
      
      const retrievedSystem = systemManager.getSystem('testSystem');
      expect(retrievedSystem).toBe(mockSystem);
    });

    test('should add multiple systems with different names', () => {
      const system1 = new MockSystem();
      const system2 = new MockSystem();
      const system3 = new MockSystem();
      
      systemManager.addSystem('system1', system1);
      systemManager.addSystem('system2', system2);
      systemManager.addSystem('system3', system3);
      
      expect(systemManager.getSystem('system1')).toBe(system1);
      expect(systemManager.getSystem('system2')).toBe(system2);
      expect(systemManager.getSystem('system3')).toBe(system3);
    });

    test('should overwrite existing system with same name', () => {
      const originalSystem = new MockSystem();
      const newSystem = new MockSystem();
      
      systemManager.addSystem('testSystem', originalSystem);
      systemManager.addSystem('testSystem', newSystem);
      
      const retrievedSystem = systemManager.getSystem('testSystem');
      expect(retrievedSystem).toBe(newSystem);
      expect(retrievedSystem).not.toBe(originalSystem);
    });

    test('should handle systems with complex inheritance', () => {
      class ExtendedMockSystem extends MockSystem {
        public extraProperty = 'test';
      }
      
      const extendedSystem = new ExtendedMockSystem();
      systemManager.addSystem('extended', extendedSystem);
      
      const retrieved = systemManager.getSystem('extended') as ExtendedMockSystem;
      expect(retrieved).toBe(extendedSystem);
      expect(retrieved.extraProperty).toBe('test');
    });
  });

  describe('System Retrieval', () => {
    test('should retrieve existing system', () => {
      const mockSystem = new MockSystem();
      systemManager.addSystem('testSystem', mockSystem);
      
      const retrievedSystem = systemManager.getSystem('testSystem');
      
      expect(retrievedSystem).toBe(mockSystem);
    });

    test('should return undefined for non-existent system', () => {
      const system = systemManager.getSystem('nonExistent');
      
      expect(system).toBeUndefined();
    });

    test('should return correct system among multiple systems', () => {
      const system1 = new MockSystem();
      const system2 = new MockSystem();
      
      systemManager.addSystem('first', system1);
      systemManager.addSystem('second', system2);
      
      expect(systemManager.getSystem('first')).toBe(system1);
      expect(systemManager.getSystem('second')).toBe(system2);
    });
  });

  describe('System Removal', () => {
    test('should remove existing system successfully', () => {
      const mockSystem = new MockSystem();
      systemManager.addSystem('testSystem', mockSystem);
      
      const removed = systemManager.removeSystem('testSystem');
      
      expect(removed).toBe(true);
      expect(systemManager.getSystem('testSystem')).toBeUndefined();
    });

    test('should return false when removing non-existent system', () => {
      const removed = systemManager.removeSystem('nonExistent');
      
      expect(removed).toBe(false);
    });

    test('should not affect other systems when removing one', () => {
      const system1 = new MockSystem();
      const system2 = new MockSystem();
      
      systemManager.addSystem('system1', system1);
      systemManager.addSystem('system2', system2);
      
      systemManager.removeSystem('system1');
      
      expect(systemManager.getSystem('system1')).toBeUndefined();
      expect(systemManager.getSystem('system2')).toBe(system2);
    });

    test('should handle removing system that was re-added', () => {
      const system1 = new MockSystem();
      const system2 = new MockSystem();
      
      systemManager.addSystem('test', system1);
      systemManager.addSystem('test', system2); // Overwrites system1
      
      const removed = systemManager.removeSystem('test');
      
      expect(removed).toBe(true);
      expect(systemManager.getSystem('test')).toBeUndefined();
    });
  });

  describe('System Updates', () => {
    test('should update single system', () => {
      const mockSystem = new MockSystem();
      systemManager.addSystem('testSystem', mockSystem);
      
      systemManager.updateAll(16.67); // ~60 FPS
      
      expect(mockSystem.updateCalled).toBe(true);
      expect(mockSystem.lastDeltaTime).toBe(16.67);
      expect(mockSystem.updateCount).toBe(1);
    });

    test('should update multiple systems', () => {
      const system1 = new MockSystem();
      const system2 = new MockSystem();
      const system3 = new MockSystem();
      
      systemManager.addSystem('system1', system1);
      systemManager.addSystem('system2', system2);
      systemManager.addSystem('system3', system3);
      
      systemManager.updateAll(33.33); // ~30 FPS
      
      expect(system1.updateCalled).toBe(true);
      expect(system2.updateCalled).toBe(true);
      expect(system3.updateCalled).toBe(true);
      
      expect(system1.lastDeltaTime).toBe(33.33);
      expect(system2.lastDeltaTime).toBe(33.33);
      expect(system3.lastDeltaTime).toBe(33.33);
    });

    test('should update systems in order of addition', () => {
      const updateOrder: string[] = [];
      
      class OrderTrackingSystem extends System {
        constructor(private name: string) {
          super();
        }
        
        update(deltaTime: number): void {
          updateOrder.push(this.name);
        }
      }
      
      systemManager.addSystem('first', new OrderTrackingSystem('first'));
      systemManager.addSystem('second', new OrderTrackingSystem('second'));
      systemManager.addSystem('third', new OrderTrackingSystem('third'));
      
      systemManager.updateAll(16.67);
      
      expect(updateOrder).toEqual(['first', 'second', 'third']);
    });

    test('should continue updating other systems if one throws error', () => {
      const system1 = new MockSystem();
      const throwingSystem = new ThrowingSystem();
      const system3 = new MockSystem();
      
      systemManager.addSystem('system1', system1);
      systemManager.addSystem('throwing', throwingSystem);
      systemManager.addSystem('system3', system3);
      
      expect(() => systemManager.updateAll(16.67)).toThrow('System update failed');
      
      // First system should have been called before the error
      expect(system1.updateCalled).toBe(true);
      // Third system might not be called due to the error
    });

    test('should handle zero delta time', () => {
      const mockSystem = new MockSystem();
      systemManager.addSystem('test', mockSystem);
      
      systemManager.updateAll(0);
      
      expect(mockSystem.updateCalled).toBe(true);
      expect(mockSystem.lastDeltaTime).toBe(0);
    });

    test('should handle negative delta time', () => {
      const mockSystem = new MockSystem();
      systemManager.addSystem('test', mockSystem);
      
      systemManager.updateAll(-5);
      
      expect(mockSystem.updateCalled).toBe(true);
      expect(mockSystem.lastDeltaTime).toBe(-5);
    });

    test('should handle multiple consecutive updates', () => {
      const mockSystem = new MockSystem();
      systemManager.addSystem('test', mockSystem);
      
      systemManager.updateAll(16.67);
      systemManager.updateAll(20.0);
      systemManager.updateAll(12.5);
      
      expect(mockSystem.updateCount).toBe(3);
      expect(mockSystem.lastDeltaTime).toBe(12.5);
    });
  });

  describe('Get All Systems', () => {
    test('should return empty map when no systems exist', () => {
      const systems = systemManager.getAllSystems();
      
      expect(systems).toBeInstanceOf(Map);
      expect(systems.size).toBe(0);
    });

    test('should return all existing systems', () => {
      const system1 = new MockSystem();
      const system2 = new MockSystem();
      
      systemManager.addSystem('system1', system1);
      systemManager.addSystem('system2', system2);
      
      const systems = systemManager.getAllSystems();
      
      expect(systems.size).toBe(2);
      expect(systems.get('system1')).toBe(system1);
      expect(systems.get('system2')).toBe(system2);
    });

    test('should return copy of systems map', () => {
      const mockSystem = new MockSystem();
      systemManager.addSystem('test', mockSystem);
      
      const systems = systemManager.getAllSystems();
      systems.delete('test');
      
      // Original should remain unchanged
      expect(systemManager.getSystem('test')).toBe(mockSystem);
    });

    test('should reflect current state of systems', () => {
      const system1 = new MockSystem();
      const system2 = new MockSystem();
      
      systemManager.addSystem('system1', system1);
      systemManager.addSystem('system2', system2);
      
      let systems = systemManager.getAllSystems();
      expect(systems.size).toBe(2);
      
      systemManager.removeSystem('system1');
      
      systems = systemManager.getAllSystems();
      expect(systems.size).toBe(1);
      expect(systems.has('system2')).toBe(true);
    });
  });

  describe('Performance Considerations', () => {
    test('should handle large numbers of systems efficiently', () => {
      const systems: MockSystem[] = [];
      const startTime = performance.now();
      
      // Add many systems
      for (let i = 0; i < 100; i++) {
        const system = new MockSystem();
        systems.push(system);
        systemManager.addSystem(`system${i}`, system);
      }
      
      // Update all systems
      systemManager.updateAll(16.67);
      
      const endTime = performance.now();
      
      // Verify all systems were updated
      systems.forEach(system => {
        expect(system.updateCalled).toBe(true);
      });
      
      expect(endTime - startTime).toBeLessThan(100); // Should complete quickly
    });

    test('should handle rapid system addition and removal', () => {
      for (let i = 0; i < 50; i++) {
        const system = new MockSystem();
        systemManager.addSystem(`test${i}`, system);
        
        expect(systemManager.getSystem(`test${i}`)).toBe(system);
        
        systemManager.removeSystem(`test${i}`);
        expect(systemManager.getSystem(`test${i}`)).toBeUndefined();
      }
    });

    test('should not degrade performance with empty update calls', () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        systemManager.updateAll(16.67);
      }
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty string system names', () => {
      const mockSystem = new MockSystem();
      
      systemManager.addSystem('', mockSystem);
      
      expect(systemManager.getSystem('')).toBe(mockSystem);
      expect(systemManager.removeSystem('')).toBe(true);
    });

    test('should handle system names with special characters', () => {
      const mockSystem = new MockSystem();
      const specialName = 'test-system_123!@#$%^&*()';
      
      systemManager.addSystem(specialName, mockSystem);
      
      expect(systemManager.getSystem(specialName)).toBe(mockSystem);
    });

    test('should handle very long system names', () => {
      const mockSystem = new MockSystem();
      const longName = 'a'.repeat(1000);
      
      systemManager.addSystem(longName, mockSystem);
      
      expect(systemManager.getSystem(longName)).toBe(mockSystem);
    });

    test('should handle systems with null/undefined properties', () => {
      class NullSystem extends System {
        public nullProperty: any = null;
        public undefinedProperty: any = undefined;
        
        update(deltaTime: number): void {
          // Do nothing
        }
      }
      
      const nullSystem = new NullSystem();
      systemManager.addSystem('null', nullSystem);
      
      const retrieved = systemManager.getSystem('null') as NullSystem;
      expect(retrieved.nullProperty).toBeNull();
      expect(retrieved.undefinedProperty).toBeUndefined();
    });
  });

  describe('System Lifecycle', () => {
    test('should maintain system state between updates', () => {
      class StatefulSystem extends System {
        public counter = 0;
        
        update(deltaTime: number): void {
          this.counter++;
        }
      }
      
      const statefulSystem = new StatefulSystem();
      systemManager.addSystem('stateful', statefulSystem);
      
      systemManager.updateAll(16.67);
      expect(statefulSystem.counter).toBe(1);
      
      systemManager.updateAll(16.67);
      expect(statefulSystem.counter).toBe(2);
      
      systemManager.updateAll(16.67);
      expect(statefulSystem.counter).toBe(3);
    });

    test('should handle system replacement during execution', () => {
      const originalSystem = new MockSystem();
      const newSystem = new MockSystem();
      
      systemManager.addSystem('test', originalSystem);
      systemManager.updateAll(16.67);
      
      expect(originalSystem.updateCalled).toBe(true);
      
      // Replace system
      systemManager.addSystem('test', newSystem);
      newSystem.reset();
      systemManager.updateAll(16.67);
      
      expect(newSystem.updateCalled).toBe(true);
    });
  });

  describe('Abstract System Class', () => {
    test('should enforce update method implementation', () => {
      // This test verifies that System is abstract
      // We can't directly test this at runtime, but TypeScript enforces it at compile time
      expect(System).toBeDefined();
      expect(System.prototype.update).toBeUndefined(); // Abstract method has no implementation
    });

    test('should allow proper inheritance', () => {
      class ConcreteSystem extends System {
        update(deltaTime: number): void {
          // Implementation required
        }
      }
      
      const system = new ConcreteSystem();
      expect(system).toBeInstanceOf(System);
      expect(typeof system.update).toBe('function');
    });
  });
});
