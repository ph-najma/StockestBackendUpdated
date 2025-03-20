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
const stockRepository_1 = require("./repositories/stockRepository");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const userRepository_1 = require("./repositories/userRepository");
const transactionRepository_1 = require("./repositories/transactionRepository");
const orderRepository_1 = require("./repositories/orderRepository");
const promotionRepository_1 = require("./repositories/promotionRepository");
const watchlistRepsoitory_1 = require("./repositories/watchlistRepsoitory");
const notificationRepository_1 = require("./repositories/notificationRepository");
const userModel_1 = __importDefault(require("./models/userModel"));
const sessionRepository_1 = require("./repositories/sessionRepository");
const userService_1 = require("./services/userService");
const orderModel_1 = __importDefault(require("./models/orderModel"));
const userRepository = new userRepository_1.UserRepository();
const stockRepository = new stockRepository_1.StockRepository();
const TransactionRepository = new transactionRepository_1.transactionRepository();
const orderRepository = new orderRepository_1.OrderRepository(orderModel_1.default);
const promotionRepository = new promotionRepository_1.PromotionRepository();
const watchlistRepository = new watchlistRepsoitory_1.watchlistRepostory();
const sessionRepsoitory = new sessionRepository_1.sessionRepository();
const notificationRepository = new notificationRepository_1.NotificationRepository();
const stockrepository = new stockRepository_1.StockRepository();
const server = http_1.default.createServer(app_1.default);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "http://localhost:4200",
        methods: ["GET", "POST"],
    },
});
exports.io = io;
const userService = new userService_1.UserService(stockRepository, userRepository, TransactionRepository, orderRepository, promotionRepository, watchlistRepository, sessionRepsoitory, notificationRepository);
// 🔹 Handle client connection for Socket.IO
io.on("connection", (socket) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    console.log("Client connected:", socket.id);
    const token = ((_a = socket.handshake.auth) === null || _a === void 0 ? void 0 : _a.token) ||
        ((_c = (_b = socket.handshake.headers) === null || _b === void 0 ? void 0 : _b.authorization) === null || _c === void 0 ? void 0 : _c.split(" ")[1]);
    console.log("Received Token:", token);
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
                const portfolioData = yield userService.getUpdatedPortfolio(user);
                socket.emit("portfolioSummaryUpdate", portfolioData);
            }
            catch (error) {
                console.error("❌ Error fetching portfolio data:", error);
            }
        }), 5000);
        // 🔹 Fetch stock updates every 5 seconds
        const stockUpdateInterval = setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const liveStockData = yield stockrepository.getAllStocks();
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
                    const allStocks = yield stockrepository.getAllStocks();
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
