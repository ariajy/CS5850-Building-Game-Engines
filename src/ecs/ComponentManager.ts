export class ComponentManager {
    private static instance: ComponentManager;
    private components: Map<string, Map<string, any>> = new Map();

    private constructor() {}

    public static getInstance(): ComponentManager {
        if (!ComponentManager.instance) {
            ComponentManager.instance = new ComponentManager();
        }
        return ComponentManager.instance;
    }

    public addComponent(entityId: string, componentType: string, componentData: any): void {
        if (!this.components.has(componentType)) {
            this.components.set(componentType, new Map());
        }
        this.components.get(componentType)!.set(entityId, componentData);
    }

    public removeComponent(entityId: string, componentType: string): boolean {
        const componentMap = this.components.get(componentType);
        if (componentMap) {
            return componentMap.delete(entityId);
        }
        return false;
    }

    public getComponent(entityId: string, componentType: string): any {
        const componentMap = this.components.get(componentType);
        return componentMap ? componentMap.get(entityId) : undefined;
    }

    public hasComponent(entityId: string, componentType: string): boolean {
        const componentMap = this.components.get(componentType);
        return componentMap ? componentMap.has(entityId) : false;
    }

    public getEntitiesWithComponent(componentType: string): string[] {
        const componentMap = this.components.get(componentType);
        return componentMap ? Array.from(componentMap.keys()) : [];
    }

    public removeAllComponents(entityId: string): void {
        for (const componentMap of this.components.values()) {
            componentMap.delete(entityId);
        }
    }
}

