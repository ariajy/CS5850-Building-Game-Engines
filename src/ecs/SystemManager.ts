export abstract class System {
    abstract update(deltaTime: number): void;
}

export class SystemManager {
    private static instance: SystemManager;
    private systems: Map<string, System> = new Map();

    private constructor() {}

    public static getInstance(): SystemManager {
        if (!SystemManager.instance) {
            SystemManager.instance = new SystemManager();
        }
        return SystemManager.instance;
    }

    public addSystem(name: string, system: System): void {
        this.systems.set(name, system);
    }

    public removeSystem(name: string): boolean {
        return this.systems.delete(name);
    }

    public getSystem(name: string): System | undefined {
        return this.systems.get(name);
    }

    public updateAll(deltaTime: number): void {
        for (const [name, system] of this.systems.entries()) {
            system.update(deltaTime);
        }
    }

    public getAllSystems(): Map<string, System> {
        return new Map(this.systems);
    }
}

