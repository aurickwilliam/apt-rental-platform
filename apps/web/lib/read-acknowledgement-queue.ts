interface ReaderDependencies<Result> {
  visible: () => boolean;
  read: (ids: string[]) => Promise<Result>;
  confirmed: (result: Result) => void;
  failed: () => void;
}

/** One live thread's batched, idempotent read work. No polling: one bounded
 * retry per viewing trigger, then reconciliation on visibility/focus/new rows. */
export class ReadAcknowledgementQueue<Result> {
  private pending = new Set<string>();
  private seen = new Set<string>();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private running = false;
  private disposed = false;
  private failures = 0;
  constructor(private dependencies: ReaderDependencies<Result>) {}
  observe(ids: string[]): void {
    if (this.disposed || !this.dependencies.visible()) return;
    let added = false;
    for (const id of ids) if (!this.seen.has(id) && !this.pending.has(id)) { this.pending.add(id); added = true; }
    if (added) this.failures = 0;
    this.schedule(80);
  }
  resume(): void { this.failures = 0; this.schedule(80); }
  private schedule(delay: number): void {
    if (this.timer || this.running || this.disposed || this.failures >= 2 || !this.pending.size || !this.dependencies.visible()) return;
    this.timer = setTimeout(() => { this.timer = null; void this.flush(); }, delay);
  }
  private async flush(): Promise<void> {
    if (this.running || this.disposed || !this.dependencies.visible()) return;
    const ids = [...this.pending].slice(0, 100);
    if (!ids.length) return;
    this.running = true;
    try {
      const result = await this.dependencies.read(ids);
      if (this.disposed) return;
      for (const id of ids) { this.pending.delete(id); this.seen.add(id); }
      this.failures = 0;
      this.dependencies.confirmed(result);
    } catch {
      if (!this.disposed) { this.failures++; this.dependencies.failed(); }
    } finally {
      this.running = false;
      if (this.failures < 2) this.schedule(this.failures ? 750 : 80);
    }
  }
  dispose(): void {
    this.disposed = true;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null; this.pending.clear(); this.seen.clear();
  }
}
