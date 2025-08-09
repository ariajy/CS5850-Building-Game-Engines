import AnimationSystem from '../src/ecs/systems/AnimationSystem';
import { System } from '../src/ecs/SystemManager';

// Mock Phaser Scene and Tween Manager
const createMockScene = () => {
  const mockTween = {
    play: jest.fn(),
    pause: jest.fn(),
    stop: jest.fn(),
    destroy: jest.fn(),
  };

  return {
    tweens: {
      add: jest.fn().mockReturnValue(mockTween),
    },
  } as any;
};

// Mock game objects for testing
const createMockGameObject = (x = 100, y = 100) => ({
  x,
  y,
  scaleX: 1,
  scaleY: 1,
  alpha: 1,
  setPosition: jest.fn(),
});

describe('AnimationSystem', () => {
  let mockScene: any;
  let animationSystem: AnimationSystem;
  let mockGameObject: any;

  beforeEach(() => {
    mockScene = createMockScene();
    animationSystem = new AnimationSystem(mockScene);
    mockGameObject = createMockGameObject();
    jest.clearAllMocks();
  });

  describe('Inheritance and Construction', () => {
    test('should extend System class', () => {
      expect(animationSystem).toBeInstanceOf(System);
      expect(animationSystem).toBeInstanceOf(AnimationSystem);
    });

    test('should store scene reference', () => {
      expect(animationSystem['scene']).toBe(mockScene);
    });

    test('should have update method', () => {
      expect(typeof animationSystem.update).toBe('function');
    });

    test('should handle null scene gracefully', () => {
      expect(() => {
        new AnimationSystem(null as any);
      }).not.toThrow();
    });
  });

  describe('Update Method', () => {
    test('should implement update method without errors', () => {
      expect(() => {
        animationSystem.update(16.67);
      }).not.toThrow();
    });

    test('should handle different delta time values', () => {
      expect(() => {
        animationSystem.update(0);
        animationSystem.update(33.33);
        animationSystem.update(-5);
        animationSystem.update(NaN);
        animationSystem.update(Infinity);
      }).not.toThrow();
    });

    test('should handle rapid update calls', () => {
      const startTime = performance.now();

      for (let i = 0; i < 1000; i++) {
        animationSystem.update(16.67);
      }

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100); // Should complete quickly
    });
  });

  describe('Fade In/Out Animation', () => {
    test('should create fade in/out tween with default parameters', () => {
      animationSystem.fadeInOut(mockGameObject);

      expect(mockScene.tweens.add).toHaveBeenCalledWith({
        targets: mockGameObject,
        alpha: 1,
        duration: 300,
        yoyo: true,
        hold: 1000,
        ease: "Power1"
      });
    });

    test('should create fade in/out tween with custom parameters', () => {
      animationSystem.fadeInOut(mockGameObject, 500, 2000);

      expect(mockScene.tweens.add).toHaveBeenCalledWith({
        targets: mockGameObject,
        alpha: 1,
        duration: 500,
        yoyo: true,
        hold: 2000,
        ease: "Power1"
      });
    });

    test('should handle zero duration', () => {
      animationSystem.fadeInOut(mockGameObject, 0, 500);

      expect(mockScene.tweens.add).toHaveBeenCalledWith(
        expect.objectContaining({
          duration: 0
        })
      );
    });

    test('should handle negative duration', () => {
      animationSystem.fadeInOut(mockGameObject, -100, 500);

      expect(mockScene.tweens.add).toHaveBeenCalledWith(
        expect.objectContaining({
          duration: -100
        })
      );
    });

    test('should handle zero hold time', () => {
      animationSystem.fadeInOut(mockGameObject, 300, 0);

      expect(mockScene.tweens.add).toHaveBeenCalledWith(
        expect.objectContaining({
          hold: 0
        })
      );
    });

    test('should handle null target', () => {
      expect(() => {
        animationSystem.fadeInOut(null);
      }).not.toThrow();

      expect(mockScene.tweens.add).toHaveBeenCalledWith(
        expect.objectContaining({
          targets: null
        })
      );
    });

    test('should handle undefined target', () => {
      expect(() => {
        animationSystem.fadeInOut(undefined);
      }).not.toThrow();

      expect(mockScene.tweens.add).toHaveBeenCalledWith(
        expect.objectContaining({
          targets: undefined
        })
      );
    });

    test('should handle array of targets', () => {
      const targets = [mockGameObject, createMockGameObject()];
      
      animationSystem.fadeInOut(targets);

      expect(mockScene.tweens.add).toHaveBeenCalledWith(
        expect.objectContaining({
          targets: targets
        })
      );
    });
  });

  describe('Scale Pulse Animation', () => {
    test('should create scale pulse tween with default parameters', () => {
      animationSystem.scalePulse(mockGameObject);

      expect(mockScene.tweens.add).toHaveBeenCalledWith({
        targets: mockGameObject,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 200,
        yoyo: true,
        ease: "Power1"
      });
    });

    test('should create scale pulse tween with custom parameters', () => {
      animationSystem.scalePulse(mockGameObject, 1.5, 400);

      expect(mockScene.tweens.add).toHaveBeenCalledWith({
        targets: mockGameObject,
        scaleX: 1.5,
        scaleY: 1.5,
        duration: 400,
        yoyo: true,
        ease: "Power1"
      });
    });

    test('should handle scale less than 1', () => {
      animationSystem.scalePulse(mockGameObject, 0.8);

      expect(mockScene.tweens.add).toHaveBeenCalledWith(
        expect.objectContaining({
          scaleX: 0.8,
          scaleY: 0.8
        })
      );
    });

    test('should handle zero scale', () => {
      animationSystem.scalePulse(mockGameObject, 0);

      expect(mockScene.tweens.add).toHaveBeenCalledWith(
        expect.objectContaining({
          scaleX: 0,
          scaleY: 0
        })
      );
    });

    test('should handle negative scale', () => {
      animationSystem.scalePulse(mockGameObject, -1.2);

      expect(mockScene.tweens.add).toHaveBeenCalledWith(
        expect.objectContaining({
          scaleX: -1.2,
          scaleY: -1.2
        })
      );
    });

    test('should handle very large scale values', () => {
      animationSystem.scalePulse(mockGameObject, 10.0);

      expect(mockScene.tweens.add).toHaveBeenCalledWith(
        expect.objectContaining({
          scaleX: 10.0,
          scaleY: 10.0
        })
      );
    });

    test('should handle zero duration', () => {
      animationSystem.scalePulse(mockGameObject, 1.1, 0);

      expect(mockScene.tweens.add).toHaveBeenCalledWith(
        expect.objectContaining({
          duration: 0
        })
      );
    });

    test('should pulse multiple objects simultaneously', () => {
      const targets = [mockGameObject, createMockGameObject()];
      
      animationSystem.scalePulse(targets);

      expect(mockScene.tweens.add).toHaveBeenCalledWith(
        expect.objectContaining({
          targets: targets
        })
      );
    });
  });

  describe('Slide In Animation', () => {
    test('should create slide in tween with default duration', () => {
      animationSystem.slideIn(mockGameObject, 0, 200);

      expect(mockGameObject.setPosition).toHaveBeenCalledWith(0, mockGameObject.y);
      expect(mockScene.tweens.add).toHaveBeenCalledWith({
        targets: mockGameObject,
        x: 200,
        duration: 500,
        ease: "Power2"
      });
    });

    test('should create slide in tween with custom duration', () => {
      animationSystem.slideIn(mockGameObject, -100, 300, 800);

      expect(mockGameObject.setPosition).toHaveBeenCalledWith(-100, mockGameObject.y);
      expect(mockScene.tweens.add).toHaveBeenCalledWith({
        targets: mockGameObject,
        x: 300,
        duration: 800,
        ease: "Power2"
      });
    });

    test('should handle same from and to positions', () => {
      animationSystem.slideIn(mockGameObject, 100, 100);

      expect(mockGameObject.setPosition).toHaveBeenCalledWith(100, mockGameObject.y);
      expect(mockScene.tweens.add).toHaveBeenCalledWith(
        expect.objectContaining({
          x: 100
        })
      );
    });

    test('should handle negative positions', () => {
      animationSystem.slideIn(mockGameObject, -200, -50);

      expect(mockGameObject.setPosition).toHaveBeenCalledWith(-200, mockGameObject.y);
      expect(mockScene.tweens.add).toHaveBeenCalledWith(
        expect.objectContaining({
          x: -50
        })
      );
    });

    test('should handle zero duration', () => {
      animationSystem.slideIn(mockGameObject, 0, 200, 0);

      expect(mockScene.tweens.add).toHaveBeenCalledWith(
        expect.objectContaining({
          duration: 0
        })
      );
    });

    test('should handle floating point positions', () => {
      animationSystem.slideIn(mockGameObject, 10.5, 200.75);

      expect(mockGameObject.setPosition).toHaveBeenCalledWith(10.5, mockGameObject.y);
      expect(mockScene.tweens.add).toHaveBeenCalledWith(
        expect.objectContaining({
          x: 200.75
        })
      );
    });

    test('should preserve original y position', () => {
      const originalY = 150;
      mockGameObject.y = originalY;

      animationSystem.slideIn(mockGameObject, 0, 200);

      expect(mockGameObject.setPosition).toHaveBeenCalledWith(0, originalY);
    });

    test('should handle target without setPosition method', () => {
      const targetWithoutSetPosition = { x: 100, y: 100 };

      expect(() => {
        animationSystem.slideIn(targetWithoutSetPosition as any, 0, 200);
      }).toThrow();
    });
  });

  describe('Bounce Animation', () => {
    test('should create bounce tween with default parameters', () => {
      animationSystem.bounce(mockGameObject);

      expect(mockScene.tweens.add).toHaveBeenCalledWith({
        targets: mockGameObject,
        y: mockGameObject.y - 10,
        duration: 300,
        yoyo: true,
        ease: "Bounce"
      });
    });

    test('should create bounce tween with custom duration', () => {
      animationSystem.bounce(mockGameObject, 600);

      expect(mockScene.tweens.add).toHaveBeenCalledWith({
        targets: mockGameObject,
        y: mockGameObject.y - 10,
        duration: 600,
        yoyo: true,
        ease: "Bounce"
      });
    });

    test('should calculate bounce position based on current y', () => {
      mockGameObject.y = 250;
      
      animationSystem.bounce(mockGameObject);

      expect(mockScene.tweens.add).toHaveBeenCalledWith(
        expect.objectContaining({
          y: 240 // 250 - 10
        })
      );
    });

    test('should handle negative y positions', () => {
      mockGameObject.y = -50;
      
      animationSystem.bounce(mockGameObject);

      expect(mockScene.tweens.add).toHaveBeenCalledWith(
        expect.objectContaining({
          y: -60 // -50 - 10
        })
      );
    });

    test('should handle zero y position', () => {
      mockGameObject.y = 0;
      
      animationSystem.bounce(mockGameObject);

      expect(mockScene.tweens.add).toHaveBeenCalledWith(
        expect.objectContaining({
          y: -10 // 0 - 10
        })
      );
    });

    test('should handle floating point y position', () => {
      mockGameObject.y = 123.45;
      
      animationSystem.bounce(mockGameObject);

      expect(mockScene.tweens.add).toHaveBeenCalledWith(
        expect.objectContaining({
          y: 113.45 // 123.45 - 10
        })
      );
    });

    test('should handle zero duration', () => {
      animationSystem.bounce(mockGameObject, 0);

      expect(mockScene.tweens.add).toHaveBeenCalledWith(
        expect.objectContaining({
          duration: 0
        })
      );
    });

    test('should handle multiple targets', () => {
      const targets = [mockGameObject, createMockGameObject(200, 200)];
      
      animationSystem.bounce(targets);

      expect(mockScene.tweens.add).toHaveBeenCalledWith(
        expect.objectContaining({
          targets: targets
        })
      );
    });
  });

  describe('Animation Combinations and Chaining', () => {
    test('should allow multiple animations on same object', () => {
      animationSystem.fadeInOut(mockGameObject);
      animationSystem.scalePulse(mockGameObject);
      animationSystem.bounce(mockGameObject);

      expect(mockScene.tweens.add).toHaveBeenCalledTimes(3);
    });

    test('should handle rapid animation calls', () => {
      const startTime = performance.now();

      for (let i = 0; i < 100; i++) {
        animationSystem.fadeInOut(mockGameObject);
        animationSystem.scalePulse(mockGameObject);
        animationSystem.slideIn(mockGameObject, i, i + 100);
        animationSystem.bounce(mockGameObject);
      }

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100); // Should complete quickly
      expect(mockScene.tweens.add).toHaveBeenCalledTimes(400);
    });

    test('should handle animations on different objects simultaneously', () => {
      const object1 = createMockGameObject(100, 100);
      const object2 = createMockGameObject(200, 200);
      const object3 = createMockGameObject(300, 300);

      animationSystem.fadeInOut(object1);
      animationSystem.scalePulse(object2);
      animationSystem.bounce(object3);

      expect(mockScene.tweens.add).toHaveBeenCalledTimes(3);
      expect(mockScene.tweens.add).toHaveBeenNthCalledWith(1, expect.objectContaining({ targets: object1 }));
      expect(mockScene.tweens.add).toHaveBeenNthCalledWith(2, expect.objectContaining({ targets: object2 }));
      expect(mockScene.tweens.add).toHaveBeenNthCalledWith(3, expect.objectContaining({ targets: object3 }));
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle scene.tweens.add returning null', () => {
      mockScene.tweens.add.mockReturnValue(null);

      expect(() => {
        animationSystem.fadeInOut(mockGameObject);
      }).not.toThrow();
    });

    test('should handle scene without tweens property', () => {
      const brokenScene = {} as any;
      const brokenAnimationSystem = new AnimationSystem(brokenScene);

      expect(() => {
        brokenAnimationSystem.fadeInOut(mockGameObject);
      }).toThrow();
    });

    test('should handle scene.tweens without add method', () => {
      mockScene.tweens = {};
      
      expect(() => {
        animationSystem.fadeInOut(mockGameObject);
      }).toThrow();
    });

    test('should handle objects without required properties', () => {
      const emptyObject = {};
      
      // These should not crash the animation system
      expect(() => {
        animationSystem.fadeInOut(emptyObject);
        animationSystem.scalePulse(emptyObject);
        animationSystem.bounce(emptyObject);
      }).not.toThrow();

      // slideIn requires setPosition method and should handle gracefully
      expect(() => {
        animationSystem.slideIn(emptyObject as any, 0, 100);
      }).toThrow();
    });

    test('should handle extremely large parameter values', () => {
      const largeValue = Number.MAX_SAFE_INTEGER;
      
      expect(() => {
        animationSystem.fadeInOut(mockGameObject, largeValue, largeValue);
        animationSystem.scalePulse(mockGameObject, largeValue, largeValue);
        animationSystem.slideIn(mockGameObject, largeValue, largeValue, largeValue);
        animationSystem.bounce(mockGameObject, largeValue);
      }).not.toThrow();
    });

    test('should handle NaN parameter values', () => {
      expect(() => {
        animationSystem.fadeInOut(mockGameObject, NaN, NaN);
        animationSystem.scalePulse(mockGameObject, NaN, NaN);
        animationSystem.slideIn(mockGameObject, NaN, NaN, NaN);
        animationSystem.bounce(mockGameObject, NaN);
      }).not.toThrow();
    });

    test('should handle Infinity parameter values', () => {
      expect(() => {
        animationSystem.fadeInOut(mockGameObject, Infinity, Infinity);
        animationSystem.scalePulse(mockGameObject, Infinity, Infinity);
        animationSystem.slideIn(mockGameObject, Infinity, Infinity, Infinity);
        animationSystem.bounce(mockGameObject, Infinity);
      }).not.toThrow();
    });
  });

  describe('Performance and Memory Management', () => {
    test('should not create excessive objects during animation calls', () => {
      const initialMemory = process.memoryUsage();

      for (let i = 0; i < 1000; i++) {
        animationSystem.fadeInOut(mockGameObject);
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      expect(memoryIncrease).toBeLessThan(1024 * 1024); // Less than 1MB increase
    });

    test('should handle animation system destruction gracefully', () => {
      // Simulate destruction by nullifying scene
      (animationSystem as any)['scene'] = null;

      expect(() => {
        animationSystem.update(16.67);
      }).not.toThrow();
    });

    test('should handle concurrent animation calls efficiently', () => {
      const promises: Promise<void>[] = [];

      for (let i = 0; i < 100; i++) {
        promises.push(new Promise<void>(resolve => {
          setTimeout(() => {
            animationSystem.fadeInOut(mockGameObject);
            resolve();
          }, Math.random() * 10);
        }));
      }

      return Promise.all(promises).then(() => {
        expect(mockScene.tweens.add).toHaveBeenCalledTimes(100);
      });
    });
  });

  describe('Integration with Phaser Tween System', () => {
    test('should pass correct tween configuration to Phaser', () => {
      animationSystem.fadeInOut(mockGameObject, 400, 1500);

      expect(mockScene.tweens.add).toHaveBeenCalledWith({
        targets: mockGameObject,
        alpha: 1,
        duration: 400,
        yoyo: true,
        hold: 1500,
        ease: "Power1"
      });
    });

    test('should use appropriate easing functions', () => {
      animationSystem.fadeInOut(mockGameObject);
      animationSystem.scalePulse(mockGameObject);
      animationSystem.slideIn(mockGameObject, 0, 100);
      animationSystem.bounce(mockGameObject);

      expect(mockScene.tweens.add).toHaveBeenNthCalledWith(1, expect.objectContaining({ ease: "Power1" }));
      expect(mockScene.tweens.add).toHaveBeenNthCalledWith(2, expect.objectContaining({ ease: "Power1" }));
      expect(mockScene.tweens.add).toHaveBeenNthCalledWith(3, expect.objectContaining({ ease: "Power2" }));
      expect(mockScene.tweens.add).toHaveBeenNthCalledWith(4, expect.objectContaining({ ease: "Bounce" }));
    });

    test('should properly configure yoyo animations', () => {
      animationSystem.fadeInOut(mockGameObject);
      animationSystem.scalePulse(mockGameObject);
      animationSystem.bounce(mockGameObject);

      expect(mockScene.tweens.add).toHaveBeenNthCalledWith(1, expect.objectContaining({ yoyo: true }));
      expect(mockScene.tweens.add).toHaveBeenNthCalledWith(2, expect.objectContaining({ yoyo: true }));
      expect(mockScene.tweens.add).toHaveBeenNthCalledWith(3, expect.objectContaining({ yoyo: true }));
    });

    test('should handle non-yoyo animations correctly', () => {
      animationSystem.slideIn(mockGameObject, 0, 100);

      expect(mockScene.tweens.add).toHaveBeenCalledWith(
        expect.not.objectContaining({ yoyo: expect.anything() })
      );
    });
  });
});
