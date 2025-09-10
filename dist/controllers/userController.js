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
exports.UserController = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const passport_1 = __importDefault(require("../config/passport"));
// import Stock from "../models/stockModel";
const generative_ai_1 = require("@google/generative-ai");
const Interfaces_1 = require("../interfaces/Interfaces");
const multer_1 = __importDefault(require("multer"));
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const helper_1 = require("../helper/helper");
const userModel_1 = __importDefault(require("../models/userModel"));
const dotenv_1 = __importDefault(require("dotenv"));
const Message_1 = require("../helper/Message");
dotenv_1.default.config();
class UserController {
    constructor(userService) {
        this.s3 = new aws_sdk_1.default.S3({
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            region: process.env.AWS_REGION,
        });
        this.upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
        //signup
        this.signup = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const { name, email, password, role } = req.body;
            try {
                yield this.userService.signup(name, email, password, role);
                (0, helper_1.sendResponse)(res, Interfaces_1.HttpStatusCode.OK, true, Message_1.MESSAGES.LOGIN_SUCCESS, email);
            }
            catch (error) {
                (0, helper_1.sendResponse)(res, Interfaces_1.HttpStatusCode.BAD_REQUEST, false, error.message, null, error);
            }
        });
        //verify OTP
        this.verifyOtp = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const { otp } = req.body;
            try {
                const result = yield this.userService.verifyOtp(otp);
                (0, helper_1.sendResponse)(res, Interfaces_1.HttpStatusCode.OK, true, Message_1.MESSAGES.OTP_VERIFY, result);
            }
            catch (error) {
                (0, helper_1.sendResponse)(res, Interfaces_1.HttpStatusCode.BAD_REQUEST, false, error.message, null, error);
            }
        });
        //Resend OTP
        this.resendOtp = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const { email } = req.body;
            try {
                const message = yield this.userService.resendOtp(email);
                (0, helper_1.sendResponse)(res, Interfaces_1.HttpStatusCode.OK, true, Message_1.MESSAGES.OTP_RESEND, message);
            }
            catch (error) {
                (0, helper_1.sendResponse)(res, Interfaces_1.HttpStatusCode.BAD_REQUEST, false, error.message, null, error);
            }
        });
        //Login
        this.login = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const { email, password } = req.body;
            try {
                const result = yield this.userService.login(email, password);
                (0, helper_1.sendResponse)(res, Interfaces_1.HttpStatusCode.OK, true, Message_1.MESSAGES.LOGIN_SUCCESS, result);
            }
            catch (error) {
                (0, helper_1.sendResponse)(res, Interfaces_1.HttpStatusCode.BAD_REQUEST, false, error.message, null, error);
            }
        });
        //Forgot Password
        this.forgotPassword = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const { email } = req.body;
            try {
                yield this.userService.forgotPassword(email);
                (0, helper_1.sendResponse)(res, Interfaces_1.HttpStatusCode.OK, true, Message_1.MESSAGES.OTP_SENT, email);
            }
            catch (error) {
                (0, helper_1.sendResponse)(res, Interfaces_1.HttpStatusCode.BAD_REQUEST, false, error.message, null, error);
            }
        });
        //Reset Password
        this.resetPassword = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const { email, otp, newPassword } = req.body;
            try {
                yield this.userService.resetPassword(email, otp, newPassword);
                (0, helper_1.sendResponse)(res, Interfaces_1.HttpStatusCode.OK, true, Message_1.MESSAGES.PASSWORD_RESET, email);
            }
            catch (error) {
                (0, helper_1.sendResponse)(res, Interfaces_1.HttpStatusCode.BAD_REQUEST, false, error.message, null, error);
            }
        });
        this.getStockList = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const stocks = yield this.userService.getAllStocks();
                (0, helper_1.sendResponse)(res, Interfaces_1.HttpStatusCode.OK, true, Message_1.MESSAGES.STOCK_LIST, stocks);
            }
            catch (error) {
                (0, helper_1.sendResponse)(res, Interfaces_1.HttpStatusCode.BAD_REQUEST, false, error.message, null, error);
            }
        });
        //User Profile
        this.getUserProfile = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield this.userService.getUserProfile(req.userId);
                (0, helper_1.sendResponse)(res, Interfaces_1.HttpStatusCode.OK, true, Message_1.MESSAGES.USER_PROFILE, user);
            }
            catch (error) {
                (0, helper_1.sendResponse)(res, Interfaces_1.HttpStatusCode.BAD_REQUEST, false, error.message, null, error);
            }
        });
        this.checkPortfolio = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId, stockId, quantity, type } = req.body;
                const result = yield this.userService.checkPortfolio(userId, stockId, quantity, type);
                if (!result.success) {
                    res.status(400).json({ message: result.message });
                    return;
                }
                res.status(200).json({ message: result.message });
            }
            catch (error) {
                console.error("Error checking portfolio:", error);
                res.status(500).json({ message: "Internal server error" });
            }
        });
        //User Portfolio
        this.getUserportfolio = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield this.userService.getUserPortfolio(req.userId);
                if (!user) {
                    res
                        .status(Interfaces_1.HttpStatusCode.NOT_FOUND)
                        .json({ message: "User not found" });
                    return;
                }
                const portfolioData = yield this.userService.getUpdatedPortfolio(user);
                (0, helper_1.sendResponse)(res, Interfaces_1.HttpStatusCode.OK, true, Message_1.MESSAGES.USER_PORTFOLIO, portfolioData);
            }
            catch (error) {
                (0, helper_1.sendResponse)(res, Interfaces_1.HttpStatusCode.BAD_REQUEST, false, error.message, null, error);
            }
        });
        //placeOrder
        this.placeOrder = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { stock, type, orderType, quantity, price, stopPrice, isIntraday } = req.body;
                const user = req.userId
                    ? new mongoose_1.default.Types.ObjectId(req.userId)
                    : undefined;
                const order = yield this.userService.placeOrder(user, stock, type, orderType, quantity, price, stopPrice, isIntraday);
                (0, helper_1.sendResponse)(res, Interfaces_1.HttpStatusCode.OK, true, Message_1.MESSAGES.PLACE_ORDER, order);
            }
            catch (error) {
                (0, helper_1.sendResponse)(res, Interfaces_1.HttpStatusCode.BAD_REQUEST, false, error.message, null, error);
            }
        });
        //Get Watchlist
        this.getWatchlist = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.userId;
                const watchlist = yield this.userService.getWatchlist(userId);
                (0, helper_1.sendResponse)(res, Interfaces_1.HttpStatusCode.OK, true, Message_1.MESSAGES.WATCHLIST, watchlist);
            }
            catch (error) {
                (0, helper_1.sendResponse)(res, Interfaces_1.HttpStatusCode.BAD_REQUEST, false, error.message, null, error);
            }
        });
        //Transaction
        this.getTransaction = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const page = parseInt(req.query.page, 10) || 1;
                const limit = parseInt(req.query.limit, 10) || 10;
                const skip = (page - 1) * limit;
                const transactions = yield this.userService.getTransactions(req.userId, skip, limit);
                (0, helper_1.sendResponse)(res, Interfaces_1.HttpStatusCode.OK, true, Message_1.MESSAGES.TRANSACTIONS_RETRIEVED, transactions);
            }
            catch (error) {
                (0, helper_1.sendResponse)(res, Interfaces_1.HttpStatusCode.BAD_REQUEST, false, error.message, null, error);
            }
        });
        this.updatePortfolioAfterSell = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId, stockId, quantityToSell } = req.body;
                const updatedData = yield this.userService.updatePortfolioAfterSell(userId, stockId, quantityToSell);
                (0, helper_1.sendResponse)(res, Interfaces_1.HttpStatusCode.OK, true, Message_1.MESSAGES.PORTFOLIO_UPDATION, updatedData);
            }
            catch (error) {
                (0, helper_1.sendResponse)(res, Interfaces_1.HttpStatusCode.BAD_REQUEST, false, error.message, null, error);
            }
        });
        this.ensureWatchlistAndAddStock = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = req.userId;
                const { stocks } = req.body;
                const stockId = (_a = stocks[0]) === null || _a === void 0 ? void 0 : _a.stockId;
                const updatedWathclist = yield this.userService.ensureWatchlistAndAddStock(userId, stockId);
                (0, helper_1.sendResponse)(res, Interfaces_1.HttpStatusCode.OK, true, Message_1.MESSAGES.ADD_TO_WATCHLIST, updatedWathclist);
            }
            catch (error) {
                (0, helper_1.sendResponse)(res, Interfaces_1.HttpStatusCode.BAD_REQUEST, false, error.message, null, error);
            }
        });
        this.getStockData = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const symbol = req.query.symbol;
                const updatedSymbol = symbol === null || symbol === void 0 ? void 0 : symbol.toString();
                const stockData = yield this.userService.getStockData(updatedSymbol);
                (0, helper_1.sendResponse)(res, Interfaces_1.HttpStatusCode.OK, true, Message_1.MESSAGES.STOCK_LIST, stockData);
            }
            catch (error) {
                (0, helper_1.sendResponse)(res, Interfaces_1.HttpStatusCode.BAD_REQUEST, false, error.message, null, error);
            }
        });
        this.getHistorical = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const symbol = req.query.symbol;
                const updatedSymbol = symbol === null || symbol === void 0 ? void 0 : symbol.toString();
                const stockData = yield this.userService.getHistorical(updatedSymbol);
                (0, helper_1.sendResponse)(res, Interfaces_1.HttpStatusCode.OK, true, Message_1.MESSAGES.STOCK_HISTORY, stockData);
            }
            catch (error) {
                (0, helper_1.sendResponse)(res, Interfaces_1.HttpStatusCode.BAD_REQUEST, false, error.message, null, error);
            }
        });
        this.getOrders = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.userId;
                const page = parseInt(req.query.page, 10) || 1;
                const limit = parseInt(req.query.limit, 10) || 10; // Default to 10 items per page
                const skip = (page - 1) * limit;
                const totalOrders = yield this.userService.countOrders(userId);
                const orders = yield this.userService.getOrders(userId, skip, limit);
                (0, helper_1.sendResponse)(res, Interfaces_1.HttpStatusCode.OK, true, Message_1.MESSAGES.ALL_ORDERS, {
                    orders,
                    totalOrders,
                    currentPage: page,
                    totalPages: Math.ceil(totalOrders / limit),
                });
            }
            catch (error) {
                (0, helper_1.sendResponse)(res, Interfaces_1.HttpStatusCode.BAD_REQUEST, false, error.message, null, error);
            }
        });
        this.getPromotions = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.userId;
                const user = yield this.userService.getUserProfileWithRewards(userId);
                (0, helper_1.sendResponse)(res, Interfaces_1.HttpStatusCode.OK, true, Message_1.MESSAGES.USER_PROMOTION, user);
            }
            catch (error) {
                (0, helper_1.sendResponse)(res, Interfaces_1.HttpStatusCode.BAD_REQUEST, false, error.message, null, error);
            }
        });
        this.getTradeDiary = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.userId;
                const tradeData = yield this.userService.getTradeDiary(userId);
                (0, helper_1.sendResponse)(res, Interfaces_1.HttpStatusCode.OK, true, Message_1.MESSAGES.TRADE_DIARY_DATA, tradeData);
            }
            catch (error) {
                (0, helper_1.sendResponse)(res, Interfaces_1.HttpStatusCode.BAD_REQUEST, false, error.message, null, error);
            }
        });
        this.getActiveSessions = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const sessionData = yield this.userService.getActiveSessions();
                (0, helper_1.sendResponse)(res, Interfaces_1.HttpStatusCode.OK, true, Message_1.MESSAGES.ACTIVE_SESSIONS, sessionData);
            }
            catch (error) {
                (0, helper_1.sendResponse)(res, Interfaces_1.HttpStatusCode.BAD_REQUEST, false, error.message, null, error);
            }
        });
        this.getPurchased = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.userId;
                const sessionData = yield this.userService.getPurchased(userId);
                (0, helper_1.sendResponse)(res, Interfaces_1.HttpStatusCode.OK, true, Message_1.MESSAGES.PURCHASED_SESSIONS, sessionData);
            }
            catch (error) {
                (0, helper_1.sendResponse)(res, Interfaces_1.HttpStatusCode.BAD_REQUEST, false, error.message, null, error);
            }
        });
        this.getAssigned = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const intructorId = req.userId;
                const sessionData = yield this.userService.getAssignedSession(intructorId);
                (0, helper_1.sendResponse)(res, Interfaces_1.HttpStatusCode.OK, true, Message_1.MESSAGES.ASSIGNED_SESSIONS, sessionData);
            }
            catch (error) {
                (0, helper_1.sendResponse)(res, Interfaces_1.HttpStatusCode.BAD_REQUEST, false, error.message, null, error);
            }
        });
        this.getBySearch = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { symbol, startDate, endDate, minPrice, maxPrice } = req.query;
                const query = {};
                if (symbol)
                    query.symbol = { $regex: symbol, $options: "i" };
                if (startDate)
                    query.timestamp = { $gte: new Date(startDate) };
                if (endDate)
                    query.timestamp = Object.assign(Object.assign({}, query.timestamp), { $lte: new Date(endDate) });
                if (minPrice)
                    query.price = { $gte: parseFloat(minPrice) };
                if (maxPrice)
                    query.price = Object.assign(Object.assign({}, query.price), { $lte: parseFloat(maxPrice) });
                const stocks = yield this.userService.getBySearch(query);
                (0, helper_1.sendResponse)(res, Interfaces_1.HttpStatusCode.OK, true, Message_1.MESSAGES.SEARCH_RESULT, stocks);
            }
            catch (error) {
                (0, helper_1.sendResponse)(res, Interfaces_1.HttpStatusCode.BAD_REQUEST, false, error.message, null, error);
            }
        });
        this.generate = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const { prompt } = req.body;
            if (!prompt) {
                res
                    .status(Interfaces_1.HttpStatusCode.BAD_REQUEST)
                    .json({ error: "Prompt is required." });
            }
            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) {
                res
                    .status(Interfaces_1.HttpStatusCode.INTERNAL_SERVER_ERROR)
                    .json({ error: "GEMINI_API_KEY is not set." });
            }
            try {
                const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                const result = yield model.generateContent(prompt);
                res.json({ response: result.response.text() });
            }
            catch (error) {
                (0, helper_1.sendResponse)(res, Interfaces_1.HttpStatusCode.BAD_REQUEST, false, error.message, null, error);
            }
        });
        this.refreshToken = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { refreshToken } = req.body;
                if (!refreshToken) {
                    res
                        .status(Interfaces_1.HttpStatusCode.INTERNAL_SERVER_ERROR)
                        .json({ error: "Refresh token is required." });
                }
                const newToken = yield this.userService.refreshToken(refreshToken);
                (0, helper_1.sendResponse)(res, Interfaces_1.HttpStatusCode.OK, true, Message_1.MESSAGES.REFRESH_TOKEN, newToken);
            }
            catch (error) {
                (0, helper_1.sendResponse)(res, Interfaces_1.HttpStatusCode.BAD_REQUEST, false, error.message, null, error);
            }
        });
        this.getSignedUrl = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const { fileName, fileType } = req.query;
            if (!fileName || !fileType) {
                return res.status(400).json({ error: "Missing fileName or fileType" });
            }
            const params = {
                Bucket: process.env.S3_BUCKET_NAME,
                Key: `profiles/${fileName}`,
                Expires: 3600,
                ContentType: fileType,
            };
            try {
                const signedUrl = yield this.s3.getSignedUrlPromise("putObject", params);
                console.log(signedUrl);
                res.json({
                    signedUrl,
                    fileUrl: `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/profiles/${fileName}`,
                });
            }
            catch (error) {
                (0, helper_1.sendResponse)(res, Interfaces_1.HttpStatusCode.BAD_REQUEST, false, error.message, null, error);
            }
        });
        this.saveProfile = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const userId = req.userId;
            const user = yield userModel_1.default.findById(userId);
            const email = user === null || user === void 0 ? void 0 : user.email;
            console.log(email);
            const { profileImageUrl } = req.body;
            console.log(profileImageUrl);
            try {
                const user = yield userModel_1.default.findOneAndUpdate({ email }, { profilePhoto: profileImageUrl }, { new: true, upsert: true });
                res.json({ message: "Profile updated successfully", user });
            }
            catch (error) {
                (0, helper_1.sendResponse)(res, Interfaces_1.HttpStatusCode.BAD_REQUEST, false, error.message, null, error);
            }
        });
        this.getNotifications = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.userId;
                const notificationData = yield this.userService.getNotifications(userId);
                (0, helper_1.sendResponse)(res, Interfaces_1.HttpStatusCode.OK, true, Message_1.MESSAGES.PURCHASED_SESSIONS, notificationData);
            }
            catch (error) {
                (0, helper_1.sendResponse)(res, Interfaces_1.HttpStatusCode.BAD_REQUEST, false, error.message, null, error);
            }
        });
        this.userService = userService;
    }
    googleAuth(req, res, next) {
        passport_1.default.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
    }
    googleCallback(req, res, next) {
        passport_1.default.authenticate("google", {
            failureRedirect: "/",
            successRedirect: "/home",
        })(req, res, next);
    }
    logout(req, res) {
        req.logout(() => {
            res.redirect("/");
        });
    }
}
exports.UserController = UserController;
