/**
 * Action Queue System (Concurrency Safe)
 * 
 * Prevents race conditions when multiple players perform actions simultaneously.
 * Actions for a specific room are queued and processed sequentially.
 */

class ActionQueue {
  constructor() {
    this.queues = new Map(); // roomId -> Array of async tasks
    this.processing = new Map(); // roomId -> boolean
  }

  push(roomId, task) {
    if (!this.queues.has(roomId)) {
      this.queues.set(roomId, []);
    }
    this.queues.get(roomId).push(task);
    this.process(roomId);
  }

  async process(roomId) {
    if (this.processing.get(roomId)) return; // Already processing this room
    
    const queue = this.queues.get(roomId);
    if (!queue || queue.length === 0) {
      this.processing.set(roomId, false);
      return;
    }

    this.processing.set(roomId, true);

    try {
      while (queue.length > 0) {
        const task = queue.shift();
        try {
          await task();
        } catch (taskError) {
          console.error(`[ActionQueue] Task Error for room ${roomId}:`, taskError);
        }
      }
    } catch (err) {
      console.error(`[ActionQueue] Fatal Error processing room ${roomId}:`, err);
    } finally {
      this.processing.set(roomId, false);
      // Double check if anything was added while finishing
      if (this.queues.get(roomId)?.length > 0) {
        this.process(roomId);
      }
    }
  }
}

module.exports = new ActionQueue();
