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
exports.AdminService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const tokenBlacklist = new Set();
class AdminService {
    constructor(userRepository, limitRepository, orderRepository, stockRepository, transactionRepository, promotionRepository, sessionRepository) {
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
        this.stockRepository = stockRepository;
        this.transactionRepository = transactionRepository;
        this.limitRepository = limitRepository;
        this.promotionRepository = promotionRepository;
        this.sessionRepository = sessionRepository;
    }
    toUserDto(user) {
        return {
            id: user._id.toString(),
            name: user.name || "",
            email: user.email || "",
            balance: user.balance,
            role: user.role,
        };
    }
    toStockDto(stock) {
        var _a, _b, _c;
        return {
            id: (_c = (_b = (_a = stock._id) === null || _a === void 0 ? void 0 : _a.toString) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : "",
            symbol: stock.symbol,
            name: stock.name,
            price: stock.price,
        };
    }
    toOrderDto(order) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        return {
            id: (_c = (_b = (_a = order._id) === null || _a === void 0 ? void 0 : _a.toString) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : "",
            userId: (_f = (_e = (_d = order.user) === null || _d === void 0 ? void 0 : _d.toString) === null || _e === void 0 ? void 0 : _e.call(_d)) !== null && _f !== void 0 ? _f : "",
            stock: order.stock && typeof order.stock === "object"
                ? this.toStockDto(order.stock)
                : order.stock,
            type: order.type,
            orderType: order.orderType,
            quantity: order.quantity,
            price: order.price,
            status: order.status,
            createdAt: (_j = (_h = (_g = order.createdAt) === null || _g === void 0 ? void 0 : _g.toISOString) === null || _h === void 0 ? void 0 : _h.call(_g)) !== null && _j !== void 0 ? _j : new Date().toISOString(),
        };
    }
    toTransactionDto(tx) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        return {
            id: (_c = (_b = (_a = tx._id) === null || _a === void 0 ? void 0 : _a.toString) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : "",
            userId: (_f = (_e = (_d = tx.user) === null || _d === void 0 ? void 0 : _d.toString) === null || _e === void 0 ? void 0 : _e.call(_d)) !== null && _f !== void 0 ? _f : "",
            amount: tx.price * tx.quantity,
            type: tx.type,
            createdAt: (_j = (_h = (_g = tx.createdAt) === null || _g === void 0 ? void 0 : _g.toISOString) === null || _h === void 0 ? void 0 : _h.call(_g)) !== null && _j !== void 0 ? _j : new Date().toISOString(),
            stock: tx.stock && typeof tx.stock === "object"
                ? this.toStockDto(tx.stock)
                : tx.stock,
            quantity: tx.quantity,
            price: tx.price,
            status: tx.status,
        };
    }
    toSessionDto(session) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        return {
            id: (_c = (_b = (_a = session._id) === null || _a === void 0 ? void 0 : _a.toString) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : "",
            title: session.title,
            instructorId: (_f = (_e = (_d = session.instructorId) === null || _d === void 0 ? void 0 : _d.toString) === null || _e === void 0 ? void 0 : _e.call(_d)) !== null && _f !== void 0 ? _f : "",
            scheduledAt: (_j = (_h = (_g = session.scheduledAt) === null || _g === void 0 ? void 0 : _g.toISOString) === null || _h === void 0 ? void 0 : _h.call(_g)) !== null && _j !== void 0 ? _j : new Date().toISOString(),
        };
    }
    // Admin Login
    loginAdmin(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const existingUser = yield this.userRepository.findAdminByEmail(email);
            if (!existingUser) {
                throw new Error("No such user");
            }
            const isMatch = yield existingUser.comparePassword(password);
            if (!isMatch) {
                throw new Error("Invalid password");
            }
            const token = jsonwebtoken_1.default.sign({ userId: existingUser._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
            return { token };
        });
    }
    // Get User List
    getUserList() {
        return __awaiter(this, void 0, void 0, function* () {
            const users = yield this.userRepository.findAllUsers();
            return users.map((u) => this.toUserDto(u));
        });
    }
    getAdminDashboard() {
        return __awaiter(this, void 0, void 0, function* () {
            const totalUsers = yield this.userRepository.countUser();
            const sessions = yield this.getAllSessions();
            const completed = sessions === null || sessions === void 0 ? void 0 : sessions.filter((s) => s.status === "COMPLETED").length;
            const canceled = sessions === null || sessions === void 0 ? void 0 : sessions.filter((s) => s.status === "CANCELED").length;
            const transactions = yield this.transactionRepository.getAllTransactions();
            const tradingVolume = transactions.reduce((acc, tx) => acc + tx.price * tx.quantity, 0);
            const totalProfitLoss = transactions.reduce((acc, tx) => {
                return tx.type === "SELL" ? acc + tx.price * tx.quantity : acc;
            }, 0);
            const feeCollection = yield this.transactionRepository.getFeeCollectionSummary();
            return {
                totalUsers,
                completed,
                canceled,
                tradingVolume,
                totalProfitLoss,
                feeCollection,
            };
        });
    }
    // Disable or Enable User
    toggleUserBlockStatus(userId, token) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.userRepository.findById(userId);
            if (!user) {
                throw new Error("User not found");
            }
            user.is_Blocked = !user.is_Blocked;
            yield this.userRepository.saveUser(user);
            if (token) {
                tokenBlacklist.add(token);
            }
            return {
                message: `${user.is_Blocked ? "Blocked" : "Unblocked"} user successfully.`,
            };
        });
    }
    countUsers() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.userRepository.countUser();
        });
    }
    //Get All Orders
    getAllOrders() {
        return __awaiter(this, void 0, void 0, function* () {
            const orders = yield this.orderRepository.getAllOrders();
            return orders.map((o) => this.toOrderDto(o));
        });
    }
    //Get Limit Orders
    getLimitOrders(query) {
        return __awaiter(this, void 0, void 0, function* () {
            query.orderType = "LIMIT";
            const orders = yield this.orderRepository.findOrdersByType(query);
            return orders.map((o) => this.toOrderDto(o));
        });
    }
    //Get Market Orders
    getMarketOrders(query) {
        return __awaiter(this, void 0, void 0, function* () {
            query.orderType = "MARKET";
            const orders = yield this.orderRepository.findOrdersByType(query);
            return orders.map((o) => this.toOrderDto(o));
        });
    }
    //Get Completed Orders
    getCompletedOrders() {
        return __awaiter(this, void 0, void 0, function* () {
            const orders = yield this.orderRepository.findCompletedOrders();
            return orders.map((o) => this.toOrderDto(o));
        });
    }
    //Get All Stocks
    getAllStocks() {
        return __awaiter(this, void 0, void 0, function* () {
            const stocks = yield this.stockRepository.getAllStocks();
            return stocks.map((s) => this.toStockDto(s));
        });
    }
    //Get All Transactiosn
    getAllTransactions() {
        return __awaiter(this, void 0, void 0, function* () {
            const txs = yield this.transactionRepository.getAllTransactions();
            return txs.map((t) => this.toTransactionDto(t));
        });
    }
    //Get UserPortfolio
    getUserPortfolio(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const userObjectId = new mongoose_1.default.Types.ObjectId(userId);
            const user = yield this.userRepository.findById(userObjectId);
            if (!user) {
                throw new Error("User not found");
            }
            const portfolio = user.portfolio;
            const portfolioDetails = yield Promise.all(portfolio.map((item) => __awaiter(this, void 0, void 0, function* () {
                const stockId = item.stockId; // Convert ObjectId to string
                const stock = yield this.stockRepository.getStockById(stockId);
                return {
                    stock: stock ? this.toStockDto(stock) : null,
                    quantity: item.quantity,
                };
            })));
            return {
                user: {
                    name: user.name,
                    email: user.email,
                    balance: user.balance,
                },
                portfolio: portfolioDetails,
            };
        });
    }
    //Get Total Fees Collected
    getTotalFeesCollected() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.transactionRepository.getFeeCollectionSummary();
        });
    }
    // Cancel Order
    cancelOrder(orderId) {
        return __awaiter(this, void 0, void 0, function* () {
            const order = yield this.orderRepository.cancelOrder(orderId);
            return order ? this.toOrderDto(order) : null;
        });
    }
    //Update the Limits
    updateLimit(limitData) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.limitRepository.updateLimit(limitData);
        });
    }
    //Get the Current Limits
    getLimits() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.limitRepository.getLimits();
        });
    }
    CreatePromotions(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.promotionRepository.createPromotion(data);
        });
    }
    createSsession(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = yield this.sessionRepository.createSession(data);
            return session ? this.toSessionDto(session) : null;
        });
    }
    getAllSessions() {
        return __awaiter(this, void 0, void 0, function* () {
            const sessions = yield this.sessionRepository.getAllSessions();
            return sessions ? sessions.map((s) => this.toSessionDto(s)) : null;
        });
    }
    getSessionById(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = yield this.sessionRepository.getSessionById(sessionId);
            return session ? this.toSessionDto(session) : null;
        });
    }
    updateSessionData(sessionId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = yield this.sessionRepository.updateSession(sessionId, data);
            return session ? this.toSessionDto(session) : null;
        });
    }
    cancelSession(sessionId, newStatus) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = yield this.sessionRepository.updateSessionStatus(sessionId, newStatus);
            return session ? this.toSessionDto(session) : null;
        });
    }
}
exports.AdminService = AdminService;
