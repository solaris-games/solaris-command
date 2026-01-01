import { GameEvent, UnifiedId } from "@solaris-command/core";
import { getIO } from "../socket";

export class SocketService {
  /**
   * Publish an event to a game room.
   * Clients must subscribe to "game:{gameId}" to receive these.
   */
  static publishToGame(gameId: UnifiedId, event: string, payload: any) {
    try {
      const io = getIO();
      const room = `game:${String(gameId)}`;
      io.to(room).emit(event, payload);
      console.log(`Socket: Published ${event} to ${room}`);
    } catch (error) {
      console.error(
        `Socket: Failed to publish ${event} to game ${String(gameId)}`,
        error
      );
    }
  }

  static publishEventToGame(gameEvent: GameEvent) {
    SocketService.publishToGame(
      gameEvent.gameId,
      gameEvent.type,
      gameEvent.data
    );
  }

  /**
   * Publish an event to a specific user.
   * Clients must be authenticated to receive these.
   */
  static publishToUser(userId: UnifiedId, event: string, payload: any) {
    try {
      const io = getIO();
      const room = `user:${String(userId)}`;
      io.to(room).emit(event, payload);
      console.log(`Socket: Published ${event} to ${room}`);
    } catch (error) {
      console.error(
        `Socket: Failed to publish ${event} to user ${String(userId)}`,
        error
      );
    }
  }

  static publishEventToUser(gameEvent: GameEvent, userId: UnifiedId) {
    SocketService.publishToUser(userId, gameEvent.type, gameEvent.data);
  }
}
