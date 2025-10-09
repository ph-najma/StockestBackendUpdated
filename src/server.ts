import { Server } from "socket.io";
import http from "http";
import app from "./app";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import { IUserService } from "./services/interfaces/userServiceInterface";
import { UserService } from "./services/userService";
import { UserDto } from "./interfaces/Interfaces";
import orderModel from "./models/orderModel";
import userModel from "./models/userModel";
import stockModel from "./models/stockModel";
import promotionModel from "./models/promoModel";
import watchlistModel from "./models/watchlistModel";
import sessionModel from "./models/sessionModel";
import notificationModel from "./models/notificationModel";
import transactionModel from "./models/transactionModel";
import User from "./models/userModel";
import dotenv from "dotenv";
dotenv.config();
// Repositories are composed in dependencyInjection; we avoid duplicating here
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  },
});

// Use the same composition as DI for consistency
import {
  userService,
  setIo,
  stockRepository as diStockRepository,
} from "./dependencyInjection";

// 🔹 Inject the Socket.IO instance into dependency injection
setIo(io);

// 🔹 Handle client connection for Socket.IO
io.on("connection", async (socket) => {
  console.log("Client connected:", socket.id);
  console.log("helloo");
  console.log("token", socket.handshake.auth?.token);

  const token =
    socket.handshake.auth?.token ||
    socket.handshake.headers?.authorization?.split(" ")[1];

  console.log("Received Token:", token);
  console.log("token");

  if (!token) {
    console.log("❌ No token provided. Disconnecting...");
    socket.emit("auth-error", "Authentication required");
    socket.disconnect(true);
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: string;
    };

    console.log("✅ Token verified. UserID:", decoded.userId);

    const user = await User.findById(decoded.userId);

    if (!user) {
      console.log("❌ User not found. Disconnecting...");
      socket.emit("auth-error", "Invalid user");
      socket.disconnect(true);
      return;
    }

    console.log(`✅ User authenticated: ${user.email}`);
    socket.emit("auth-success", { userId: user._id, email: user.email });

    // 🔹 Fetch user's portfolio and send updates every 5 seconds
    const portfolioUpdateInterval = setInterval(async () => {
      try {
        const userDto: UserDto = {
          id: user._id.toString(),
          name: user.name || "",
          email: user.email || "",
          balance: user.balance,
          role: (user as any).role,
        };
        const portfolioData = await userService.getUpdatedPortfolio(userDto);
        socket.emit("portfolioSummaryUpdate", portfolioData);
      } catch (error) {
        console.error("❌ Error fetching portfolio data:", error);
      }
    }, 5000);

    // 🔹 Fetch stock updates every 5 seconds
    const stockUpdateInterval = setInterval(async () => {
      try {
        const liveStockData = await diStockRepository.getAllStocks();
        socket.emit("stockUpdate", liveStockData);
      } catch (error) {
        console.error("Error fetching stock data:", error);
      }
    }, 5000);

    // 🔹 Handle Watchlist Subscription
    socket.on("subscribeWatchlist", async (watchlist) => {
      console.log(`📌 ${user.email} subscribed to watchlist:`, watchlist);

      const watchlistInterval = setInterval(async () => {
        try {
          const allStocks = await diStockRepository.getAllStocks();
          const watchlistStocks = allStocks.filter((stock) =>
            watchlist.includes(stock.symbol)
          );
          socket.emit("WatchlistStockUpdate", watchlistStocks);
        } catch (error) {
          console.error("Error fetching watchlist data:", error);
        }
      }, 5000);

      // 🔹 Clean up watchlist interval on disconnect
      socket.on("disconnect", () => {
        clearInterval(watchlistInterval);
      });
    });

    // 🔹 Handle Room Creation
    socket.on("create-room", () => {
      const roomCode = uuidv4().slice(0, 6);
      socket.join(roomCode);
      socket.emit("room-created", roomCode);
      console.log(`🎉 Room ${roomCode} created by ${user.email}`);
    });

    // 🔹 Handle Room Joining
    socket.on("join-room", (roomCode) => {
      const rooms = io.sockets.adapter.rooms;
      if (rooms.has(roomCode)) {
        socket.join(roomCode);
        socket.emit("room-joined", roomCode);
        socket.to(roomCode).emit("user-joined", socket.id);
        console.log(`${user.email} joined room ${roomCode}`);
      } else {
        socket.emit("error", "Room not found");
      }
    });
    socket.on("call-ended", ({ roomCode }) => {
      io.to(roomCode).emit("call-ended");
    });

    // 🔹 WebRTC Signaling
    socket.on("offer", ({ roomCode, offer }) => {
      socket.to(roomCode).emit("offer", offer);
    });

    socket.on("answer", ({ roomCode, answer }) => {
      socket.to(roomCode).emit("answer", answer);
    });

    socket.on("ice-candidate", ({ roomCode, candidate }) => {
      socket.to(roomCode).emit("ice-candidate", candidate);
    });

    // 🔹 Handle User Disconnect
    socket.on("disconnect", () => {
      clearInterval(stockUpdateInterval);
      clearInterval(portfolioUpdateInterval);
      console.log(`👋 User ${user.email} disconnected: ${socket.id}`);
      io.emit("call-ended");
    });
  } catch (error) {
    console.log("❌ Invalid token. Disconnecting...");
    socket.emit("auth-error", "Invalid token");
    socket.disconnect(true);
  }
});

// Start the combined HTTP server (Express + Socket.IO) on port 5000
server.listen(5000, () => {
  console.log("Server (Express + Socket.IO) running on port 5000");
});

export { io };
