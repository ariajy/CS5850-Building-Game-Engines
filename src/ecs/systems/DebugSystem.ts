import { System } from "../SystemManager";
import { EntityManager } from "../EntityManager";
import { DataManager } from "../DataManager";

export class DebugSystem extends System {
    private debugTimer: number = 0;
    private readonly debugInterval: number = 1000; // 每秒输出一次调试信息

    constructor(
        private entityManager: EntityManager,
        private dataManager: DataManager
    ) {
        super();
    }

    update(delta: number) {
        this.debugTimer += delta;

        if (this.debugTimer >= this.debugInterval) {
            this.debugTimer = 0;
            this.printDebugInfo();
        }
    }

    private printDebugInfo() {
        console.log('=== DEBUG SYSTEM INFO ===');

        // check DataManager
        const recipes = this.dataManager.getRecipes();
        const ingredients = this.dataManager.getIngredients();
        console.log(`📊 DataManager: ${recipes.length} recipes, ${ingredients.length} ingredients`);

        // check EntityManager
        const allEntities = this.entityManager.getAllEntities();
        console.log(`👥 EntityManager: ${allEntities.size} entities`);

        // list all entities
        allEntities.forEach((entity, id) => {
            console.log(`  - Entity ${id}: ${entity.components.size} components`);
            entity.components.forEach((component, componentName) => {
                console.log(`    * ${componentName}:`, component);
            });
        });
        
        console.log('========================');
    }
}
