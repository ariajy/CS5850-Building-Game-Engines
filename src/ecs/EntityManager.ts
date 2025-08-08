export interface Entity {
    id: string;
    components: Map<string, any>;
}

export class EntityManager {
    private static instance: EntityManager;
    private entities: Map<string, Entity> = new Map();
    private nextEntityId: number = 0;

    private constructor() {}

    public static getInstance(): EntityManager {
        if (!EntityManager.instance) {
            EntityManager.instance = new EntityManager();
        }
        return EntityManager.instance;
    }

    public createEntity(): string {
        const entityId = `entity_${this.nextEntityId++}`;
        const entity: Entity = {
            id: entityId,
            components: new Map()
        };
        this.entities.set(entityId, entity);
        return entityId;
    }

    public addEntity(entity: Entity): void {
        this.entities.set(entity.id, entity);
    }

    public removeEntity(entityId: string): boolean {
        return this.entities.delete(entityId);
    }

    public getEntity(entityId: string): Entity | undefined {
        return this.entities.get(entityId);
    }

    public getAllEntities(): Map<string, Entity> {
        return new Map(this.entities);
    }

    public hasEntity(entityId: string): boolean {
        return this.entities.has(entityId);
    }
    public getEntitiesWithComponent(componentName: string): string[] {
        const result: string[] = [];
    
        for (const [entityId, entity] of this.entities.entries()) {
            if (entity.components.has(componentName)) {
                result.push(entityId);
            }
        }
    
        return result;
    }

    public getComponent<T>(entityId: string, componentName: string): T | undefined {
        const entity = this.getEntity(entityId);
        if (entity && entity.components.has(componentName)) {
            return entity.components.get(componentName) as T;
        }
        return undefined;
    }
    
}

