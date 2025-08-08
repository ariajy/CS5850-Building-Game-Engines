import { System } from '../SystemManager';

export enum GameState {
    MENU = 'menu',
    SHOP = 'shop',
    CRAFTING = 'crafting',
    CUSTOMER_SERVICE = 'customer_service'
}

export default class GameStateSystem extends System {
    private currentState: GameState = GameState.SHOP;
    private previousState: GameState | null = null;

    constructor() {
        super();
    }

    update(deltaTime: number): void {
    }

    getCurrentState(): GameState {
        return this.currentState;
    }

    setState(newState: GameState): void {
        this.previousState = this.currentState;
        this.currentState = newState;
    }

    getPreviousState(): GameState | null {
        return this.previousState;
    }

    isInState(state: GameState): boolean {
        return this.currentState === state;
    }

    canTransitionTo(newState: GameState): boolean {
        return true;
    }
}


