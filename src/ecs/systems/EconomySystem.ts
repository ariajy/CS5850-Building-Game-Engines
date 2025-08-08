import { System } from '../SystemManager';

export class EconomySystem extends System {
  private gold: number;
  private transactionLog: { type: string; amount: number; reason: string }[] = [];
  private onGoldChangeCallback: ((newGold: number) => void) | null = null;
  private onTargetReachedCallback: ((targetGold: number) => void) | null = null;
  private targetGold: number = 120;

  constructor() {
    super();
    this.gold = 100; // starting gold, you can customize
  }

  public update(deltaTime: number): void {
    // Economy system doesn't need regular updates, but we implement it for System interface
  }

  public getGold(): number {
    return this.gold;
  }

  public addGold(amount: number, reason: string = "income"): void {
    this.gold += amount;
    this.transactionLog.push({ type: "gain", amount, reason });

    // Notify HUD gold change
    if (this.onGoldChangeCallback) {
      this.onGoldChangeCallback(this.gold);
    }

    // Check if target reached
    if (this.gold >= this.targetGold && this.onTargetReachedCallback) {
      this.onTargetReachedCallback(this.targetGold);
    }
  }

  public spendGold(amount: number, reason: string = "expense"): boolean {
    if (this.gold >= amount) {
      this.gold -= amount;
      this.transactionLog.push({ type: "spend", amount, reason });

      // Notify HUD gold change
      if (this.onGoldChangeCallback) {
        this.onGoldChangeCallback(this.gold);
      }
      
      return true;
    }
    return false; // not enough gold
  }

  public getTransactionHistory(): { type: string; amount: number; reason: string }[] {
    return this.transactionLog;
  }
  public setOnGoldChange(callback: (newGold: number) => void): void {
    // This method should be implemented to notify when gold changes
    // For example, you can use an event emitter or a simple callback
    this.onGoldChangeCallback = callback;
  }

  // Set target reached callback
  public setOnTargetReached(callback: (targetGold: number) => void): void {
    this.onTargetReachedCallback = callback;
  }

  // Set target gold
  public setTarget(target: number): void {
    this.targetGold = target;
  }

  // Get target gold
  public getTarget(): number {
    return this.targetGold;
  }
}
