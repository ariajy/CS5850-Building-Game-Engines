import { DataManager } from '../src/ecs/DataManager';
import { Ingredient, Recipe } from '../src/ecs/types';

describe('DataManager', () => {
  let dataManager: DataManager;

  beforeEach(() => {
    dataManager = DataManager.getInstance();
  });

  describe('Singleton Pattern', () => {
    test('should return the same instance when called multiple times', () => {
      const instance1 = DataManager.getInstance();
      const instance2 = DataManager.getInstance();
      
      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(DataManager);
    });

    test('should maintain state across multiple getInstance calls', () => {
      const instance1 = DataManager.getInstance();
      const ingredients1 = instance1.getIngredients();
      
      const instance2 = DataManager.getInstance();
      const ingredients2 = instance2.getIngredients();
      
      expect(ingredients1).toStrictEqual(ingredients2);
    });
  });

  describe('Ingredient Data Management', () => {
    test('should load and return ingredient data', () => {
      const ingredients = dataManager.getIngredients();
      
      expect(Array.isArray(ingredients)).toBe(true);
      expect(ingredients.length).toBeGreaterThan(0);
    });

    test('should return ingredients with correct structure', () => {
      const ingredients = dataManager.getIngredients();
      
      ingredients.forEach((ingredient: Ingredient) => {
        expect(ingredient).toHaveProperty('id');
        expect(ingredient).toHaveProperty('name');
        expect(ingredient).toHaveProperty('price');
        expect(ingredient).toHaveProperty('imageKey');
        
        expect(typeof ingredient.id).toBe('string');
        expect(typeof ingredient.name).toBe('string');
        expect(typeof ingredient.price).toBe('number');
        expect(typeof ingredient.imageKey).toBe('string');
      });
    });

    test('should find ingredient by id', () => {
      const ingredients = dataManager.getIngredients();
      
      if (ingredients.length > 0) {
        const firstIngredient = ingredients[0];
        const foundIngredient = dataManager.getIngredientById(firstIngredient.id);
        
        expect(foundIngredient).toEqual(firstIngredient);
      }
    });

    test('should return undefined for non-existent ingredient id', () => {
      const nonExistentIngredient = dataManager.getIngredientById('non-existent-id');
      
      expect(nonExistentIngredient).toBeUndefined();
    });

    test('should contain expected ingredient types', () => {
      const ingredients = dataManager.getIngredients();
      const ingredientNames = ingredients.map(ing => ing.name.toLowerCase());
      
      // Check for common perfume ingredients
      expect(ingredientNames.some(name => name.includes('rose'))).toBe(true);
      expect(ingredientNames.some(name => name.includes('lavender'))).toBe(true);
    });
  });

  describe('Recipe Data Management', () => {
    test('should load and return recipe data', () => {
      const recipes = dataManager.getRecipes();
      
      expect(Array.isArray(recipes)).toBe(true);
      expect(recipes.length).toBeGreaterThan(0);
    });

    test('should return recipes with correct structure', () => {
      const recipes = dataManager.getRecipes();
      
      recipes.forEach((recipe: Recipe) => {
        expect(recipe).toHaveProperty('name');
        expect(recipe).toHaveProperty('ingredients');
        
        expect(typeof recipe.name).toBe('string');
        expect(typeof recipe.ingredients).toBe('object');
        
        // Check ingredients structure
        Object.entries(recipe.ingredients).forEach(([ingredientId, quantity]) => {
          expect(typeof ingredientId).toBe('string');
          expect(typeof quantity).toBe('number');
          expect(quantity).toBeGreaterThan(0);
        });
      });
    });

    test('should find recipe by name', () => {
      const recipes = dataManager.getRecipes();
      
      if (recipes.length > 0) {
        const firstRecipe = recipes[0];
        const foundRecipe = dataManager.getRecipeByName(firstRecipe.name);
        
        expect(foundRecipe).toEqual(firstRecipe);
      }
    });

    test('should return undefined for non-existent recipe name', () => {
      const nonExistentRecipe = dataManager.getRecipeByName('non-existent-recipe');
      
      expect(nonExistentRecipe).toBeUndefined();
    });

    test('should have recipes that reference valid ingredients', () => {
      const recipes = dataManager.getRecipes();
      const ingredients = dataManager.getIngredients();
      const ingredientIds = new Set(ingredients.map(ing => ing.id));
      
      recipes.forEach(recipe => {
        Object.keys(recipe.ingredients).forEach(ingredientId => {
          expect(ingredientIds.has(ingredientId)).toBe(true);
        });
      });
    });
  });

  describe('Data Relationships', () => {
    test('should maintain consistent data between ingredients and recipes', () => {
      const recipes = dataManager.getRecipes();
      const ingredients = dataManager.getIngredients();
      
      expect(recipes.length).toBeGreaterThan(0);
      expect(ingredients.length).toBeGreaterThan(0);
      
      // Each recipe should use ingredients that exist in the ingredient list
      recipes.forEach(recipe => {
        Object.keys(recipe.ingredients).forEach(ingredientId => {
          const ingredient = dataManager.getIngredientById(ingredientId);
          expect(ingredient).toBeDefined();
        });
      });
    });

    test('should provide reasonable ingredient pricing', () => {
      const ingredients = dataManager.getIngredients();
      
      ingredients.forEach(ingredient => {
        expect(ingredient.price).toBeGreaterThan(0);
        expect(ingredient.price).toBeLessThanOrEqual(100); // Reasonable upper bound
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle empty string ids gracefully', () => {
      expect(() => dataManager.getIngredientById('')).not.toThrow();
      expect(() => dataManager.getRecipeByName('')).not.toThrow();
      
      expect(dataManager.getIngredientById('')).toBeUndefined();
      expect(dataManager.getRecipeByName('')).toBeUndefined();
    });

    test('should handle null and undefined ids gracefully', () => {
      expect(() => dataManager.getIngredientById(null as any)).not.toThrow();
      expect(() => dataManager.getIngredientById(undefined as any)).not.toThrow();
      expect(() => dataManager.getRecipeByName(null as any)).not.toThrow();
      expect(() => dataManager.getRecipeByName(undefined as any)).not.toThrow();
    });
  });
});
