import InputSystem from '../src/ecs/systems/InputSystem';
import { System } from '../src/ecs/SystemManager';
import { Ingredient, Recipe } from '../src/ecs/types';

// Mock Phaser GameObjects
const mockText: any = {
  setInteractive: jest.fn(function(this: any) { return this; }),
  on: jest.fn(function(this: any) { return this; })
};

const mockScene = {
  add: {
    text: jest.fn(() => mockText)
  },
  input: {
    on: jest.fn()
  }
};

function createMockButton(): any {
  return {
    setInteractive: jest.fn(function(this: any) { return this; }),
    on: jest.fn(function(this: any) { return this; })
  };
}

describe('InputSystem', () => {
  let inputSystem: InputSystem;
  let mockInventorySystem: any;
  let mockSynthesisSystem: any;
  let mockUIEventSystem: any;

  beforeEach(() => {
    // Mock systems
    mockInventorySystem = {
      addItem: jest.fn(),
      getPerfumeQuantity: jest.fn(),
      removePerfume: jest.fn()
    };

    mockSynthesisSystem = {
      canCraft: jest.fn(),
      craft: jest.fn()
    };

    mockUIEventSystem = {
      updateStockText: jest.fn(),
      updateAllStockTexts: jest.fn(),
      updatePerfumeTexts: jest.fn(),
      showMessage: jest.fn()
    };

    inputSystem = new InputSystem(
      mockScene as any,
      mockInventorySystem,
      mockSynthesisSystem,
      mockUIEventSystem
    );

    jest.clearAllMocks();
  });

  describe('Construction and Inheritance', () => {
    test('should extend System class', () => {
      expect(inputSystem).toBeInstanceOf(System);
      expect(inputSystem).toBeInstanceOf(InputSystem);
    });

    test('should store system references', () => {
      expect(inputSystem['scene']).toBe(mockScene);
      expect(inputSystem['inventorySystem']).toBe(mockInventorySystem);
      expect(inputSystem['synthesisSystem']).toBe(mockSynthesisSystem);
      expect(inputSystem['uiEventSystem']).toBe(mockUIEventSystem);
    });

    test('should handle null scene gracefully', () => {
      expect(() => {
        new InputSystem(null as any, mockInventorySystem, mockSynthesisSystem, mockUIEventSystem);
      }).not.toThrow();
    });

    test('should handle null systems gracefully', () => {
      expect(() => {
        new InputSystem(mockScene as any, null, null, null);
      }).not.toThrow();
    });

    test('should create with all required parameters', () => {
      const system = new InputSystem(
        mockScene as any,
        mockInventorySystem,
        mockSynthesisSystem,
        mockUIEventSystem
      );

      expect(system).toBeDefined();
      expect(system['scene']).toBe(mockScene);
      expect(system['inventorySystem']).toBe(mockInventorySystem);
      expect(system['synthesisSystem']).toBe(mockSynthesisSystem);
      expect(system['uiEventSystem']).toBe(mockUIEventSystem);
    });
  });

  describe('Update Method', () => {
    test('should handle update calls without errors', () => {
      expect(() => {
        inputSystem.update(16.67);
      }).not.toThrow();
    });

    test('should accept any delta time without processing', () => {
      expect(() => {
        inputSystem.update(0);
        inputSystem.update(100);
        inputSystem.update(-50);
        inputSystem.update(Infinity);
        inputSystem.update(NaN);
      }).not.toThrow();
    });

    test('should not modify any systems during update', () => {
      inputSystem.update(100);

      expect(mockInventorySystem.addItem).not.toHaveBeenCalled();
      expect(mockSynthesisSystem.canCraft).not.toHaveBeenCalled();
      expect(mockUIEventSystem.updateStockText).not.toHaveBeenCalled();
    });

    test('should handle frequent updates efficiently', () => {
      const startTime = performance.now();

      for (let i = 0; i < 1000; i++) {
        inputSystem.update(16.67);
      }

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe('Buy Button Setup', () => {
    let mockIngredient: Ingredient;
    let mockBuyButton: any;

    beforeEach(() => {
      mockIngredient = {
        id: 'rose-oil',
        name: 'Rose Oil',
        price: 5,
        imageKey: 'rose_oil'
      };

      mockBuyButton = createMockButton();
    });

    test('should set up buy button interactions', () => {
      inputSystem.setupBuyButton(mockIngredient, mockBuyButton);

      expect(mockBuyButton.setInteractive).toHaveBeenCalled();
      expect(mockBuyButton.on).toHaveBeenCalledWith('pointerdown', expect.any(Function));
    });

    test('should handle buy button click', () => {
      inputSystem.setupBuyButton(mockIngredient, mockBuyButton);

      // Get the click handler
      const clickHandler = mockBuyButton.on.mock.calls[0][1];
      
      // Simulate click
      clickHandler();

      expect(mockInventorySystem.addItem).toHaveBeenCalledWith('rose-oil', 1);
      expect(mockUIEventSystem.updateStockText).toHaveBeenCalledWith('rose-oil');
    });

    test('should handle multiple buy button clicks', () => {
      inputSystem.setupBuyButton(mockIngredient, mockBuyButton);
      const clickHandler = mockBuyButton.on.mock.calls[0][1];

      // Simulate multiple clicks
      clickHandler();
      clickHandler();
      clickHandler();

      expect(mockInventorySystem.addItem).toHaveBeenCalledTimes(3);
      expect(mockInventorySystem.addItem).toHaveBeenCalledWith('rose-oil', 1);
      expect(mockUIEventSystem.updateStockText).toHaveBeenCalledTimes(3);
    });

    test('should handle different ingredients', () => {
      const ingredients: Ingredient[] = [
        { id: 'rose-oil', name: 'Rose Oil', price: 5, imageKey: 'rose_oil' },
        { id: 'lavender-oil', name: 'Lavender Oil', price: 3, imageKey: 'lavender_oil' },
        { id: 'alcohol', name: 'Alcohol', price: 1, imageKey: 'alcohol' }
      ];

      ingredients.forEach(ingredient => {
        const button = createMockButton();

        inputSystem.setupBuyButton(ingredient, button);
        const clickHandler = button.on.mock.calls[0][1];
        clickHandler();

        expect(mockInventorySystem.addItem).toHaveBeenCalledWith(ingredient.id, 1);
        expect(mockUIEventSystem.updateStockText).toHaveBeenCalledWith(ingredient.id);
      });
    });

    test('should handle null ingredient gracefully', () => {
      expect(() => {
        inputSystem.setupBuyButton(null as any, mockBuyButton);
      }).not.toThrow();

      expect(mockBuyButton.setInteractive).toHaveBeenCalled();
      expect(mockBuyButton.on).toHaveBeenCalled();
    });

    test('should handle null button gracefully', () => {
      expect(() => {
        inputSystem.setupBuyButton(mockIngredient, null as any);
      }).toThrow(); // Will throw when trying to call setInteractive on null
    });

    test('should handle ingredient with missing properties', () => {
      const incompleteIngredient = { id: 'incomplete' } as Ingredient;
      
      inputSystem.setupBuyButton(incompleteIngredient, mockBuyButton);
      const clickHandler = mockBuyButton.on.mock.calls[0][1];
      
      expect(() => {
        clickHandler();
      }).not.toThrow();

      expect(mockInventorySystem.addItem).toHaveBeenCalledWith('incomplete', 1);
    });

    test('should handle button setup errors gracefully', () => {
      mockBuyButton.setInteractive.mockImplementation(() => {
        throw new Error('Button setup error');
      });

      expect(() => {
        inputSystem.setupBuyButton(mockIngredient, mockBuyButton);
      }).toThrow('Button setup error');
    });

    test('should handle inventory system errors', () => {
      mockInventorySystem.addItem.mockImplementation(() => {
        throw new Error('Inventory error');
      });

      inputSystem.setupBuyButton(mockIngredient, mockBuyButton);
      const clickHandler = mockBuyButton.on.mock.calls[0][1];

      expect(() => {
        clickHandler();
      }).toThrow('Inventory error');
    });

    test('should handle UI system errors', () => {
      mockUIEventSystem.updateStockText.mockImplementation(() => {
        throw new Error('UI error');
      });

      inputSystem.setupBuyButton(mockIngredient, mockBuyButton);
      const clickHandler = mockBuyButton.on.mock.calls[0][1];

      expect(() => {
        clickHandler();
      }).toThrow('UI error');
    });
  });

  describe('Craft Button Setup', () => {
    let mockRecipe: Recipe;
    let mockCraftButton: any;

    beforeEach(() => {
      mockRecipe = {
        name: 'Rose Perfume',
        ingredients: { 'rose-oil': 2, 'alcohol': 1 }
      };

      mockCraftButton = {
        setInteractive: jest.fn(() => mockCraftButton),
        on: jest.fn(() => mockCraftButton)
      };
    });

    test('should set up craft button interactions', () => {
      inputSystem.setupCraftButton(mockRecipe, mockCraftButton);

      expect(mockCraftButton.setInteractive).toHaveBeenCalled();
      expect(mockCraftButton.on).toHaveBeenCalledWith('pointerdown', expect.any(Function));
    });

    test('should handle successful crafting', () => {
      mockSynthesisSystem.canCraft.mockReturnValue(true);

      inputSystem.setupCraftButton(mockRecipe, mockCraftButton);
      const clickHandler = mockCraftButton.on.mock.calls[0][1];

      clickHandler();

      expect(mockSynthesisSystem.canCraft).toHaveBeenCalledWith(mockRecipe);
      expect(mockSynthesisSystem.craft).toHaveBeenCalledWith(mockRecipe);
      expect(mockUIEventSystem.updateAllStockTexts).toHaveBeenCalledWith([]);
      expect(mockUIEventSystem.updatePerfumeTexts).toHaveBeenCalled();
      expect(mockUIEventSystem.showMessage).toHaveBeenCalledWith('Rose Perfume crafted!', 'success');
    });

    test('should handle failed crafting due to insufficient ingredients', () => {
      mockSynthesisSystem.canCraft.mockReturnValue(false);

      inputSystem.setupCraftButton(mockRecipe, mockCraftButton);
      const clickHandler = mockCraftButton.on.mock.calls[0][1];

      clickHandler();

      expect(mockSynthesisSystem.canCraft).toHaveBeenCalledWith(mockRecipe);
      expect(mockSynthesisSystem.craft).not.toHaveBeenCalled();
      expect(mockUIEventSystem.showMessage).toHaveBeenCalledWith('Not enough ingredients for Rose Perfume', 'error');
    });

    test('should handle multiple craft attempts', () => {
      mockSynthesisSystem.canCraft.mockReturnValue(true);

      inputSystem.setupCraftButton(mockRecipe, mockCraftButton);
      const clickHandler = mockCraftButton.on.mock.calls[0][1];

      // First attempt - success
      clickHandler();
      expect(mockSynthesisSystem.craft).toHaveBeenCalledTimes(1);

      // Second attempt - also success
      clickHandler();
      expect(mockSynthesisSystem.craft).toHaveBeenCalledTimes(2);
    });

    test('should handle alternating success and failure', () => {
      inputSystem.setupCraftButton(mockRecipe, mockCraftButton);
      const clickHandler = mockCraftButton.on.mock.calls[0][1];

      // First attempt - success
      mockSynthesisSystem.canCraft.mockReturnValue(true);
      clickHandler();
      expect(mockUIEventSystem.showMessage).toHaveBeenLastCalledWith('Rose Perfume crafted!', 'success');

      // Second attempt - failure
      mockSynthesisSystem.canCraft.mockReturnValue(false);
      clickHandler();
      expect(mockUIEventSystem.showMessage).toHaveBeenLastCalledWith('Not enough ingredients for Rose Perfume', 'error');
    });

    test('should handle different recipes', () => {
      const recipes: Recipe[] = [
        { name: 'Rose Perfume', ingredients: { 'rose-oil': 2, 'alcohol': 1 } },
        { name: 'Lavender Perfume', ingredients: { 'lavender-oil': 2, 'alcohol': 1 } },
        { name: 'Dream Perfume', ingredients: { 'sage': 1, 'lavender-oil': 1, 'rose-oil': 1 } }
      ];

      mockSynthesisSystem.canCraft.mockReturnValue(true);

      recipes.forEach(recipe => {
        const button = createMockButton();

        inputSystem.setupCraftButton(recipe, button);
        const clickHandler = button.on.mock.calls[0][1];
        clickHandler();

        expect(mockSynthesisSystem.canCraft).toHaveBeenCalledWith(recipe);
        expect(mockSynthesisSystem.craft).toHaveBeenCalledWith(recipe);
        expect(mockUIEventSystem.showMessage).toHaveBeenCalledWith(`${recipe.name} crafted!`, 'success');
      });
    });

    test('should handle null recipe gracefully', () => {
      expect(() => {
        inputSystem.setupCraftButton(null as any, mockCraftButton);
      }).not.toThrow();

      expect(mockCraftButton.setInteractive).toHaveBeenCalled();
      expect(mockCraftButton.on).toHaveBeenCalled();
    });

    test('should handle null button gracefully', () => {
      expect(() => {
        inputSystem.setupCraftButton(mockRecipe, null as any);
      }).toThrow(); // Will throw when trying to call setInteractive on null
    });

    test('should handle recipe with missing properties', () => {
      const incompleteRecipe = { name: 'Incomplete' } as Recipe;
      mockSynthesisSystem.canCraft.mockReturnValue(true);

      inputSystem.setupCraftButton(incompleteRecipe, mockCraftButton);
      const clickHandler = mockCraftButton.on.mock.calls[0][1];

      expect(() => {
        clickHandler();
      }).not.toThrow();

      expect(mockUIEventSystem.showMessage).toHaveBeenCalledWith('Incomplete crafted!', 'success');
    });

    test('should handle synthesis system errors', () => {
      mockSynthesisSystem.canCraft.mockImplementation(() => {
        throw new Error('Synthesis error');
      });

      inputSystem.setupCraftButton(mockRecipe, mockCraftButton);
      const clickHandler = mockCraftButton.on.mock.calls[0][1];

      expect(() => {
        clickHandler();
      }).toThrow('Synthesis error');
    });

    test('should handle UI update errors', () => {
      mockSynthesisSystem.canCraft.mockReturnValue(true);
      mockUIEventSystem.updateAllStockTexts.mockImplementation(() => {
        throw new Error('UI update error');
      });

      inputSystem.setupCraftButton(mockRecipe, mockCraftButton);
      const clickHandler = mockCraftButton.on.mock.calls[0][1];

      expect(() => {
        clickHandler();
      }).toThrow('UI update error');
    });
  });

  describe('Private Methods', () => {
    test('getIngredients should return empty array', () => {
      const result = inputSystem['getIngredients']();
      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    test('getIngredients should always return same result', () => {
      const result1 = inputSystem['getIngredients']();
      const result2 = inputSystem['getIngredients']();
      
      expect(result1).toEqual(result2);
      expect(result1).toEqual([]);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle button with no setInteractive method', () => {
      const invalidButton = {};
      
      expect(() => {
        inputSystem.setupBuyButton({ id: 'test', name: 'Test', price: 1, imageKey: 'test' }, invalidButton as any);
      }).toThrow();
    });

    test('should handle button with no on method', () => {
      const invalidButton = createMockButton();
      delete (invalidButton as any).on;
      
      expect(() => {
        inputSystem.setupBuyButton({ id: 'test', name: 'Test', price: 1, imageKey: 'test' }, invalidButton as any);
      }).toThrow();
    });

    test('should handle system references being null during button clicks', () => {
      const ingredient: Ingredient = { id: 'test', name: 'Test', price: 1, imageKey: 'test' };
      const button = createMockButton();

      // Set up button normally
      inputSystem.setupBuyButton(ingredient, button);
      
      // Corrupt system reference
      inputSystem['inventorySystem'] = null;
      
      const clickHandler = button.on.mock.calls[0][1];
      
      expect(() => {
        clickHandler();
      }).toThrow();
    });

    test('should handle undefined system methods', () => {
      const ingredient: Ingredient = { id: 'test', name: 'Test', price: 1, imageKey: 'test' };
      const button = createMockButton();

      // System without required methods
      inputSystem['inventorySystem'] = {};
      
      inputSystem.setupBuyButton(ingredient, button);
      const clickHandler = button.on.mock.calls[0][1];
      
      expect(() => {
        clickHandler();
      }).toThrow();
    });

    test('should handle extreme ingredient data', () => {
      const extremeIngredient: Ingredient = {
        id: 'x'.repeat(10000),
        name: 'y'.repeat(10000),
        price: Number.MAX_SAFE_INTEGER,
        imageKey: 'z'.repeat(10000)
      };

      const button = createMockButton();

      expect(() => {
        inputSystem.setupBuyButton(extremeIngredient, button);
      }).not.toThrow();
    });

    test('should handle extreme recipe data', () => {
      const extremeRecipe: Recipe = {
        name: 'x'.repeat(10000),
        ingredients: {}
      };

      // Add many ingredients
      for (let i = 0; i < 1000; i++) {
        extremeRecipe.ingredients[`ingredient_${i}`] = i;
      }

      const button = createMockButton();

      mockSynthesisSystem.canCraft.mockReturnValue(true);

      expect(() => {
        inputSystem.setupCraftButton(extremeRecipe, button);
      }).not.toThrow();
    });
  });

  describe('Performance Tests', () => {
    test('should handle many button setups efficiently', () => {
      const ingredient: Ingredient = { id: 'test', name: 'Test', price: 1, imageKey: 'test' };
      const buttons = Array.from({ length: 1000 }, () => ({
        setInteractive: jest.fn(function() { return this; }),
        on: jest.fn(function() { return this; })
      }));

      const startTime = performance.now();

      buttons.forEach(button => {
        inputSystem.setupBuyButton(ingredient, button as any);
      });

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100);
    });

    test('should handle rapid button clicks efficiently', () => {
      const ingredient: Ingredient = { id: 'test', name: 'Test', price: 1, imageKey: 'test' };
      const button = createMockButton();

      inputSystem.setupBuyButton(ingredient, button);
      const clickHandler = button.on.mock.calls[0][1];

      const startTime = performance.now();

      for (let i = 0; i < 1000; i++) {
        clickHandler();
      }

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100);
    });

    test('should not create memory leaks with frequent operations', () => {
      const initialMemory = process.memoryUsage();

      for (let i = 0; i < 100; i++) {
        const ingredient: Ingredient = { id: `test_${i}`, name: `Test ${i}`, price: i, imageKey: `test_${i}` };
        const button = createMockButton();

        inputSystem.setupBuyButton(ingredient, button);
        inputSystem.update(16.67);
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      expect(memoryIncrease).toBeLessThan(2 * 1024 * 1024); // Less than 2MB increase
    });
  });

  describe('Integration Scenarios', () => {
    test('should support complete ingredient purchase workflow', () => {
      const ingredient: Ingredient = {
        id: 'rose-oil',
        name: 'Rose Oil',
        price: 5,
        imageKey: 'rose_oil'
      };

      const buyButton = createMockButton();

      // Set up buy button
      inputSystem.setupBuyButton(ingredient, buyButton);
      
      // Simulate player clicking to buy ingredient
      const clickHandler = buyButton.on.mock.calls[0][1];
      clickHandler();

      // Verify workflow
      expect(mockInventorySystem.addItem).toHaveBeenCalledWith('rose-oil', 1);
      expect(mockUIEventSystem.updateStockText).toHaveBeenCalledWith('rose-oil');
    });

    test('should support complete perfume crafting workflow', () => {
      const recipe: Recipe = {
        name: 'Rose Perfume',
        ingredients: { 'rose-oil': 2, 'alcohol': 1 }
      };

      const craftButton = createMockButton();

      mockSynthesisSystem.canCraft.mockReturnValue(true);

      // Set up craft button
      inputSystem.setupCraftButton(recipe, craftButton);
      
      // Simulate player clicking to craft perfume
      const clickHandler = craftButton.on.mock.calls[0][1];
      clickHandler();

      // Verify workflow
      expect(mockSynthesisSystem.canCraft).toHaveBeenCalledWith(recipe);
      expect(mockSynthesisSystem.craft).toHaveBeenCalledWith(recipe);
      expect(mockUIEventSystem.updateAllStockTexts).toHaveBeenCalled();
      expect(mockUIEventSystem.updatePerfumeTexts).toHaveBeenCalled();
      expect(mockUIEventSystem.showMessage).toHaveBeenCalledWith('Rose Perfume crafted!', 'success');
    });

    test('should handle shop interface with multiple ingredients and recipes', () => {
      const ingredients: Ingredient[] = [
        { id: 'rose-oil', name: 'Rose Oil', price: 5, imageKey: 'rose_oil' },
        { id: 'lavender-oil', name: 'Lavender Oil', price: 3, imageKey: 'lavender_oil' }
      ];

      const recipes: Recipe[] = [
        { name: 'Rose Perfume', ingredients: { 'rose-oil': 2, 'alcohol': 1 } },
        { name: 'Lavender Perfume', ingredients: { 'lavender-oil': 2, 'alcohol': 1 } }
      ];

      // Set up buy buttons
      ingredients.forEach(ingredient => {
        const button = createMockButton();
        inputSystem.setupBuyButton(ingredient, button);
      });

      // Set up craft buttons
      mockSynthesisSystem.canCraft.mockReturnValue(true);
      recipes.forEach(recipe => {
        const button = createMockButton();
        inputSystem.setupCraftButton(recipe, button);
      });

      // Verify all buttons are set up
      expect(mockInventorySystem.addItem).not.toHaveBeenCalled();
      expect(mockSynthesisSystem.craft).not.toHaveBeenCalled();
    });

    test('should handle dynamic button state changes', () => {
      const recipe: Recipe = { name: 'Test Recipe', ingredients: { 'test': 1 } };
      const craftButton = createMockButton();

      inputSystem.setupCraftButton(recipe, craftButton);
      const clickHandler = craftButton.on.mock.calls[0][1];

      // Initially can craft
      mockSynthesisSystem.canCraft.mockReturnValue(true);
      clickHandler();
      expect(mockUIEventSystem.showMessage).toHaveBeenLastCalledWith('Test Recipe crafted!', 'success');

      // Player runs out of ingredients
      mockSynthesisSystem.canCraft.mockReturnValue(false);
      clickHandler();
      expect(mockUIEventSystem.showMessage).toHaveBeenLastCalledWith('Not enough ingredients for Test Recipe', 'error');

      // Player gets ingredients again
      mockSynthesisSystem.canCraft.mockReturnValue(true);
      clickHandler();
      expect(mockUIEventSystem.showMessage).toHaveBeenLastCalledWith('Test Recipe crafted!', 'success');
    });
  });
});
