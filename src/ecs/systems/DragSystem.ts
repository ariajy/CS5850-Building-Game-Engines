import { System } from '../SystemManager';
import { EntityManager } from '../EntityManager';
import { DraggableComponent } from '../components/DraggableComponent';

export class DragSystem extends System {
    private scene: Phaser.Scene;
    private entityManager: EntityManager;
    private isDragging: boolean = false;
    private draggedEntity: string | null = null;

    constructor(scene: Phaser.Scene, entityManager: EntityManager) {
        super();
        this.scene = scene;
        this.entityManager = entityManager;
        this.setupInput();
    }

    private setupInput(): void {
        // Listen for mouse events
        this.scene.input.on('pointerdown', this.onPointerDown, this);
        this.scene.input.on('pointermove', this.onPointerMove, this);
        this.scene.input.on('pointerup', this.onPointerUp, this);
    }

    private onPointerDown(pointer: Phaser.Input.Pointer): void {
        // Check if a draggable object was clicked
        const entities = this.entityManager.getEntitiesWithComponent('draggable');
        
        for (const entityId of entities) {
            const draggable = this.entityManager.getComponent<DraggableComponent>(entityId, 'draggable');
            if (!draggable || !draggable.gameObject) continue;

            const gameObject = draggable.gameObject as Phaser.GameObjects.Rectangle;
            // Check if the mouse is within the game object's bounds
            const bounds = gameObject.getBounds();
            if (bounds.contains(pointer.x, pointer.y)) {
                this.startDrag(entityId, pointer);
                break;
            }
        }
    }

    private startDrag(entityId: string, pointer: Phaser.Input.Pointer): void {
        const draggable = this.entityManager.getComponent<DraggableComponent>(entityId, 'draggable');
        if (!draggable) return;

        this.isDragging = true;
        this.draggedEntity = entityId;
        draggable.isDragging = true;

        const gameObject = draggable.gameObject as any;
        draggable.dragOffsetX = pointer.x - gameObject.x;
        draggable.dragOffsetY = pointer.y - gameObject.y;

        // Bring the dragged object to the top
        gameObject.setDepth(1000);
    }

    private onPointerMove(pointer: Phaser.Input.Pointer): void {
        if (!this.isDragging || !this.draggedEntity) return;

        const draggable = this.entityManager.getComponent<DraggableComponent>(this.draggedEntity, 'draggable');
        if (!draggable || !draggable.gameObject) return;

        const gameObject = draggable.gameObject as any;
        const newX = pointer.x - draggable.dragOffsetX;
        const newY = pointer.y - draggable.dragOffsetY;
        
        gameObject.setPosition(newX, newY);
        
        const text = gameObject.getData('text');
        if (text) {
            text.setPosition(newX, newY);
        }
    }

    private onPointerUp(pointer: Phaser.Input.Pointer): void {
        if (!this.isDragging || !this.draggedEntity) return;

        const draggable = this.entityManager.getComponent<DraggableComponent>(this.draggedEntity, 'draggable');
        if (!draggable) return;

        // Send drag end event for SellSystem to handle
        this.scene.events.emit('dragEnd', {
            entityId: this.draggedEntity,
            perfumeName: draggable.perfumeName,
            position: { x: pointer.x, y: pointer.y }
        });

        // Reset drag state
        this.resetDrag();
    }

    private resetDrag(): void {
        if (this.draggedEntity) {
            const draggable = this.entityManager.getComponent<DraggableComponent>(this.draggedEntity, 'draggable');
            if (draggable) {
                draggable.isDragging = false;

                // bring the dragged object back to its original position
                const gameObject = draggable.gameObject as any;
                gameObject.setPosition(draggable.originalPosition.x, draggable.originalPosition.y);
                gameObject.setDepth(5); // restore original depth

                // If there is associated text, also restore its position
                const text = gameObject.getData('text');
                if (text) {
                    text.setPosition(draggable.originalPosition.x, draggable.originalPosition.y);
                }
            }
        }

        this.isDragging = false;
        this.draggedEntity = null;
    }

    update(deltaTime: number): void {
        // Drag system mainly responds to events, this can be left empty or handle other logic
    }

    // Public method: called after a successful drop
    public confirmDrop(entityId: string): void {
        const draggable = this.entityManager.getComponent<DraggableComponent>(entityId, 'draggable');
        if (draggable && draggable.gameObject) {
            const gameObject = draggable.gameObject as any;

            // Destroy associated text
            const text = gameObject.getData('text');
            if (text) {
                text.destroy();
            }

            // Remove the dragged game object
            gameObject.destroy();

            // Remove from entity manager
            this.entityManager.removeEntity(entityId);
        }
    }

    // Public method: called to cancel the drop and return to the original position
    public cancelDrop(entityId: string): void {
        const draggable = this.entityManager.getComponent<DraggableComponent>(entityId, 'draggable');
        if (draggable && draggable.gameObject) {
            const gameObject = draggable.gameObject as any;
            gameObject.setPosition(draggable.originalPosition.x, draggable.originalPosition.y);
            gameObject.setDepth(5);

            // If there is associated text, also restore its position
            const text = gameObject.getData('text');
            if (text) {
                text.setPosition(draggable.originalPosition.x, draggable.originalPosition.y);
            }
        }
    }
}