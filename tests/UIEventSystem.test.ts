import UIEventSystem from '../src/ecs/systems/UIEventSystem';
import { Ingredient } from '../src/ecs/types';

describe('UIEventSystem', () => {
  let uiEventSystem: UIEventSystem;
  let mockScene: any;
  let mockInventorySystem: any;
  let mockText: any;

  beforeEach(() => {
    mockText = {
      setText: jest.fn(),
      setOrigin: jest.fn().mockReturnThis(),
      setAlpha: jest.fn().mockReturnThis(),
      destroy: jest.fn(),
      x: 0,
      y: 0
    };

    mockScene = {
      add: {
        text: jest.fn().mockReturnValue(mockText)
      },
      tweens: {
        add: jest.fn()
      },
      cameras: {
        main: {
          centerX: 400,
          centerY: 300
        }
      }
    };

    mockInventorySystem = {
      getQuantity: jest.fn((id: string) => 5),
      getPerfumeQuantity: jest.fn((name: string) => 2)
    };

    uiEventSystem = new UIEventSystem(mockScene, mockInventorySystem);
  });

  describe('System Creation', () => {
    test('should create UIEventSystem successfully', () => {
      expect(uiEventSystem).toBeInstanceOf(UIEventSystem);
    });

    test('should store scene and inventory references', () => {
      expect(uiEventSystem['scene']).toBe(mockScene);
      expect(uiEventSystem['inventorySystem']).toBe(mockInventorySystem);
    });
  });

  describe('Stock Texts Management', () => {
    test('should set stock texts', () => {
      const stockTexts = { rose: mockText };
      uiEventSystem.setStockTexts(stockTexts);
      expect(uiEventSystem['stockTexts']).toBe(stockTexts);
    });

    test('should set perfume texts', () => {
      const perfumeTexts = { lavender: mockText };
      uiEventSystem.setPerfumeTexts(perfumeTexts);
      expect(uiEventSystem['perfumeStockTexts']).toBe(perfumeTexts);
    });
  });

  describe('Stock Text Updates', () => {
    test('should update stock text for ingredient', () => {
      const stockTexts = { rose: mockText };
      uiEventSystem.setStockTexts(stockTexts);
      uiEventSystem.updateStockText('rose');
      expect(mockInventorySystem.getQuantity).toHaveBeenCalledWith('rose');
      expect(mockText.setText).toHaveBeenCalledWith('Stock: 5');
    });

    test('should not update stock text if text object missing', () => {
      uiEventSystem.setStockTexts({});
      expect(() => uiEventSystem.updateStockText('missing')).not.toThrow();
    });

    test('should update all stock texts for ingredients', () => {
      const stockTexts = { rose: mockText, lavender: mockText };
      uiEventSystem.setStockTexts(stockTexts);
      const ingredients: Ingredient[] = [
        { id: 'rose', name: 'Rose Oil', price: 10, imageKey: 'rose_oil' },
        { id: 'lavender', name: 'Lavender Oil', price: 8, imageKey: 'lavender_oil' }
      ];
      uiEventSystem.updateAllStockTexts(ingredients);
      expect(mockText.setText).toHaveBeenCalledWith('Stock: 5');
    });
  });

  describe('Perfume Text Updates', () => {
    test('should update perfume texts for all perfumes', () => {
      const perfumeTexts = { rose: mockText, lavender: mockText };
      uiEventSystem.setPerfumeTexts(perfumeTexts);
      uiEventSystem.updatePerfumeTexts();
      expect(mockInventorySystem.getPerfumeQuantity).toHaveBeenCalledWith('rose');
      expect(mockInventorySystem.getPerfumeQuantity).toHaveBeenCalledWith('lavender');
      expect(mockText.setText).toHaveBeenCalledWith('Owned: 2');
    });
  });

  describe('Message Display', () => {
    test('should show success message', () => {
      uiEventSystem.showMessage('Success!', 'success');
      expect(mockScene.add.text).toHaveBeenCalledWith(400, 50, 'Success!', expect.objectContaining({
        fontSize: '24px',
        color: '#00ff00'
      }));
      expect(mockScene.tweens.add).toHaveBeenCalledWith(expect.objectContaining({
        targets: mockText,
        alpha: 1,
        duration: 300,
        yoyo: true,
        hold: 1000,
        ease: 'Power1',
        onComplete: expect.any(Function)
      }));
    });

    test('should show error message', () => {
      uiEventSystem.showMessage('Error!', 'error');
      expect(mockScene.add.text).toHaveBeenCalledWith(400, 50, 'Error!', expect.objectContaining({
        fontSize: '24px',
        color: '#ff0000'
      }));
      expect(mockScene.tweens.add).toHaveBeenCalledWith(expect.objectContaining({
        targets: mockText,
        alpha: 1,
        duration: 300,
        yoyo: true,
        hold: 1000,
        ease: 'Power1',
        onComplete: expect.any(Function)
      }));
    });
  });

  describe('Update Method', () => {
    test('should handle update calls', () => {
      expect(() => uiEventSystem.update(16.67)).not.toThrow();
    });
  });
});
