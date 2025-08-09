import { CustomerSpawnSystem } from '../src/ecs/systems/CustomerSpawnSystem';
import { DataManager } from '../src/ecs/DataManager';
import { EntityManager } from '../src/ecs/EntityManager';

describe('CustomerSpawnSystem', () => {
  let customerSpawnSystem: CustomerSpawnSystem;
  let dataManager: DataManager;
  let entityManager: EntityManager;

  beforeEach(() => {
    dataManager = DataManager.getInstance();
    entityManager = EntityManager.getInstance();
    customerSpawnSystem = new CustomerSpawnSystem(entityManager, dataManager);
  });

  describe('System Creation', () => {
    test('should create CustomerSpawnSystem successfully', () => {
      expect(customerSpawnSystem).toBeInstanceOf(CustomerSpawnSystem);
    });
  });

  describe('Update Method', () => {
    test('should handle update calls', () => {
      expect(() => customerSpawnSystem.update(16.67)).not.toThrow();
    });

    test('should handle large time deltas', () => {
      expect(() => customerSpawnSystem.update(5000)).not.toThrow();
    });
  });
});
