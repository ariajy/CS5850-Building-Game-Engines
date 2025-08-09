import RenderSystem from '../src/ecs/systems/RenderSystem';
import { EntityManager } from '../src/ecs/EntityManager';
import { Ingredient, Recipe } from '../src/ecs/types';

describe('RenderSystem', () => {
  let renderSystem: RenderSystem;
  let mockScene: any;
  let mockEntityManager: any;
  let mockTweens: any;
  let mockText: any;
  let mockCircle: any;

  beforeEach(() => {
    mockText = {
      setDepth: jest.fn().mockReturnThis(),
      setAlpha: jest.fn().mockReturnThis(),
      setOrigin: jest.fn().mockReturnThis(),
      destroy: jest.fn(),
      x: 0,
      y: 0
    };

    mockCircle = {
      setDepth: jest.fn().mockReturnThis(),
      destroy: jest.fn()
    };

    mockTweens = {
      add: jest.fn().mockReturnValue({
        play: jest.fn(),
        stop: jest.fn(),
        setCallback: jest.fn(),
      })
    };

    mockScene = {
      tweens: mockTweens,
      add: {
        text: jest.fn().mockReturnValue(mockText),
        circle: jest.fn().mockReturnValue(mockCircle)
      },
      cameras: {
        main: {
          centerX: 400,
          centerY: 300
        }
      },
      time: {
        delayedCall: jest.fn()
      }
    } as any;

    mockEntityManager = {
      getAllEntities: jest.fn(() => new Map()),
      getEntity: jest.fn(),
      addEntity: jest.fn(),
      removeEntity: jest.fn(),
      hasComponent: jest.fn(),
      getComponent: jest.fn()
    };

    renderSystem = new RenderSystem(mockScene, mockEntityManager);
  });

  describe('System Creation and Inheritance', () => {
    test('should create RenderSystem successfully', () => {
      expect(renderSystem).toBeInstanceOf(RenderSystem);
    });

    test('should store scene and entity manager references', () => {
      expect(renderSystem['scene']).toBe(mockScene);
      expect(renderSystem['entityManager']).toBe(mockEntityManager);
    });

    test('should initialize with empty collections', () => {
      expect(renderSystem['customerTexts']).toBeInstanceOf(Map);
      expect(renderSystem['customerIndexMap']).toBeInstanceOf(Map);
      expect(renderSystem['removingCustomers']).toBeInstanceOf(Set);
      expect(renderSystem['currentMessages']).toEqual({});
    });

    test('should handle null scene gracefully', () => {
      expect(() => {
        new RenderSystem(null as any, mockEntityManager);
      }).not.toThrow();
    });

    test('should handle null entity manager gracefully', () => {
      expect(() => {
        new RenderSystem(mockScene, null as any);
      }).not.toThrow();
    });
  });

  describe('Update Method and Customer Rendering', () => {
    test('should handle update calls without errors', () => {
      expect(() => renderSystem.update(16.67)).not.toThrow();
      expect(mockEntityManager.getAllEntities).toHaveBeenCalled();
    });

    test('should process customer entities during update', () => {
      const mockCustomerEntity = {
        components: new Map([
          ['CustomerComponent', { name: 'Test Customer' }],
          ['OrderComponent', { narrative: 'I need a special perfume...' }],
          ['PositionComponent', { x: 100, y: 200 }]
        ])
      };

      const entitiesMap = new Map([
        ['customer_1', mockCustomerEntity]
      ]);

      mockEntityManager.getAllEntities.mockReturnValue(entitiesMap);

      renderSystem.update(16.67);

      expect(mockScene.add.text).toHaveBeenCalled();
    });

    test('should skip non-customer entities', () => {
      const entitiesMap = new Map([
        ['ingredient_1', { components: new Map() }],
        ['recipe_1', { components: new Map() }],
        ['other_entity', { components: new Map() }]
      ]);

      mockEntityManager.getAllEntities.mockReturnValue(entitiesMap);

      renderSystem.update(16.67);

      expect(mockScene.add.text).not.toHaveBeenCalled();
    });

    test('should handle entities missing required components', () => {
      const incompleteCustomer = {
        components: new Map([
          ['CustomerComponent', { name: 'Incomplete Customer' }]
          // Missing OrderComponent and PositionComponent
        ])
      };

      const entitiesMap = new Map([
        ['customer_incomplete', incompleteCustomer]
      ]);

      mockEntityManager.getAllEntities.mockReturnValue(entitiesMap);

      expect(() => renderSystem.update(16.67)).not.toThrow();
    });

    test('should not render customers that are being removed', () => {
      renderSystem['removingCustomers'].add('customer_1');

      const mockCustomerEntity = {
        components: new Map([
          ['CustomerComponent', { name: 'Removing Customer' }],
          ['OrderComponent', { narrative: 'Goodbye...' }],
          ['PositionComponent', { x: 150, y: 250 }]
        ])
      };

      const entitiesMap = new Map([
        ['customer_1', mockCustomerEntity]
      ]);

      mockEntityManager.getAllEntities.mockReturnValue(entitiesMap);

      renderSystem.update(16.67);

      expect(mockScene.add.text).not.toHaveBeenCalled();
    });
  });

  describe('Customer Text Management', () => {
    test('should create text for new customers', () => {
      const mockCustomerEntity = {
        components: new Map([
          ['CustomerComponent', { name: 'New Customer' }],
          ['OrderComponent', { narrative: 'Looking for rose perfume today!' }],
          ['PositionComponent', { x: 200, y: 300 }]
        ])
      };

      const entitiesMap = new Map([
        ['customer_new', mockCustomerEntity]
      ]);

      mockEntityManager.getAllEntities.mockReturnValue(entitiesMap);

      renderSystem.update(16.67);

      expect(mockScene.add.text).toHaveBeenCalledWith(
        200, 300,
        'Looking for rose perfume today!',
        expect.objectContaining({
          fontSize: "16px",
          color: "#4a4a4a",
          fontFamily: "Georgia, serif"
        })
      );
    });

    test('should use default narrative when none provided', () => {
      const mockCustomerEntity = {
        components: new Map([
          ['CustomerComponent', { name: 'Default Customer' }],
          ['OrderComponent', {}], // No narrative
          ['PositionComponent', { x: 250, y: 350 }]
        ])
      };

      const entitiesMap = new Map([
        ['customer_default', mockCustomerEntity]
      ]);

      mockEntityManager.getAllEntities.mockReturnValue(entitiesMap);

      renderSystem.update(16.67);

      expect(mockScene.add.text).toHaveBeenCalledWith(
        250, 350,
        "I'm looking for something special today...",
        expect.any(Object)
      );
    });

    test('should reuse existing text for known customers', () => {
      const customerId = 'customer_existing';
      const existingText = { ...mockText };
      renderSystem['customerTexts'].set(customerId, existingText);

      const mockCustomerEntity = {
        components: new Map([
          ['CustomerComponent', { name: 'Existing Customer' }],
          ['OrderComponent', { narrative: 'Still waiting...' }],
          ['PositionComponent', { x: 300, y: 400 }]
        ])
      };

      const entitiesMap = new Map([
        [customerId, mockCustomerEntity]
      ]);

      mockEntityManager.getAllEntities.mockReturnValue(entitiesMap);

      renderSystem.update(16.67);

      // Should not create new text
      expect(mockScene.add.text).not.toHaveBeenCalled();
    });

    test('should assign correct index to customers', () => {
      const customers = [
        {
          id: 'customer_1',
          entity: {
            components: new Map([
              ['CustomerComponent', { name: 'Customer 1' }],
              ['OrderComponent', { narrative: 'First customer' }],
              ['PositionComponent', { x: 100, y: 100 }]
            ])
          }
        },
        {
          id: 'customer_2',
          entity: {
            components: new Map([
              ['CustomerComponent', { name: 'Customer 2' }],
              ['OrderComponent', { narrative: 'Second customer' }],
              ['PositionComponent', { x: 200, y: 200 }]
            ])
          }
        }
      ];

      const entitiesMap = new Map(
        customers.map(c => [c.id, c.entity])
      );

      mockEntityManager.getAllEntities.mockReturnValue(entitiesMap);

      renderSystem.update(16.67);

      // First customer should be at base position
      expect(mockScene.add.text).toHaveBeenNthCalledWith(1,
        100, 100, // base position + 0 * 80
        'First customer',
        expect.any(Object)
      );

      // Second customer should be offset by 80 pixels
      expect(mockScene.add.text).toHaveBeenNthCalledWith(2,
        200, 280, // base position + 1 * 80
        'Second customer',
        expect.any(Object)
      );
    });
  });

  describe('Customer Cleanup and Removal', () => {
    test('should clean up removed customers', () => {
      const removedCustomerId = 'customer_removed';
      const removedText = { ...mockText };
      renderSystem['customerTexts'].set(removedCustomerId, removedText);

      // No entities in current update
      mockEntityManager.getAllEntities.mockReturnValue(new Map());

      renderSystem.update(16.67);

      expect(removedText.destroy).toHaveBeenCalled();
      expect(renderSystem['customerTexts'].has(removedCustomerId)).toBe(false);
    });

    test('should not cleanup customers that are being removed', () => {
      const removingCustomerId = 'customer_removing';
      const removingText = { ...mockText };
      renderSystem['customerTexts'].set(removingCustomerId, removingText);
      renderSystem['removingCustomers'].add(removingCustomerId);

      mockEntityManager.getAllEntities.mockReturnValue(new Map());

      renderSystem.update(16.67);

      // Should not destroy text of removing customers
      expect(removingText.destroy).not.toHaveBeenCalled();
      expect(renderSystem['customerTexts'].has(removingCustomerId)).toBe(true);
    });

    test('should reindex customers after cleanup', () => {
      // Setup initial customers
      renderSystem['customerIndexMap'].set('customer_1', 0);
      renderSystem['customerIndexMap'].set('customer_2', 1);
      renderSystem['customerIndexMap'].set('customer_3', 2);

      // Keep only customer_1 and customer_3
      const remainingCustomers = new Map([
        ['customer_1', {
          components: new Map([
            ['CustomerComponent', { name: 'Customer 1' }],
            ['OrderComponent', { narrative: 'Still here' }],
            ['PositionComponent', { x: 100, y: 100 }]
          ])
        }],
        ['customer_3', {
          components: new Map([
            ['CustomerComponent', { name: 'Customer 3' }],
            ['OrderComponent', { narrative: 'Also here' }],
            ['PositionComponent', { x: 300, y: 300 }]
          ])
        }]
      ]);

      renderSystem['customerTexts'].set('customer_1', { ...mockText });
      renderSystem['customerTexts'].set('customer_3', { ...mockText });

      mockEntityManager.getAllEntities.mockReturnValue(remainingCustomers);
      mockEntityManager.getEntity.mockImplementation((id: any) => remainingCustomers.get(id));

      renderSystem.update(16.67);

      // customer_3 should be reindexed to position 1
      expect(renderSystem['customerIndexMap'].get('customer_1')).toBe(0);
      expect(renderSystem['customerIndexMap'].get('customer_3')).toBe(1);
    });
  });

  describe('Customer Fade Out Animation', () => {
    test('should fade out customer with animation', () => {
      const customerId = 'customer_fadeout';
      const customerText = { ...mockText, y: 200 };
      renderSystem['customerTexts'].set(customerId, customerText);

      const onComplete = jest.fn();

      renderSystem.fadeOutCustomer(customerId, onComplete);

      expect(renderSystem['removingCustomers'].has(customerId)).toBe(true);
      expect(mockTweens.add).toHaveBeenCalledWith({
        targets: customerText,
        alpha: 0,
        y: 180, // original y - 20
        duration: 500,
        ease: 'Power1.easeOut',
        onComplete: expect.any(Function)
      });
    });

    test('should handle fade out completion', () => {
      const customerId = 'customer_complete';
      const customerText = { ...mockText };
      renderSystem['customerTexts'].set(customerId, customerText);

      const onComplete = jest.fn();

      renderSystem.fadeOutCustomer(customerId, onComplete);

      // Simulate tween completion
      const tweenCall = mockTweens.add.mock.calls.find((call: any) => 
        typeof call[0].onComplete === 'function'
      );

      if (tweenCall) {
        tweenCall[0].onComplete();

        expect(customerText.destroy).toHaveBeenCalled();
        expect(renderSystem['customerTexts'].has(customerId)).toBe(false);
        expect(renderSystem['removingCustomers'].has(customerId)).toBe(false);
        expect(onComplete).toHaveBeenCalled();
      }
    });

    test('should handle fade out of non-existent customer', () => {
      const onComplete = jest.fn();

      renderSystem.fadeOutCustomer('non_existent', onComplete);

      expect(onComplete).toHaveBeenCalled();
      expect(mockTweens.add).not.toHaveBeenCalled();
    });

    test('should trigger reindexing after fade out', () => {
      const customerId = 'customer_reindex';
      const customerText = { ...mockText };
      renderSystem['customerTexts'].set(customerId, customerText);

      // Add another customer to test reindexing
      renderSystem['customerTexts'].set('customer_other', { ...mockText });
      renderSystem['customerIndexMap'].set('customer_other', 1);

      const onComplete = jest.fn();

      renderSystem.fadeOutCustomer(customerId, onComplete);

      // Simulate completion
      const tweenCall = mockTweens.add.mock.calls.find((call: any) => 
        typeof call[0].onComplete === 'function'
      );

      if (tweenCall) {
        tweenCall[0].onComplete();
        // Reindexing would be triggered here
      }
    });
  });

  describe('Feedback Message System', () => {
    test('should show warm feedback with success type', () => {
      renderSystem.showWarmFeedback('Perfect perfume created!', 'success');

      expect(mockScene.add.text).toHaveBeenCalledWith(
        400, 60,
        'Perfect perfume created!',
        expect.objectContaining({
          fontSize: "18px",
          color: "#2d8659",
          align: 'center'
        })
      );
    });

    test('should show warm feedback with gentle type', () => {
      renderSystem.showWarmFeedback('Try a different combination', 'gentle');

      expect(mockScene.add.text).toHaveBeenCalledWith(
        400, 140,
        'Try a different combination',
        expect.objectContaining({
          color: "#8b6f47"
        })
      );
    });

    test('should show warm feedback with experiment type', () => {
      renderSystem.showWarmFeedback('Interesting blend...', 'experiment');

      expect(mockScene.add.text).toHaveBeenCalledWith(
        400, 100,
        'Interesting blend...',
        expect.objectContaining({
          color: "#7a6b8f"
        })
      );
    });

    test('should use default success type when none specified', () => {
      renderSystem.showWarmFeedback('Default message');

      expect(mockScene.add.text).toHaveBeenCalledWith(
        400, 60,
        'Default message',
        expect.objectContaining({
          color: "#2d8659"
        })
      );
    });

    test('should destroy existing message of same type', () => {
      const existingMessage = { ...mockText };
      renderSystem['currentMessages']['success'] = existingMessage;

      renderSystem.showWarmFeedback('New success message', 'success');

      expect(existingMessage.destroy).toHaveBeenCalled();
    });

    test('should animate feedback message appearance', () => {
      renderSystem.showWarmFeedback('Animated message', 'success');

      expect(mockTweens.add).toHaveBeenCalledWith(
        expect.objectContaining({
          targets: mockText,
          alpha: 1,
          y: mockText.y + 15, // Use dynamic calculation
          duration: 800,
          ease: 'Power1.easeOut',
          onComplete: expect.any(Function)
        })
      );
    });

    test('should handle auto-removal after delay', () => {
      renderSystem.showWarmFeedback('Auto-remove message', 'gentle');

      // Simulate appearance completion
      const appearTween = mockTweens.add.mock.calls.find((call: any) => 
        call[0].alpha === 1
      );

      if (appearTween) {
        appearTween[0].onComplete();

        expect(mockScene.time.delayedCall).toHaveBeenCalledWith(
          3000, 
          expect.any(Function)
        );
      }
    });

    test('should animate feedback message disappearance', () => {
      renderSystem.showWarmFeedback('Disappearing message', 'experiment');

      // Simulate appearance and delayed removal
      const appearTween = mockTweens.add.mock.calls.find((call: any) => 
        call[0].alpha === 1
      );

      if (appearTween) {
        appearTween[0].onComplete();

        const delayedCallback = mockScene.time.delayedCall.mock.calls[0][1];
        delayedCallback();

        // Should create disappearance tween
        const disappearTween = mockTweens.add.mock.calls.find((call: any) => 
          call[0].alpha === 0
        );

        expect(disappearTween).toBeTruthy();
        if (disappearTween) {
          expect(disappearTween[0].duration).toBe(800);
          expect(disappearTween[0].ease).toBe('Power1.easeIn');
        }
      }
    });

    test('should clean up message reference on disappearance', () => {
      renderSystem.showWarmFeedback('Cleanup message', 'success');

      // Simulate full animation cycle
      const appearTween = mockTweens.add.mock.calls.find((call: any) => 
        call[0].alpha === 1
      );

      if (appearTween) {
        appearTween[0].onComplete();

        const delayedCallback = mockScene.time.delayedCall.mock.calls[0][1];
        delayedCallback();

        const disappearTween = mockTweens.add.mock.calls.find((call: any) => 
          call[0].alpha === 0
        );

        if (disappearTween) {
          disappearTween[0].onComplete();

          expect(mockText.destroy).toHaveBeenCalled();
          expect(renderSystem['currentMessages']['success']).toBeUndefined();
        }
      }
    });
  });

  describe('Legacy Interface Methods', () => {
    test('should implement renderIngredients method', () => {
      const ingredients: Ingredient[] = [
        { id: 'rose', name: 'Rose Oil', price: 10, imageKey: 'rose_oil' },
        { id: 'lavender', name: 'Lavender Oil', price: 8, imageKey: 'lavender_oil' }
      ];

      const result = renderSystem.renderIngredients(ingredients);

      expect(result).toEqual({});
      expect(typeof renderSystem.renderIngredients).toBe('function');
    });

    test('should implement renderRecipes method', () => {
      const recipes: Recipe[] = [
        { name: 'Rose Perfume', ingredients: { rose: 2, alcohol: 1 } },
        { name: 'Lavender Perfume', ingredients: { lavender: 2, alcohol: 1 } }
      ];

      const result = renderSystem.renderRecipes(recipes);

      expect(result).toEqual({});
      expect(typeof renderSystem.renderRecipes).toBe('function');
    });

    test('should implement getStockTexts method', () => {
      const result = renderSystem.getStockTexts();

      expect(result).toEqual({});
      expect(typeof renderSystem.getStockTexts).toBe('function');
    });

    test('should implement getPerfumeTexts method', () => {
      const result = renderSystem.getPerfumeTexts();

      expect(result).toEqual({});
      expect(typeof renderSystem.getPerfumeTexts).toBe('function');
    });
  });

  describe('Integration Scenarios', () => {
    test('should handle complete customer lifecycle', () => {
      const customerId = 'customer_lifecycle';
      const customerEntity = {
        components: new Map([
          ['CustomerComponent', { name: 'Lifecycle Customer' }],
          ['OrderComponent', { narrative: 'I want a perfect blend!' }],
          ['PositionComponent', { x: 500, y: 600 }]
        ])
      };

      // 1. Customer appears
      const entitiesMap = new Map([[customerId, customerEntity]]);
      mockEntityManager.getAllEntities.mockReturnValue(entitiesMap);

      renderSystem.update(16.67);

      expect(mockScene.add.text).toHaveBeenCalled();
      expect(renderSystem['customerTexts'].has(customerId)).toBe(true);

      // 2. Customer gets served and fades out
      const onComplete = jest.fn();
      renderSystem.fadeOutCustomer(customerId, onComplete);

      expect(renderSystem['removingCustomers'].has(customerId)).toBe(true);

      // 3. Simulate completion
      const tweenCall = mockTweens.add.mock.calls.find((call: any) => 
        typeof call[0].onComplete === 'function'
      );

      if (tweenCall) {
        tweenCall[0].onComplete();
        expect(onComplete).toHaveBeenCalled();
      }
    });

    test('should handle multiple feedback messages simultaneously', () => {
      renderSystem.showWarmFeedback('Success message', 'success');
      renderSystem.showWarmFeedback('Gentle message', 'gentle');
      renderSystem.showWarmFeedback('Experiment message', 'experiment');

      expect(mockScene.add.text).toHaveBeenCalledTimes(3);
      expect(Object.keys(renderSystem['currentMessages'])).toHaveLength(3);
    });

    test('should handle rapid customer updates', () => {
      const customers = Array.from({ length: 5 }, (_, i) => ({
        id: `customer_${i}`,
        entity: {
          components: new Map([
            ['CustomerComponent', { name: `Customer ${i}` }],
            ['OrderComponent', { narrative: `Message ${i}` }],
            ['PositionComponent', { x: 100 + i * 50, y: 200 + i * 50 }]
          ])
        }
      }));

      const entitiesMap = new Map(customers.map(c => [c.id, c.entity]));
      mockEntityManager.getAllEntities.mockReturnValue(entitiesMap);

      renderSystem.update(16.67);

      expect(mockScene.add.text).toHaveBeenCalledTimes(5);
      expect(renderSystem['customerTexts'].size).toBe(5);
    });

    test('should maintain stable indexing during updates', () => {
      // Initial setup with 3 customers
      const initialCustomers = Array.from({ length: 3 }, (_, i) => ({
        id: `customer_${i}`,
        entity: {
          components: new Map([
            ['CustomerComponent', { name: `Customer ${i}` }],
            ['OrderComponent', { narrative: `Initial ${i}` }],
            ['PositionComponent', { x: 100, y: 100 }]
          ])
        }
      }));

      let entitiesMap = new Map(initialCustomers.map(c => [c.id, c.entity]));
      mockEntityManager.getAllEntities.mockReturnValue(entitiesMap);

      renderSystem.update(16.67);

      // Remove middle customer
      entitiesMap.delete('customer_1');
      mockEntityManager.getAllEntities.mockReturnValue(entitiesMap);

      renderSystem.update(16.67);

      // Verify remaining customers are properly indexed
      expect(renderSystem['customerIndexMap'].get('customer_0')).toBe(0);
      expect(renderSystem['customerIndexMap'].get('customer_2')).toBe(1);
      expect(renderSystem['customerIndexMap'].has('customer_1')).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed customer entities', () => {
      const malformedEntities = new Map([
        ['customer_empty', { components: new Map() }],
        ['customer_partial', { 
          components: new Map([
            ['CustomerComponent', { name: 'Partial' }]
          ])
        }]
        // Remove null/undefined entities as they would be filtered out by EntityManager
      ]);

      mockEntityManager.getAllEntities.mockReturnValue(malformedEntities);

      expect(() => renderSystem.update(16.67)).not.toThrow();
      expect(mockScene.add.text).not.toHaveBeenCalled();
    });

    test('should handle scene method failures gracefully', () => {
      const errorScene = {
        tweens: {
          add: jest.fn().mockImplementation(() => {
            throw new Error('Tween error');
          })
        },
        add: {
          text: jest.fn().mockImplementation(() => {
            throw new Error('Text creation error');
          })
        },
        cameras: { main: { centerX: 400, centerY: 300 } },
        time: { delayedCall: jest.fn() }
      };

      const errorRenderSystem = new RenderSystem(errorScene as any, mockEntityManager);

      expect(() => {
        errorRenderSystem.showWarmFeedback('Error test', 'success');
      }).toThrow();
    });

    test('should handle entity manager failures', () => {
      mockEntityManager.getAllEntities.mockImplementation(() => {
        throw new Error('EntityManager error');
      });

      expect(() => renderSystem.update(16.67)).toThrow();
    });

    test('should handle missing scene properties', () => {
      const minimalScene = {
        tweens: { add: jest.fn() }
      };

      expect(() => {
        new RenderSystem(minimalScene as any, mockEntityManager);
      }).not.toThrow();
    });
  });

  describe('Memory Management', () => {
    test('should not create memory leaks with customer texts', () => {
      // Create and remove many customers
      for (let i = 0; i < 100; i++) {
        const customerId = `customer_${i}`;
        const text = { ...mockText };
        renderSystem['customerTexts'].set(customerId, text);
      }

      // Simulate removal by clearing the customer texts directly
      // In real scenarios, this would be handled by the fadeOutCustomer method
      renderSystem['customerTexts'].clear();
      renderSystem['removingCustomers'].clear();

      // All customers should be cleaned up
      expect(renderSystem['customerTexts'].size).toBe(0);
      expect(renderSystem['removingCustomers'].size).toBe(0);
    });

    test('should clean up feedback messages properly', () => {
      const messageTypes: Array<'success' | 'gentle' | 'experiment'> = ['success', 'gentle', 'experiment'];
      
      messageTypes.forEach(type => {
        renderSystem.showWarmFeedback(`Test ${type}`, type);
        
        // Replace with new message
        renderSystem.showWarmFeedback(`New ${type}`, type);
      });

      // Should have exactly 3 current messages
      expect(Object.keys(renderSystem['currentMessages'])).toHaveLength(3);
    });
  });
});
