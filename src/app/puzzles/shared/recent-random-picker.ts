export class RecentRandomPicker<T> {
  private readonly recentKeys: string[] = [];

  constructor(private readonly recentWindowSize: number) {}

  pick(items: readonly T[], getKey: (item: T) => string): T {
    if (items.length === 0) {
      throw new Error('Cannot pick an item from an empty list.');
    }

    const blockedKeys = new Set(this.recentKeys);
    const availableItems = items.filter((item) => !blockedKeys.has(getKey(item)));
    const candidates = availableItems.length > 0 ? availableItems : items;
    const item = candidates[Math.floor(Math.random() * candidates.length)];

    this.remember(getKey(item), items.length);

    return item;
  }

  private remember(key: string, itemCount: number): void {
    this.recentKeys.push(key);

    const maxRecentKeys = Math.min(this.recentWindowSize, Math.max(0, itemCount - 1));

    while (this.recentKeys.length > maxRecentKeys) {
      this.recentKeys.shift();
    }
  }
}
