import { EconomySystem } from '../src/ecs/systems/EconomySystem';

describe('EconomySystem', () => {
  let economySystem: EconomySystem;

  beforeEach(() => {
    economySystem = new EconomySystem();
  });

  describe('Gold Management', () => {
    test('should initialize with 100 gold', () => {
      expect(economySystem.getGold()).toBe(100);
    });

    test('should add gold correctly', () => {
      economySystem.addGold(50, 'Test addition');
      expect(economySystem.getGold()).toBe(150);
    });

    test('should add multiple gold amounts correctly', () => {
      economySystem.addGold(20, 'First addition');
      economySystem.addGold(30, 'Second addition');
      expect(economySystem.getGold()).toBe(150); // 100 + 20 + 30
    });

    test('should spend gold successfully when sufficient funds available', () => {
      const result = economySystem.spendGold(30, 'Test purchase');
      
      expect(result).toBe(true);
      expect(economySystem.getGold()).toBe(70);
    });

    test('should fail to spend gold when insufficient funds', () => {
      const result = economySystem.spendGold(150, 'Expensive purchase');
      
      expect(result).toBe(false);
      expect(economySystem.getGold()).toBe(100);
    });

    test('should handle exact gold spending', () => {
      const result = economySystem.spendGold(100, 'Spend all');
      
      expect(result).toBe(true);
      expect(economySystem.getGold()).toBe(0);
    });
  });

  describe('Transaction History', () => {
    test('should track gold addition transactions', () => {
      economySystem.addGold(25, 'Sold perfume');
      economySystem.addGold(15, 'Customer tip');
      
      const history = economySystem.getTransactionHistory();
      expect(history).toHaveLength(2);
      expect(history[0].amount).toBe(25);
      expect(history[0].reason).toBe('Sold perfume');
      expect(history[0].type).toBe('gain');
    });

    test('should track gold spending transactions', () => {
      economySystem.spendGold(30, 'Bought ingredients');
      
      const history = economySystem.getTransactionHistory();
      expect(history).toHaveLength(1);
      expect(history[0].amount).toBe(30);
      expect(history[0].reason).toBe('Bought ingredients');
      expect(history[0].type).toBe('spend');
    });

    test('should maintain chronological order of transactions', () => {
      economySystem.addGold(50, 'First transaction');
      economySystem.spendGold(20, 'Second transaction');
      economySystem.addGold(30, 'Third transaction');
      
      const history = economySystem.getTransactionHistory();
      expect(history).toHaveLength(3);
      expect(history[0].reason).toBe('First transaction');
      expect(history[1].reason).toBe('Second transaction');
      expect(history[2].reason).toBe('Third transaction');
    });
  });

  describe('Target System', () => {
    test('should have default target of 120 gold', () => {
      expect(economySystem.getTarget()).toBe(120);
    });

    test('should allow setting custom target', () => {
      economySystem.setTarget(200);
      expect(economySystem.getTarget()).toBe(200);
    });

    test('should trigger target reached callback when target is met', () => {
      const callback = jest.fn();
      economySystem.setOnTargetReached(callback);
      economySystem.setTarget(120);
      
      economySystem.addGold(20, 'Reach target'); // 100 + 20 = 120
      
      expect(callback).toHaveBeenCalledWith(120);
    });

    test('should not trigger target callback when target not reached', () => {
      const callback = jest.fn();
      economySystem.setOnTargetReached(callback);
      economySystem.setTarget(200);
      
      economySystem.addGold(50, 'Not enough'); // 100 + 50 = 150 < 200
      
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Callback System', () => {
    test('should trigger gold change callback on addition', () => {
      const callback = jest.fn();
      economySystem.setOnGoldChange(callback);
      
      economySystem.addGold(25, 'Test addition');
      
      expect(callback).toHaveBeenCalledWith(125);
    });

    test('should trigger gold change callback on spending', () => {
      const callback = jest.fn();
      economySystem.setOnGoldChange(callback);
      
      economySystem.spendGold(50, 'Test spending');
      
      expect(callback).toHaveBeenCalledWith(50);
    });

    test('should not trigger gold change callback on failed spending', () => {
      const callback = jest.fn();
      economySystem.setOnGoldChange(callback);
      
      economySystem.spendGold(150, 'Failed spending'); // More than available
      
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('System Interface', () => {
    test('should run update method without errors', () => {
      expect(() => economySystem.update(16.67)).not.toThrow();
    });

    test('should maintain state consistency during updates', () => {
      economySystem.addGold(100, 'Initial');
      economySystem.update(16.67);
      expect(economySystem.getGold()).toBe(200); // 100 initial + 100 added
    });
  });
});
