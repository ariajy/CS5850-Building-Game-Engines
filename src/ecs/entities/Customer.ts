import { Entity } from "../EntityManager";
import { CustomerComponent } from "../components/CustomerComponent";
import { OrderComponent } from "../components/OrderComponent";
import { PositionComponent } from "../components/PositionComponent";

let customerId = 0;

export function createCustomer(recipe: any): Entity {
    console.log('createCustomer called with recipe:', recipe);
    const entity: Entity = {
        id: `customer_${customerId++}`,
        components: new Map(),
    };

    entity.components.set("CustomerComponent", {
        patience: 100,
        status: "waiting"
    });

    entity.components.set("OrderComponent", {
        recipeId: recipe.id,
        perfumeName: recipe.name,
        quantity: 1,
        status: "pending", 
        fulfilled: false
    });

    entity.components.set("PositionComponent", {
        x: 600,
        y: 200
    });

    entity.components.set("expired", {
        remainingTime: 3000
    });

    return entity;
}
