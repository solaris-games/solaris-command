import { getIO } from "../socket";

export class SocketService {
  /**
   * Publish an event to a game room.
   * Clients must subscribe to "game:{gameId}" to receive these.
   */
  static publishToGame(gameId: string, event: string, payload: any) {
    try {
      const io = getIO();
      const room = `game:${gameId}`;
      io.to(room).emit(event, payload);
      console.log(`Socket: Published ${event} to ${room}`);
    } catch (error) {
      console.error(`Socket: Failed to publish ${event} to game ${gameId}`, error);
    }
  }

  /**
   * Publish an event to a specific user.
   * Clients must be authenticated to receive these.
   */
  static publishToUser(userId: string, event: string, payload: any) {
    try {
      const io = getIO();
      const room = `user:${userId}`;
      io.to(room).emit(event, payload);
      console.log(`Socket: Published ${event} to ${room}`);
    } catch (error) {
      console.error(`Socket: Failed to publish ${event} to user ${userId}`, error);
    }
  }
}
