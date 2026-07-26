const DEFAULT_TIMEOUT = 30_000;

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

export class PendingRequests {
  private map = new Map<string, PendingRequest>();

  create(jobId: string, timeout: number = DEFAULT_TIMEOUT): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.map.delete(jobId);
        reject(new Error(`Agent execution timed out after ${timeout}ms`));
      }, timeout);
      this.map.set(jobId, { resolve, reject, timer });
    });
  }

  resolve(jobId: string, value: unknown): boolean {
    const entry = this.map.get(jobId);
    if (!entry) return false;
    clearTimeout(entry.timer);
    this.map.delete(jobId);
    entry.resolve(value);
    return true;
  }

  reject(jobId: string, error: Error): boolean {
    const entry = this.map.get(jobId);
    if (!entry) return false;
    clearTimeout(entry.timer);
    this.map.delete(jobId);
    entry.reject(error);
    return true;
  }

  purge(): void {
    for (const [jobId, entry] of this.map) {
      clearTimeout(entry.timer);
      entry.reject(new Error("Server shutting down"));
    }
    this.map.clear();
  }
}

export const pendingRequests = new PendingRequests();
