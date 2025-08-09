import { ComponentManager } from '../src/ecs/ComponentManager';

describe('ComponentManager', () => {
  let componentManager: ComponentManager;

  beforeEach(() => {
    // Reset singleton instance for each test
    (ComponentManager as any).instance = undefined;
    componentManager = ComponentManager.getInstance();
  });

  afterEach(() => {
    // Clean up singleton instance
    (ComponentManager as any).instance = undefined;
  });

  describe('Singleton Pattern', () => {
    test('should return the same instance on multiple calls', () => {
      const instance1 = ComponentManager.getInstance();
      const instance2 = ComponentManager.getInstance();

      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(ComponentManager);
    });

    test('should maintain state across getInstance calls', () => {
      const manager1 = ComponentManager.getInstance();
      manager1.addComponent('entity1', 'Position', { x: 10, y: 20 });

      const manager2 = ComponentManager.getInstance();
      const component = manager2.getComponent('entity1', 'Position');

      expect(component).toEqual({ x: 10, y: 20 });
    });
  });

  describe('Component Management', () => {
    test('should add component to entity', () => {
      const positionData = { x: 100, y: 200 };
      
      componentManager.addComponent('entity1', 'Position', positionData);
      
      const retrievedComponent = componentManager.getComponent('entity1', 'Position');
      expect(retrievedComponent).toEqual(positionData);
    });

    test('should add multiple components to same entity', () => {
      const positionData = { x: 100, y: 200 };
      const velocityData = { dx: 5, dy: -3 };
      
      componentManager.addComponent('entity1', 'Position', positionData);
      componentManager.addComponent('entity1', 'Velocity', velocityData);
      
      expect(componentManager.getComponent('entity1', 'Position')).toEqual(positionData);
      expect(componentManager.getComponent('entity1', 'Velocity')).toEqual(velocityData);
    });

    test('should add same component type to multiple entities', () => {
      const position1 = { x: 10, y: 20 };
      const position2 = { x: 30, y: 40 };
      
      componentManager.addComponent('entity1', 'Position', position1);
      componentManager.addComponent('entity2', 'Position', position2);
      
      expect(componentManager.getComponent('entity1', 'Position')).toEqual(position1);
      expect(componentManager.getComponent('entity2', 'Position')).toEqual(position2);
    });

    test('should overwrite existing component data', () => {
      const initialData = { x: 10, y: 20 };
      const updatedData = { x: 50, y: 60 };
      
      componentManager.addComponent('entity1', 'Position', initialData);
      componentManager.addComponent('entity1', 'Position', updatedData);
      
      expect(componentManager.getComponent('entity1', 'Position')).toEqual(updatedData);
    });
  });

  describe('Component Retrieval', () => {
    test('should return undefined for non-existent component', () => {
      const component = componentManager.getComponent('entity1', 'NonExistent');
      
      expect(component).toBeUndefined();
    });

    test('should return undefined for non-existent entity', () => {
      componentManager.addComponent('entity1', 'Position', { x: 10, y: 20 });
      
      const component = componentManager.getComponent('entity2', 'Position');
      
      expect(component).toBeUndefined();
    });

    test('should return correct component for valid entity and type', () => {
      const data = { health: 100, maxHealth: 100 };
      
      componentManager.addComponent('player', 'Health', data);
      
      expect(componentManager.getComponent('player', 'Health')).toEqual(data);
    });
  });

  describe('Component Existence Checking', () => {
    test('should return true for existing component', () => {
      componentManager.addComponent('entity1', 'Position', { x: 10, y: 20 });
      
      expect(componentManager.hasComponent('entity1', 'Position')).toBe(true);
    });

    test('should return false for non-existent component', () => {
      expect(componentManager.hasComponent('entity1', 'Position')).toBe(false);
    });

    test('should return false for non-existent entity', () => {
      componentManager.addComponent('entity1', 'Position', { x: 10, y: 20 });
      
      expect(componentManager.hasComponent('entity2', 'Position')).toBe(false);
    });

    test('should return false after component removal', () => {
      componentManager.addComponent('entity1', 'Position', { x: 10, y: 20 });
      componentManager.removeComponent('entity1', 'Position');
      
      expect(componentManager.hasComponent('entity1', 'Position')).toBe(false);
    });
  });

  describe('Component Removal', () => {
    test('should remove existing component successfully', () => {
      componentManager.addComponent('entity1', 'Position', { x: 10, y: 20 });
      
      const removed = componentManager.removeComponent('entity1', 'Position');
      
      expect(removed).toBe(true);
      expect(componentManager.getComponent('entity1', 'Position')).toBeUndefined();
    });

    test('should return false when removing non-existent component', () => {
      const removed = componentManager.removeComponent('entity1', 'Position');
      
      expect(removed).toBe(false);
    });

    test('should return false when removing from non-existent entity', () => {
      componentManager.addComponent('entity1', 'Position', { x: 10, y: 20 });
      
      const removed = componentManager.removeComponent('entity2', 'Position');
      
      expect(removed).toBe(false);
    });

    test('should not affect other entities when removing component', () => {
      const position1 = { x: 10, y: 20 };
      const position2 = { x: 30, y: 40 };
      
      componentManager.addComponent('entity1', 'Position', position1);
      componentManager.addComponent('entity2', 'Position', position2);
      
      componentManager.removeComponent('entity1', 'Position');
      
      expect(componentManager.getComponent('entity1', 'Position')).toBeUndefined();
      expect(componentManager.getComponent('entity2', 'Position')).toEqual(position2);
    });
  });

  describe('Entity Queries', () => {
    test('should return entities with specific component', () => {
      componentManager.addComponent('entity1', 'Position', { x: 10, y: 20 });
      componentManager.addComponent('entity2', 'Position', { x: 30, y: 40 });
      componentManager.addComponent('entity3', 'Velocity', { dx: 5, dy: 3 });
      
      const entitiesWithPosition = componentManager.getEntitiesWithComponent('Position');
      
      expect(entitiesWithPosition).toHaveLength(2);
      expect(entitiesWithPosition).toContain('entity1');
      expect(entitiesWithPosition).toContain('entity2');
      expect(entitiesWithPosition).not.toContain('entity3');
    });

    test('should return empty array for non-existent component type', () => {
      const entities = componentManager.getEntitiesWithComponent('NonExistent');
      
      expect(entities).toEqual([]);
    });

    test('should return empty array when no entities have the component', () => {
      componentManager.addComponent('entity1', 'Position', { x: 10, y: 20 });
      
      const entities = componentManager.getEntitiesWithComponent('Velocity');
      
      expect(entities).toEqual([]);
    });

    test('should update query results after adding components', () => {
      componentManager.addComponent('entity1', 'Position', { x: 10, y: 20 });
      
      let entities = componentManager.getEntitiesWithComponent('Position');
      expect(entities).toHaveLength(1);
      
      componentManager.addComponent('entity2', 'Position', { x: 30, y: 40 });
      
      entities = componentManager.getEntitiesWithComponent('Position');
      expect(entities).toHaveLength(2);
    });

    test('should update query results after removing components', () => {
      componentManager.addComponent('entity1', 'Position', { x: 10, y: 20 });
      componentManager.addComponent('entity2', 'Position', { x: 30, y: 40 });
      
      let entities = componentManager.getEntitiesWithComponent('Position');
      expect(entities).toHaveLength(2);
      
      componentManager.removeComponent('entity1', 'Position');
      
      entities = componentManager.getEntitiesWithComponent('Position');
      expect(entities).toHaveLength(1);
      expect(entities).toContain('entity2');
    });
  });

  describe('Bulk Operations', () => {
    test('should remove all components from entity', () => {
      componentManager.addComponent('entity1', 'Position', { x: 10, y: 20 });
      componentManager.addComponent('entity1', 'Velocity', { dx: 5, dy: 3 });
      componentManager.addComponent('entity1', 'Health', { hp: 100 });
      componentManager.addComponent('entity2', 'Position', { x: 30, y: 40 });
      
      componentManager.removeAllComponents('entity1');
      
      expect(componentManager.getComponent('entity1', 'Position')).toBeUndefined();
      expect(componentManager.getComponent('entity1', 'Velocity')).toBeUndefined();
      expect(componentManager.getComponent('entity1', 'Health')).toBeUndefined();
      expect(componentManager.getComponent('entity2', 'Position')).toEqual({ x: 30, y: 40 });
    });

    test('should handle removing all components from non-existent entity', () => {
      expect(() => componentManager.removeAllComponents('nonexistent')).not.toThrow();
    });

    test('should handle removing all components from entity with no components', () => {
      componentManager.addComponent('entity1', 'Position', { x: 10, y: 20 });
      componentManager.removeComponent('entity1', 'Position');
      
      expect(() => componentManager.removeAllComponents('entity1')).not.toThrow();
    });
  });

  describe('Data Types and Complex Objects', () => {
    test('should handle primitive data types', () => {
      componentManager.addComponent('entity1', 'Score', 100);
      componentManager.addComponent('entity2', 'Name', 'Player');
      componentManager.addComponent('entity3', 'Active', true);
      
      expect(componentManager.getComponent('entity1', 'Score')).toBe(100);
      expect(componentManager.getComponent('entity2', 'Name')).toBe('Player');
      expect(componentManager.getComponent('entity3', 'Active')).toBe(true);
    });

    test('should handle complex nested objects', () => {
      const complexData = {
        stats: {
          health: 100,
          mana: 50,
          attributes: {
            strength: 10,
            agility: 15
          }
        },
        inventory: ['sword', 'potion', 'key']
      };
      
      componentManager.addComponent('player', 'Character', complexData);
      
      const retrieved = componentManager.getComponent('player', 'Character');
      expect(retrieved).toEqual(complexData);
      expect(retrieved.stats.attributes.strength).toBe(10);
      expect(retrieved.inventory).toHaveLength(3);
    });

    test('should handle arrays and objects with methods', () => {
      const dataWithMethods = {
        values: [1, 2, 3],
        getValue: function(index: number) { return this.values[index]; }
      };
      
      componentManager.addComponent('entity1', 'Data', dataWithMethods);
      
      const retrieved = componentManager.getComponent('entity1', 'Data');
      expect(retrieved.values).toEqual([1, 2, 3]);
      expect(typeof retrieved.getValue).toBe('function');
      expect(retrieved.getValue(1)).toBe(2);
    });
  });

  describe('Performance and Edge Cases', () => {
    test('should handle large numbers of entities efficiently', () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        componentManager.addComponent(`entity${i}`, 'Position', { x: i, y: i * 2 });
      }
      
      const entities = componentManager.getEntitiesWithComponent('Position');
      
      const endTime = performance.now();
      
      expect(entities).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(100); // Should complete quickly
    });

    test('should handle rapid component additions and removals', () => {
      const entityId = 'testEntity';
      
      for (let i = 0; i < 100; i++) {
        componentManager.addComponent(entityId, 'Position', { x: i, y: i });
        expect(componentManager.hasComponent(entityId, 'Position')).toBe(true);
        
        componentManager.removeComponent(entityId, 'Position');
        expect(componentManager.hasComponent(entityId, 'Position')).toBe(false);
      }
    });

    test('should handle null and undefined component data', () => {
      componentManager.addComponent('entity1', 'NullData', null);
      componentManager.addComponent('entity2', 'UndefinedData', undefined);
      
      expect(componentManager.getComponent('entity1', 'NullData')).toBeNull();
      expect(componentManager.getComponent('entity2', 'UndefinedData')).toBeUndefined();
      expect(componentManager.hasComponent('entity1', 'NullData')).toBe(true);
      expect(componentManager.hasComponent('entity2', 'UndefinedData')).toBe(true);
    });

    test('should handle empty string entity IDs and component types', () => {
      componentManager.addComponent('', 'Position', { x: 10, y: 20 });
      componentManager.addComponent('entity1', '', { data: 'test' });
      
      expect(componentManager.getComponent('', 'Position')).toEqual({ x: 10, y: 20 });
      expect(componentManager.getComponent('entity1', '')).toEqual({ data: 'test' });
    });
  });
});
