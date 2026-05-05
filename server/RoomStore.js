/**
 * Async Persistence Abstraction (RoomStore)
 * 
 * This module abstracts the storage of active game rooms.
 * Currently, it uses an in-memory Map (acting like an async DB) 
 * so it works perfectly on local environments without extra setup.
 * 
 * PRODUCTION UPGRADE:
 * To use Redis, just replace the Map logic with standard Redis `hset`/`hgetall` commands.
 */

class RoomStore {
  constructor() {
    this.rooms = new Map();
  }

  async get(roomId) {
    if (!roomId) return null;
    return this.rooms.get(roomId) || null;
  }

  async set(roomId, roomData) {
    if (!roomId || !roomData) return;
    this.rooms.set(roomId, roomData);
  }

  async delete(roomId) {
    if (!roomId) return;
    this.rooms.delete(roomId);
  }

  async getAll() {
    return Array.from(this.rooms.values());
  }

  async has(roomId) {
    return this.rooms.has(roomId);
  }
}

// Export a singleton instance
module.exports = new RoomStore();
