export interface DraggableComponent {
    isDragging: boolean;
    originalPosition: { x: number; y: number };
    gameObject: Phaser.GameObjects.GameObject | null;
    perfumeName: string;
    dragOffsetX: number;
    dragOffsetY: number;
}