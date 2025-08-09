import GameStateSystem, { GameState } from '../src/ecs/systems/GameStateSystem';
import { System } from '../src/ecs/SystemManager';

describe('GameStateSystem', () => {
  let gameStateSystem: GameStateSystem;

  beforeEach(() => {
    gameStateSystem = new GameStateSystem();
  });

  describe('Construction and Inheritance', () => {
    test('should extend System class', () => {
      expect(gameStateSystem).toBeInstanceOf(System);
      expect(gameStateSystem).toBeInstanceOf(GameStateSystem);
    });

    test('should initialize with default state', () => {
      expect(gameStateSystem.getCurrentState()).toBe(GameState.SHOP);
      expect(gameStateSystem.getPreviousState()).toBeNull();
    });

    test('should create multiple instances independently', () => {
      const system1 = new GameStateSystem();
      const system2 = new GameStateSystem();

      system1.setState(GameState.MENU);
      system2.setState(GameState.CRAFTING);

      expect(system1.getCurrentState()).toBe(GameState.MENU);
      expect(system2.getCurrentState()).toBe(GameState.CRAFTING);
    });
  });

  describe('GameState Enum', () => {
    test('should have all expected game states', () => {
      expect(GameState.MENU).toBe('menu');
      expect(GameState.SHOP).toBe('shop');
      expect(GameState.CRAFTING).toBe('crafting');
      expect(GameState.CUSTOMER_SERVICE).toBe('customer_service');
    });

    test('should be string enums', () => {
      expect(typeof GameState.MENU).toBe('string');
      expect(typeof GameState.SHOP).toBe('string');
      expect(typeof GameState.CRAFTING).toBe('string');
      expect(typeof GameState.CUSTOMER_SERVICE).toBe('string');
    });

    test('should have unique values', () => {
      const states = Object.values(GameState);
      const uniqueStates = [...new Set(states)];
      expect(states.length).toBe(uniqueStates.length);
    });
  });

  describe('State Management', () => {
    test('should get current state correctly', () => {
      expect(gameStateSystem.getCurrentState()).toBe(GameState.SHOP);

      gameStateSystem.setState(GameState.MENU);
      expect(gameStateSystem.getCurrentState()).toBe(GameState.MENU);

      gameStateSystem.setState(GameState.CRAFTING);
      expect(gameStateSystem.getCurrentState()).toBe(GameState.CRAFTING);
    });

    test('should set state and track previous state', () => {
      // Initial state
      expect(gameStateSystem.getCurrentState()).toBe(GameState.SHOP);
      expect(gameStateSystem.getPreviousState()).toBeNull();

      // First transition
      gameStateSystem.setState(GameState.MENU);
      expect(gameStateSystem.getCurrentState()).toBe(GameState.MENU);
      expect(gameStateSystem.getPreviousState()).toBe(GameState.SHOP);

      // Second transition
      gameStateSystem.setState(GameState.CRAFTING);
      expect(gameStateSystem.getCurrentState()).toBe(GameState.CRAFTING);
      expect(gameStateSystem.getPreviousState()).toBe(GameState.MENU);

      // Third transition
      gameStateSystem.setState(GameState.CUSTOMER_SERVICE);
      expect(gameStateSystem.getCurrentState()).toBe(GameState.CUSTOMER_SERVICE);
      expect(gameStateSystem.getPreviousState()).toBe(GameState.CRAFTING);
    });

    test('should handle setting same state multiple times', () => {
      gameStateSystem.setState(GameState.MENU);
      expect(gameStateSystem.getCurrentState()).toBe(GameState.MENU);
      expect(gameStateSystem.getPreviousState()).toBe(GameState.SHOP);

      // Set same state again
      gameStateSystem.setState(GameState.MENU);
      expect(gameStateSystem.getCurrentState()).toBe(GameState.MENU);
      expect(gameStateSystem.getPreviousState()).toBe(GameState.MENU);

      // Set same state once more
      gameStateSystem.setState(GameState.MENU);
      expect(gameStateSystem.getCurrentState()).toBe(GameState.MENU);
      expect(gameStateSystem.getPreviousState()).toBe(GameState.MENU);
    });

    test('should handle rapid state changes', () => {
      const states = [GameState.MENU, GameState.CRAFTING, GameState.CUSTOMER_SERVICE, GameState.SHOP];
      
      states.forEach(state => {
        gameStateSystem.setState(state);
        expect(gameStateSystem.getCurrentState()).toBe(state);
      });

      expect(gameStateSystem.getPreviousState()).toBe(GameState.CUSTOMER_SERVICE);
    });

    test('should handle circular state transitions', () => {
      // Go through all states in a circle
      gameStateSystem.setState(GameState.MENU);
      gameStateSystem.setState(GameState.CRAFTING);
      gameStateSystem.setState(GameState.CUSTOMER_SERVICE);
      gameStateSystem.setState(GameState.SHOP); // Back to starting state

      expect(gameStateSystem.getCurrentState()).toBe(GameState.SHOP);
      expect(gameStateSystem.getPreviousState()).toBe(GameState.CUSTOMER_SERVICE);
    });
  });

  describe('State Queries', () => {
    test('should check if in specific state correctly', () => {
      // Initially in SHOP state
      expect(gameStateSystem.isInState(GameState.SHOP)).toBe(true);
      expect(gameStateSystem.isInState(GameState.MENU)).toBe(false);
      expect(gameStateSystem.isInState(GameState.CRAFTING)).toBe(false);
      expect(gameStateSystem.isInState(GameState.CUSTOMER_SERVICE)).toBe(false);

      // Change to MENU state
      gameStateSystem.setState(GameState.MENU);
      expect(gameStateSystem.isInState(GameState.MENU)).toBe(true);
      expect(gameStateSystem.isInState(GameState.SHOP)).toBe(false);
      expect(gameStateSystem.isInState(GameState.CRAFTING)).toBe(false);
      expect(gameStateSystem.isInState(GameState.CUSTOMER_SERVICE)).toBe(false);

      // Change to CRAFTING state
      gameStateSystem.setState(GameState.CRAFTING);
      expect(gameStateSystem.isInState(GameState.CRAFTING)).toBe(true);
      expect(gameStateSystem.isInState(GameState.MENU)).toBe(false);
      expect(gameStateSystem.isInState(GameState.SHOP)).toBe(false);
      expect(gameStateSystem.isInState(GameState.CUSTOMER_SERVICE)).toBe(false);
    });

    test('should handle isInState with all possible states', () => {
      const allStates = Object.values(GameState);

      allStates.forEach(state => {
        gameStateSystem.setState(state);
        
        allStates.forEach(testState => {
          if (testState === state) {
            expect(gameStateSystem.isInState(testState)).toBe(true);
          } else {
            expect(gameStateSystem.isInState(testState)).toBe(false);
          }
        });
      });
    });
  });

  describe('State Transition Validation', () => {
    test('should allow transitions to all states', () => {
      const allStates = Object.values(GameState);

      allStates.forEach(fromState => {
        gameStateSystem.setState(fromState);
        
        allStates.forEach(toState => {
          expect(gameStateSystem.canTransitionTo(toState)).toBe(true);
        });
      });
    });

    test('should always return true for canTransitionTo', () => {
      // Test from initial state
      expect(gameStateSystem.canTransitionTo(GameState.MENU)).toBe(true);
      expect(gameStateSystem.canTransitionTo(GameState.SHOP)).toBe(true);
      expect(gameStateSystem.canTransitionTo(GameState.CRAFTING)).toBe(true);
      expect(gameStateSystem.canTransitionTo(GameState.CUSTOMER_SERVICE)).toBe(true);

      // Test from different states
      gameStateSystem.setState(GameState.MENU);
      expect(gameStateSystem.canTransitionTo(GameState.SHOP)).toBe(true);
      expect(gameStateSystem.canTransitionTo(GameState.CRAFTING)).toBe(true);

      gameStateSystem.setState(GameState.CRAFTING);
      expect(gameStateSystem.canTransitionTo(GameState.MENU)).toBe(true);
      expect(gameStateSystem.canTransitionTo(GameState.CUSTOMER_SERVICE)).toBe(true);
    });

    test('should allow transition to same state', () => {
      Object.values(GameState).forEach(state => {
        gameStateSystem.setState(state);
        expect(gameStateSystem.canTransitionTo(state)).toBe(true);
      });
    });
  });

  describe('Update Method', () => {
    test('should handle update calls without errors', () => {
      expect(() => {
        gameStateSystem.update(16.67);
      }).not.toThrow();

      expect(() => {
        gameStateSystem.update(0);
      }).not.toThrow();

      expect(() => {
        gameStateSystem.update(1000);
      }).not.toThrow();
    });

    test('should not change state during update', () => {
      const initialState = gameStateSystem.getCurrentState();
      const initialPrevious = gameStateSystem.getPreviousState();

      gameStateSystem.update(16.67);

      expect(gameStateSystem.getCurrentState()).toBe(initialState);
      expect(gameStateSystem.getPreviousState()).toBe(initialPrevious);
    });

    test('should handle variable delta times', () => {
      const deltaTestValues = [0, 1, 16.67, 33.33, 100, 1000, -1, 0.1];

      deltaTestValues.forEach(delta => {
        expect(() => {
          gameStateSystem.update(delta);
        }).not.toThrow();
      });
    });

    test('should preserve state through multiple updates', () => {
      gameStateSystem.setState(GameState.CRAFTING);

      for (let i = 0; i < 100; i++) {
        gameStateSystem.update(16.67);
        expect(gameStateSystem.getCurrentState()).toBe(GameState.CRAFTING);
      }
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle undefined state parameter gracefully', () => {
      // TypeScript would prevent this, but testing runtime behavior
      expect(() => {
        (gameStateSystem as any).setState(undefined);
      }).not.toThrow();
    });

    test('should handle null state parameter gracefully', () => {
      // TypeScript would prevent this, but testing runtime behavior
      expect(() => {
        (gameStateSystem as any).setState(null);
      }).not.toThrow();
    });

    test('should handle invalid state strings', () => {
      // TypeScript would prevent this, but testing runtime behavior
      expect(() => {
        (gameStateSystem as any).setState('invalid_state');
      }).not.toThrow();

      expect(() => {
        (gameStateSystem as any).isInState('invalid_state');
      }).not.toThrow();

      expect(() => {
        (gameStateSystem as any).canTransitionTo('invalid_state');
      }).not.toThrow();
    });

    test('should handle empty string states', () => {
      expect(() => {
        (gameStateSystem as any).setState('');
        (gameStateSystem as any).isInState('');
        (gameStateSystem as any).canTransitionTo('');
      }).not.toThrow();
    });

    test('should handle extremely long state names', () => {
      const longStateName = 'a'.repeat(10000);
      
      expect(() => {
        (gameStateSystem as any).setState(longStateName);
        (gameStateSystem as any).isInState(longStateName);
        (gameStateSystem as any).canTransitionTo(longStateName);
      }).not.toThrow();
    });
  });

  describe('Performance Tests', () => {
    test('should handle rapid state changes efficiently', () => {
      const states = Object.values(GameState);
      const startTime = performance.now();

      for (let i = 0; i < 10000; i++) {
        const randomState = states[i % states.length];
        gameStateSystem.setState(randomState);
      }

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100); // Should complete quickly
    });

    test('should handle frequent state queries efficiently', () => {
      const states = Object.values(GameState);
      const startTime = performance.now();

      for (let i = 0; i < 10000; i++) {
        const randomState = states[i % states.length];
        gameStateSystem.isInState(randomState);
        gameStateSystem.canTransitionTo(randomState);
      }

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100);
    });

    test('should handle frequent updates efficiently', () => {
      const startTime = performance.now();

      for (let i = 0; i < 10000; i++) {
        gameStateSystem.update(16.67);
      }

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100);
    });

    test('should not create memory leaks with frequent operations', () => {
      const initialMemory = process.memoryUsage();

      for (let i = 0; i < 1000; i++) {
        gameStateSystem.setState(GameState.MENU);
        gameStateSystem.setState(GameState.SHOP);
        gameStateSystem.getCurrentState();
        gameStateSystem.getPreviousState();
        gameStateSystem.isInState(GameState.CRAFTING);
        gameStateSystem.canTransitionTo(GameState.CUSTOMER_SERVICE);
        gameStateSystem.update(16.67);
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      expect(memoryIncrease).toBeLessThan(1024 * 1024); // Less than 1MB increase
    });
  });

  describe('Integration Scenarios', () => {
    test('should support typical game flow transitions', () => {
      // Game starts in shop
      expect(gameStateSystem.getCurrentState()).toBe(GameState.SHOP);

      // Player opens menu
      gameStateSystem.setState(GameState.MENU);
      expect(gameStateSystem.getCurrentState()).toBe(GameState.MENU);
      expect(gameStateSystem.getPreviousState()).toBe(GameState.SHOP);

      // Player returns to shop
      gameStateSystem.setState(GameState.SHOP);
      expect(gameStateSystem.getCurrentState()).toBe(GameState.SHOP);
      expect(gameStateSystem.getPreviousState()).toBe(GameState.MENU);

      // Player starts crafting
      gameStateSystem.setState(GameState.CRAFTING);
      expect(gameStateSystem.getCurrentState()).toBe(GameState.CRAFTING);
      expect(gameStateSystem.isInState(GameState.CRAFTING)).toBe(true);

      // Player serves customer
      gameStateSystem.setState(GameState.CUSTOMER_SERVICE);
      expect(gameStateSystem.getCurrentState()).toBe(GameState.CUSTOMER_SERVICE);
      expect(gameStateSystem.canTransitionTo(GameState.SHOP)).toBe(true);

      // Return to shop
      gameStateSystem.setState(GameState.SHOP);
      expect(gameStateSystem.getCurrentState()).toBe(GameState.SHOP);
    });

    test('should work with conditional logic based on state', () => {
      // Simulate game logic that depends on state
      const performAction = (action: string) => {
        if (gameStateSystem.isInState(GameState.SHOP)) {
          return `${action} in shop`;
        } else if (gameStateSystem.isInState(GameState.CRAFTING)) {
          return `${action} while crafting`;
        } else if (gameStateSystem.isInState(GameState.CUSTOMER_SERVICE)) {
          return `${action} while serving customer`;
        } else {
          return `${action} in menu`;
        }
      };

      // Test in different states
      expect(performAction('click')).toBe('click in shop');

      gameStateSystem.setState(GameState.CRAFTING);
      expect(performAction('click')).toBe('click while crafting');

      gameStateSystem.setState(GameState.CUSTOMER_SERVICE);
      expect(performAction('click')).toBe('click while serving customer');

      gameStateSystem.setState(GameState.MENU);
      expect(performAction('click')).toBe('click in menu');
    });

    test('should support state-based feature toggling', () => {
      const isFeatureEnabled = (feature: string) => {
        switch (feature) {
          case 'crafting':
            return gameStateSystem.isInState(GameState.CRAFTING);
          case 'shopping':
            return gameStateSystem.isInState(GameState.SHOP);
          case 'customer_interaction':
            return gameStateSystem.isInState(GameState.CUSTOMER_SERVICE);
          case 'menu_options':
            return gameStateSystem.isInState(GameState.MENU);
          default:
            return false;
        }
      };

      // Test feature availability in different states
      gameStateSystem.setState(GameState.SHOP);
      expect(isFeatureEnabled('shopping')).toBe(true);
      expect(isFeatureEnabled('crafting')).toBe(false);
      expect(isFeatureEnabled('customer_interaction')).toBe(false);

      gameStateSystem.setState(GameState.CRAFTING);
      expect(isFeatureEnabled('crafting')).toBe(true);
      expect(isFeatureEnabled('shopping')).toBe(false);

      gameStateSystem.setState(GameState.CUSTOMER_SERVICE);
      expect(isFeatureEnabled('customer_interaction')).toBe(true);
      expect(isFeatureEnabled('crafting')).toBe(false);
    });

    test('should maintain state consistency during complex workflows', () => {
      const stateHistory: GameState[] = [];
      
      // Simulate complex game workflow
      const workflow = [
        GameState.MENU,
        GameState.SHOP,
        GameState.CRAFTING,
        GameState.SHOP,
        GameState.CUSTOMER_SERVICE,
        GameState.SHOP,
        GameState.MENU,
        GameState.SHOP
      ];

      workflow.forEach(state => {
        gameStateSystem.setState(state);
        stateHistory.push(gameStateSystem.getCurrentState());
        
        // Verify state is correctly set
        expect(gameStateSystem.getCurrentState()).toBe(state);
        expect(gameStateSystem.isInState(state)).toBe(true);
        
        // Verify we can transition anywhere
        Object.values(GameState).forEach(targetState => {
          expect(gameStateSystem.canTransitionTo(targetState)).toBe(true);
        });
      });

      // Verify final state
      expect(gameStateSystem.getCurrentState()).toBe(GameState.SHOP);
      expect(gameStateSystem.getPreviousState()).toBe(GameState.MENU);
      expect(stateHistory).toEqual(workflow);
    });
  });
});
