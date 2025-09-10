"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = exports.adminController = exports.paymentController = exports.orderMatchingService = exports.userService = void 0;
const adminController_1 = require("./controllers/adminController");
const adminService_1 = require("./services/adminService");
const userController_1 = require("./controllers/userController");
const userService_1 = require("./services/userService");
const paymentController_1 = require("./controllers/paymentController");
const paymentServices_1 = require("./services/paymentServices");
const orderMatchingService_1 = require("./services/orderMatchingService");
// repositories
const userRepository_1 = require("./repositories/userRepository");
const limitRepository_1 = require("./repositories/limitRepository");
const orderRepository_1 = require("./repositories/orderRepository");
const stockRepository_1 = require("./repositories/stockRepository");
const transactionRepository_1 = require("./repositories/transactionRepository");
const promotionRepository_1 = require("./repositories/promotionRepository");
const sessionRepository_1 = require("./repositories/sessionRepository");
const watchlistRepsoitory_1 = require("./repositories/watchlistRepsoitory");
const paymentRepository_1 = require("./repositories/paymentRepository");
// models
const userModel_1 = __importDefault(require("./models/userModel"));
const stockModel_1 = __importDefault(require("./models/stockModel"));
const promoModel_1 = __importDefault(require("./models/promoModel"));
const sessionModel_1 = __importDefault(require("./models/sessionModel"));
const orderModel_1 = __importDefault(require("./models/orderModel"));
const watchlistModel_1 = __importDefault(require("./models/watchlistModel"));
const limitModel_1 = __importDefault(require("./models/limitModel"));
const transactionModel_1 = __importDefault(require("./models/transactionModel"));
const notificationRepository_1 = require("./repositories/notificationRepository");
const notificationModel_1 = __importDefault(require("./models/notificationModel"));
const server_1 = require("./server");
// ---------- Repositories ----------
const userRepository = new userRepository_1.UserRepository(userModel_1.default);
const limitRepo = new limitRepository_1.limitRepository(limitModel_1.default);
const orderRepository = new orderRepository_1.OrderRepository(orderModel_1.default);
const stockRepository = new stockRepository_1.StockRepository(stockModel_1.default);
const promotionRepository = new promotionRepository_1.PromotionRepository(promoModel_1.default);
const transactionRepository = new transactionRepository_1.TransactionRepository(transactionModel_1.default);
const sessionRepository = new sessionRepository_1.SessionRepository(sessionModel_1.default);
const watchlistRepsoitory = new watchlistRepsoitory_1.WatchlistRepostory(watchlistModel_1.default);
const notificationRepository = new notificationRepository_1.NotificationRepository(notificationModel_1.default);
const paymentRepository = new paymentRepository_1.PaymentRepository();
// ---------- Services ----------
const adminService = new adminService_1.AdminService(userRepository, limitRepo, orderRepository, stockRepository, transactionRepository, promotionRepository, sessionRepository);
exports.userService = new userService_1.UserService(stockRepository, userRepository, transactionRepository, orderRepository, promotionRepository, watchlistRepsoitory, sessionRepository, notificationRepository);
const paymentService = new paymentServices_1.PaymentService(paymentRepository, userRepository, sessionRepository);
exports.orderMatchingService = new orderMatchingService_1.OrderMatchingService(orderRepository, stockRepository, userRepository, transactionRepository, notificationRepository, server_1.io);
exports.paymentController = new paymentController_1.PaymentController(paymentService);
exports.adminController = new adminController_1.AdminController(adminService);
exports.userController = new userController_1.UserController(exports.userService);
