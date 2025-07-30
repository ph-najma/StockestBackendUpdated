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
exports.AdminController = exports.ERROR_MESSAGES = void 0;
const orderModel_1 = __importDefault(require("../models/orderModel"));
const transactionModel_1 = __importDefault(require("../models/transactionModel"));
const mongoose_1 = __importDefault(require("mongoose"));
const Interfaces_1 = require("../interfaces/Interfaces");
const helper_1 = __importDefault(require("../helper/helper"));
const Message_1 = require("../helper/Message");
exports.ERROR_MESSAGES = {
    BAD_REQUEST: "Bad Request",
};
class AdminController {
    constructor(adminService) {
        // Admin Login
        this.login = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { email, password } = req.body;
                const { token } = yield this.adminService.loginAdmin(email, password);
                (0, helper_1.default)(res, Interfaces_1.HttpStatusCode.OK, true, Message_1.MESSAGES.LOGIN_SUCCESS, {
                    token,
                });
            }
            catch (error) {
                (0, helper_1.default)(res, Interfaces_1.HttpStatusCode.BAD_REQUEST, false, error.message, null, error);
            }
        });
        // Get User List
        this.getUserList = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const usersData = yield this.adminService.getUserList();
                const page = parseInt(req.query.page, 10) || 1;
                const limit = parseInt(req.query.limit, 10) || 10;
                const skip = (page - 1) * limit;
                const totalUsers = yield this.adminService.countUsers();
                (0, helper_1.default)(res, Interfaces_1.HttpStatusCode.OK, true, Message_1.MESSAGES.USERS_RETRIEVED, {
                    usersData,
                    totalUsers,
                    currentPage: page,
                    totalPages: Math.ceil(totalUsers / limit),
                });
            }
            catch (error) {
                (0, helper_1.default)(res, Interfaces_1.HttpStatusCode.BAD_REQUEST, false, error.message, null, error);
            }
        });
        // Disable User
        this.disableUser = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = req.params.id;
                const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
                const result = yield this.adminService.toggleUserBlockStatus(userId, token);
                (0, helper_1.default)(res, Interfaces_1.HttpStatusCode.OK, true, Message_1.MESSAGES.USER_DISABLED, result);
            }
            catch (error) {
                (0, helper_1.default)(res, Interfaces_1.HttpStatusCode.BAD_REQUEST, false, error.message, null, error);
            }
        });
        // Get Stock List
        this.getStockList = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const stocks = yield this.adminService.getAllStocks();
                (0, helper_1.default)(res, Interfaces_1.HttpStatusCode.OK, true, Message_1.MESSAGES.STOCK_LIST, stocks);
            }
            catch (error) {
                (0, helper_1.default)(res, Interfaces_1.HttpStatusCode.BAD_REQUEST, false, error.message, null, error);
            }
        });
        // Get All Orders
        this.getAllOrders = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const orders = yield this.adminService.getAllOrders();
                (0, helper_1.default)(res, Interfaces_1.HttpStatusCode.OK, true, Message_1.MESSAGES.ALL_ORDERS, orders);
            }
            catch (error) {
                (0, helper_1.default)(res, Interfaces_1.HttpStatusCode.BAD_REQUEST, false, error.message, null, error);
            }
        });
        // Get Limit Orders
        this.getLimitOrders = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { status, user, dateRange } = req.query;
                const query = { orderType: "LIMIT" };
                if (typeof status === "string" && status !== "all") {
                    query.status = status;
                }
                if (user) {
                    const userQuery = Array.isArray(user) ? user.join(" ") : user;
                    if (typeof userQuery === "string") {
                        query.user = { $regex: new RegExp(userQuery, "i") };
                    }
                }
                if (dateRange) {
                    const date = new Date(dateRange);
                    query.createdAt = {
                        $gte: new Date(date.setHours(0, 0, 0, 0)),
                        $lte: new Date(date.setHours(23, 59, 59, 999)),
                    };
                }
                const orders = yield this.adminService.getLimitOrders(query);
                (0, helper_1.default)(res, Interfaces_1.HttpStatusCode.OK, true, Message_1.MESSAGES.LIMIT_ORDERS, orders);
            }
            catch (error) {
                (0, helper_1.default)(res, Interfaces_1.HttpStatusCode.BAD_REQUEST, false, error.message, null, error);
            }
        });
        // Get Market Orders
        this.getMarketOrders = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { status, user, dateRange } = req.query;
                const query = { orderType: "MARKET" };
                if (typeof status === "string" && status !== "all") {
                    query.status = status;
                }
                if (user) {
                    const userQuery = Array.isArray(user) ? user.join(" ") : user;
                    if (typeof userQuery === "string") {
                        query.user = { $regex: new RegExp(userQuery, "i") };
                    }
                }
                if (dateRange) {
                    const date = new Date(dateRange);
                    query.createdAt = {
                        $gte: new Date(date.setHours(0, 0, 0, 0)),
                        $lte: new Date(date.setHours(23, 59, 59, 999)),
                    };
                }
                const orders = yield this.adminService.getMarketOrders(query);
                (0, helper_1.default)(res, Interfaces_1.HttpStatusCode.OK, true, Message_1.MESSAGES.MARKET_ORDERS, orders);
            }
            catch (error) {
                (0, helper_1.default)(res, Interfaces_1.HttpStatusCode.BAD_REQUEST, false, error.message, null, error);
            }
        });
        // Matched Orders
        this.getMatchedOrders = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const orders = yield orderModel_1.default.find({ status: "COMPLETED" })
                    .populate("user", "name")
                    .populate("stock", "symbol")
                    .exec();
                (0, helper_1.default)(res, Interfaces_1.HttpStatusCode.OK, true, Message_1.MESSAGES.MATCHED_ORDERS, orders);
            }
            catch (error) {
                (0, helper_1.default)(res, Interfaces_1.HttpStatusCode.BAD_REQUEST, false, error.message, null, error);
            }
        });
        // Get Order Details
        this.getOrderDetails = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const orderId = req.params.orderId;
                const order = yield orderModel_1.default.findById(orderId)
                    .populate("user")
                    .populate("stock")
                    .exec();
                const transactions = yield transactionModel_1.default
                    .find({ $or: [{ buyOrder: orderId }, { sellOrder: orderId }] })
                    .populate("buyer seller")
                    .populate("stock")
                    .exec();
                if (!order) {
                    res
                        .status(Interfaces_1.HttpStatusCode.NOT_FOUND)
                        .json({ message: "Order not found" });
                }
                else {
                    (0, helper_1.default)(res, Interfaces_1.HttpStatusCode.OK, true, Message_1.MESSAGES.ORDER_DETAILS, {
                        order,
                        transactions,
                    });
                }
            }
            catch (error) {
                (0, helper_1.default)(res, Interfaces_1.HttpStatusCode.BAD_REQUEST, false, error.message, null, error);
            }
        });
        this.getAllTransactions = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const transactions = yield this.adminService.getAllTransactions();
                (0, helper_1.default)(res, Interfaces_1.HttpStatusCode.OK, true, Message_1.MESSAGES.TRANSACTIONS_RETRIEVED, transactions);
            }
            catch (error) {
                (0, helper_1.default)(res, Interfaces_1.HttpStatusCode.BAD_REQUEST, false, error.message, null, error);
            }
        });
        this.getUserPortfolio = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.params.userId;
                if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
                    res.status(400).json({ message: "Invalid User ID format" });
                }
                const portfolio = yield this.adminService.getUserPortfolio(userId);
                (0, helper_1.default)(res, Interfaces_1.HttpStatusCode.OK, true, Message_1.MESSAGES.USER_PORTFOLIO, portfolio);
            }
            catch (error) {
                (0, helper_1.default)(res, Interfaces_1.HttpStatusCode.BAD_REQUEST, false, error.message, null, error);
            }
        });
        this.getTotalFeesCollected = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const fees = yield this.adminService.getTotalFeesCollected();
                (0, helper_1.default)(res, Interfaces_1.HttpStatusCode.OK, true, Message_1.MESSAGES.TOTAL_FEES_COLLECTED, fees);
            }
            catch (error) {
                (0, helper_1.default)(res, Interfaces_1.HttpStatusCode.BAD_REQUEST, false, error.message, null, error);
            }
        });
        this.cancelOrder = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const orderId = req.params.orderId;
                const updatedOrder = yield this.adminService.cancelOrder(orderId);
                (0, helper_1.default)(res, Interfaces_1.HttpStatusCode.OK, true, Message_1.MESSAGES.ORDER_DETAILS, updatedOrder);
            }
            catch (error) {
                (0, helper_1.default)(res, Interfaces_1.HttpStatusCode.BAD_REQUEST, false, error.message, null, error);
            }
        });
        this.updateLimit = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const limitData = req.body;
                const updatedLimit = yield this.adminService.updateLimit(limitData);
                (0, helper_1.default)(res, Interfaces_1.HttpStatusCode.OK, true, Message_1.MESSAGES.UPDATE_LIMIT, updatedLimit);
            }
            catch (error) {
                (0, helper_1.default)(res, Interfaces_1.HttpStatusCode.BAD_REQUEST, false, error.message, null, error);
            }
        });
        this.getLimits = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const limits = yield this.adminService.getLimits();
                (0, helper_1.default)(res, Interfaces_1.HttpStatusCode.OK, true, Message_1.MESSAGES.CURRENT_LIMIT, limits);
            }
            catch (error) {
                (0, helper_1.default)(res, Interfaces_1.HttpStatusCode.BAD_REQUEST, false, error.message, null, error);
            }
        });
        this.CreatePromotions = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const promotions = yield this.adminService.CreatePromotions(req.body);
                (0, helper_1.default)(res, Interfaces_1.HttpStatusCode.OK, true, Message_1.MESSAGES.PROMOTION_CREATED, promotions);
            }
            catch (error) {
                (0, helper_1.default)(res, Interfaces_1.HttpStatusCode.BAD_REQUEST, false, error.message, null, error);
            }
        });
        this.createSession = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const session = yield this.adminService.createSsession(req.body);
                (0, helper_1.default)(res, Interfaces_1.HttpStatusCode.OK, true, Message_1.MESSAGES.SESSION_CREATED, session);
            }
            catch (error) {
                (0, helper_1.default)(res, Interfaces_1.HttpStatusCode.BAD_REQUEST, false, error.message, null, error);
            }
        });
        this.getAllSessions = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const sessions = yield this.adminService.getAllSessions();
                (0, helper_1.default)(res, Interfaces_1.HttpStatusCode.OK, true, Message_1.MESSAGES.SESSION_RETRIEVED, sessions);
            }
            catch (error) {
                (0, helper_1.default)(res, Interfaces_1.HttpStatusCode.BAD_REQUEST, false, error.message, null, error);
            }
        });
        this.getSessionById = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const sessionId = req.params.sessionId;
                const session = yield this.adminService.getSessionById(sessionId);
                (0, helper_1.default)(res, Interfaces_1.HttpStatusCode.OK, true, Message_1.MESSAGES.SESSION_RETRIEVED, session);
            }
            catch (error) {
                (0, helper_1.default)(res, Interfaces_1.HttpStatusCode.BAD_REQUEST, false, error.message, null, error);
            }
        });
        this.updateSessionData = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const sessionId = req.params.sessionId;
                const updatedSession = yield this.adminService.updateSessionData(sessionId, req.body);
                (0, helper_1.default)(res, Interfaces_1.HttpStatusCode.OK, true, Message_1.MESSAGES.SESSION_CREATED, updatedSession);
            }
            catch (error) {
                (0, helper_1.default)(res, Interfaces_1.HttpStatusCode.BAD_REQUEST, false, error.message, null, error);
            }
        });
        this.cancelSession = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const sessionId = req.params.id;
                const { status } = req.body;
                const updatedSession = yield this.adminService.cancelSession(sessionId, status);
                (0, helper_1.default)(res, Interfaces_1.HttpStatusCode.OK, true, Message_1.MESSAGES.SESSION_CANCELLED, updatedSession);
            }
            catch (error) {
                (0, helper_1.default)(res, Interfaces_1.HttpStatusCode.BAD_REQUEST, false, error.message, null, error);
            }
        });
        this.getDashboardSummary = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const summary = yield this.adminService.getAdminDashboard();
                (0, helper_1.default)(res, Interfaces_1.HttpStatusCode.OK, true, Message_1.MESSAGES.SUMMARY, summary);
            }
            catch (error) {
                (0, helper_1.default)(res, Interfaces_1.HttpStatusCode.BAD_REQUEST, false, error.message, null, error);
            }
        });
        this.adminService = adminService;
    }
}
exports.AdminController = AdminController;
