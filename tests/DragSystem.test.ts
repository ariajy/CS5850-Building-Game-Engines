import { DragSystem } from '../src/ecs/systems/DragSystem';
import { EntityManager, Entity } from '../src/ecs/EntityManager';
import { DraggableComponent } from '../src/ecs/components/DraggableComponent';
import { PositionComponent } from '../src/ecs/components/PositionComponent';
import { System } from '../src/ecs/SystemManager';

// Mock Phaser
const mockInput = {
  on: jest.fn(),
  off: jest.fn()
};

const mockScene = {
  input: mockInput,
  events: {
    emit: jest.fn()
  },
  add: {
    container: jest.fn(() => ({
      x: 0,
      y: 0,
      setSize: jest.fn(),
      setInteractive: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      destroy: jest.fn()
    }))
  }
};

describe('DragSystem', () => {
  let dragSystem: DragSystem;
  let mockEntityManager: jest.Mocked<EntityManager>;

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

    // Clear all mocks before creating system to track constructor calls
    jest.clearAllMocks();
    
    dragSystem = new DragSystem(mockScene as any, mockEntityManager);
  });

  describe('Construction and Inheritance', () => {
    test('should extend System class', () => {
      expect(dragSystem).toBeInstanceOf(System);
      expect(dragSystem).toBeInstanceOf(DragSystem);
    });

    test('should store scene and entity manager references', () => {
      expect(dragSystem['scene']).toBe(mockScene);
      expect(dragSystem['entityManager']).toBe(mockEntityManager);
    });

    test('should initialize with default drag state', () => {
      expect(dragSystem['isDragging']).toBe(false);
      expect(dragSystem['draggedEntity']).toBeNull();
    });

    test('should set up input listeners during construction', () => {
      expect(mockInput.on).toHaveBeenCalledWith('pointerdown', expect.any(Function), dragSystem);
      expect(mockInput.on).toHaveBeenCalledWith('pointermove', expect.any(Function), dragSystem);
      expect(mockInput.on).toHaveBeenCalledWith('pointerup', expect.any(Function), dragSystem);
    });

    test('should handle null scene gracefully', () => {
      expect(() => {
        new DragSystem(null as any, mockEntityManager);
      }).toThrow(); // Will throw when trying to access scene.input
    });

    test('should handle null entity manager gracefully', () => {
      expect(() => {
        new DragSystem(mockScene as any, null as any);
      }).not.toThrow(); // Constructor doesn't immediately use entityManager
    });
  });

  describe('Update Method', () => {
    test('should handle update calls without errors', () => {
      expect(() => {
        dragSystem.update(16.67);
      }).not.toThrow();
    });

    test('should handle variable delta times', () => {
      expect(() => {
        dragSystem.update(0);
        dragSystem.update(16.67);
        dragSystem.update(33.33);
        dragSystem.update(1000);
        dragSystem.update(-5);
      }).not.toThrow();
    });

    test('should accept fractional delta times', () => {
      expect(() => {
        dragSystem.update(16.67); // ~60 FPS
        dragSystem.update(8.33);  // ~120 FPS
      }).not.toThrow();
    });
  });

  describe('Pointer Event Handling', () => {
    let onPointerDown: Function;
    let onPointerMove: Function;
    let onPointerUp: Function;

    beforeEach(() => {
      // Extract the event handler functions
      const downCall = mockInput.on.mock.calls.find(call => call[0] === 'pointerdown');
      const moveCall = mockInput.on.mock.calls.find(call => call[0] === 'pointermove');
      const upCall = mockInput.on.mock.calls.find(call => call[0] === 'pointerup');

      onPointerDown = downCall?.[1];
      onPointerMove = moveCall?.[1];
      onPointerUp = upCall?.[1];
    });

    describe('Pointer Down Events', () => {
      test('should handle pointer down without draggable entities', () => {
        mockEntityManager.getEntitiesWithComponent.mockReturnValue([]);

        expect(() => {
          onPointerDown.call(dragSystem, { x: 100, y: 200 });
        }).not.toThrow();

        expect(dragSystem['isDragging']).toBe(false);
        expect(dragSystem['draggedEntity']).toBeNull();
      });

      test('should check for draggable entities on pointer down', () => {
        mockEntityManager.getEntitiesWithComponent.mockReturnValue(['entity1', 'entity2']);
        mockEntityManager.getComponent.mockReturnValue(null);

        onPointerDown.call(dragSystem, { x: 100, y: 200 });

        expect(mockEntityManager.getEntitiesWithComponent).toHaveBeenCalledWith('draggable');
      });

      test('should handle entities with draggable components', () => {
        const mockDraggable: DraggableComponent = {
          isDragging: false,
          originalPosition: { x: 0, y: 0 },
          gameObject: null,
          perfumeName: '',
          dragOffsetX: 0,
          dragOffsetY: 0
        };

        mockEntityManager.getEntitiesWithComponent.mockReturnValue(['entity1']);
        mockEntityManager.getComponent.mockReturnValue(mockDraggable);

        expect(() => {
          onPointerDown.call(dragSystem, { x: 100, y: 200 });
        }).not.toThrow();

        expect(mockEntityManager.getComponent).toHaveBeenCalledWith('entity1', 'draggable');
      });

      test('should handle null draggable components', () => {
        mockEntityManager.getEntitiesWithComponent.mockReturnValue(['entity1']);
        mockEntityManager.getComponent.mockReturnValue(null);

        expect(() => {
          onPointerDown.call(dragSystem, { x: 100, y: 200 });
        }).not.toThrow();
      });

      test('should handle undefined draggable components', () => {
        mockEntityManager.getEntitiesWithComponent.mockReturnValue(['entity1']);
        mockEntityManager.getComponent.mockReturnValue(undefined);

        expect(() => {
          onPointerDown.call(dragSystem, { x: 100, y: 200 });
        }).not.toThrow();
      });

      test('should handle multiple draggable entities', () => {
        const mockDraggable1: DraggableComponent = {
          isDragging: false,
          originalPosition: { x: 0, y: 0 },
          gameObject: null,
          perfumeName: '',
          dragOffsetX: 0,
          dragOffsetY: 0
        };

        const mockDraggable2: DraggableComponent = {
          isDragging: false,
          originalPosition: { x: 0, y: 0 },
          gameObject: null,
          perfumeName: '',
          dragOffsetX: 0,
          dragOffsetY: 0
        };

        mockEntityManager.getEntitiesWithComponent.mockReturnValue(['entity1', 'entity2']);
        mockEntityManager.getComponent
          .mockReturnValueOnce(mockDraggable1)
          .mockReturnValueOnce(mockDraggable2);

        expect(() => {
          onPointerDown.call(dragSystem, { x: 100, y: 200 });
        }).not.toThrow();

        expect(mockEntityManager.getComponent).toHaveBeenCalledWith('entity1', 'draggable');
        expect(mockEntityManager.getComponent).toHaveBeenCalledWith('entity2', 'draggable');
      });
    });

    describe('Pointer Move Events', () => {
      test('should handle pointer move events', () => {
        expect(() => {
          onPointerMove.call(dragSystem, { x: 150, y: 250 });
        }).not.toThrow();
      });

      test('should handle move events when not dragging', () => {
        dragSystem['isDragging'] = false;
        dragSystem['draggedEntity'] = null;

        expect(() => {
          onPointerMove.call(dragSystem, { x: 150, y: 250 });
        }).not.toThrow();
      });

      test('should handle move events when dragging', () => {
        dragSystem['isDragging'] = true;
        dragSystem['draggedEntity'] = 'entity1';

        const mockPosition: PositionComponent = { x: 100, y: 200 };
        mockEntityManager.getComponent.mockReturnValue(mockPosition);

        expect(() => {
          onPointerMove.call(dragSystem, { x: 150, y: 250 });
        }).not.toThrow();
      });

      test('should handle move events with null dragged entity', () => {
        dragSystem['isDragging'] = true;
        dragSystem['draggedEntity'] = null;

        expect(() => {
          onPointerMove.call(dragSystem, { x: 150, y: 250 });
        }).not.toThrow();
      });

      test('should handle move events with invalid entity', () => {
        dragSystem['isDragging'] = true;
        dragSystem['draggedEntity'] = 'invalid-entity';
        mockEntityManager.getComponent.mockReturnValue(null);

        expect(() => {
          onPointerMove.call(dragSystem, { x: 150, y: 250 });
        }).not.toThrow();
      });

      test('should handle extreme pointer coordinates', () => {
        expect(() => {
          onPointerMove.call(dragSystem, { x: Number.MAX_SAFE_INTEGER, y: Number.MIN_SAFE_INTEGER });
          onPointerMove.call(dragSystem, { x: -1000, y: -1000 });
          onPointerMove.call(dragSystem, { x: 0, y: 0 });
        }).not.toThrow();
      });
    });

    describe('Pointer Up Events', () => {
      test('should handle pointer up events', () => {
        expect(() => {
          onPointerUp.call(dragSystem, { x: 150, y: 250 });
        }).not.toThrow();
      });

      test('should handle pointer up when not dragging', () => {
        dragSystem['isDragging'] = false;
        dragSystem['draggedEntity'] = null;

        expect(() => {
          onPointerUp.call(dragSystem, { x: 150, y: 250 });
        }).not.toThrow();
      });

      test('should handle pointer up when dragging', () => {
        dragSystem['isDragging'] = true;
        dragSystem['draggedEntity'] = 'entity1';

        const mockGameObject = {
          setPosition: jest.fn(),
          setDepth: jest.fn(),
          getData: jest.fn(() => null)
        };

        const mockDraggable: DraggableComponent = {
          isDragging: true,
          originalPosition: { x: 100, y: 200 },
          gameObject: mockGameObject as any,
          perfumeName: 'Test Perfume',
          dragOffsetX: 10,
          dragOffsetY: 20
        };

        mockEntityManager.getComponent.mockReturnValue(mockDraggable);

        expect(() => {
          onPointerUp.call(dragSystem, { x: 150, y: 250 });
        }).not.toThrow();
      });

      test('should handle pointer up with null dragged entity', () => {
        dragSystem['isDragging'] = true;
        dragSystem['draggedEntity'] = null;

        expect(() => {
          onPointerUp.call(dragSystem, { x: 150, y: 250 });
        }).not.toThrow();
      });

      test('should handle pointer up with invalid entity', () => {
        dragSystem['isDragging'] = true;
        dragSystem['draggedEntity'] = 'invalid-entity';
        mockEntityManager.getComponent.mockReturnValue(null);

        expect(() => {
          onPointerUp.call(dragSystem, { x: 150, y: 250 });
        }).not.toThrow();
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle EntityManager errors gracefully', () => {
      mockEntityManager.getEntitiesWithComponent.mockImplementation(() => {
        throw new Error('EntityManager error');
      });

      const onPointerDown = mockInput.on.mock.calls.find(call => call[0] === 'pointerdown')?.[1];

      expect(() => {
        onPointerDown.call(dragSystem, { x: 100, y: 200 });
      }).toThrow('EntityManager error');
    });

    test('should handle getComponent errors', () => {
      mockEntityManager.getEntitiesWithComponent.mockReturnValue(['entity1']);
      mockEntityManager.getComponent.mockImplementation(() => {
        throw new Error('Component error');
      });

      const onPointerDown = mockInput.on.mock.calls.find(call => call[0] === 'pointerdown')?.[1];

      expect(() => {
        onPointerDown.call(dragSystem, { x: 100, y: 200 });
      }).toThrow('Component error');
    });

    test('should handle malformed pointer events', () => {
      const onPointerDown = mockInput.on.mock.calls.find(call => call[0] === 'pointerdown')?.[1];
      const onPointerMove = mockInput.on.mock.calls.find(call => call[0] === 'pointermove')?.[1];
      const onPointerUp = mockInput.on.mock.calls.find(call => call[0] === 'pointerup')?.[1];

      mockEntityManager.getEntitiesWithComponent.mockReturnValue([]);

      expect(() => {
        onPointerDown.call(dragSystem, null);
        onPointerDown.call(dragSystem, undefined);
        onPointerDown.call(dragSystem, {});
        onPointerMove.call(dragSystem, null);
        onPointerUp.call(dragSystem, null);
      }).not.toThrow();
    });

    test('should handle corrupted component data', () => {
      const corruptedDraggable = {
        isDragging: null,
        dragOffset: undefined
      };

      mockEntityManager.getEntitiesWithComponent.mockReturnValue(['entity1']);
      mockEntityManager.getComponent.mockReturnValue(corruptedDraggable);

      const onPointerDown = mockInput.on.mock.calls.find(call => call[0] === 'pointerdown')?.[1];

      expect(() => {
        onPointerDown.call(dragSystem, { x: 100, y: 200 });
      }).not.toThrow();
    });
  });

  describe('Performance Tests', () => {
    test('should handle many draggable entities efficiently', () => {
      const entityIds = Array.from({ length: 1000 }, (_, i) => `entity-${i}`);
      mockEntityManager.getEntitiesWithComponent.mockReturnValue(entityIds);
      mockEntityManager.getComponent.mockReturnValue({
        isDragging: false,
        originalPosition: { x: 0, y: 0 },
        gameObject: null,
        perfumeName: '',
        dragOffsetX: 0,
        dragOffsetY: 0
      });

      const onPointerDown = mockInput.on.mock.calls.find(call => call[0] === 'pointerdown')?.[1];

      const startTime = performance.now();
      onPointerDown.call(dragSystem, { x: 100, y: 200 });
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should complete quickly
    });

    test('should handle rapid pointer events efficiently', () => {
      const onPointerMove = mockInput.on.mock.calls.find(call => call[0] === 'pointermove')?.[1];

      const startTime = performance.now();

      for (let i = 0; i < 1000; i++) {
        onPointerMove.call(dragSystem, { x: 100 + i, y: 200 + i });
      }

      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100);
    });

    test('should handle frequent updates efficiently', () => {
      const startTime = performance.now();

      for (let i = 0; i < 1000; i++) {
        dragSystem.update(16.67);
      }

      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe('Integration Tests', () => {
    test('should work with realistic draggable components', () => {
      const mockDraggable: DraggableComponent = {
        isDragging: false,
        originalPosition: { x: 0, y: 0 },
        gameObject: null,
        perfumeName: '',
        dragOffsetX: 0,
        dragOffsetY: 0
      };

      const mockPosition: PositionComponent = {
        x: 100,
        y: 200
      };

      mockEntityManager.getEntitiesWithComponent.mockReturnValue(['dragItem']);
      mockEntityManager.getComponent
        .mockReturnValueOnce(mockDraggable) // For pointer down
        .mockReturnValueOnce(mockPosition); // For pointer move

      const onPointerDown = mockInput.on.mock.calls.find(call => call[0] === 'pointerdown')?.[1];
      const onPointerMove = mockInput.on.mock.calls.find(call => call[0] === 'pointermove')?.[1];
      const onPointerUp = mockInput.on.mock.calls.find(call => call[0] === 'pointerup')?.[1];

      // Simulate drag workflow
      onPointerDown.call(dragSystem, { x: 105, y: 205 });
      onPointerMove.call(dragSystem, { x: 150, y: 250 });
      onPointerUp.call(dragSystem, { x: 200, y: 300 });

      expect(mockEntityManager.getEntitiesWithComponent).toHaveBeenCalledWith('draggable');
    });

    test('should handle multiple drag sessions', () => {
      const mockDraggable: DraggableComponent = {
        isDragging: false,
        originalPosition: { x: 0, y: 0 },
        gameObject: null,
        perfumeName: '',
        dragOffsetX: 0,
        dragOffsetY: 0
      };

      mockEntityManager.getEntitiesWithComponent.mockReturnValue(['item1', 'item2']);
      mockEntityManager.getComponent.mockReturnValue(mockDraggable);

      const onPointerDown = mockInput.on.mock.calls.find(call => call[0] === 'pointerdown')?.[1];
      const onPointerUp = mockInput.on.mock.calls.find(call => call[0] === 'pointerup')?.[1];

      // First drag session
      onPointerDown.call(dragSystem, { x: 100, y: 200 });
      onPointerUp.call(dragSystem, { x: 150, y: 250 });

      // Second drag session
      onPointerDown.call(dragSystem, { x: 200, y: 300 });
      onPointerUp.call(dragSystem, { x: 250, y: 350 });

      expect(mockEntityManager.getEntitiesWithComponent).toHaveBeenCalledTimes(2);
    });

    test('should work with empty component responses', () => {
      mockEntityManager.getEntitiesWithComponent.mockReturnValue([]);

      const onPointerDown = mockInput.on.mock.calls.find(call => call[0] === 'pointerdown')?.[1];

      expect(() => {
        onPointerDown.call(dragSystem, { x: 100, y: 200 });
      }).not.toThrow();

      expect(dragSystem['isDragging']).toBe(false);
    });
  });
});
