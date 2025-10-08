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
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const db_1 = __importDefault(require("./config/db"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
// import passportRoute from "./auth/authRoutes";
const redis_1 = require("./config/redis");
const express_session_1 = __importDefault(require("express-session"));
const passport_1 = __importDefault(require("passport"));
const node_cron_1 = __importDefault(require("node-cron"));
const squareOffService_1 = require("./services/squareOffService");
// import { newOrderRepository } from "./repositories/newOrder";
const fetchStock_1 = require("./repositories/fetchStock");
const dependencyInjection_1 = require("./dependencyInjection");
const morgan_1 = __importDefault(require("morgan"));
const rotating_file_stream_1 = require("rotating-file-stream");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = __importDefault(require("dotenv"));
const server_1 = require("./server");
dotenv_1.default.config();
const app = (0, express_1.default)();
(0, db_1.default)();
(0, redis_1.connectRedis)();
// const newOrderRepostory = new newOrderRepository();
const fetchStocks = new fetchStock_1.fetchStockRepository();
const squareOffService = new squareOffService_1.SquareOffService();
// Log directory
if (process.env.NODE_ENV === "development") {
    app.use((0, morgan_1.default)("dev"));
}
else {
    const logDirectory = path_1.default.join(__dirname, "logs");
    console.log(logDirectory);
    if (!fs_1.default.existsSync(logDirectory)) {
        fs_1.default.mkdirSync(logDirectory);
    }
    const accessLogStream = (0, rotating_file_stream_1.createStream)("access.log", {
        interval: "7d",
        path: logDirectory,
        maxFiles: 5,
    });
    app.use((0, morgan_1.default)("combined", {
        stream: accessLogStream,
    }));
}
console.log("Rotating log stream configured.");
// Middleware for session management
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
}));
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
app.use((0, cors_1.default)({
    origin: ["http://localhost:4200"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
}));
app.use(express_1.default.json());
// Routes
app.use("/api", userRoutes_1.default);
app.use("/api", adminRoutes_1.default);
// app.use("/api", passportRoute);
app.use((req, res, next) => {
    if (req.path.startsWith("/socket.io"))
        return next();
    res.status(404).send("Not Found");
});
node_cron_1.default.schedule("* * * * *", () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Running order matching...");
    try {
        yield (0, dependencyInjection_1.getOrderMatchingService)().matchOrders();
        console.log("Order matching completed.");
    }
    catch (error) {
        console.error("Error while matching orders:", error);
    }
}));
node_cron_1.default.schedule("* * * * *", () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Sending live portfolio summary...");
    const stockSymbols = ["AAPL", "GOOGL", "MSFT", "AMZN"];
    try {
        const updatedSummary = yield fetchStocks.fetchStockData(stockSymbols);
        server_1.io.emit("portfolioSummaryUpdate", updatedSummary); // Broadcast the summary to all connected clients
    }
    catch (error) {
        console.error("Error fetching live stock data:", error);
    }
}));
node_cron_1.default.schedule("15 15 * * *", () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Executing auto square off...");
    yield squareOffService.autoSquareOff();
}));
// Test route
app.get("/", (req, res) => {
    res.send("API is running..");
});
exports.default = app;
