import { PhysicsSystem } from '../src/ecs/systems/PhysicsSystem';

// Mock Phaser.Math.Distance.Between
global.Phaser = {
  Math: {
    Distance: {
      Between: jest.fn((x1: number, y1: number, x2: number, y2: number) => {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
      })
    }
  }
} as any;

describe('PhysicsSystem', () => {
  let physicsSystem: PhysicsSystem;
  let mockScene: any;
  let mockTweens: any;

  beforeEach(() => {
    mockTweens = {
      add: jest.fn().mockReturnValue({
        play: jest.fn(),
        stop: jest.fn(),
        setCallback: jest.fn(),
      }),
      timeline: jest.fn().mockReturnValue({
        play: jest.fn(),
        stop: jest.fn(),
      }),
    };

    mockScene = {
      tweens: mockTweens,
      add: {
        circle: jest.fn().mockReturnValue({
          setDepth: jest.fn().mockReturnThis(),
          destroy: jest.fn(),
        })
      },
      time: {
        delayedCall: jest.fn()
      }
    } as any;

    physicsSystem = new PhysicsSystem(mockScene);
  });

  describe('System Creation and Inheritance', () => {
    test('should create PhysicsSystem successfully', () => {
      expect(physicsSystem).toBeInstanceOf(PhysicsSystem);
    });

    test('should initialize with default cauldron values', () => {
      const cauldronInfo = physicsSystem.getCauldronInfo();
      expect(cauldronInfo.x).toBe(400);
      expect(cauldronInfo.y).toBe(350);
      expect(cauldronInfo.radius).toBe(80);
    });

    test('should store scene reference', () => {
      expect(physicsSystem['scene']).toBe(mockScene);
    });
  });

  describe('Cauldron Configuration', () => {
    test('should set cauldron area correctly', () => {
      physicsSystem.setCauldronArea(500, 300, 100);
      
      const cauldronInfo = physicsSystem.getCauldronInfo();
      expect(cauldronInfo.x).toBe(500);
      expect(cauldronInfo.y).toBe(300);
      expect(cauldronInfo.radius).toBe(100);
    });

    test('should handle negative cauldron coordinates', () => {
      physicsSystem.setCauldronArea(-100, -50, 25);
      
      const cauldronInfo = physicsSystem.getCauldronInfo();
      expect(cauldronInfo.x).toBe(-100);
      expect(cauldronInfo.y).toBe(-50);
      expect(cauldronInfo.radius).toBe(25);
    });

    test('should handle zero radius', () => {
      physicsSystem.setCauldronArea(200, 200, 0);
      
      const cauldronInfo = physicsSystem.getCauldronInfo();
      expect(cauldronInfo.radius).toBe(0);
    });

    test('should update cauldron area multiple times', () => {
      physicsSystem.setCauldronArea(100, 100, 50);
      physicsSystem.setCauldronArea(200, 200, 75);
      physicsSystem.setCauldronArea(300, 300, 100);
      
      const cauldronInfo = physicsSystem.getCauldronInfo();
      expect(cauldronInfo.x).toBe(300);
      expect(cauldronInfo.y).toBe(300);
      expect(cauldronInfo.radius).toBe(100);
    });
  });

  describe('Bottle Flight Animation', () => {
    test('should handle flying bottle to cauldron', () => {
      const mockBottle = { x: 100, y: 200 };
      const mockIngredient = { 
        id: 'lavender', 
        name: 'lavender', 
        price: 10, 
        imageKey: 'lavender_oil' 
      };
      const onComplete = jest.fn();

      physicsSystem.flyBottleToCauldron(mockBottle as any, mockIngredient, onComplete);

      // Should create multiple tweens for parabolic flight
      expect(mockTweens.add).toHaveBeenCalledTimes(3); // position, rotation, scale
    });

    test('should calculate correct parabolic flight path', () => {
      const mockBottle = { x: 0, y: 0 };
      const mockIngredient = { id: 'rose', name: 'rose', price: 5, imageKey: 'rose_oil' };
      const onComplete = jest.fn();

      physicsSystem.flyBottleToCauldron(mockBottle as any, mockIngredient, onComplete);

      // Verify first tween call for flight to midpoint
      const firstTweenCall = mockTweens.add.mock.calls[0][0];
      expect(firstTweenCall.targets).toBe(mockBottle);
      expect(typeof firstTweenCall.x).toBe('number');
      expect(typeof firstTweenCall.y).toBe('number');
      expect(firstTweenCall.duration).toBe(400);
      expect(firstTweenCall.ease).toBe('Power2.out');
    });

    test('should add rotation animation during flight', () => {
      const mockBottle = { x: 50, y: 100 };
      const mockIngredient = { id: 'sage', name: 'sage', price: 8, imageKey: 'sage' };
      const onComplete = jest.fn();

      physicsSystem.flyBottleToCauldron(mockBottle as any, mockIngredient, onComplete);

      // Check for rotation tween
      const rotationTween = mockTweens.add.mock.calls.find((call: any) => 
        call[0].rotation === Math.PI * 2
      );
      expect(rotationTween).toBeTruthy();
      expect(rotationTween[0].duration).toBe(700);
    });

    test('should add scale animation during flight', () => {
      const mockBottle = { x: 150, y: 250 };
      const mockIngredient = { id: 'alcohol', name: 'alcohol', price: 3, imageKey: 'alcohol' };
      const onComplete = jest.fn();

      physicsSystem.flyBottleToCauldron(mockBottle as any, mockIngredient, onComplete);

      // Check for scale tween
      const scaleTween = mockTweens.add.mock.calls.find((call: any) => 
        call[0].scaleX === 0.2 && call[0].scaleY === 0.2
      );
      expect(scaleTween).toBeTruthy();
      expect(scaleTween[0].duration).toBe(700);
    });

    test('should handle null bottle gracefully', () => {
      const mockIngredient = { 
        id: 'lavender', 
        name: 'lavender', 
        price: 10, 
        imageKey: 'lavender_oil' 
      };
      const onComplete = jest.fn();

      expect(() => {
        physicsSystem.flyBottleToCauldron(null as any, mockIngredient, onComplete);
      }).toThrow();
    });

    test('should handle bottle at cauldron position', () => {
      physicsSystem.setCauldronArea(400, 350, 80);
      const mockBottle = { x: 400, y: 350 }; // Same as cauldron position
      const mockIngredient = { id: 'test', name: 'test', price: 1, imageKey: 'test' };
      const onComplete = jest.fn();

      expect(() => {
        physicsSystem.flyBottleToCauldron(mockBottle as any, mockIngredient, onComplete);
      }).not.toThrow();

      expect(mockTweens.add).toHaveBeenCalled();
    });

    test('should handle far distance bottles', () => {
      physicsSystem.setCauldronArea(400, 350, 80);
      const mockBottle = { x: 1000, y: 1000 }; // Far from cauldron
      const mockIngredient = { id: 'distant', name: 'distant', price: 20, imageKey: 'distant' };
      const onComplete = jest.fn();

      physicsSystem.flyBottleToCauldron(mockBottle as any, mockIngredient, onComplete);

      expect(mockTweens.add).toHaveBeenCalledTimes(3);
    });
  });

  describe('Splash Effect Creation', () => {
    test('should create splash effect with multiple particles', () => {
      // Access private method through type assertion
      const createSplashEffect = physicsSystem['createSplashEffect'].bind(physicsSystem);
      
      createSplashEffect(400, 350);

      // Should create 6 splash circles + bubble effect
      expect(mockScene.add.circle).toHaveBeenCalledTimes(7); // 6 splash + 1 bubble
    });

    test('should create splash particles with correct properties', () => {
      const createSplashEffect = physicsSystem['createSplashEffect'].bind(physicsSystem);
      
      createSplashEffect(200, 200);

      // Verify splash circles are created with correct parameters
      const splashCalls = mockScene.add.circle.mock.calls.slice(0, 6);
      splashCalls.forEach((call: any) => {
        expect(call[0]).toBe(200); // x position
        expect(call[1]).toBe(200); // y position
        expect(call[2]).toBe(3);   // radius
        expect(call[3]).toBe(0x87CEEB); // color
        expect(call[4]).toBe(0.8); // alpha
      });
    });

    test('should create bubble effect with correct properties', () => {
      const createSplashEffect = physicsSystem['createSplashEffect'].bind(physicsSystem);
      
      createSplashEffect(300, 300);

      // Check bubble (last circle created)
      const bubbleCall = mockScene.add.circle.mock.calls[6];
      expect(bubbleCall[0]).toBe(300); // x
      expect(bubbleCall[1]).toBe(300); // y
      expect(bubbleCall[2]).toBe(8);   // radius
      expect(bubbleCall[3]).toBe(0xFFFFFF); // white color
      expect(bubbleCall[4]).toBe(0.6); // alpha
    });
  });

  describe('Collision Detection', () => {
    test('should detect point inside cauldron area', () => {
      physicsSystem.setCauldronArea(400, 350, 80);
      
      expect(physicsSystem.isInCauldron(400, 350)).toBe(true); // Center
      expect(physicsSystem.isInCauldron(420, 350)).toBe(true); // Within radius
      expect(physicsSystem.isInCauldron(380, 350)).toBe(true); // Within radius
    });

    test('should detect point outside cauldron area', () => {
      physicsSystem.setCauldronArea(400, 350, 80);
      
      expect(physicsSystem.isInCauldron(500, 350)).toBe(false); // Too far right
      expect(physicsSystem.isInCauldron(400, 450)).toBe(false); // Too far down
      expect(physicsSystem.isInCauldron(300, 250)).toBe(false); // Too far away
    });

    test('should handle edge cases for collision detection', () => {
      physicsSystem.setCauldronArea(0, 0, 50);
      
      expect(physicsSystem.isInCauldron(0, 50)).toBe(true);  // Exactly on edge
      expect(physicsSystem.isInCauldron(0, 51)).toBe(false); // Just outside edge
    });

    test('should handle zero radius cauldron', () => {
      physicsSystem.setCauldronArea(100, 100, 0);
      
      expect(physicsSystem.isInCauldron(100, 100)).toBe(true);  // Exact center
      expect(physicsSystem.isInCauldron(101, 100)).toBe(false); // Any offset
    });
  });

  describe('Distance Calculation', () => {
    test('should calculate distance between two points correctly', () => {
      expect(physicsSystem.getDistance(0, 0, 3, 4)).toBe(5); // 3-4-5 triangle
      expect(physicsSystem.getDistance(0, 0, 0, 0)).toBe(0); // Same point
      expect(physicsSystem.getDistance(10, 20, 10, 20)).toBe(0); // Same point
    });

    test('should handle negative coordinates', () => {
      expect(physicsSystem.getDistance(-5, -5, 5, 5)).toBeCloseTo(14.142, 2);
    });

    test('should calculate distance with floating point coordinates', () => {
      const distance = physicsSystem.getDistance(1.5, 2.5, 4.5, 6.5);
      expect(distance).toBeCloseTo(5, 1);
    });
  });

  describe('Gravity Effects', () => {
    test('should apply gravity to game object', () => {
      const mockGameObject = { y: 100 };
      const targetY = 300;
      const callback = jest.fn();

      physicsSystem.applyGravity(mockGameObject as any, targetY, callback);

      expect(mockTweens.add).toHaveBeenCalledWith({
        targets: mockGameObject,
        y: targetY,
        duration: 500,
        ease: 'Bounce.out',
        onComplete: callback
      });
    });

    test('should apply gravity without callback', () => {
      const mockGameObject = { y: 50 };
      const targetY = 200;

      expect(() => {
        physicsSystem.applyGravity(mockGameObject as any, targetY);
      }).not.toThrow();

      expect(mockTweens.add).toHaveBeenCalled();
    });

    test('should handle negative gravity (upward movement)', () => {
      const mockGameObject = { y: 300 };
      const targetY = 100; // Moving up

      physicsSystem.applyGravity(mockGameObject as any, targetY);

      const tweenCall = mockTweens.add.mock.calls.find((call: any) => 
        call[0].y === targetY
      );
      expect(tweenCall).toBeTruthy();
    });
  });

  describe('Shake Effects', () => {
    test('should apply shake effect to game object', () => {
      const mockGameObject = { 
        x: 100, 
        y: 200,
        setPosition: jest.fn()
      };

      physicsSystem.shake(mockGameObject as any, 5, 300);

      expect(mockTweens.add).toHaveBeenCalledWith({
        targets: mockGameObject,
        x: 105, // original + intensity
        duration: 50,
        yoyo: true,
        repeat: 3, // duration / 100
        ease: 'Power2',
        onComplete: expect.any(Function)
      });
    });

    test('should use default shake parameters', () => {
      const mockGameObject = { 
        x: 200, 
        y: 300,
        setPosition: jest.fn()
      };

      physicsSystem.shake(mockGameObject as any);

      const tweenCall = mockTweens.add.mock.calls.find((call: any) => 
        call[0].x === 205 && // default intensity 5
        call[0].repeat === 3 // default duration 300 / 100
      );
      expect(tweenCall).toBeTruthy();
    });

    test('should handle different shake intensities', () => {
      const mockGameObject = { 
        x: 150, 
        y: 150,
        setPosition: jest.fn()
      };

      physicsSystem.shake(mockGameObject as any, 10, 500);

      expect(mockTweens.add).toHaveBeenCalledWith({
        targets: mockGameObject,
        x: 160, // 150 + 10
        duration: 50,
        yoyo: true,
        repeat: 5, // 500 / 100
        ease: 'Power2',
        onComplete: expect.any(Function)
      });
    });

    test('should reset position after shake completion', () => {
      const mockGameObject = { 
        x: 100, 
        y: 200,
        setPosition: jest.fn()
      };

      physicsSystem.shake(mockGameObject as any, 8, 200);

      // Simulate onComplete callback
      const tweenCall = mockTweens.add.mock.calls.find((call: any) => 
        typeof call[0].onComplete === 'function'
      );
      
      if (tweenCall) {
        tweenCall[0].onComplete();
        expect(mockGameObject.setPosition).toHaveBeenCalledWith(100, 200);
      }
    });
  });

  describe('Update Method', () => {
    test('should handle update calls without errors', () => {
      expect(() => physicsSystem.update(16.67)).not.toThrow();
      expect(() => physicsSystem.update(0)).not.toThrow();
      expect(() => physicsSystem.update(100)).not.toThrow();
    });

    test('should accept any delta time value', () => {
      expect(() => physicsSystem.update(-1)).not.toThrow();
      expect(() => physicsSystem.update(Number.MAX_VALUE)).not.toThrow();
      expect(() => physicsSystem.update(Number.MIN_VALUE)).not.toThrow();
    });
  });

  describe('Integration Scenarios', () => {
    test('should handle complete bottle animation workflow', () => {
      const mockBottle = { x: 100, y: 100 };
      const ingredient = { id: 'complex', name: 'Complex Ingredient', price: 15, imageKey: 'complex' };
      let animationCompleted = false;
      
      const onComplete = () => {
        animationCompleted = true;
      };

      // Set custom cauldron area
      physicsSystem.setCauldronArea(500, 400, 100);
      
      // Start bottle animation
      physicsSystem.flyBottleToCauldron(mockBottle as any, ingredient, onComplete);
      
      // Verify all animation components were set up
      expect(mockTweens.add).toHaveBeenCalledTimes(3);
      
      // Simulate first tween completion (flight to midpoint)
      const firstTween = mockTweens.add.mock.calls[0][0];
      if (firstTween.onComplete) {
        firstTween.onComplete();
        
        // Second tween should be called for flight to cauldron
        expect(mockTweens.add).toHaveBeenCalledTimes(4); // +1 for second part of flight
      }
    });

    test('should handle multiple simultaneous bottle animations', () => {
      const bottles = [
        { x: 50, y: 50 },
        { x: 150, y: 150 },
        { x: 250, y: 250 }
      ];
      
      const ingredients = [
        { id: 'ing1', name: 'Ingredient 1', price: 5, imageKey: 'ing1' },
        { id: 'ing2', name: 'Ingredient 2', price: 10, imageKey: 'ing2' },
        { id: 'ing3', name: 'Ingredient 3', price: 15, imageKey: 'ing3' }
      ];

      const completionCallbacks = bottles.map(() => jest.fn());

      bottles.forEach((bottle, index) => {
        physicsSystem.flyBottleToCauldron(
          bottle as any, 
          ingredients[index], 
          completionCallbacks[index]
        );
      });

      // Should have 9 tween calls total (3 per bottle)
      expect(mockTweens.add).toHaveBeenCalledTimes(9);
    });

    test('should handle rapid successive operations', () => {
      const mockGameObject = { x: 100, y: 100, setPosition: jest.fn() };
      
      // Apply multiple effects rapidly
      physicsSystem.shake(mockGameObject as any, 3, 100);
      physicsSystem.applyGravity(mockGameObject as any, 200);
      physicsSystem.shake(mockGameObject as any, 5, 200);
      
      expect(mockTweens.add).toHaveBeenCalledTimes(3);
    });

    test('should maintain cauldron state throughout operations', () => {
      physicsSystem.setCauldronArea(600, 500, 120);
      
      // Perform various operations
      const mockBottle = { x: 200, y: 200 };
      physicsSystem.flyBottleToCauldron(mockBottle as any, 
        { id: 'test', name: 'test', price: 1, imageKey: 'test' }, 
        jest.fn()
      );
      
      physicsSystem.shake({ x: 100, y: 100, setPosition: jest.fn() } as any);
      
      // Cauldron info should remain unchanged
      const cauldronInfo = physicsSystem.getCauldronInfo();
      expect(cauldronInfo.x).toBe(600);
      expect(cauldronInfo.y).toBe(500);
      expect(cauldronInfo.radius).toBe(120);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid bottle objects', () => {
      const invalidBottles = [
        undefined,
        null,
        {},
        { x: 'invalid' },
        { y: 'invalid' },
        { x: undefined, y: undefined }
      ];

      const ingredient = { id: 'test', name: 'test', price: 1, imageKey: 'test' };
      
      invalidBottles.forEach(bottle => {
        if (bottle === null || bottle === undefined) {
          expect(() => {
            physicsSystem.flyBottleToCauldron(bottle as any, ingredient, jest.fn());
          }).toThrow();
        } else {
          expect(() => {
            physicsSystem.flyBottleToCauldron(bottle as any, ingredient, jest.fn());
          }).not.toThrow();
        }
      });
    });

    test('should handle missing scene methods gracefully', () => {
      const limitedScene = {
        tweens: { add: jest.fn() },
        add: { circle: jest.fn().mockReturnValue({ setDepth: jest.fn().mockReturnThis(), destroy: jest.fn() }) }
      };

      const limitedPhysicsSystem = new PhysicsSystem(limitedScene as any);
      
      expect(() => {
        limitedPhysicsSystem.update(16.67);
      }).not.toThrow();
    });
  });
});
