/**
 * Sound Queue & Timing Management Service
 * Manages queued SFX playback with precise timing control
 * Backend-ready: Can be replaced with server-side queue management
 */

export interface QueuedSound {
  id: string;
  sfxId: string;
  delayMs: number;
  createdAt: number;
  status: "pending" | "playing" | "completed";
  timeoutId?: NodeJS.Timeout;
}

export interface QueueStats {
  totalQueued: number;
  currentlyPlaying: number;
  completed: number;
}

export class SoundQueue {
  private queue: Map<string, QueuedSound> = new Map();
  private queueIdCounter = 0;
  private onStatusChange:
    | ((queueId: string, status: QueuedSound["status"]) => void)
    | null = null;
  private onQueueUpdate: (() => void) | null = null;

  /**
   * Add a sound to the queue with optional delay
   * @param sfxId - The SFX track ID to queue
   * @param delayMs - Delay in milliseconds before playback starts
   * @returns Queue entry ID
   */
  addToQueue(sfxId: string, delayMs: number = 0): string {
    const queueId = `queue-${this.queueIdCounter++}`;
    const queuedSound: QueuedSound = {
      id: queueId,
      sfxId,
      delayMs,
      createdAt: Date.now(),
      status: "pending",
    };

    this.queue.set(queueId, queuedSound);
    this.notifyUpdate();

    return queueId;
  }

  /**
   * Schedule a sound for playback with timing control
   * Non-blocking: Returns immediately, playback happens asynchronously
   */
  scheduleSound(sfxId: string, delayMs: number, onPlay: () => void): string {
    const queueId = this.addToQueue(sfxId, delayMs);
    const queuedSound = this.queue.get(queueId)!;

    // Set timeout for delayed playback
    queuedSound.timeoutId = setTimeout(() => {
      if (this.queue.has(queueId)) {
        this.updateStatus(queueId, "playing");
        try {
          onPlay();
        } catch (err) {
          // Ensure queue stays consistent even if onPlay throws
          console.error("[SoundQueue] onPlay handler error:", err);
        }
        // NOTE: Completion must be signalled by caller (e.g. audio 'ended' event)
      }
    }, delayMs);

    return queueId;
  }

  /**
   * Mark a queued sound as completed. Caller should call this when audio actually finishes.
   */
  markCompleted(queueId: string): void {
    const queuedSound = this.queue.get(queueId);
    if (!queuedSound) return;
    if (queuedSound.timeoutId) {
      clearTimeout(queuedSound.timeoutId);
      queuedSound.timeoutId = undefined;
    }
    this.updateStatus(queueId, "completed");
    // Optionally remove completed items from queue to keep stats accurate
    // Keep it in the map so callers can inspect history if needed
  }

  /**
   * Remove a queued sound before it plays
   */
  removeFromQueue(queueId: string): boolean {
    const queuedSound = this.queue.get(queueId);
    if (!queuedSound) return false;

    if (queuedSound.timeoutId) {
      clearTimeout(queuedSound.timeoutId);
    }

    this.queue.delete(queueId);
    this.notifyUpdate();
    return true;
  }

  /**
   * Clear all pending queued sounds
   */
  clearQueue(): void {
    this.queue.forEach((sound) => {
      if (sound.timeoutId) {
        clearTimeout(sound.timeoutId);
      }
    });
    this.queue.clear();
    this.notifyUpdate();
  }

  /**
   * Get current queue status
   */
  getStats(): QueueStats {
    const stats: QueueStats = {
      totalQueued: this.queue.size,
      currentlyPlaying: 0,
      completed: 0,
    };

    this.queue.forEach((sound) => {
      if (sound.status === "playing") stats.currentlyPlaying++;
      if (sound.status === "completed") stats.completed++;
    });

    return stats;
  }

  /**
   * Get all queued sounds for UI display
   */
  getQueue(): QueuedSound[] {
    return Array.from(this.queue.values()).sort(
      (a, b) => a.createdAt - b.createdAt,
    );
  }

  /**
   * Update status of a queued sound
   */
  private updateStatus(queueId: string, status: QueuedSound["status"]): void {
    const queuedSound = this.queue.get(queueId);
    if (queuedSound) {
      queuedSound.status = status;
      this.onStatusChange?.(queueId, status);
      this.notifyUpdate();
    }
  }

  /**
   * Set callbacks for queue updates
   */
  onUpdate(callback: () => void): void {
    this.onQueueUpdate = callback;
  }

  onStatusUpdate(
    callback: (queueId: string, status: QueuedSound["status"]) => void,
  ): void {
    this.onStatusChange = callback;
  }

  private notifyUpdate(): void {
    this.onQueueUpdate?.();
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.clearQueue();
    this.onStatusChange = null;
    this.onQueueUpdate = null;
  }
}

export const createSoundQueue = () => new SoundQueue();
