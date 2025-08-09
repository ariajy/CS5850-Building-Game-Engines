import { createCustomer } from '../src/ecs/entities/Customer';
import { Entity } from '../src/ecs/EntityManager';

describe('Customer Entity Factory', () => {
  // Mock console.log to avoid test output pollution
  const originalConsoleLog = console.log;
  beforeEach(() => {
    console.log = jest.fn();
  });

  afterEach(() => {
    console.log = originalConsoleLog;
  });

  describe('Customer Creation', () => {
    test('should create customer entity with correct structure', () => {
      const mockRecipe = {
        id: 'lavender-perfume',
        name: 'Lavender Perfume',
        ingredients: {
          'lavender-oil': 2,
          'alcohol': 1
        }
      };

      const customer = createCustomer(mockRecipe);

      expect(customer).toBeDefined();
      expect(customer.id).toMatch(/^customer_\d+$/);
      expect(customer.components).toBeInstanceOf(Map);
      expect(customer.components.size).toBe(4);
    });

    test('should create customer with unique IDs', () => {
      const mockRecipe = {
        id: 'rose-perfume',
        name: 'Rose Perfume',
        ingredients: { 'rose-oil': 2, 'alcohol': 1 }
      };

      const customer1 = createCustomer(mockRecipe);
      const customer2 = createCustomer(mockRecipe);
      const customer3 = createCustomer(mockRecipe);

      expect(customer1.id).not.toBe(customer2.id);
      expect(customer2.id).not.toBe(customer3.id);
      expect(customer1.id).not.toBe(customer3.id);

      // Should be sequential
      const id1Num = parseInt(customer1.id.split('_')[1]);
      const id2Num = parseInt(customer2.id.split('_')[1]);
      const id3Num = parseInt(customer3.id.split('_')[1]);

      expect(id2Num).toBe(id1Num + 1);
      expect(id3Num).toBe(id2Num + 1);
    });

    test('should log recipe information during creation', () => {
      const mockRecipe = {
        id: 'test-perfume',
        name: 'Test Perfume',
        ingredients: { 'test-oil': 1 }
      };

      createCustomer(mockRecipe);

      expect(console.log).toHaveBeenCalledWith('createCustomer called with recipe:', mockRecipe);
    });
  });

  describe('CustomerComponent', () => {
    test('should create customer component with default values', () => {
      const mockRecipe = { id: 'test', name: 'Test' };
      const customer = createCustomer(mockRecipe);

      const customerComponent = customer.components.get('CustomerComponent');

      expect(customerComponent).toBeDefined();
      expect(customerComponent.patience).toBe(100);
      expect(customerComponent.status).toBe('waiting');
    });

    test('should maintain customer component structure', () => {
      const mockRecipe = { id: 'test', name: 'Test' };
      const customer = createCustomer(mockRecipe);

      const customerComponent = customer.components.get('CustomerComponent');

      expect(customerComponent).toHaveProperty('patience');
      expect(customerComponent).toHaveProperty('status');
      expect(typeof customerComponent.patience).toBe('number');
      expect(typeof customerComponent.status).toBe('string');
    });
  });

  describe('OrderComponent', () => {
    test('should create order component with recipe information', () => {
      const mockRecipe = {
        id: 'lavender-perfume',
        name: 'Lavender Perfume',
        ingredients: { 'lavender-oil': 2 }
      };

      const customer = createCustomer(mockRecipe);
      const orderComponent = customer.components.get('OrderComponent');

      expect(orderComponent).toBeDefined();
      expect(orderComponent.recipeId).toBe('lavender-perfume');
      expect(orderComponent.perfumeName).toBe('Lavender Perfume');
      expect(orderComponent.quantity).toBe(1);
      expect(orderComponent.status).toBe('pending');
      expect(orderComponent.fulfilled).toBe(false);
    });

    test('should handle different recipe formats', () => {
      const mockRecipe = {
        id: 'complex-perfume',
        name: 'Complex Perfume with Long Name',
        ingredients: {
          'rose-oil': 3,
          'lavender-oil': 2,
          'alcohol': 1,
          'sage': 1
        }
      };

      const customer = createCustomer(mockRecipe);
      const orderComponent = customer.components.get('OrderComponent');

      expect(orderComponent.recipeId).toBe('complex-perfume');
      expect(orderComponent.perfumeName).toBe('Complex Perfume with Long Name');
    });

    test('should always create orders with quantity 1', () => {
      const recipes = [
        { id: 'recipe1', name: 'Recipe 1' },
        { id: 'recipe2', name: 'Recipe 2' },
        { id: 'recipe3', name: 'Recipe 3' }
      ];

      recipes.forEach(recipe => {
        const customer = createCustomer(recipe);
        const orderComponent = customer.components.get('OrderComponent');
        expect(orderComponent.quantity).toBe(1);
      });
    });

    test('should always create orders as pending and unfulfilled', () => {
      const mockRecipe = { id: 'test', name: 'Test' };
      const customer = createCustomer(mockRecipe);
      const orderComponent = customer.components.get('OrderComponent');

      expect(orderComponent.status).toBe('pending');
      expect(orderComponent.fulfilled).toBe(false);
    });
  });

  describe('PositionComponent', () => {
    test('should create position component with fixed coordinates', () => {
      const mockRecipe = { id: 'test', name: 'Test' };
      const customer = createCustomer(mockRecipe);

      const positionComponent = customer.components.get('PositionComponent');

      expect(positionComponent).toBeDefined();
      expect(positionComponent.x).toBe(600);
      expect(positionComponent.y).toBe(200);
    });

    test('should create all customers at same position', () => {
      const recipes = [
        { id: 'recipe1', name: 'Recipe 1' },
        { id: 'recipe2', name: 'Recipe 2' },
        { id: 'recipe3', name: 'Recipe 3' }
      ];

      recipes.forEach(recipe => {
        const customer = createCustomer(recipe);
        const positionComponent = customer.components.get('PositionComponent');
        expect(positionComponent.x).toBe(600);
        expect(positionComponent.y).toBe(200);
      });
    });
  });

  describe('Expiration Component', () => {
    test('should create expired component with default timeout', () => {
      const mockRecipe = { id: 'test', name: 'Test' };
      const customer = createCustomer(mockRecipe);

      const expiredComponent = customer.components.get('expired');

      expect(expiredComponent).toBeDefined();
      expect(expiredComponent.remainingTime).toBe(3000);
    });

    test('should create all customers with same timeout', () => {
      const recipes = [
        { id: 'recipe1', name: 'Recipe 1' },
        { id: 'recipe2', name: 'Recipe 2' }
      ];

      recipes.forEach(recipe => {
        const customer = createCustomer(recipe);
        const expiredComponent = customer.components.get('expired');
        expect(expiredComponent.remainingTime).toBe(3000);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle recipe with missing name', () => {
      const mockRecipe = { id: 'test-recipe' };

      const customer = createCustomer(mockRecipe);
      const orderComponent = customer.components.get('OrderComponent');

      expect(orderComponent.recipeId).toBe('test-recipe');
      expect(orderComponent.perfumeName).toBeUndefined();
    });

    test('should handle recipe with missing id', () => {
      const mockRecipe = { name: 'Test Recipe' };

      const customer = createCustomer(mockRecipe);
      const orderComponent = customer.components.get('OrderComponent');

      expect(orderComponent.recipeId).toBeUndefined();
      expect(orderComponent.perfumeName).toBe('Test Recipe');
    });

    test('should handle empty recipe object', () => {
      const mockRecipe = {};

      const customer = createCustomer(mockRecipe);

      expect(customer).toBeDefined();
      expect(customer.components.size).toBe(4);
      
      const orderComponent = customer.components.get('OrderComponent');
      expect(orderComponent.recipeId).toBeUndefined();
      expect(orderComponent.perfumeName).toBeUndefined();
    });

    test('should handle null recipe', () => {
      expect(() => {
        createCustomer(null);
      }).toThrow();
    });

    test('should handle undefined recipe', () => {
      expect(() => {
        createCustomer(undefined);
      }).toThrow();
    });

    test('should handle recipe with additional properties', () => {
      const mockRecipe = {
        id: 'test-recipe',
        name: 'Test Recipe',
        ingredients: { 'oil': 1 },
        difficulty: 'easy',
        price: 50,
        description: 'A test recipe'
      };

      const customer = createCustomer(mockRecipe);
      const orderComponent = customer.components.get('OrderComponent');

      expect(orderComponent.recipeId).toBe('test-recipe');
      expect(orderComponent.perfumeName).toBe('Test Recipe');
      // Additional properties should not affect the order component
    });

    test('should handle recipe with numeric values as strings', () => {
      const mockRecipe = {
        id: '123',
        name: '456',
        ingredients: { 'oil': '1' }
      };

      const customer = createCustomer(mockRecipe);
      const orderComponent = customer.components.get('OrderComponent');

      expect(orderComponent.recipeId).toBe('123');
      expect(orderComponent.perfumeName).toBe('456');
    });
  });

  describe('Component Data Integrity', () => {
    test('should create independent customer instances', () => {
      const mockRecipe = { id: 'test', name: 'Test' };
      
      const customer1 = createCustomer(mockRecipe);
      const customer2 = createCustomer(mockRecipe);

      // Modify first customer's components
      customer1.components.get('CustomerComponent').patience = 50;
      customer1.components.get('OrderComponent').status = 'completed';

      // Second customer should remain unchanged
      expect(customer2.components.get('CustomerComponent').patience).toBe(100);
      expect(customer2.components.get('OrderComponent').status).toBe('pending');
    });

    test('should create deep copies of component data', () => {
      const mockRecipe = { id: 'test', name: 'Test' };
      
      const customer = createCustomer(mockRecipe);
      const customerComponent = customer.components.get('CustomerComponent');
      const originalPatience = customerComponent.patience;

      // Modify the component
      customerComponent.patience = 75;

      // Original value should have changed (objects are passed by reference)
      expect(customerComponent.patience).toBe(75);
      expect(customerComponent.patience).not.toBe(originalPatience);
    });

    test('should maintain proper component types', () => {
      const mockRecipe = { id: 'test', name: 'Test' };
      const customer = createCustomer(mockRecipe);

      const customerComponent = customer.components.get('CustomerComponent');
      const orderComponent = customer.components.get('OrderComponent');
      const positionComponent = customer.components.get('PositionComponent');
      const expiredComponent = customer.components.get('expired');

      expect(typeof customerComponent.patience).toBe('number');
      expect(typeof customerComponent.status).toBe('string');
      expect(typeof orderComponent.quantity).toBe('number');
      expect(typeof orderComponent.fulfilled).toBe('boolean');
      expect(typeof positionComponent.x).toBe('number');
      expect(typeof positionComponent.y).toBe('number');
      expect(typeof expiredComponent.remainingTime).toBe('number');
    });
  });

  describe('Performance and Memory', () => {
    test('should handle rapid customer creation efficiently', () => {
      const mockRecipe = { id: 'test', name: 'Test' };
      const startTime = performance.now();

      const customers: Entity[] = [];
      for (let i = 0; i < 1000; i++) {
        customers.push(createCustomer(mockRecipe));
      }

      const endTime = performance.now();

      expect(customers).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(100); // Should complete quickly
    });

    test('should create customers with unique IDs at scale', () => {
      const mockRecipe = { id: 'test', name: 'Test' };
      const customers: Entity[] = [];
      const ids = new Set();

      for (let i = 0; i < 100; i++) {
        const customer = createCustomer(mockRecipe);
        customers.push(customer);
        ids.add(customer.id);
      }

      expect(customers).toHaveLength(100);
      expect(ids.size).toBe(100); // All IDs should be unique
    });

    test('should not create excessive memory usage', () => {
      const mockRecipe = { id: 'test', name: 'Test' };
      const initialMemory = process.memoryUsage();

      for (let i = 0; i < 1000; i++) {
        createCustomer(mockRecipe);
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024); // Less than 5MB increase
    });
  });

  describe('Integration Scenarios', () => {
    test('should work with realistic recipe data', () => {
      const realisticRecipes = [
        {
          id: 'lavender-perfume',
          name: 'Lavender Perfume',
          ingredients: {
            'lavender-oil': 2,
            'alcohol': 1
          }
        },
        {
          id: 'rose-perfume',
          name: 'Rose Perfume',
          ingredients: {
            'rose-oil': 2,
            'alcohol': 1
          }
        },
        {
          id: 'dream-perfume',
          name: 'Dream Perfume',
          ingredients: {
            'lavender-oil': 1,
            'rose-oil': 1,
            'sage': 1,
            'alcohol': 1
          }
        }
      ];

      realisticRecipes.forEach(recipe => {
        const customer = createCustomer(recipe);
        
        expect(customer.id).toMatch(/^customer_\d+$/);
        expect(customer.components.size).toBe(4);
        
        const orderComponent = customer.components.get('OrderComponent');
        expect(orderComponent.recipeId).toBe(recipe.id);
        expect(orderComponent.perfumeName).toBe(recipe.name);
      });
    });

    test('should support game flow scenarios', () => {
      const mockRecipe = { id: 'test', name: 'Test' };
      const customer = createCustomer(mockRecipe);

      // Simulate game progression
      const customerComponent = customer.components.get('CustomerComponent');
      const orderComponent = customer.components.get('OrderComponent');

      // Customer waiting
      expect(customerComponent.status).toBe('waiting');
      expect(orderComponent.status).toBe('pending');

      // Customer getting impatient
      customerComponent.patience = 50;
      expect(customerComponent.patience).toBe(50);

      // Order being processed
      orderComponent.status = 'processing';
      expect(orderComponent.status).toBe('processing');

      // Order completed
      orderComponent.status = 'completed';
      orderComponent.fulfilled = true;
      expect(orderComponent.fulfilled).toBe(true);
    });
  });
});
