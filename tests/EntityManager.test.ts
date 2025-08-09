import { EntityManager, Entity } from '../src/ecs/EntityManager';

describe('EntityManager', () => {
  let entityManager: EntityManager;

  beforeEach(() => {
    // Reset singleton instance for each test
    (EntityManager as any).instance = undefined;
    entityManager = EntityManager.getInstance();
  });

  afterEach(() => {
    // Clean up singleton instance
    (EntityManager as any).instance = undefined;
  });

  describe('Singleton Pattern', () => {
    test('should return the same instance on multiple calls', () => {
      const instance1 = EntityManager.getInstance();
      const instance2 = EntityManager.getInstance();

      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(EntityManager);
    });

    test('should maintain state across getInstance calls', () => {
      const manager1 = EntityManager.getInstance();
      const entityId = manager1.createEntity();

      const manager2 = EntityManager.getInstance();
      const entity = manager2.getEntity(entityId);

      expect(entity).toBeDefined();
      expect(entity!.id).toBe(entityId);
    });
  });

  describe('Entity Creation', () => {
    test('should create entity with unique ID', () => {
      const entityId = entityManager.createEntity();

      expect(entityId).toBeDefined();
      expect(typeof entityId).toBe('string');
      expect(entityId).toMatch(/^entity_\d+$/);
    });

    test('should create multiple entities with unique IDs', () => {
      const entity1 = entityManager.createEntity();
      const entity2 = entityManager.createEntity();
      const entity3 = entityManager.createEntity();

      expect(entity1).not.toBe(entity2);
      expect(entity2).not.toBe(entity3);
      expect(entity1).not.toBe(entity3);

      expect(entity1).toBe('entity_0');
      expect(entity2).toBe('entity_1');
      expect(entity3).toBe('entity_2');
    });

    test('should create entity with proper structure', () => {
      const entityId = entityManager.createEntity();
      const entity = entityManager.getEntity(entityId);

      expect(entity).toBeDefined();
      expect(entity!.id).toBe(entityId);
      expect(entity!.components).toBeInstanceOf(Map);
      expect(entity!.components.size).toBe(0);
    });

    test('should increment entity ID counter correctly', () => {
      const firstId = entityManager.createEntity();
      const secondId = entityManager.createEntity();

      expect(firstId).toBe('entity_0');
      expect(secondId).toBe('entity_1');
    });
  });

  describe('Entity Addition', () => {
    test('should add custom entity successfully', () => {
      const customEntity: Entity = {
        id: 'custom_entity_1',
        components: new Map([
          ['Position', { x: 100, y: 200 }],
          ['Velocity', { dx: 5, dy: -3 }]
        ])
      };

      entityManager.addEntity(customEntity);

      const retrieved = entityManager.getEntity('custom_entity_1');
      expect(retrieved).toEqual(customEntity);
      expect(retrieved!.components.get('Position')).toEqual({ x: 100, y: 200 });
    });

    test('should overwrite existing entity with same ID', () => {
      const entity1: Entity = {
        id: 'test_entity',
        components: new Map([['Position', { x: 10, y: 20 }]])
      };

      const entity2: Entity = {
        id: 'test_entity',
        components: new Map([['Velocity', { dx: 5, dy: 3 }]])
      };

      entityManager.addEntity(entity1);
      entityManager.addEntity(entity2);

      const retrieved = entityManager.getEntity('test_entity');
      expect(retrieved).toEqual(entity2);
      expect(retrieved!.components.has('Position')).toBe(false);
      expect(retrieved!.components.has('Velocity')).toBe(true);
    });

    test('should handle entity with empty components map', () => {
      const emptyEntity: Entity = {
        id: 'empty_entity',
        components: new Map()
      };

      entityManager.addEntity(emptyEntity);

      const retrieved = entityManager.getEntity('empty_entity');
      expect(retrieved).toEqual(emptyEntity);
      expect(retrieved!.components.size).toBe(0);
    });
  });

  describe('Entity Retrieval', () => {
    test('should retrieve existing entity', () => {
      const entityId = entityManager.createEntity();
      const entity = entityManager.getEntity(entityId);

      expect(entity).toBeDefined();
      expect(entity!.id).toBe(entityId);
    });

    test('should return undefined for non-existent entity', () => {
      const entity = entityManager.getEntity('non_existent');

      expect(entity).toBeUndefined();
    });

    test('should retrieve entity with components', () => {
      const customEntity: Entity = {
        id: 'test_entity',
        components: new Map([
          ['Position', { x: 50, y: 75 }],
          ['Health', { hp: 100, maxHp: 100 }]
        ])
      };

      entityManager.addEntity(customEntity);
      const retrieved = entityManager.getEntity('test_entity');

      expect(retrieved).toBeDefined();
      expect(retrieved!.components.get('Position')).toEqual({ x: 50, y: 75 });
      expect(retrieved!.components.get('Health')).toEqual({ hp: 100, maxHp: 100 });
    });
  });

  describe('Entity Existence Checking', () => {
    test('should return true for existing entity', () => {
      const entityId = entityManager.createEntity();

      expect(entityManager.hasEntity(entityId)).toBe(true);
    });

    test('should return false for non-existent entity', () => {
      expect(entityManager.hasEntity('non_existent')).toBe(false);
    });

    test('should return false after entity removal', () => {
      const entityId = entityManager.createEntity();
      entityManager.removeEntity(entityId);

      expect(entityManager.hasEntity(entityId)).toBe(false);
    });
  });

  describe('Entity Removal', () => {
    test('should remove existing entity successfully', () => {
      const entityId = entityManager.createEntity();

      const removed = entityManager.removeEntity(entityId);

      expect(removed).toBe(true);
      expect(entityManager.getEntity(entityId)).toBeUndefined();
      expect(entityManager.hasEntity(entityId)).toBe(false);
    });

    test('should return false when removing non-existent entity', () => {
      const removed = entityManager.removeEntity('non_existent');

      expect(removed).toBe(false);
    });

    test('should not affect other entities when removing one', () => {
      const entity1Id = entityManager.createEntity();
      const entity2Id = entityManager.createEntity();

      entityManager.removeEntity(entity1Id);

      expect(entityManager.hasEntity(entity1Id)).toBe(false);
      expect(entityManager.hasEntity(entity2Id)).toBe(true);
    });
  });

  describe('Get All Entities', () => {
    test('should return empty map when no entities exist', () => {
      const entities = entityManager.getAllEntities();

      expect(entities).toBeInstanceOf(Map);
      expect(entities.size).toBe(0);
    });

    test('should return all existing entities', () => {
      const entity1Id = entityManager.createEntity();
      const entity2Id = entityManager.createEntity();

      const entities = entityManager.getAllEntities();

      expect(entities.size).toBe(2);
      expect(entities.has(entity1Id)).toBe(true);
      expect(entities.has(entity2Id)).toBe(true);
    });

    test('should return copy of entities map', () => {
      const entity1Id = entityManager.createEntity();
      const entities = entityManager.getAllEntities();

      // Modify the returned map
      entities.delete(entity1Id);

      // Original should remain unchanged
      expect(entityManager.hasEntity(entity1Id)).toBe(true);
    });

    test('should reflect current state of entities', () => {
      const entity1Id = entityManager.createEntity();
      const entity2Id = entityManager.createEntity();

      let entities = entityManager.getAllEntities();
      expect(entities.size).toBe(2);

      entityManager.removeEntity(entity1Id);

      entities = entityManager.getAllEntities();
      expect(entities.size).toBe(1);
      expect(entities.has(entity2Id)).toBe(true);
    });
  });

  describe('Component Queries', () => {
    test('should find entities with specific component', () => {
      const entity1: Entity = {
        id: 'entity1',
        components: new Map([
          ['Position', { x: 10, y: 20 }],
          ['Velocity', { dx: 5, dy: 3 }]
        ])
      };

      const entity2: Entity = {
        id: 'entity2',
        components: new Map([
          ['Position', { x: 30, y: 40 }],
          ['Health', { hp: 100 }]
        ])
      };

      const entity3: Entity = {
        id: 'entity3',
        components: new Map([
          ['Velocity', { dx: -2, dy: 1 }]
        ])
      };

      entityManager.addEntity(entity1);
      entityManager.addEntity(entity2);
      entityManager.addEntity(entity3);

      const entitiesWithPosition = entityManager.getEntitiesWithComponent('Position');
      const entitiesWithVelocity = entityManager.getEntitiesWithComponent('Velocity');
      const entitiesWithHealth = entityManager.getEntitiesWithComponent('Health');

      expect(entitiesWithPosition).toHaveLength(2);
      expect(entitiesWithPosition).toContain('entity1');
      expect(entitiesWithPosition).toContain('entity2');

      expect(entitiesWithVelocity).toHaveLength(2);
      expect(entitiesWithVelocity).toContain('entity1');
      expect(entitiesWithVelocity).toContain('entity3');

      expect(entitiesWithHealth).toHaveLength(1);
      expect(entitiesWithHealth).toContain('entity2');
    });

    test('should return empty array for non-existent component', () => {
      const entity1Id = entityManager.createEntity();
      const entities = entityManager.getEntitiesWithComponent('NonExistent');

      expect(entities).toEqual([]);
    });

    test('should return empty array when no entities have the component', () => {
      const entity: Entity = {
        id: 'test_entity',
        components: new Map([['Position', { x: 10, y: 20 }]])
      };

      entityManager.addEntity(entity);
      const entities = entityManager.getEntitiesWithComponent('Velocity');

      expect(entities).toEqual([]);
    });
  });

  describe('Component Retrieval', () => {
    test('should retrieve component from entity', () => {
      const entity: Entity = {
        id: 'test_entity',
        components: new Map([
          ['Position', { x: 100, y: 200 }],
          ['Health', { hp: 75, maxHp: 100 }]
        ])
      };

      entityManager.addEntity(entity);

      const position = entityManager.getComponent('test_entity', 'Position');
      const health = entityManager.getComponent('test_entity', 'Health');

      expect(position).toEqual({ x: 100, y: 200 });
      expect(health).toEqual({ hp: 75, maxHp: 100 });
    });

    test('should return undefined for non-existent component', () => {
      const entity: Entity = {
        id: 'test_entity',
        components: new Map([['Position', { x: 100, y: 200 }]])
      };

      entityManager.addEntity(entity);

      const velocity = entityManager.getComponent('test_entity', 'Velocity');

      expect(velocity).toBeUndefined();
    });

    test('should return undefined for non-existent entity', () => {
      const component = entityManager.getComponent('non_existent', 'Position');

      expect(component).toBeUndefined();
    });

    test('should support generic type retrieval', () => {
      interface PositionComponent {
        x: number;
        y: number;
      }

      const entity: Entity = {
        id: 'test_entity',
        components: new Map([['Position', { x: 50, y: 75 }]])
      };

      entityManager.addEntity(entity);

      const position = entityManager.getComponent<PositionComponent>('test_entity', 'Position');

      expect(position).toBeDefined();
      expect(position!.x).toBe(50);
      expect(position!.y).toBe(75);
    });
  });

  describe('Entity ID Generation', () => {
    test('should generate sequential IDs', () => {
      const ids: string[] = [];

      for (let i = 0; i < 10; i++) {
        ids.push(entityManager.createEntity());
      }

      ids.forEach((id, index) => {
        expect(id).toBe(`entity_${index}`);
      });
    });

    test('should continue ID sequence after removal', () => {
      const entity1 = entityManager.createEntity(); // entity_0
      const entity2 = entityManager.createEntity(); // entity_1

      entityManager.removeEntity(entity1);

      const entity3 = entityManager.createEntity(); // entity_2 (continues sequence)

      expect(entity3).toBe('entity_2');
    });
  });

  describe('Performance and Edge Cases', () => {
    test('should handle large numbers of entities efficiently', () => {
      const startTime = performance.now();
      const entityIds: string[] = [];

      for (let i = 0; i < 1000; i++) {
        entityIds.push(entityManager.createEntity());
      }

      const endTime = performance.now();

      expect(entityIds).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(100); // Should complete quickly
    });

    test('should handle rapid entity creation and removal', () => {
      for (let i = 0; i < 100; i++) {
        const entityId = entityManager.createEntity();
        expect(entityManager.hasEntity(entityId)).toBe(true);

        entityManager.removeEntity(entityId);
        expect(entityManager.hasEntity(entityId)).toBe(false);
      }
    });

    test('should handle entities with complex component data', () => {
      const complexComponent = {
        nested: {
          deep: {
            value: 42,
            array: [1, 2, 3, { key: 'value' }]
          }
        },
        function: function() { return 'test'; }
      };

      const entity: Entity = {
        id: 'complex_entity',
        components: new Map([['Complex', complexComponent]])
      };

      entityManager.addEntity(entity);

      const retrieved = entityManager.getComponent('complex_entity', 'Complex') as any;
      expect(retrieved.nested.deep.value).toBe(42);
      expect(retrieved.nested.deep.array).toHaveLength(4);
      expect(typeof retrieved.function).toBe('function');
      expect(retrieved.function()).toBe('test');
    });

    test('should handle null and undefined component values', () => {
      const entity: Entity = {
        id: 'test_entity',
        components: new Map([
          ['NullComponent', null],
          ['UndefinedComponent', undefined]
        ])
      };

      entityManager.addEntity(entity);

      expect(entityManager.getComponent('test_entity', 'NullComponent')).toBeNull();
      expect(entityManager.getComponent('test_entity', 'UndefinedComponent')).toBeUndefined();
    });

    test('should handle empty string entity IDs', () => {
      const entity: Entity = {
        id: '',
        components: new Map([['Position', { x: 10, y: 20 }]])
      };

      entityManager.addEntity(entity);

      expect(entityManager.hasEntity('')).toBe(true);
      expect(entityManager.getComponent('', 'Position')).toEqual({ x: 10, y: 20 });
    });
  });

  describe('Data Integrity', () => {
    test('should maintain component data integrity', () => {
      const originalData = { x: 10, y: 20, metadata: { type: 'player' } };
      const entity: Entity = {
        id: 'test_entity',
        components: new Map([['Position', originalData]])
      };

      entityManager.addEntity(entity);

      const retrieved = entityManager.getComponent('test_entity', 'Position') as any;
      
      // Modify retrieved data
      retrieved.x = 100;
      retrieved.metadata.type = 'enemy';

      // Original entity data should be affected (objects are passed by reference)
      const retrievedAgain = entityManager.getComponent('test_entity', 'Position') as any;
      expect(retrievedAgain.x).toBe(100);
      expect(retrievedAgain.metadata.type).toBe('enemy');
    });

    test('should handle concurrent access patterns', () => {
      const entity1Id = entityManager.createEntity();
      const entity2Id = entityManager.createEntity();

      const allEntities = entityManager.getAllEntities();
      const entitiesWithComponent = entityManager.getEntitiesWithComponent('Position');

      // Operations shouldn't interfere with each other
      expect(allEntities.size).toBe(2);
      expect(entitiesWithComponent).toHaveLength(0);
    });
  });
});
