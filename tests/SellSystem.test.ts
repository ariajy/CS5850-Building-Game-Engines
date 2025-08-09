import { SellSystem } from '../src/ecs/systems/SellSystem';
import { EntityManager } from '../src/ecs/EntityManager';
import { EconomySystem } from '../src/ecs/systems/EconomySystem';
import InventorySystem from '../src/ecs/systems/InventorySystem';
import { OrderComponent } from '../src/ecs/components/OrderComponent';

describe('SellSystem', () => {
  let sellSystem: SellSystem;
  let mockScene: any;
  let mockEntityManager: any;
  let mockEconomySystem: any;
  let mockInventorySystem: any;
  let mockAudioSystem: any;
  let mockDragSystem: any;
  let mockText: any;
  let mockCircle: any;

  beforeEach(() => {
    mockText = {
      setOrigin: jest.fn().mockReturnThis(),
      setAlpha: jest.fn().mockReturnThis(),
      destroy: jest.fn(),
      y: 50
    };

    mockCircle = {
      setAlpha: jest.fn().mockReturnThis(),
      destroy: jest.fn()
    };

    mockScene = {
      events: {
        on: jest.fn(),
        emit: jest.fn(),
      },
      add: {
        text: jest.fn().mockReturnValue(mockText),
        circle: jest.fn().mockReturnValue(mockCircle)
      },
      tweens: {
        add: jest.fn()
      },
      time: {
        delayedCall: jest.fn()
      },
      cameras: {
        main: {
          centerX: 400,
          width: 800
        }
      }
    };

    mockEntityManager = {
      getEntitiesWithComponent: jest.fn(() => []),
      getEntity: jest.fn(),
      removeEntity: jest.fn()
    };

    mockEconomySystem = {
      addGold: jest.fn()
    };

    mockInventorySystem = {
      getPerfumeQuantity: jest.fn(() => 5),
      removePerfume: jest.fn(() => true)
    };

    mockAudioSystem = {
      playMoneySound: jest.fn()
    };

    mockDragSystem = {
      confirmDrop: jest.fn(),
      cancelDrop: jest.fn()
    };

    sellSystem = new SellSystem(mockScene, mockEntityManager, mockEconomySystem, mockInventorySystem);
    sellSystem.setAudioSystem(mockAudioSystem);
    sellSystem.setDragSystem(mockDragSystem);
  });

  describe('System Creation and Inheritance', () => {
    test('should create SellSystem successfully', () => {
      expect(sellSystem).toBeInstanceOf(SellSystem);
    });

    test('should register drag end event listener', () => {
      expect(mockScene.events.on).toHaveBeenCalledWith('dragEnd', expect.any(Function), sellSystem);
    });

    test('should store system references', () => {
      expect(sellSystem['scene']).toBe(mockScene);
      expect(sellSystem['entityManager']).toBe(mockEntityManager);
      expect(sellSystem['economySystem']).toBe(mockEconomySystem);
      expect(sellSystem['inventorySystem']).toBe(mockInventorySystem);
    });

    test('should have correct order area configuration', () => {
      const orderArea = sellSystem['ORDER_AREA'];
      expect(orderArea.x).toBe(800);
      expect(orderArea.y).toBe(100);
      expect(orderArea.width).toBe(300);
      expect(orderArea.height).toBe(400);
    });

    test('should require valid scene for initialization', () => {
      expect(() => {
        new SellSystem(null as any, mockEntityManager, mockEconomySystem, mockInventorySystem);
      }).toThrow('Cannot read properties of null (reading \'events\')');
    });
  });

  describe('Audio System Integration', () => {
    test('should allow setting audio system', () => {
      const newAudioSystem = {
        playMoneySound: jest.fn(),
        playSuccessSound: jest.fn(),
      };

      expect(() => sellSystem.setAudioSystem(newAudioSystem as any)).not.toThrow();
      expect(sellSystem['audioSystem']).toBe(newAudioSystem);
    });

    test('should handle null audio system', () => {
      expect(() => sellSystem.setAudioSystem(null as any)).not.toThrow();
    });
  });

  describe('Drag System Integration', () => {
    test('should allow setting drag system', () => {
      const newDragSystem = {
        confirmDrop: jest.fn(),
        cancelDrop: jest.fn(),
      };

      expect(() => sellSystem.setDragSystem(newDragSystem)).not.toThrow();
      expect(sellSystem['dragSystem']).toBe(newDragSystem);
    });

    test('should handle null drag system', () => {
      expect(() => sellSystem.setDragSystem(null)).not.toThrow();
    });
  });

  describe('Order Area Detection', () => {
    test('should detect position inside order area', () => {
      const isInArea = sellSystem['isInOrderArea']({ x: 900, y: 200 });
      expect(isInArea).toBe(true);
    });

    test('should detect position outside order area - left boundary', () => {
      const isInArea = sellSystem['isInOrderArea']({ x: 799, y: 200 });
      expect(isInArea).toBe(false);
    });

    test('should detect position outside order area - right boundary', () => {
      const isInArea = sellSystem['isInOrderArea']({ x: 1101, y: 200 });
      expect(isInArea).toBe(false);
    });

    test('should detect position outside order area - top boundary', () => {
      const isInArea = sellSystem['isInOrderArea']({ x: 900, y: 99 });
      expect(isInArea).toBe(false);
    });

    test('should detect position outside order area - bottom boundary', () => {
      const isInArea = sellSystem['isInOrderArea']({ x: 900, y: 501 });
      expect(isInArea).toBe(false);
    });

    test('should handle edge cases - exact boundaries', () => {
      expect(sellSystem['isInOrderArea']({ x: 800, y: 100 })).toBe(true);
      expect(sellSystem['isInOrderArea']({ x: 1100, y: 500 })).toBe(true);
    });
  });

  describe('Customer Order Matching', () => {
    test('should find matching customer order', () => {
      const mockCustomerEntity = {
        components: new Map([
          ['OrderComponent', { perfumeName: 'Rose Perfume', status: 'pending' }]
        ])
      };

      mockEntityManager.getEntitiesWithComponent.mockReturnValue(['customer1']);
      mockEntityManager.getEntity.mockReturnValue(mockCustomerEntity);

      const customerId = sellSystem['findMatchingOrder']('Rose Perfume');
      expect(customerId).toBe('customer1');
    });

    test('should not find customer with different perfume', () => {
      const mockCustomerEntity = {
        components: new Map([
          ['OrderComponent', { perfumeName: 'Lavender Perfume', status: 'pending' }]
        ])
      };

      mockEntityManager.getEntitiesWithComponent.mockReturnValue(['customer1']);
      mockEntityManager.getEntity.mockReturnValue(mockCustomerEntity);

      const customerId = sellSystem['findMatchingOrder']('Rose Perfume');
      expect(customerId).toBeNull();
    });

    test('should not find customer with completed order', () => {
      const mockCustomerEntity = {
        components: new Map([
          ['OrderComponent', { perfumeName: 'Rose Perfume', status: 'completed' }]
        ])
      };

      mockEntityManager.getEntitiesWithComponent.mockReturnValue(['customer1']);
      mockEntityManager.getEntity.mockReturnValue(mockCustomerEntity);

      const customerId = sellSystem['findMatchingOrder']('Rose Perfume');
      expect(customerId).toBeNull();
    });

    test('should handle missing entity', () => {
      mockEntityManager.getEntitiesWithComponent.mockReturnValue(['customer1']);
      mockEntityManager.getEntity.mockReturnValue(null);

      const customerId = sellSystem['findMatchingOrder']('Rose Perfume');
      expect(customerId).toBeNull();
    });

    test('should handle missing order component', () => {
      const mockCustomerEntity = {
        components: new Map()
      };

      mockEntityManager.getEntitiesWithComponent.mockReturnValue(['customer1']);
      mockEntityManager.getEntity.mockReturnValue(mockCustomerEntity);

      const customerId = sellSystem['findMatchingOrder']('Rose Perfume');
      expect(customerId).toBeNull();
    });
  });

  describe('Waiting Customer Detection', () => {
    test('should find any waiting customer', () => {
      const mockCustomerEntity = {
        components: new Map([
          ['OrderComponent', { perfumeName: 'Any Perfume', status: 'pending' }]
        ])
      };

      mockEntityManager.getEntitiesWithComponent.mockReturnValue(['customer1']);
      mockEntityManager.getEntity.mockReturnValue(mockCustomerEntity);

      const customerId = sellSystem['findAnyWaitingCustomer']();
      expect(customerId).toBe('customer1');
    });

    test('should not find customer with completed order', () => {
      const mockCustomerEntity = {
        components: new Map([
          ['OrderComponent', { perfumeName: 'Any Perfume', status: 'completed' }]
        ])
      };

      mockEntityManager.getEntitiesWithComponent.mockReturnValue(['customer1']);
      mockEntityManager.getEntity.mockReturnValue(mockCustomerEntity);

      const customerId = sellSystem['findAnyWaitingCustomer']();
      expect(customerId).toBeNull();
    });

    test('should return null when no customers exist', () => {
      mockEntityManager.getEntitiesWithComponent.mockReturnValue([]);

      const customerId = sellSystem['findAnyWaitingCustomer']();
      expect(customerId).toBeNull();
    });
  });

  describe('Complete Sale Functionality', () => {
    test('should complete successful sale', () => {
      const mockCustomerEntity = {
        components: new Map([
          ['OrderComponent', { perfumeName: 'Rose Perfume', status: 'pending' }]
        ])
      };

      mockEntityManager.getEntity.mockReturnValue(mockCustomerEntity);
      mockInventorySystem.getPerfumeQuantity.mockReturnValue(3);
      mockInventorySystem.removePerfume.mockReturnValue(true);

      sellSystem['completeSale']('customer1', 'Rose Perfume', 'perfume1');

      expect(mockInventorySystem.removePerfume).toHaveBeenCalledWith('Rose Perfume', 1);
      expect(mockEconomySystem.addGold).toHaveBeenCalledWith(20, 'Sold Rose Perfume');
      expect(mockAudioSystem.playMoneySound).toHaveBeenCalled();
      expect(mockDragSystem.confirmDrop).toHaveBeenCalledWith('perfume1');
      expect(mockEntityManager.removeEntity).toHaveBeenCalledWith('customer1');
      expect(mockScene.events.emit).toHaveBeenCalledWith('inventoryChanged');
    });

    test('should handle insufficient stock', () => {
      mockInventorySystem.getPerfumeQuantity.mockReturnValue(0);

      sellSystem['completeSale']('customer1', 'Rose Perfume', 'perfume1');

      expect(mockDragSystem.cancelDrop).toHaveBeenCalledWith('perfume1');
      expect(mockInventorySystem.removePerfume).not.toHaveBeenCalled();
      expect(mockEconomySystem.addGold).not.toHaveBeenCalled();
    });

    test('should handle inventory removal failure', () => {
      mockInventorySystem.getPerfumeQuantity.mockReturnValue(3);
      mockInventorySystem.removePerfume.mockReturnValue(false);

      sellSystem['completeSale']('customer1', 'Rose Perfume', 'perfume1');

      expect(mockDragSystem.cancelDrop).toHaveBeenCalledWith('perfume1');
      expect(mockEconomySystem.addGold).not.toHaveBeenCalled();
    });

    test('should update order status to completed', () => {
      const orderComponent = { perfumeName: 'Rose Perfume', status: 'pending' };
      const mockCustomerEntity = {
        components: new Map([
          ['OrderComponent', orderComponent]
        ])
      };

      mockEntityManager.getEntity.mockReturnValue(mockCustomerEntity);
      mockInventorySystem.getPerfumeQuantity.mockReturnValue(3);
      mockInventorySystem.removePerfume.mockReturnValue(true);

      sellSystem['completeSale']('customer1', 'Rose Perfume', 'perfume1');

      expect(orderComponent.status).toBe('completed');
    });

    test('should handle missing customer entity', () => {
      mockEntityManager.getEntity.mockReturnValue(null);
      mockInventorySystem.getPerfumeQuantity.mockReturnValue(3);
      mockInventorySystem.removePerfume.mockReturnValue(true);

      expect(() => {
        sellSystem['completeSale']('customer1', 'Rose Perfume', 'perfume1');
      }).not.toThrow();

      expect(mockEconomySystem.addGold).toHaveBeenCalled();
    });
  });

  describe('Wrong Perfume Handling', () => {
    test('should handle wrong perfume gracefully', () => {
      sellSystem['handleWrongPerfume']('customer1', 'Wrong Perfume', 'perfume1');

      expect(mockInventorySystem.removePerfume).toHaveBeenCalledWith('Wrong Perfume', 1);
      expect(mockDragSystem.confirmDrop).toHaveBeenCalledWith('perfume1');
      expect(mockEntityManager.removeEntity).toHaveBeenCalledWith('customer1');
      expect(mockScene.events.emit).toHaveBeenCalledWith('inventoryChanged');
    });

    test('should show gentle disappointment message', () => {
      sellSystem['handleWrongPerfume']('customer1', 'Wrong Perfume', 'perfume1');

      expect(mockScene.add.text).toHaveBeenCalledWith(
        400, 160,
        expect.any(String),
        expect.objectContaining({
          fontSize: "16px",
          color: "#8b6f47",
          fontFamily: "Georgia, serif"
        })
      );
    });

    test('should animate gentle message appearance', () => {
      sellSystem['handleWrongPerfume']('customer1', 'Wrong Perfume', 'perfume1');

      expect(mockScene.tweens.add).toHaveBeenCalledWith(
        expect.objectContaining({
          targets: mockText,
          alpha: 1,
          y: mockText.y + 10,
          duration: 800,
          ease: "Power1.easeOut"
        })
      );
    });
  });

  describe('Message Display System', () => {
    test('should show success message', () => {
      sellSystem['showMessage']('Success!', 'success');

      expect(mockScene.add.text).toHaveBeenCalledWith(
        400, 50, 'Success!',
        expect.objectContaining({
          fontSize: "24px",
          color: "#00ff00"
        })
      );
    });

    test('should show error message', () => {
      sellSystem['showMessage']('Error!', 'error');

      expect(mockScene.add.text).toHaveBeenCalledWith(
        400, 50, 'Error!',
        expect.objectContaining({
          fontSize: "24px",
          color: "#ff0000"
        })
      );
    });

    test('should animate message with yoyo effect', () => {
      sellSystem['showMessage']('Test', 'success');

      expect(mockScene.tweens.add).toHaveBeenCalledWith(
        expect.objectContaining({
          targets: mockText,
          alpha: 1,
          duration: 300,
          yoyo: true,
          hold: 1000,
          ease: "Power1",
          onComplete: expect.any(Function)
        })
      );
    });

    test('should destroy message after animation', () => {
      sellSystem['showMessage']('Test', 'success');

      const tweenCall = mockScene.tweens.add.mock.calls.find((call: any) => 
        typeof call[0].onComplete === 'function'
      );

      if (tweenCall) {
        tweenCall[0].onComplete();
        expect(mockText.destroy).toHaveBeenCalled();
      }
    });
  });

  describe('Money Animation System', () => {
    test('should show money animation', () => {
      sellSystem['showMoneyAnimation'](25);

      expect(mockScene.add.text).toHaveBeenCalledWith(
        680, 60, '+25 gold',
        expect.objectContaining({
          fontSize: "20px",
          color: "#FFD700",
          fontFamily: "Arial Black",
          fontStyle: "bold",
          strokeThickness: 2
        })
      );

      expect(mockScene.add.circle).toHaveBeenCalledWith(
        650, 60, 4, 0xFFD700
      );
    });

    test('should animate money text with scaling and movement', () => {
      sellSystem['showMoneyAnimation'](15);

      expect(mockScene.tweens.add).toHaveBeenCalledWith(
        expect.objectContaining({
          targets: mockText,
          alpha: 1,
          scaleX: 1.2,
          scaleY: 1.2,
          y: 30, // 60 - 30
          duration: 800,
          ease: "Back.easeOut"
        })
      );
    });

    test('should animate coin effect', () => {
      sellSystem['showMoneyAnimation'](10);

      expect(mockScene.tweens.add).toHaveBeenCalledWith(
        expect.objectContaining({
          targets: mockCircle,
          alpha: 0.8,
          scaleX: 1.2,
          scaleY: 1.2,
          duration: 400,
          ease: "Power2.easeOut"
        })
      );
    });

    test('should chain money text disappearance animation', () => {
      sellSystem['showMoneyAnimation'](20);

      // Find the money text animation with onComplete
      const moneyTextTween = mockScene.tweens.add.mock.calls.find((call: any) => 
        call[0].targets === mockText && typeof call[0].onComplete === 'function'
      );

      if (moneyTextTween) {
        moneyTextTween[0].onComplete();

        // Should create disappearance animation
        expect(mockScene.tweens.add).toHaveBeenCalledWith(
          expect.objectContaining({
            targets: mockText,
            alpha: 0,
            duration: 600,
            ease: "Power1.easeIn"
          })
        );
      }
    });
  });

  describe('Drag End Event Handling', () => {
    test('should handle successful sale on drag end', () => {
      const mockCustomerEntity = {
        components: new Map([
          ['OrderComponent', { perfumeName: 'Rose Perfume', status: 'pending' }]
        ])
      };

      mockEntityManager.getEntitiesWithComponent.mockReturnValue(['customer1']);
      mockEntityManager.getEntity.mockReturnValue(mockCustomerEntity);
      mockInventorySystem.getPerfumeQuantity.mockReturnValue(5);
      mockInventorySystem.removePerfume.mockReturnValue(true);

      const dragEvent = {
        entityId: 'perfume1',
        perfumeName: 'Rose Perfume',
        position: { x: 900, y: 200 }
      };

      sellSystem['handleDragEnd'](dragEvent);

      expect(mockEconomySystem.addGold).toHaveBeenCalledWith(20, 'Sold Rose Perfume');
      expect(mockEntityManager.removeEntity).toHaveBeenCalledWith('customer1');
    });

    test('should handle wrong perfume on drag end', () => {
      const mockWaitingCustomer = {
        components: new Map([
          ['OrderComponent', { perfumeName: 'Different Perfume', status: 'pending' }]
        ])
      };

      mockEntityManager.getEntitiesWithComponent.mockReturnValue(['customer1']);
      mockEntityManager.getEntity.mockReturnValue(mockWaitingCustomer);

      const dragEvent = {
        entityId: 'perfume1',
        perfumeName: 'Rose Perfume',
        position: { x: 900, y: 200 }
      };

      sellSystem['handleDragEnd'](dragEvent);

      expect(mockInventorySystem.removePerfume).toHaveBeenCalledWith('Rose Perfume', 1);
      expect(mockDragSystem.confirmDrop).toHaveBeenCalledWith('perfume1');
    });

    test('should handle no customer wants perfume', () => {
      mockEntityManager.getEntitiesWithComponent.mockReturnValue([]);

      const dragEvent = {
        entityId: 'perfume1',
        perfumeName: 'Rose Perfume',
        position: { x: 900, y: 200 }
      };

      sellSystem['handleDragEnd'](dragEvent);

      expect(mockDragSystem.cancelDrop).toHaveBeenCalledWith('perfume1');
    });

    test('should handle drag outside order area', () => {
      const dragEvent = {
        entityId: 'perfume1',
        perfumeName: 'Rose Perfume',
        position: { x: 500, y: 200 } // Outside order area
      };

      sellSystem['handleDragEnd'](dragEvent);

      expect(mockDragSystem.cancelDrop).toHaveBeenCalledWith('perfume1');
      expect(mockEntityManager.removeEntity).not.toHaveBeenCalled();
    });

    test('should handle drag end without drag system', () => {
      sellSystem.setDragSystem(null);

      const dragEvent = {
        entityId: 'perfume1',
        perfumeName: 'Rose Perfume',
        position: { x: 500, y: 200 }
      };

      expect(() => sellSystem['handleDragEnd'](dragEvent)).not.toThrow();
    });
  });

  describe('Integration Scenarios', () => {
    test('should handle complete customer service workflow', () => {
      const mockCustomerEntity = {
        components: new Map([
          ['OrderComponent', { perfumeName: 'Lavender Perfume', status: 'pending' }]
        ])
      };

      mockEntityManager.getEntitiesWithComponent.mockReturnValue(['customer1']);
      mockEntityManager.getEntity.mockReturnValue(mockCustomerEntity);
      mockInventorySystem.getPerfumeQuantity.mockReturnValue(2);
      mockInventorySystem.removePerfume.mockReturnValue(true);

      const dragEvent = {
        entityId: 'perfume1',
        perfumeName: 'Lavender Perfume',
        position: { x: 950, y: 300 }
      };

      sellSystem['handleDragEnd'](dragEvent);

      // Verify complete workflow
      expect(mockInventorySystem.removePerfume).toHaveBeenCalledWith('Lavender Perfume', 1);
      expect(mockEconomySystem.addGold).toHaveBeenCalledWith(20, 'Sold Lavender Perfume');
      expect(mockAudioSystem.playMoneySound).toHaveBeenCalled();
      expect(mockDragSystem.confirmDrop).toHaveBeenCalledWith('perfume1');
      expect(mockEntityManager.removeEntity).toHaveBeenCalledWith('customer1');
      expect(mockScene.events.emit).toHaveBeenCalledWith('inventoryChanged');
    });

    test('should handle multiple customers with different orders', () => {
      const customers = [
        {
          id: 'customer1',
          entity: {
            components: new Map([
              ['OrderComponent', { perfumeName: 'Rose Perfume', status: 'pending' }]
            ])
          }
        },
        {
          id: 'customer2',
          entity: {
            components: new Map([
              ['OrderComponent', { perfumeName: 'Lavender Perfume', status: 'pending' }]
            ])
          }
        }
      ];

      mockEntityManager.getEntitiesWithComponent.mockReturnValue(['customer1', 'customer2']);
      mockEntityManager.getEntity.mockImplementation((id: string) => 
        customers.find(c => c.id === id)?.entity || null
      );

      // Test finding specific customer
      const roseCustomer = sellSystem['findMatchingOrder']('Rose Perfume');
      expect(roseCustomer).toBe('customer1');

      const lavenderCustomer = sellSystem['findMatchingOrder']('Lavender Perfume');
      expect(lavenderCustomer).toBe('customer2');
    });

    test('should handle rapid successive sales', () => {
      mockInventorySystem.getPerfumeQuantity.mockReturnValue(10);
      mockInventorySystem.removePerfume.mockReturnValue(true);

      const sales = [
        { perfume: 'Rose Perfume', customer: 'customer1' },
        { perfume: 'Lavender Perfume', customer: 'customer2' },
        { perfume: 'Sage Perfume', customer: 'customer3' }
      ];

      sales.forEach((sale, index) => {
        const mockCustomerEntity = {
          components: new Map([
            ['OrderComponent', { perfumeName: sale.perfume, status: 'pending' }]
          ])
        };

        mockEntityManager.getEntity.mockReturnValue(mockCustomerEntity);
        sellSystem['completeSale'](sale.customer, sale.perfume, `perfume${index + 1}`);
      });

      expect(mockEconomySystem.addGold).toHaveBeenCalledTimes(3);
      expect(mockEntityManager.removeEntity).toHaveBeenCalledTimes(3);
      expect(mockScene.events.emit).toHaveBeenCalledTimes(3);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle missing scene properties gracefully', () => {
      const limitedScene = {
        events: { on: jest.fn(), emit: jest.fn() },
        cameras: { main: { centerX: 400, width: 800 } }
      };

      expect(() => {
        new SellSystem(limitedScene as any, mockEntityManager, mockEconomySystem, mockInventorySystem);
      }).not.toThrow();
    });

    test('should handle corrupted customer data', () => {
      const corruptedEntity = {
        components: new Map([
          ['OrderComponent', null]
        ])
      };

      mockEntityManager.getEntitiesWithComponent.mockReturnValue(['customer1']);
      mockEntityManager.getEntity.mockReturnValue(corruptedEntity);

      const customerId = sellSystem['findMatchingOrder']('Any Perfume');
      expect(customerId).toBeNull();
    });

    test('should handle inventory system failures', () => {
      mockInventorySystem.getPerfumeQuantity.mockImplementation(() => {
        throw new Error('Inventory system error');
      });

      expect(() => {
        sellSystem['completeSale']('customer1', 'Rose Perfume', 'perfume1');
      }).toThrow('Inventory system error');
    });

    test('should handle audio system failures', () => {
      mockAudioSystem.playMoneySound.mockImplementation(() => {
        throw new Error('Audio error');
      });

      const mockCustomerEntity = {
        components: new Map([
          ['OrderComponent', { perfumeName: 'Rose Perfume', status: 'pending' }]
        ])
      };

      mockEntityManager.getEntity.mockReturnValue(mockCustomerEntity);
      mockInventorySystem.getPerfumeQuantity.mockReturnValue(3);
      mockInventorySystem.removePerfume.mockReturnValue(true);

      expect(() => {
        sellSystem['completeSale']('customer1', 'Rose Perfume', 'perfume1');
      }).toThrow('Audio error');
    });

    test('should handle boundary position values', () => {
      const boundaryPositions = [
        { x: 800, y: 100 },   // Top-left corner
        { x: 1100, y: 500 },  // Bottom-right corner
        { x: 799.9, y: 300 }, // Just outside left
        { x: 1100.1, y: 300 } // Just outside right
      ];

      const expectedResults = [true, true, false, false];

      boundaryPositions.forEach((position, index) => {
        const result = sellSystem['isInOrderArea'](position);
        expect(result).toBe(expectedResults[index]);
      });
    });
  });

  describe('Update Method', () => {
    test('should handle update calls without errors', () => {
      expect(() => sellSystem.update(16.67)).not.toThrow();
      expect(() => sellSystem.update(0)).not.toThrow();
      expect(() => sellSystem.update(100)).not.toThrow();
    });

    test('should accept any delta time value', () => {
      expect(() => sellSystem.update(-1)).not.toThrow();
      expect(() => sellSystem.update(Number.MAX_VALUE)).not.toThrow();
      expect(() => sellSystem.update(Number.MIN_VALUE)).not.toThrow();
    });
  });
});
