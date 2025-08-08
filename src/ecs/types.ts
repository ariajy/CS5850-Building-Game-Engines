export interface Ingredient {
    id: string;
    name: string;
    price: number;
    imageKey: string;
}

export interface Recipe {
    name: string;
    ingredients: Record<string, number>;
}

export interface UIElement {
    id: string;
    type: 'button' | 'text' | 'image';
    position: { x: number; y: number };
    data: any;
}

export interface GameEvent {
    type: string;
    data: any;
    timestamp: number;
} 