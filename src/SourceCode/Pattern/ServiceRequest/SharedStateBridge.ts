// SharedStateBridge.ts

export type SharedDataSubscriber<T = any> = (data: T) => void;

export class SharedStateBridge {
  // === 状态共享（Pub/Sub） ===
  protected sharedDataRegistry = new Map<string, any>();
  protected sharedDataSubscribers = new Map<string, Set<SharedDataSubscriber>>();

  // === 通用键值缓存（按命名空间） ===
  // protected registryMap = new Map<string, Map<string, any>>();

  // ========== 通用缓存操作 ==========

  // protected getRegistry(namespace: string): Map<string, any> {
  //   if (!this.registryMap.has(namespace)) {
  //     this.registryMap.set(namespace, new Map());
  //   }
  //   return this.registryMap.get(namespace)!;
  // }

  // setRegistryItem<T>(namespace: string, key: string, value: T): void {
  //   this.getRegistry(namespace).set(key, value);
  // }

  // getRegistryItem<T>(namespace: string, key: string): T | undefined {
  //   return this.getRegistry(namespace).get(key) as T | undefined;
  // }

  // deleteRegistryItem(namespace: string, key: string): boolean {
  //   return this.getRegistry(namespace).delete(key);
  // }

  // invokeRegistryItem(namespace: string, key: string, ...args: any[]): void {
  //   const fn = this.getRegistry(namespace).get(key);
  //   if (typeof fn === 'function') {
  //     fn(...args);
  //   }
  // }

  // ========== 状态共享（发布订阅） ==========

  publishSharedData<T>(key: string, data: T): void {
    this.sharedDataRegistry.set(key, data);
    const subs = this.sharedDataSubscribers.get(key);
    subs?.forEach(cb => cb(data));
  }

  getSharedData<T>(key: string): T | undefined {
    return this.sharedDataRegistry.get(key);
  }

  clearSharedData(key: string): void {
    this.sharedDataRegistry.delete(key);
    const subs = this.sharedDataSubscribers.get(key);
    subs?.forEach(cb => cb(null));
  }

  subscribeSharedData<T>(key: string, callback: SharedDataSubscriber<T>): void {
    if (!this.sharedDataSubscribers.has(key)) {
      this.sharedDataSubscribers.set(key, new Set());
    }
    this.sharedDataSubscribers.get(key)!.add(callback as SharedDataSubscriber);
    const existing = this.sharedDataRegistry.get(key);
    if (existing !== undefined) callback(existing);
  }

  unsubscribeSharedData(key: string, callback: SharedDataSubscriber): void {
    this.sharedDataSubscribers.get(key)?.delete(callback);
  }
}