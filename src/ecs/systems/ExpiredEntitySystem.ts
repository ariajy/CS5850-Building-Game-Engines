import { System } from '../SystemManager'
import { EntityManager } from '../EntityManager'
import { ExpiredComponent } from '../components/ExpiredComponent'

export class ExpiredEntitySystem extends System {
  private renderSystem: any = null;

  constructor(private entityManager: EntityManager) {
    super();
  }

  // Set render system reference for handling animations
  setRenderSystem(renderSystem: any): void {
    this.renderSystem = renderSystem;
  }

  update(delta: number) {
    const entities = this.entityManager.getEntitiesWithComponent('expired');

    for (const id of entities) {
      const expired = this.entityManager.getComponent<ExpiredComponent>(id, 'expired');
      if (!expired) continue;

      expired.remainingTime -= delta;

      if (expired.remainingTime <= 0) {
        if (this.renderSystem && this.renderSystem.fadeOutCustomer) {
          this.renderSystem.fadeOutCustomer(id, () => {
            this.entityManager.removeEntity(id);
          });
        } else {
          this.entityManager.removeEntity(id);
        }
      }
    }
  }
}
