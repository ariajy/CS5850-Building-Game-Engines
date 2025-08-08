import { DataManager } from './DataManager';
import { EntityManager } from './EntityManager';
import { ComponentManager } from './ComponentManager';
import { SystemManager } from './SystemManager';

export class GameManager {
    private static instance: GameManager;
    public dataManager: DataManager;
    public entityManager: EntityManager;
    public componentManager: ComponentManager;
    public systemManager: SystemManager;

    private constructor() {
        this.dataManager = DataManager.getInstance();
        this.entityManager = EntityManager.getInstance();
        this.componentManager = ComponentManager.getInstance();
        this.systemManager = SystemManager.getInstance();
    }

    public static getInstance(): GameManager {
        if (!GameManager.instance) {
            GameManager.instance = new GameManager();
        }
        return GameManager.instance;
    }

    public update(deltaTime: number): void {
        this.systemManager.updateAll(deltaTime);
    }
} 