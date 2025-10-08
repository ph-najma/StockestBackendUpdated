"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const socket_io_1 = require("socket.io");
const http_1 = __importDefault(require("http"));
const app_1 = __importDefault(require("./app"));
const uuid_1 = require("uuid");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const userModel_1 = __importDefault(require("./models/userModel"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Repositories are composed in dependencyInjection; we avoid duplicating here
const server = http_1.default.createServer(app_1.default);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    },
});
exports.io = io;
// Use the same composition as DI for consistency
const dependencyInjection_1 = require("./dependencyInjection");
// 🔹 Inject the Socket.IO instance into dependency injection
(0, dependencyInjection_1.setIo)(io);
// 🔹 Handle client connection for Socket.IO
io.on("connection", (socket) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    console.log("Client connected:", socket.id);
    console.log("helloo");
    console.log("token", (_a = socket.handshake.auth) === null || _a === void 0 ? void 0 : _a.token);
    const token = ((_b = socket.handshake.auth) === null || _b === void 0 ? void 0 : _b.token) ||
        ((_d = (_c = socket.handshake.headers) === null || _c === void 0 ? void 0 : _c.authorization) === null || _d === void 0 ? void 0 : _d.split(" ")[1]);
    console.log("Received Token:", token);
    console.log("token");
    if (!token) {
        console.log("❌ No token provided. Disconnecting...");
        socket.emit("auth-error", "Authentication required");
        socket.disconnect(true);
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        console.log("✅ Token verified. UserID:", decoded.userId);
        const user = yield userModel_1.default.findById(decoded.userId);
        if (!user) {
            console.log("❌ User not found. Disconnecting...");
            socket.emit("auth-error", "Invalid user");
            socket.disconnect(true);
            return;
        }
        console.log(`✅ User authenticated: ${user.email}`);
        socket.emit("auth-success", { userId: user._id, email: user.email });
        // 🔹 Fetch user's portfolio and send updates every 5 seconds
        const portfolioUpdateInterval = setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const portfolioData = yield dependencyInjection_1.userService.getUpdatedPortfolio(user);
                socket.emit("portfolioSummaryUpdate", portfolioData);
            }
            catch (error) {
                console.error("❌ Error fetching portfolio data:", error);
            }
        }), 5000);
        // 🔹 Fetch stock updates every 5 seconds
        const stockUpdateInterval = setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const liveStockData = yield dependencyInjection_1.stockRepository.getAllStocks();
                socket.emit("stockUpdate", liveStockData);
            }
            catch (error) {
                console.error("Error fetching stock data:", error);
            }
        }), 5000);
        // 🔹 Handle Watchlist Subscription
        socket.on("subscribeWatchlist", (watchlist) => __awaiter(void 0, void 0, void 0, function* () {
            console.log(`📌 ${user.email} subscribed to watchlist:`, watchlist);
            const watchlistInterval = setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
                try {
                    const allStocks = yield dependencyInjection_1.stockRepository.getAllStocks();
                    const watchlistStocks = allStocks.filter((stock) => watchlist.includes(stock.symbol));
                    socket.emit("WatchlistStockUpdate", watchlistStocks);
                }
                catch (error) {
                    console.error("Error fetching watchlist data:", error);
                }
            }), 5000);
            // 🔹 Clean up watchlist interval on disconnect
            socket.on("disconnect", () => {
                clearInterval(watchlistInterval);
            });
        }));
        // 🔹 Handle Room Creation
        socket.on("create-room", () => {
            const roomCode = (0, uuid_1.v4)().slice(0, 6);
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
            }
            else {
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
    }
    catch (error) {
        console.log("❌ Invalid token. Disconnecting...");
        socket.emit("auth-error", "Invalid token");
        socket.disconnect(true);
    }
}));
// Start the combined HTTP server (Express + Socket.IO) on port 5000
server.listen(5000, () => {
    console.log("Server (Express + Socket.IO) running on port 5000");
});
