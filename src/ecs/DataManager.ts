import { Ingredient, Recipe } from './types';

export class DataManager {
    private static instance: DataManager;
    private ingredients: Ingredient[] = [];
    private recipes: Recipe[] = [];

    private constructor() {
        this.loadData();
    }

    public static getInstance(): DataManager {
        if (!DataManager.instance) {
            DataManager.instance = new DataManager();
        }
        return DataManager.instance;
    }

    private loadData(): void {
        this.ingredients = [
            {
                id: 'rose-oil',
                name: 'Rose Oil',
                price: 3,
                imageKey: 'rose_oil',
            },
            {
                id: 'lavender-oil',
                name: 'Lavender Oil',
                price: 3,
                imageKey: 'lavender_oil',
            },
            {
                id: 'alcohol',
                name: 'Alcohol',
                price: 1,
                imageKey: 'alcohol',
            },
        ];

        this.recipes = [
            {
                name: 'Rose Perfume',
                ingredients: {
                    'rose-oil': 1,
                    'alcohol': 2,
                },
            },
            {
                name: 'Lavender Perfume',
                ingredients: {
                    'lavender-oil': 1,
                    'alcohol': 2,
                },
            },
            {
                name: 'Dream Perfume',
                ingredients: {
                    'rose-oil': 1,
                    'lavender-oil': 1,
                    'alcohol': 1,
                },
            },
        ];
    }

    public getIngredients(): Ingredient[] {
        return [...this.ingredients];
    }

    public getRecipes(): Recipe[] {
        return [...this.recipes];
    }

    public getIngredientById(id: string): Ingredient | undefined {
        return this.ingredients.find(ingredient => ingredient.id === id);
    }

    public getRecipeByName(name: string): Recipe | undefined {
        return this.recipes.find(recipe => recipe.name === name);
    }
}
