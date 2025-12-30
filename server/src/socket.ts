import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { UserService } from "./services/UserService";
import { Types } from "mongoose";

let io: Server | null = null;

// Define allowed origins matching the express config
const allowedOrigins = [
  "http://localhost:5173", // Frontend dev local
  "https://command.solaris.games",
];

interface AuthenticatedSocket extends Socket {
  user?: {
    _id: string;
    email: string;
    alias?: string;
  };
}

export const initSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Authentication Middleware
  io.use((socket: AuthenticatedSocket, next) => {
    const token =
      socket.handshake.auth.token || socket.handshake.query.token;

    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    const secret = process.env.JWT_SECRET || "default-secret-change-me";

    jwt.verify(token as string, secret, async (err: any, decoded: any) => {
      if (err) {
        return next(new Error("Authentication error: Invalid token"));
      }

      try {
        // Optional: Verify user exists in DB if needed, similar to auth middleware
        // For performance in websockets, we might skip DB call every time if JWT is trusted
        // But for consistency with API, let's do a quick check or just trust the JWT payload
        // The API middleware checks DB, so let's do it here too for safety.

        // Note: We need to be careful about async inside middleware if it takes too long
        const dbUser = await UserService.getUserById(new Types.ObjectId(decoded.id));

        if (!dbUser) {
           return next(new Error("Authentication error: User not found"));
        }

        socket.user = {
          _id: dbUser._id.toString(),
          email: dbUser.email,
          alias: dbUser.settings?.alias
        };

        next();
      } catch (error) {
        console.error("Socket Auth Error:", error);
        return next(new Error("Authentication error: Internal Error"));
      }
    });
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    console.log(`Socket connected: ${socket.id} (User: ${socket.user?._id})`);

    // Join user-specific room
    if (socket.user) {
      const userRoom = `user:${socket.user._id}`;
      socket.join(userRoom);
      console.log(`Socket ${socket.id} joined ${userRoom}`);
    }

    // Handle joining game rooms
    socket.on("join_game", (gameId: string) => {
      // Basic validation of gameId format?
      // For now trust the client, but in production we might want to verify access rights
      const gameRoom = `game:${gameId}`;
      socket.join(gameRoom);
      console.log(`Socket ${socket.id} (User: ${socket.user?._id}) joined ${gameRoom}`);

      // Acknowledge join
      socket.emit("game_joined", { gameId });
    });

    socket.on("leave_game", (gameId: string) => {
        const gameRoom = `game:${gameId}`;
        socket.leave(gameRoom);
        console.log(`Socket ${socket.id} (User: ${socket.user?._id}) left ${gameRoom}`);
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  console.log("Socket.IO initialized");
  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO not initialized!");
  }
  return io;
};
