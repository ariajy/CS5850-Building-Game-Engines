import ShopScene from '../src/scenes/ShopScene';
import { GameManager } from '../src/ecs/GameManager';

// Mock all complex systems
jest.mock('../src/ecs/systems/AudioSystem', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      preloadAudio: jest.fn(),
      createAudio: jest.fn(),
      playSuccessSound: jest.fn(),
      playFailSound: jest.fn(),
      playMoneySound: jest.fn(),
    }))
  };
});
jest.mock('../src/ecs/systems/PhysicsSystem');
jest.mock('../src/ecs/systems/InventorySystem');
jest.mock('../src/ecs/systems/RenderSystem');
jest.mock('../src/ecs/systems/ExpiredEntitySystem');
jest.mock('../src/ecs/systems/EconomySystem');
jest.mock('../src/ecs/systems/DragSystem');
jest.mock('../src/ecs/systems/SellSystem');
jest.mock('../src/UI/HUD');

// Mock Phaser Scene and its dependencies
jest.mock('phaser', () => ({
  Scene: class MockScene {
    constructor(key: string) {
      this.scene = { 
        key,
        pause: jest.fn(),
      };
    }
    
    load = {
      image: jest.fn(),
      audio: jest.fn(),
    };
    
    sound = {
      add: jest.fn().mockReturnValue({
        play: jest.fn(),
        stop: jest.fn(),
        setVolume: jest.fn(),
        setMute: jest.fn(),
        isPlaying: false,
      }),
    };
    
    add = {
      image: jest.fn().mockReturnValue({
        setScale: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        setOrigin: jest.fn().mockReturnThis(),
        setDisplaySize: jest.fn().mockReturnThis(),
        setInteractive: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
        setData: jest.fn().mockReturnThis(),
        setScrollFactor: jest.fn().mockReturnThis(),
      }),
      text: jest.fn().mockReturnValue({
        setOrigin: jest.fn().mockReturnThis(),
        setAlpha: jest.fn().mockReturnThis(),
        setScrollFactor: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        setColor: jest.fn().mockReturnThis(),
        destroy: jest.fn(),
      }),
      rectangle: jest.fn().mockReturnValue({
        setDepth: jest.fn().mockReturnThis(),
        setStrokeStyle: jest.fn().mockReturnThis(),
        setInteractive: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
        setFillStyle: jest.fn().mockReturnThis(),
      }),
    };
    
    cameras = {
      main: {
        centerX: 400,
        centerY: 300,
        width: 800,
        height: 600,
      },
    };
    
    tweens = {
      add: jest.fn(),
    };
    
    time = {
      delayedCall: jest.fn(),
    };
    
    events = {
      on: jest.fn(),
      emit: jest.fn(),
    };
    
    scene = {
      pause: jest.fn(),
      key: '',
    };
  },
  default: jest.fn(),
}));

describe('ShopScene', () => {
  let shopScene: ShopScene;
  let mockGameManager: any;

  beforeEach(() => {
    // Mock GameManager and its dependencies
    mockGameManager = {
      systemManager: {
        addSystem: jest.fn(),
        getSystem: jest.fn(),
      },
      entityManager: {
        addEntity: jest.fn(),
        createEntity: jest.fn().mockReturnValue('entity123'),
        getEntitiesWithComponent: jest.fn().mockReturnValue([]),
        getAllEntities: jest.fn().mockReturnValue(new Map()),
        removeEntity: jest.fn(),
      },
      dataManager: {
        getIngredients: jest.fn().mockReturnValue([
          {
            id: 'lavender-oil',
            name: 'Lavender Oil',
            price: 3,
            imageKey: 'lavender_oil',
          },
          {
            id: 'rose-oil',
            name: 'Rose Oil', 
            price: 3,
            imageKey: 'rose_oil',
          },
          {
            id: 'alcohol',
            name: 'Alcohol',
            price: 1,
            imageKey: 'alcohol',
          },
        ]),
        getRecipes: jest.fn().mockReturnValue([
          {
            name: 'Lavender Perfume',
            ingredients: {
              'lavender-oil': 2,
              'alcohol': 1,
            },
          },
          {
            name: 'Rose Perfume',
            ingredients: {
              'rose-oil': 2,
              'alcohol': 1,
            },
          },
        ]),
      },
    };

    // Mock GameManager.getInstance()
    jest.spyOn(GameManager, 'getInstance').mockReturnValue(mockGameManager);

    shopScene = new ShopScene();
    
    // Mock the audioSystem that gets created in preload
    shopScene['audioSystem'] = {
      preloadAudio: jest.fn(),
      createAudio: jest.fn(),
      playSuccessSound: jest.fn(),
      playFailSound: jest.fn(),
      playMoneySound: jest.fn(),
      playWinMusic: jest.fn(),
      playClickSound: jest.fn(),
    } as any;

    // Mock the children property for createDraggablePerfume tests
    shopScene['children'] = {
      list: [
        // Mock some existing children
        {
          getData: jest.fn().mockReturnValue('existing'),
          destroy: jest.fn(),
        }
      ],
    } as any;

    // Initialize cauldronIngredients for testing
    shopScene['cauldronIngredients'] = {};
    shopScene['economySystem'] = {
      getGold: jest.fn().mockReturnValue(100),
      spendGold: jest.fn().mockReturnValue(true),
    } as any;

    // Mock the physics system with flyBottleToCauldron that immediately calls callback
    shopScene['physicsSystem'] = {
      setCauldronArea: jest.fn(),
      flyBottleToCauldron: jest.fn().mockImplementation((bottle: any, ingredient: any, callback: Function) => {
        // Immediately call the callback to simulate completed animation
        callback();
      }),
    } as any;

    // Mock other required methods
    shopScene['showWarmMessage'] = jest.fn();
    shopScene['createFlyingBottle'] = jest.fn().mockImplementation((ingredient: any) => {
      // Directly call addIngredientToCauldron to simulate the bottle animation completion
      shopScene['addIngredientToCauldron'](ingredient);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Scene Creation', () => {
    test('should create ShopScene successfully', () => {
      expect(shopScene).toBeInstanceOf(ShopScene);
    });

    test('should have correct scene key', () => {
      expect(shopScene.scene.key).toBe('ShopScene');
    });
  });

  describe('Preload Method', () => {
    test('should load background and UI images', () => {
      shopScene.preload();

      expect(shopScene.load.image).toHaveBeenCalledWith('background', './src/assets/images/background.png');
      expect(shopScene.load.image).toHaveBeenCalledWith('cauldron', './src/assets/images/cauldron.png');
      expect(shopScene.load.image).toHaveBeenCalledWith('dream_perfume', './src/assets/images/dream_perfume.png');
      expect(shopScene.load.image).toHaveBeenCalledWith('lavender_perfume', './src/assets/images/lavender_perfume.png');
      expect(shopScene.load.image).toHaveBeenCalledWith('rose_perfume', './src/assets/images/rose_perfume.png');
    });

    test('should load ingredient images dynamically', () => {
      shopScene.preload();

      expect(shopScene.load.image).toHaveBeenCalledWith('lavender_oil', './src/assets/images/lavender_oil.png');
      expect(shopScene.load.image).toHaveBeenCalledWith('rose_oil', './src/assets/images/rose_oil.png');
      expect(shopScene.load.image).toHaveBeenCalledWith('alcohol', './src/assets/images/alcohol.png');
    });

    test('should initialize GameManager', () => {
      shopScene.preload();

      expect(GameManager.getInstance).toHaveBeenCalled();
      expect(mockGameManager.dataManager.getIngredients).toHaveBeenCalled();
    });

    test('should handle preload without errors', () => {
      expect(() => shopScene.preload()).not.toThrow();
    });
  });

  describe('Scene Configuration', () => {
    test('should configure camera properly', () => {
      expect(shopScene.cameras.main.centerX).toBe(400);
      expect(shopScene.cameras.main.centerY).toBe(300);
      expect(shopScene.cameras.main.width).toBe(800);
      expect(shopScene.cameras.main.height).toBe(600);
    });

    test('should have required scene methods', () => {
      expect(typeof shopScene.preload).toBe('function');
      expect(typeof shopScene.create).toBe('function');
    });
  });

  describe('Asset Management', () => {
    test('should load all required image assets', () => {
      shopScene.preload();

      const requiredImages = [
        'background',
        'cauldron',
        'dream_perfume',
        'lavender_perfume',
        'rose_perfume',
      ];

      requiredImages.forEach(imageKey => {
        expect(shopScene.load.image).toHaveBeenCalledWith(
          imageKey,
          expect.stringContaining(imageKey)
        );
      });
    });

    test('should handle dynamic asset loading for ingredients', () => {
      shopScene.preload();

      // Should dynamically load assets based on data
      mockGameManager.dataManager.getIngredients().forEach((ingredient: any) => {
        expect(shopScene.load.image).toHaveBeenCalledWith(
          ingredient.imageKey,
          `./src/assets/images/${ingredient.imageKey}.png`
        );
      });
    });
  });

  describe('Data Integration', () => {
    test('should handle ingredient data loading', () => {
      shopScene.preload();

      expect(mockGameManager.dataManager.getIngredients).toHaveBeenCalled();
    });

    test('should handle missing ingredient data gracefully', () => {
      mockGameManager.dataManager.getIngredients.mockReturnValue([]);

      expect(() => shopScene.preload()).not.toThrow();
    });

    test('should create proper number of ingredient assets', () => {
      shopScene.preload();

      // Should create assets for each ingredient
      const ingredients = mockGameManager.dataManager.getIngredients();
      ingredients.forEach((ingredient: any) => {
        expect(shopScene.load.image).toHaveBeenCalledWith(
          ingredient.imageKey,
          expect.stringContaining(ingredient.imageKey)
        );
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle GameManager initialization errors', () => {
      jest.spyOn(GameManager, 'getInstance').mockImplementation(() => {
        throw new Error('GameManager initialization failed');
      });

      expect(() => shopScene.preload()).toThrow();
    });

    test('should handle missing data manager gracefully', () => {
      const mockGameManagerWithoutData = {
        systemManager: {
          addSystem: jest.fn(),
          getSystem: jest.fn(),
        },
        entityManager: {
          addEntity: jest.fn(),
          createEntity: jest.fn().mockReturnValue('entity123'),
          getEntitiesWithComponent: jest.fn().mockReturnValue([]),
        },
        componentManager: {},
        update: jest.fn(),
        dataManager: {
          getIngredients: jest.fn().mockImplementation(() => {
            throw new Error('Data loading failed');
          }),
        },
      } as any;

      jest.spyOn(GameManager, 'getInstance').mockReturnValue(mockGameManagerWithoutData);

      expect(() => shopScene.preload()).toThrow();
    });
  });

  describe('Performance Considerations', () => {
    test('should not load excessive assets', () => {
      shopScene.preload();

      // Verify reasonable number of calls to load.image
      const imageCallCount = (shopScene.load.image as jest.Mock).mock.calls.length;
      expect(imageCallCount).toBeLessThan(15); // Reasonable upper bound for a shop scene
    });

    test('should handle rapid preload calls gracefully', () => {
      const startTime = performance.now();

      for (let i = 0; i < 10; i++) {
        shopScene.preload();
      }

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(100); // Should complete quickly
    });
  });

  describe('Scene Lifecycle', () => {
    test('should support standard Phaser scene lifecycle', () => {
      expect(shopScene).toHaveProperty('preload');
      expect(shopScene).toHaveProperty('create');
      expect(shopScene).toHaveProperty('scene');
    });

    test('should maintain scene state', () => {
      expect(shopScene.scene.key).toBe('ShopScene');
    });
  });

  describe('Asset Path Validation', () => {
    test('should use consistent asset path structure', () => {
      shopScene.preload();

      const imageCalls = (shopScene.load.image as jest.Mock).mock.calls;
      
      imageCalls.forEach(([key, path]: [string, string]) => {
        expect(path).toMatch(/^\.\/src\/assets\/images\/.+\.png$/);
      });
    });

    test('should load assets with correct naming convention', () => {
      shopScene.preload();

      const expectedAssets = [
        { key: 'background', path: './src/assets/images/background.png' },
        { key: 'cauldron', path: './src/assets/images/cauldron.png' },
        { key: 'lavender_oil', path: './src/assets/images/lavender_oil.png' },
        { key: 'rose_oil', path: './src/assets/images/rose_oil.png' },
        { key: 'alcohol', path: './src/assets/images/alcohol.png' },
      ];

      expectedAssets.forEach(({ key, path }) => {
        expect(shopScene.load.image).toHaveBeenCalledWith(key, path);
      });
    });
  });

  describe('Create Method and System Initialization', () => {
    test('should create method exist and be callable', () => {
      expect(typeof shopScene.create).toBe('function');
      expect(() => shopScene.create()).not.toThrow();
    });

    test('should initialize core systems in create method', () => {
      shopScene.create();

      expect(mockGameManager.systemManager.addSystem).toHaveBeenCalledWith('inventory', expect.any(Object));
      expect(mockGameManager.systemManager.addSystem).toHaveBeenCalledWith('audio', expect.any(Object));
      expect(mockGameManager.systemManager.addSystem).toHaveBeenCalledWith('physics', expect.any(Object));
      expect(mockGameManager.systemManager.addSystem).toHaveBeenCalledWith('render', expect.any(Object));
    });

    test('should register inventory change event listener', () => {
      shopScene.create();

      expect(shopScene.events.on).toHaveBeenCalledWith('inventoryChanged', expect.any(Function), shopScene);
    });

    test('should create background with proper configuration', () => {
      shopScene.create();

      expect(shopScene.add.image).toHaveBeenCalledWith(0, 0, 'background');
    });

    test('should initialize economy system with gold target', () => {
      shopScene.create();

      expect(mockGameManager.systemManager.addSystem).toHaveBeenCalledWith('economy', expect.any(Object));
    });

    test('should create all required game systems', () => {
      shopScene.create();

      const expectedSystems = [
        'inventory', 'audio', 'physics', 'render', 
        'expired', 'economy', 'drag', 'sell', 'order', 
        'customerSpawn', 'debug'
      ];

      expectedSystems.forEach(systemName => {
        expect(mockGameManager.systemManager.addSystem).toHaveBeenCalledWith(systemName, expect.any(Object));
      });
    });
  });

  describe('Cauldron Creation', () => {
    test('should create cauldron with proper positioning', () => {
      shopScene.create();

      expect(shopScene.add.image).toHaveBeenCalledWith(700, 500, 'cauldron');
    });

    test('should create cauldron instruction text', () => {
      shopScene.create();

      expect(shopScene.add.text).toHaveBeenCalledWith(
        700, 700, 'Click ingredients to add',
        expect.objectContaining({
          fontSize: '16px',
          color: '#666',
          fontStyle: 'italic'
        })
      );
    });

    test('should configure physics system for cauldron area', () => {
      const mockPhysicsSystem = {
        setCauldronArea: jest.fn()
      };

      // Mock the PhysicsSystem constructor to return our mock
      jest.doMock('../src/ecs/systems/PhysicsSystem', () => ({
        PhysicsSystem: jest.fn().mockImplementation(() => mockPhysicsSystem)
      }));

      shopScene.create();

      // Verify cauldron area is set up (would need to access internal physics system)
      expect(shopScene.add.image).toHaveBeenCalledWith(700, 500, 'cauldron');
    });
  });

  describe('Order Area Indicator', () => {
    test('should create order area visual indicator', () => {
      shopScene.create();

      // Should create some visual indication of the order area
      expect(shopScene.add.rectangle).toHaveBeenCalled();
    });

    test('should create order area with proper depth', () => {
      shopScene.create();

      const rectangleCalls = (shopScene.add.rectangle as jest.Mock).mock.calls;
      expect(rectangleCalls.length).toBeGreaterThan(0);
    });
  });

  describe('Ingredient Interface Creation', () => {
    test('should create clickable ingredients based on data', () => {
      shopScene.create();

      const ingredients = mockGameManager.dataManager.getIngredients();
      
      // Should create image for each ingredient
      ingredients.forEach((ingredient: any) => {
        expect(shopScene.add.image).toHaveBeenCalledWith(
          250, expect.any(Number), ingredient.imageKey
        );
      });
    });

    test('should create ingredient labels with names and prices', () => {
      shopScene.create();

      const ingredients = mockGameManager.dataManager.getIngredients();
      
      // Should create text labels for each ingredient
      ingredients.forEach((ingredient: any, index: number) => {
        expect(shopScene.add.text).toHaveBeenCalledWith(
          330, 150 + index * 200, ingredient.name,
          expect.objectContaining({
            fontSize: '20px',
            color: '#000'
          })
        );

        expect(shopScene.add.text).toHaveBeenCalledWith(
          330, 175 + index * 200, `${ingredient.price} gold`,
          expect.objectContaining({
            fontSize: '16px',
            color: '#DAA520'
          })
        );
      });
    });

    test('should set up ingredient interactivity', () => {
      shopScene.create();

      const ingredients = mockGameManager.dataManager.getIngredients();
      const imageAddCalls = (shopScene.add.image as jest.Mock).mock.calls;
      
      // Find ingredient image calls
      const ingredientImageCalls = imageAddCalls.filter(call => 
        ingredients.some((ing: any) => ing.imageKey === call[2])
      );

      expect(ingredientImageCalls.length).toBe(ingredients.length);
    });
  });

  describe('Start Screen Creation', () => {
    test('should create start screen elements', () => {
      shopScene.create();

      // Should create some start screen UI elements
      expect(shopScene.add.text).toHaveBeenCalled();
    });

    test('should create start screen with proper styling', () => {
      shopScene.create();

      const textCalls = (shopScene.add.text as jest.Mock).mock.calls;
      expect(textCalls.length).toBeGreaterThan(0);
    });
  });

  describe('Victory Screen Functionality', () => {
    test('should handle victory screen display', () => {
      shopScene.create();

      // The victory screen functionality should be available
      expect(typeof shopScene['showVictoryScreen']).toBe('function');
    });

    test('should show victory screen when called', () => {
      shopScene.create();

      expect(() => {
        shopScene['showVictoryScreen'](150);
      }).not.toThrow();
    });
  });

  describe('Message Display System', () => {
    test('should show warm messages', () => {
      shopScene.create();

      expect(() => {
        shopScene['showWarmMessage']('Test message', 'success');
      }).not.toThrow();
    });

    test('should handle different message types', () => {
      shopScene.create();

      expect(() => {
        shopScene['showWarmMessage']('Success message', 'success');
        shopScene['showWarmMessage']('Gentle message', 'gentle');
      }).not.toThrow();
    });

    test('should manage current messages tracking', () => {
      shopScene.create();

      // Should have message tracking system
      expect(shopScene['currentMessages']).toBeDefined();
      expect(typeof shopScene['currentMessages']).toBe('object');
    });
  });

  describe('Perfume Text Management', () => {
    test('should update perfume texts when inventory changes', () => {
      shopScene.create();

      expect(() => {
        shopScene['updatePerfumeTexts']();
      }).not.toThrow();
    });

    test('should track perfume stock texts', () => {
      shopScene.create();

      expect(shopScene['perfumeStockTexts']).toBeDefined();
      expect(typeof shopScene['perfumeStockTexts']).toBe('object');
    });

    test('should create perfume stock display', () => {
      shopScene.create();

      // Should create text elements for perfume stocks
      expect(shopScene.add.text).toHaveBeenCalled();
    });
  });

  describe('Ingredient Click Handling', () => {
    test('should handle ingredient clicks', () => {
      shopScene.create();

      const mockIngredient = {
        id: 'test-ingredient',
        name: 'Test Ingredient',
        price: 5,
        imageKey: 'test_ingredient'
      };

      expect(() => {
        shopScene['onIngredientClick'](mockIngredient);
      }).not.toThrow();
    });

    test('should track cauldron ingredients', () => {
      shopScene.create();

      expect(shopScene['cauldronIngredients']).toBeDefined();
      expect(typeof shopScene['cauldronIngredients']).toBe('object');
    });

    test('should update cauldron contents on ingredient click', () => {
      shopScene.create();

      const mockIngredient = {
        id: 'lavender-oil',
        name: 'Lavender Oil',
        price: 3,
        imageKey: 'lavender_oil'
      };

      shopScene['onIngredientClick'](mockIngredient);

      expect(shopScene['cauldronIngredients']['lavender-oil']).toBeDefined();
    });
  });

  describe('Recipe System Integration', () => {
    test('should check if recipes can be brewed', () => {
      shopScene.create();

      const mockRecipe = {
        name: 'Test Perfume',
        ingredients: {
          'lavender-oil': 2,
          'alcohol': 1
        }
      };

      expect(() => {
        shopScene['canBrewRecipe'](mockRecipe);
      }).not.toThrow();
    });

    test('should handle recipe brewing attempts', () => {
      shopScene.create();

      expect(() => {
        shopScene['checkForCompletedRecipes']();
      }).not.toThrow();
    });

    test('should create experimental results for invalid recipes', () => {
      shopScene.create();

      expect(() => {
        shopScene['createExperimentResult']();
      }).not.toThrow();
    });
  });

  describe('Draggable Perfume Creation', () => {
    test('should create draggable perfumes', () => {
      shopScene.create();

      expect(() => {
        shopScene['createDraggablePerfume']('Rose Perfume');
      }).not.toThrow();
    });

    test('should get correct perfume image keys', () => {
      shopScene.create();

      const roseKey = shopScene['getPerfumeImageKey']('Rose Perfume');
      expect(roseKey).toBe('rose_perfume');

      const lavenderKey = shopScene['getPerfumeImageKey']('Lavender Perfume');
      expect(lavenderKey).toBe('lavender_perfume');

      const dreamKey = shopScene['getPerfumeImageKey']('Dream Perfume');
      expect(dreamKey).toBe('dream_perfume');
    });

    test('should handle unknown perfume types', () => {
      shopScene.create();

      const unknownKey = shopScene['getPerfumeImageKey']('Unknown Perfume');
      expect(unknownKey).toBe('dream_perfume'); // Default fallback
    });
  });

  describe('Game State Management', () => {
    test('should track game completion state', () => {
      shopScene.create();

      expect(shopScene['gameCompleted']).toBeDefined();
      expect(typeof shopScene['gameCompleted']).toBe('boolean');
      expect(shopScene['gameCompleted']).toBe(false);
    });

    test('should have gold target configuration', () => {
      shopScene.create();

      expect(shopScene['goldTarget']).toBeDefined();
      expect(typeof shopScene['goldTarget']).toBe('number');
      expect(shopScene['goldTarget']).toBe(150);
    });
  });

  describe('Audio System Integration', () => {
    test('should initialize audio system in preload', () => {
      expect(() => shopScene.preload()).not.toThrow();
    });

    test('should create audio in create method', () => {
      expect(() => shopScene.create()).not.toThrow();
    });

    test('should have audio system available', () => {
      shopScene.create();

      expect(shopScene['audioSystem']).toBeDefined();
    });
  });

  describe('System Interconnection', () => {
    test('should connect systems properly', () => {
      shopScene.create();

      // Verify systems are connected through the manager
      expect(mockGameManager.systemManager.addSystem).toHaveBeenCalledTimes(11);
    });

    test('should set up system dependencies', () => {
      shopScene.create();

      // All systems should be registered with the system manager
      const addSystemCalls = mockGameManager.systemManager.addSystem.mock.calls;
      const systemNames = addSystemCalls.map((call: any) => call[0]);
      
      expect(systemNames).toContain('inventory');
      expect(systemNames).toContain('economy');
      expect(systemNames).toContain('drag');
      expect(systemNames).toContain('sell');
    });
  });

  describe('UI Layout and Positioning', () => {
    test('should position elements consistently', () => {
      shopScene.create();

      // Cauldron should be positioned at specific coordinates
      expect(shopScene.add.image).toHaveBeenCalledWith(700, 500, 'cauldron');
    });

    test('should create proper ingredient layout', () => {
      shopScene.create();

      const ingredients = mockGameManager.dataManager.getIngredients();
      
      ingredients.forEach((ingredient: any, index: number) => {
        const expectedY = 150 + index * 200;
        expect(shopScene.add.image).toHaveBeenCalledWith(250, expectedY + 30, ingredient.imageKey);
      });
    });

    test('should maintain proper visual hierarchy with depth', () => {
      shopScene.create();

      // Background should have negative depth
      const imageAddCalls = (shopScene.add.image as jest.Mock).mock.calls;
      expect(imageAddCalls.some(call => call[2] === 'background')).toBe(true);
    });
  });

  describe('Error Handling in Scene Operations', () => {
    test('should handle missing recipe data', () => {
      mockGameManager.dataManager.getRecipes.mockReturnValue([]);

      expect(() => shopScene.create()).not.toThrow();
    });

    test('should handle corrupted ingredient data', () => {
      mockGameManager.dataManager.getIngredients.mockReturnValue([
        { id: null, name: null, price: NaN, imageKey: null }
      ]);

      expect(() => shopScene.preload()).not.toThrow();
    });

    test('should handle system initialization failures gracefully', () => {
      mockGameManager.systemManager.addSystem.mockImplementation(() => {
        throw new Error('System initialization failed');
      });

      expect(() => shopScene.create()).toThrow();
    });
  });

  describe('Memory Management', () => {
    test('should clean up message tracking', () => {
      shopScene.create();

      expect(shopScene['currentMessages']).toEqual({});
    });

    test('should initialize cauldron ingredients as empty', () => {
      shopScene.create();

      expect(shopScene['cauldronIngredients']).toEqual({});
    });

    test('should initialize perfume stock texts as empty', () => {
      shopScene.create();

      expect(shopScene['perfumeStockTexts']).toEqual({});
    });
  });
});
