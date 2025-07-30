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
            return yield this.userRepository.findAllUsers();
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
            return this.orderRepository.getAllOrders();
        });
    }
    //Get Limit Orders
    getLimitOrders(query) {
        return __awaiter(this, void 0, void 0, function* () {
            query.orderType = "LIMIT";
            return this.orderRepository.findOrdersByType(query);
        });
    }
    //Get Market Orders
    getMarketOrders(query) {
        return __awaiter(this, void 0, void 0, function* () {
            query.orderType = "MARKET";
            return this.orderRepository.findOrdersByType(query);
        });
    }
    //Get Completed Orders
    getCompletedOrders() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.orderRepository.findCompletedOrders();
        });
    }
    //Get All Stocks
    getAllStocks() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.stockRepository.getAllStocks();
        });
    }
    //Get All Transactiosn
    getAllTransactions() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.transactionRepository.getAllTransactions();
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
                    stock,
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
            return this.orderRepository.cancelOrder(orderId);
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
            return session;
        });
    }
    getAllSessions() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.sessionRepository.getAllSessions();
        });
    }
    getSessionById(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.sessionRepository.getSessionById(sessionId);
        });
    }
    updateSessionData(sessionId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.sessionRepository.updateSession(sessionId, data);
        });
    }
    cancelSession(sessionId, newStatus) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.sessionRepository.updateSessionStatus(sessionId, newStatus);
        });
    }
}
exports.AdminService = AdminService;
