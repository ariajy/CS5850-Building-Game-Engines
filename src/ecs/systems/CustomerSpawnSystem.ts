import { EntityManager } from "../EntityManager";
import { DataManager } from "../DataManager";
import { createCustomer } from "../entities/Customer";
import { System } from "../SystemManager";

export class CustomerSpawnSystem extends System {
    private spawnTimer: number = 0;
    private readonly spawnInterval: number = 2000; // 2秒，更快节奏

    // narrativeHints
    private readonly narrativeHints: Record<string, string[]> = {
        "Rose Perfume": [
            "Tomorrow is my anniversary. I still remember the garden that evening—petals drifting onto the path, and his hand brushing mine.",
            "My daughter loves the flowers that climb over the old fence. I want her to catch that same scent when she opens her birthday gift.",
            "This morning the air smelled empty. I need something that feels like petals opening at first light, warm and expectant.",
            "I have a date tonight. I want a fragrance that feels like laughter shared under flickering candlelight.",
            "When I think of home, I see narrow streets lined with blooms, and hear the sound of bicycles passing slowly.",
            "It’s been raining for days. I need something bright enough to make the walls feel less close.",
            "The spring festival is coming. I can almost hear the music and see the blossoms strung across the stalls.",
        ],
        "Lavender Perfume": [
            "Lately, my thoughts have been restless. My grandmother used to hang bundles of pale blossoms by her window, and the air always felt lighter there.",
            "Sleep has been hard to find. I miss the quiet that settles over a field just before the stars come out.",
            "Work has been loud and fast. I long for something that feels like an open meadow after the rain, where nothing asks anything of me.",
            "I miss the countryside—rows of soft color bowing under the summer wind, the hum of bees drifting in the air.",
            "There’s a scent that wraps around you like a shawl someone knitted just for you, slow and steady.",
            "I want to bring a piece of that slow world into my apartment, even if it’s only for an evening.",
            "Sometimes, when I close my eyes, I’m back in that wooden chair by the window, the book slipping from my hands as I breathe it in.",
        ],
        "Dream Perfume": [
            "My wedding is next week. I want a fragrance where two melodies weave into one and stay in the air long after the song ends.",
            "I’m turning the first page of a new life. I need something that carries both a steady heartbeat and the thrill of the unknown.",
            "I once dreamt of a garden at dusk: one half bathed in warm light, the other cooled by silver shade, and I stood in the middle.",
            "I want something that holds both the spark of a festival and the hush of a quiet field, as if day and night agreed to share the same sky.",
            "The perfect night smells like two seasons meeting in the air, each changing the other just by being close.",
            "Give me a scent that feels like a dream I can carry into the morning without it fading."
        ]
    };

    // satisfied responses
    private readonly satisfiedResponses: Record<string, string[]> = {
        "Rose Perfume": [
            "Oh my! This smells exactly like our garden! Thank you so much!",
            "Perfect! This will make her so happy. You have a gift!",
            "This is beautiful... it makes me feel so elegant. Thank you!",
            "Yes! This captures exactly what I was feeling. Wonderful!"
        ],
        "Lavender Perfume": [
            "Ahh... I can already feel my stress melting away. This is perfect.",
            "This smells like peaceful dreams. Just what I needed.",
            "It's like you bottled serenity itself. Thank you so much!",
            "This takes me back to grandmother's garden. Perfect!"
        ],
        "Dream Perfume": [
            "This is absolutely magical! You're an artist!",
            "It's perfect for my special day. Thank you for creating something so beautiful!",
            "This smells like hope and new beginnings. Exactly what I needed.",
            "It's like wearing a dream! This is absolutely perfect!"
        ]
    };

    // gentle corrections
    private readonly gentleCorrections: string[] = [
        "This is lovely, but it's not quite what I had in mind...",
        "Beautiful scent! But I was hoping for something different...",
        "This smells wonderful, but it doesn't match what I'm feeling today...",
        "It's nice, but I think I need something else for this moment..."
    ];

    constructor(
        private entityManager: EntityManager,
        private dataManager: DataManager
    ) {
        super();
    }

    update(delta: number) {
        this.spawnTimer += delta;
        const customers = this.entityManager.getEntitiesWithComponent("CustomerComponent");

        // stop spawning if there are customers
        if (customers.length > 0) {
            return;
        }

        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnNarrativeCustomer();
        }
    }

    private spawnNarrativeCustomer(): void {
        const recipes = this.dataManager.getRecipes(); 
        const randomRecipe = recipes[Math.floor(Math.random() * recipes.length)];

        // randomize narrative hints
        const hints = this.narrativeHints[randomRecipe.name] || ["I'm looking for something special today..."];
        const narrativeHint = hints[Math.floor(Math.random() * hints.length)];

        const customerEntity = this.createNarrativeCustomer(randomRecipe, narrativeHint);
        this.entityManager.addEntity(customerEntity);

    }

    private createNarrativeCustomer(recipe: any, narrative: string): any {
        const customerId = `customer_${Date.now()}`;
        
        return {
            id: customerId,
            components: new Map([
                ["CustomerComponent", {
                    patience: 100, 
                    state: "waiting", 
                    mood: "hopeful" 
                }],
                
                ["OrderComponent", {
                    recipeId: recipe.name.replace(' ', '_').toLowerCase(),
                    perfumeName: recipe.name,
                    quantity: 1,
                    status: 'pending',
                    narrative: narrative, 
                    satisfiedResponse: this.getRandomResponse(this.satisfiedResponses[recipe.name]),
                    wrongResponse: this.getRandomResponse(this.gentleCorrections)
                }],
            
                ["PositionComponent", {
                    x: 900,
                    y: 200
                }],
            
                ["RenderComponent", {
                    x: 900,
                    y: 200,
                    text: narrative,
                    visible: true
                }]
            ])
        };
    }

    private getRandomResponse(responses: string[] = []): string {
        if (responses.length === 0) return "Thank you!";
        return responses[Math.floor(Math.random() * responses.length)];
    }

    public handleSuccessfulSale(customerEntity: any): string {
        const orderComponent = customerEntity.components.get("OrderComponent");
        if (!orderComponent) return "Thank you so much!";
        
        return orderComponent.satisfiedResponse || "This is perfect! Thank you!";
    }

    public handleWrongChoice(customerEntity: any): string {
        const orderComponent = customerEntity.components.get("OrderComponent");
        if (!orderComponent) return "This is nice, but not quite right...";
        
        return orderComponent.wrongResponse || "This is lovely, but not what I was looking for...";
    }

    public getWaitingCustomers(): string[] {
        return this.entityManager.getEntitiesWithComponent("CustomerComponent");
    }
}