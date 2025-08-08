import Phaser from 'phaser'
import { GameManager } from '../ecs/GameManager'
import InventorySystem from '../ecs/systems/InventorySystem'
import { CustomerSpawnSystem } from '../ecs/systems/CustomerSpawnSystem'
import { DebugSystem } from '../ecs/systems/DebugSystem'
import RenderSystem from '../ecs/systems/RenderSystem'
import { Ingredient, Recipe } from '../ecs/types'
import { EntityManager } from '../ecs/EntityManager'
import { OrderSystem } from '../ecs/systems/OrderSystem'
import { EconomySystem } from '../ecs/systems/EconomySystem'
import { HUD } from '../UI/HUD'
import { ExpiredEntitySystem } from '../ecs/systems/ExpiredEntitySystem'
import { DragSystem } from '../ecs/systems/DragSystem'
import { SellSystem } from '../ecs/systems/SellSystem'
import { PhysicsSystem } from '../ecs/systems/PhysicsSystem'
import AudioSystem from '../ecs/systems/AudioSystem'

export default class ShopScene extends Phaser.Scene {
    private inventory!: InventorySystem;
    private perfumeStockTexts: Record<string, Phaser.GameObjects.Text> = {};
    private gameManager!: GameManager;
    private physicsSystem!: PhysicsSystem;
    private economySystem!: EconomySystem;
    private audioSystem!: AudioSystem;
    private cauldronIngredients: Record<string, number> = {}; // Ingredients currently in the cauldron
    private currentMessages: Record<string, Phaser.GameObjects.Text> = {}; // Track currently displayed messages
    
    private readonly goldTarget: number = 150; // Target gold amount to win
    private gameCompleted: boolean = false; // Whether the game has been completed

  constructor() {
    super('ShopScene')
  }

  preload() {
    // Load background and cauldron images
    this.load.image('background', './src/assets/images/background.png')
    this.load.image('cauldron', './src/assets/images/cauldron.png')
    
    // Load perfume bottle images
    this.load.image('dream_perfume', './src/assets/images/dream_perfume.png')
    this.load.image('lavender_perfume', './src/assets/images/lavender_perfume.png')
    this.load.image('rose_perfume', './src/assets/images/rose_perfume.png')
    
    // Load ingredient images dynamically from data
    this.gameManager = GameManager.getInstance();
    const ingredients = this.gameManager.dataManager.getIngredients();
    ingredients.forEach((item: Ingredient) => {
        this.load.image(item.imageKey, `./src/assets/images/${item.imageKey}.png`);
      });

    // Initialize and preload audio system
    this.audioSystem = new AudioSystem(this);
    this.audioSystem.preloadAudio();
  }

  create() {
    // Initialize game manager and core systems
    this.gameManager = GameManager.getInstance();
    this.inventory = new InventorySystem();
    this.gameManager.systemManager.addSystem('inventory', this.inventory);
    
    // Create and register audio system
    this.gameManager.systemManager.addSystem('audio', this.audioSystem);
    this.audioSystem.createAudio();
    
    // Create physics system for bottle flying animations
    this.physicsSystem = new PhysicsSystem(this);
    this.gameManager.systemManager.addSystem('physics', this.physicsSystem);
    
    // Create rendering system for customers and UI
    const renderSystem = new RenderSystem(this, this.gameManager.entityManager);
    this.gameManager.systemManager.addSystem('render', renderSystem);

    // Create system to clean up expired entities
    const expiredSystem = new ExpiredEntitySystem(this.gameManager.entityManager);
    expiredSystem.setRenderSystem(renderSystem);
    this.gameManager.systemManager.addSystem('expired', expiredSystem);

    // Create economy system to track gold and targets
    this.economySystem = new EconomySystem();
    this.gameManager.systemManager.addSystem('economy', this.economySystem);
    
    // Set up win condition
    this.economySystem.setTarget(this.goldTarget);
    this.economySystem.setOnTargetReached((target) => this.showVictoryScreen(target));
    
    // Create HUD with mute button and gold display
    const hud = new HUD(this, this.economySystem, this.audioSystem)

    // Create drag and drop system for perfume bottles
    const dragSystem = new DragSystem(this, this.gameManager.entityManager);
    this.gameManager.systemManager.addSystem('drag', dragSystem);

    // Create selling system for customer transactions
    const sellSystem = new SellSystem(this, this.gameManager.entityManager, this.economySystem, this.inventory);
    sellSystem.setDragSystem(dragSystem);
    sellSystem.setAudioSystem(this.audioSystem);
    this.gameManager.systemManager.addSystem('sell', sellSystem);

    // Create order management system
    const orderSystem = new OrderSystem(
      this.gameManager.entityManager,
      this.inventory,
      this.economySystem
    );
    this.gameManager.systemManager.addSystem('order', orderSystem);

    // Create customer spawning system
    const customerSpawnSystem = new CustomerSpawnSystem(
      this.gameManager.entityManager,
      this.gameManager.dataManager
    );
    this.gameManager.systemManager.addSystem('customerSpawn', customerSpawnSystem);
    
    // Create debug system for development
    const debugSystem = new DebugSystem(
      this.gameManager.entityManager,
      this.gameManager.dataManager
    );
    this.gameManager.systemManager.addSystem('debug', debugSystem);

    // Listen for inventory changes to update UI
    this.events.on('inventoryChanged', this.updatePerfumeTexts, this);

    // Create background image that fills the screen
    const background = this.add.image(0, 0, 'background')
      .setOrigin(0, 0)
      .setDisplaySize(this.cameras.main.width, this.cameras.main.height)
      .setDepth(-1);

    // Create the main game elements
    this.createCauldron();
    this.createOrderAreaIndicator();
    this.createClickableIngredients();
    this.createStartScreen();
  }

  /**
   * Creates the cauldron where players mix ingredients
   */
  /**
   * Creates the main cauldron where players brew their perfumes
   * Sets up the visual sprite, instruction text, and physics collision area
   */
  private createCauldron(): void {
    const cauldronX = 700;
    const cauldronY = 500;

    // Create cauldron sprite at center of brewing area
    const cauldron = this.add.image(cauldronX, cauldronY, 'cauldron')
      .setScale(0.3)
      .setDepth(1);

    // Add instruction text below cauldron to guide players
    this.add.text(cauldronX, cauldronY + 200, 'Click ingredients to add', {
      fontSize: '16px',
      color: '#666',
      fontStyle: 'italic'
    }).setOrigin(0.5);

    // Set up physics collision area for bottle animations
    this.physicsSystem.setCauldronArea(cauldronX, cauldronY, 80);
  }

  /**
   * Creates clickable ingredient sprites that players can interact with to brew perfumes
   * Each ingredient displays its name, price, and can be clicked to purchase and add to cauldron
   */
  private createClickableIngredients(): void {
    // Get all available ingredients from the data manager
    const ingredients = this.gameManager.dataManager.getIngredients();
    
    // Create UI elements for each ingredient
    ingredients.forEach((item: Ingredient, index: number) => {
      const x = 250;
      const y = 150 + index * 200; 

      // Create interactive ingredient image with hover effects
      const ingredientImage = this.add.image(x, y + 30, item.imageKey)
        .setScale(0.35)
        .setInteractive()
        .on('pointerdown', () => this.onIngredientClick(item))
        .on('pointerover', () => ingredientImage.setScale(0.4))
        .on('pointerout', () => ingredientImage.setScale(0.35));

      // Display ingredient name
      this.add.text(x + 80, y, item.name, { 
        fontSize: '20px', 
        color: '#000' 
      });
      
      // Display ingredient price in gold
      this.add.text(x + 80, y + 25, `${item.price} gold`, { 
        fontSize: '16px', 
        color: '#DAA520' 
      });
    });
  }

  /**
   * Handles ingredient click events - checks if player has enough gold and processes purchase
   * @param ingredient - The ingredient object that was clicked
   */
  private onIngredientClick(ingredient: Ingredient): void {
    // Play click sound for user feedback
    this.audioSystem.playClickSound();
    
    // Check if player has sufficient gold for this ingredient
    if (this.economySystem.getGold() < ingredient.price) {
      this.audioSystem.playFailSound();
      this.showWarmMessage('Perhaps I need to save a bit more gold first...', 'gentle');
      return;
    }

    // Deduct the cost from player's gold
    this.economySystem.spendGold(ingredient.price, `Used ${ingredient.name}`);
    
    // Create visual animation of ingredient being added to cauldron
    this.createFlyingBottle(ingredient);
    
    const encouragingMessages = [
      `Added some ${ingredient.name} to the mixture...`,
      `${ingredient.name} swirls into the cauldron...`,
      `A few drops of ${ingredient.name}...`,
      `${ingredient.name} joins the blend...`
    ];
    
    const randomMessage = encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];
    this.showWarmMessage(randomMessage, 'experiment');
  }

  /**
   * Creates a visual animation of an ingredient bottle flying from shelf to cauldron
   * @param ingredient - The ingredient to animate to the cauldron
   */
  private createFlyingBottle(ingredient: Ingredient): void {
    // Calculate starting position based on ingredient's shelf location
    const ingredientIndex = this.getIngredientIndex(ingredient.id);
    const startX = 250;
    const startY = 150 + ingredientIndex * 200 + 30;
    
    // Create temporary bottle sprite for animation
    const bottle = this.add.image(startX, startY, ingredient.imageKey)
      .setScale(0.3)
      .setDepth(100);

    // Use physics system to animate bottle movement to cauldron
    this.physicsSystem.flyBottleToCauldron(bottle, ingredient, () => {
      this.addIngredientToCauldron(ingredient);
      bottle.destroy();
    });
  }

  /**
   * Adds an ingredient to the cauldron's current mixture and checks for completed recipes
   * @param ingredient - The ingredient being added to the cauldron
   */
  private addIngredientToCauldron(ingredient: Ingredient): void {
    // Track ingredient count in cauldron
    this.cauldronIngredients[ingredient.id] = (this.cauldronIngredients[ingredient.id] || 0) + 1;
    
    const totalIngredients = Object.values(this.cauldronIngredients).reduce((sum, qty) => sum + qty, 0);
    
    if (totalIngredients === 3) {
      this.checkForCompletedRecipes();
    } else if (totalIngredients < 3) {
      const remainingCount = 3 - totalIngredients;
      this.showWarmMessage(`${remainingCount} more ingredient${remainingCount > 1 ? 's' : ''} needed...`, 'gentle');
    }
  }

  /**
   * Checks if current cauldron contents match any known perfume recipes
   * If a match is found, brews the perfume; otherwise creates experimental result
   */
  private checkForCompletedRecipes(): void {
    const recipes = this.gameManager.dataManager.getRecipes();
    
    // Check each recipe to see if cauldron ingredients match
    for (const recipe of recipes) {
      if (this.canBrewRecipe(recipe)) {
        this.brewPerfume(recipe);
        return; // Successfully brewed, exit without creating experimental result
      }
    }
    
    // If no valid recipe found but ingredients present, create experimental result
    if (Object.keys(this.cauldronIngredients).length > 0) {
      this.createExperimentResult();
    }
  }

  /**
   * Checks if any known recipe can be brewed with current cauldron ingredients
   * @returns true if at least one valid recipe exists, false otherwise
   */
  private hasValidRecipe(): boolean {
    const recipes = this.gameManager.dataManager.getRecipes();
    return recipes.some(recipe => this.canBrewRecipe(recipe));
  }

  /**
   * Creates an experimental result when ingredients don't match any known recipe
   * Plays failure sound, clears cauldron, and shows encouraging message
   */
  private createExperimentResult(): void {
    this.audioSystem.playFailSound();
    
    // Clear cauldron for next attempt
    this.cauldronIngredients = {};
    
    // Show encouraging message for failed experiments
    const experimentMessages = [
      "Hmm, that combination didn't quite work... but it smells interesting!",
      "This mixture is lovely, but not quite a perfume yet. Keep experimenting!",
      "An interesting blend! Perhaps try a different combination?",
      "Not quite right this time, but every experiment teaches us something!"
    ];
    
    const randomMessage = experimentMessages[Math.floor(Math.random() * experimentMessages.length)];
    this.showWarmMessage(randomMessage, 'gentle');
  }

  /**
   * Checks if the cauldron contains sufficient ingredients for a specific recipe
   * @param recipe - The recipe to check against current cauldron contents
   * @returns true if all required ingredients are present in sufficient quantities
   */
  private canBrewRecipe(recipe: Recipe): boolean {
    return Object.entries(recipe.ingredients).every(
      ([ingredientId, requiredQty]) => 
        (this.cauldronIngredients[ingredientId] || 0) >= requiredQty
    );
  }

  /**
   * Successfully brews a perfume when recipe requirements are met
   * Plays success sound, consumes ingredients, adds perfume to inventory
   * @param recipe - The recipe being brewed
   */
  private brewPerfume(recipe: Recipe): void {
    this.audioSystem.playSuccessSound();
    
    // Consume required ingredients from cauldron
    Object.entries(recipe.ingredients).forEach(([ingredientId, qty]) => {
      this.cauldronIngredients[ingredientId] -= qty;
      if (this.cauldronIngredients[ingredientId] <= 0) {
        delete this.cauldronIngredients[ingredientId];
      }
    });

    // 添加香水到库存
    this.inventory.addPerfume(recipe.name, 1);
    
    // 创建可拖拽的香水
    this.createDraggablePerfume(recipe.name);
    
    // 更新UI
    this.updatePerfumeTexts();
    
    const successMessages = [
      `A beautiful ${recipe.name} emerges from your careful work!`,
      `The ingredients have blended perfectly into ${recipe.name}!`,
      `Your intuition was right - you've created ${recipe.name}!`,
      `Something magical happened... you've made ${recipe.name}!`
    ];
    
    const randomSuccess = successMessages[Math.floor(Math.random() * successMessages.length)];
    this.showWarmMessage(randomSuccess, 'success');
    
  }

  private getIngredientIndex(ingredientId: string): number {
    const ingredients = this.gameManager.dataManager.getIngredients();
    return ingredients.findIndex(ing => ing.id === ingredientId);
  }

  private getPerfumeImageKey(perfumeName: string): string {
    const perfumeImageMap: Record<string, string> = {
      'Dream Perfume': 'dream_perfume',
      'Lavender Perfume': 'lavender_perfume', 
      'Rose Perfume': 'rose_perfume'
    };
    
    return perfumeImageMap[perfumeName] || 'dream_perfume';
  }

  private createPerfumeRecipes(): void {
    const recipes = this.gameManager.dataManager.getRecipes();
    
    this.add.text(700, 450, 'Recipes:', {
      fontSize: '20px',
      color: '#5a3e36',
      fontStyle: 'bold'
    });

    recipes.forEach((recipe: Recipe, index: number) => {
        const y = 480 + index * 60;
      
        this.add.text(700, y, recipe.name, { 
          fontSize: '18px', 
          color: '#5a3e36' 
        });

        const ingredientText = Object.entries(recipe.ingredients)
          .map(([id, qty]) => {
            const ingredient = this.gameManager.dataManager.getIngredientById(id);
            return `${ingredient?.name} x${qty}`;
          })
          .join(', ');
        
        this.add.text(700, y + 20, ingredientText, { 
          fontSize: '12px', 
          color: '#666' 
        });

        const perfumeStockText = this.add.text(700, y + 35, 'Owned: 0', { 
          fontSize: '16px', 
          color: '#333' 
        });
        this.perfumeStockTexts[recipe.name] = perfumeStockText;
    });
  }

  /**
   * Updates the displayed perfume stock counts in the UI
   * Called when inventory changes to keep display synchronized
   */
  updatePerfumeTexts() {
    // This method updates perfume stock display texts
    // Implementation details handled by inventory system
  }

  /**
   * Displays warm, encouraging messages to the player based on game events
   * @param text - The message text to display
   * @param type - The type of message (affects color and positioning)
   */
  private showWarmMessage(text: string, type: "success" | "gentle" | "experiment" = "success") {
    // Try to use render system for message display first
    const renderSystem = this.gameManager.systemManager.getSystem('render') as RenderSystem;
    if (renderSystem && renderSystem.showWarmFeedback) {
      renderSystem.showWarmFeedback(text, type);
    } else {
      // Fallback: create message display manually
      if (this.currentMessages[type]) {
        this.currentMessages[type].destroy();
        delete this.currentMessages[type];
      }

      // Define colors for different message types
      const colors = {
        success: "#2d8659",
        gentle: "#8b6f47", 
        experiment: "#7a6b8f"
      };

      // Define Y positions for different message types
      const yPositions = {
        success: 80,
        experiment: 100,
        gentle: 120
      };
      const yPosition = yPositions[type];

      const message = this.add.text(this.cameras.main.centerX, yPosition, text, {
          fontSize: "16px",
          color: colors[type],
          fontFamily: "Georgia, serif",
          align: 'center',
          wordWrap: { width: 400 },
          padding: { x: 12, y: 8 }
      }).setOrigin(0.5).setAlpha(0);

      this.currentMessages[type] = message;

      this.tweens.add({
          targets: message,
          alpha: 1,
          y: message.y + 10,
          duration: 800,
          ease: "Power1.easeOut",
          onComplete: () => {
            this.time.delayedCall(2500, () => {
              this.tweens.add({
                targets: message,
                alpha: 0,
                duration: 600,
                onComplete: () => {
                  message.destroy();
                  if (this.currentMessages[type] === message) {
                    delete this.currentMessages[type];
                  }
                }
              });
            });
          }
      });
    }
  }

  /**
   * Creates the order area indicator where players can view customer requests
   */
  private createOrderAreaIndicator(): void {
    // Create order display area background
    const orderArea = this.add.rectangle(1050, 350, 300, 400, 0x000000, 0)
      .setStrokeStyle(3, 0xD8BFD8, 0.8);

    // Add title text for order area
    this.add.text(1050, 170, 'Customer Orders', {
      fontSize: '24px',
      color: '#D8BFD8',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Add instruction text
    this.add.text(1050, 570, 'Drag perfumes here to sell', {
      fontSize: '16px',
      color: '#666',
      fontStyle: 'italic'
    }).setOrigin(0.5);
  }

  /**
   * Creates draggable perfume sprites that players can drag to sell to customers
   * @param perfumeName - The name of the perfume type to create
   */
  private createDraggablePerfume(perfumeName: string): void {
    // Check if there's inventory for this perfume type
    const quantity = this.inventory.getPerfumeQuantity(perfumeName);
    if (quantity <= 0) return;

    // Remove existing draggable perfumes to prevent duplicates
    const existingPerfumes = this.children.list.filter(child => 
      child.getData && child.getData('perfumeType') === 'draggable'
    );
    
    existingPerfumes.forEach(perfume => {
      const text = perfume.getData('text');
      if (text) text.destroy();
      perfume.destroy();
    });

    const allEntities = this.gameManager.entityManager.getAllEntities();
    allEntities.forEach((entity, entityId) => {
      if (entityId.startsWith('perfume_')) {
        this.gameManager.entityManager.removeEntity(entityId);
      }
    });

    const entityId = `perfume_${perfumeName}_${Date.now()}`;
    
    const cauldronX = 700;
    const cauldronY = 500;
    
    const x = cauldronX;
    const y = cauldronY - 250;

    const perfumeImageKey = this.getPerfumeImageKey(perfumeName);
    const perfumeObject = this.add.image(x, y, perfumeImageKey)
      .setScale(0.17)
      .setInteractive()
      .setData('perfumeType', 'draggable');
  

    const entity = {
      id: entityId,
      components: new Map()
    };

    entity.components.set('draggable', {
      isDragging: false,
      originalPosition: { x, y },
      gameObject: perfumeObject,
      perfumeName: perfumeName,
      dragOffsetX: 0,
      dragOffsetY: 0
    });

    this.gameManager.entityManager.addEntity(entity);
  }

  private showVictoryScreen(targetGold: number): void {
    if (this.gameCompleted) return;
    this.gameCompleted = true;

    this.audioSystem.playWinMusic();

    this.scene.pause();

    const overlay = this.add.rectangle(
      this.cameras.main.centerX, 
      this.cameras.main.centerY,
      this.cameras.main.width, 
      this.cameras.main.height,
      0x000000, 
      0.7
    ).setDepth(1000);

    const panelWidth = 500;
    const panelHeight = 350;
    const panel = this.add.rectangle(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      panelWidth,
      panelHeight,
      0xffffff,
      0.95
    ).setDepth(1001).setStrokeStyle(4, 0xDAA520);

    const titleText = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY - 120,
      '🌸 Congratulations! 🌸',
      {
        fontSize: '32px',
        color: '#D8BFD8',
        fontStyle: 'bold',
        fontFamily: 'Georgia, serif'
      }
    ).setOrigin(0.5).setDepth(1002);

    const achievementText = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY - 70,
      `You've successfully earned ${targetGold} gold!`,
      {
        fontSize: '20px',
        color: '#2d8659',
        fontFamily: 'Georgia, serif'
      }
    ).setOrigin(0.5).setDepth(1002);

    const endingMessage = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY - 20,
      'Thank you for creating such beautiful\nmoments for your customers! 💫',
      {
        fontSize: '16px',
        color: '#333',
        fontFamily: 'Georgia, serif',
        align: 'center',
        lineSpacing: 8
      }
    ).setOrigin(0.5).setDepth(1002);

    this.tweens.add({
      targets: titleText,
      alpha: 0.5,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private createStartScreen(): void {
    const startOverlay = this.add.rectangle(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      this.cameras.main.width,
      this.cameras.main.height,
      0x2c1810,
      0.95
    ).setDepth(1000);

    const titleText = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY - 150,
      '🌸 Perfume Shop 🌸',
      {
        fontSize: '48px',
        color: '#F5E6D3',
        fontStyle: 'bold',
        fontFamily: 'Georgia, serif'
      }
    ).setOrigin(0.5).setDepth(1001);

    const instructionText = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY - 20,
      'Welcome to your magical perfume shop!\n\n' +
      '• Click ingredients to add them to your cauldron\n' +
      '• Create beautiful scents for your customers\n' +
      '• Earn gold to reach your goal of 120 coins\n\n' +
      'Every fragrance tells a story... what will yours be?',
      {
        fontSize: '16px',
        color: '#E6D7C3',
        fontFamily: 'Georgia, serif',
        align: 'center',
        lineSpacing: 6,
        wordWrap: { width: 500 }
      }
    ).setOrigin(0.5).setDepth(1001);

    const startButton = this.add.rectangle(
      this.cameras.main.centerX,
      this.cameras.main.centerY + 140,
      180,
      50,
      0xDAA520,
      0.9
    ).setDepth(1002)
    .setInteractive()
    .on('pointerover', () => {
      startButton.setFillStyle(0xFFD700, 1);
      startButtonText.setColor('#2c1810');
    })
    .on('pointerout', () => {
      startButton.setFillStyle(0xDAA520, 0.9);
      startButtonText.setColor('#ffffff');
    })
    .on('pointerdown', () => {
      this.audioSystem.playClickSound();
      this.startGame([startOverlay, titleText, instructionText, startButton, startButtonText]);
    });

    const startButtonText = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY + 140,
      'Begin Your Journey',
      {
        fontSize: '18px',
        color: '#ffffff',
        fontStyle: 'bold',
        fontFamily: 'Georgia, serif'
      }
    ).setOrigin(0.5).setDepth(1003);

    this.tweens.add({
      targets: titleText,
      alpha: 0.7,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.tweens.add({
      targets: startButton,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private startGame(overlayElements: Phaser.GameObjects.GameObject[]): void {
    this.audioSystem.playBackgroundMusic();
    
    overlayElements.forEach(element => {
      if (element && element.destroy) {
        element.destroy();
      }
    });
  }

  private restartGame(): void {
    this.gameCompleted = false;
    
    Object.values(this.currentMessages).forEach(message => {
      if (message && message.destroy) {
        message.destroy();
      }
    });
    this.currentMessages = {};
    
    this.cauldronIngredients = {};
    
    this.scene.restart();
  }

  update(time: number, delta: number) {
    this.gameManager.update(delta);
  }
}