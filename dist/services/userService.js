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
exports.UserService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const mongoose_1 = __importDefault(require("mongoose"));
const crypto_1 = __importDefault(require("crypto"));
const dotenv_1 = __importDefault(require("dotenv"));
const sendEmail_1 = require("../utils/sendEmail");
const otpGenerator_1 = require("../utils/otpGenerator");
const helper_1 = require("../helper/helper");
dotenv_1.default.config();
const otpStore = new Map();
class UserService {
    constructor(stockRepository, userRepository, transactionRepository, orderRepository, promotionRepository, watchlistRepsoitory, sessionRepository, notificationRepository) {
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
        this.transactionRepository = transactionRepository;
        this.stockRepository = stockRepository;
        this.promotionRepository = promotionRepository;
        this.watchlistRepository = watchlistRepsoitory;
        this.sessionRepository = sessionRepository;
        this.notificationRepository = notificationRepository;
    }
    // Sign up a new user
    signup(name, email, password, role, referralCode) {
        return __awaiter(this, void 0, void 0, function* () {
            const existingUser = yield this.userRepository.findByEmail(email);
            if (existingUser) {
                throw new Error("User already exists");
            }
            const otp = (0, otpGenerator_1.generateOTP)();
            const generatedReferralCode = crypto_1.default.randomBytes(4).toString("hex");
            otpStore.set(otp, {
                name,
                email,
                password,
                role,
                otp,
                refferedBy: referralCode,
            });
            yield (0, sendEmail_1.sendEmail)(email, "Your OTP for user verification", `Your OTP is ${otp}. Please enter this code to verify your account.`);
        });
    }
    // Verify OTP
    verifyOtp(otp) {
        return __awaiter(this, void 0, void 0, function* () {
            const pendingUser = otpStore.get(otp);
            if (!pendingUser) {
                throw new Error("Invalid OTP");
            }
            const referredBy = pendingUser.refferedBy;
            if (pendingUser.role == "instructor") {
                const newUser = yield this.userRepository.save({
                    name: pendingUser.name,
                    email: pendingUser.email,
                    password: pendingUser.password,
                    is_instructor: true,
                });
                otpStore.delete(otp);
                const token = jsonwebtoken_1.default.sign({ userId: newUser._id }, process.env.JWT_SECRET, {
                    expiresIn: "1h",
                });
                return { token };
            }
            else {
                const newUser = yield this.userRepository.save({
                    name: pendingUser.name,
                    email: pendingUser.email,
                    password: pendingUser.password,
                    referralCode: crypto_1.default.randomBytes(4).toString("hex"),
                    referredBy,
                });
                otpStore.delete(otp);
                const promotion = yield this.promotionRepository.findPromotion();
                if (promotion && promotion.signupBonus.enabled) {
                    yield this.userRepository.addSignupBonus(newUser._id.toString(), "signup");
                }
                if (referredBy) {
                    const referrer = yield this.userRepository.findByRefferalCode(referredBy);
                    if (referrer) {
                        yield this.userRepository.addSignupBonus(referrer._id.toString(), "referral");
                    }
                }
                const token = jsonwebtoken_1.default.sign({ userId: newUser._id }, process.env.JWT_SECRET, {
                    expiresIn: "1h",
                });
                return { token };
            }
        });
    }
    //Resend OTP
    resendOtp(email) {
        return __awaiter(this, void 0, void 0, function* () {
            const existingUser = yield this.userRepository.findByEmail(email);
            if (existingUser) {
                throw new Error("User already registered");
            }
            // Find the pending OTP entry for the user
            const pendingUserEntry = Array.from(otpStore.values()).find((entry) => entry.email === email);
            if (!pendingUserEntry) {
                throw new Error("No pending registration found for this email");
            }
            const newOtp = (0, otpGenerator_1.generateOTP)();
            otpStore.set(newOtp, Object.assign(Object.assign({}, pendingUserEntry), { otp: newOtp }));
            // Remove the old OTP entry for the same email
            otpStore.forEach((value, key) => {
                if (value.email === email && key !== newOtp) {
                    otpStore.delete(key);
                }
            });
            yield (0, sendEmail_1.sendEmail)(email, "Your OTP for user verification", `Your OTP is ${newOtp}. Please enter this code to verify your account.`);
            return "OTP resent to email";
        });
    }
    // Login user
    login(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.userRepository.findByEmail(email);
            if (!user) {
                throw new Error("No such user");
            }
            const isMatch = yield bcryptjs_1.default.compare(password, user.password || "");
            if (!isMatch) {
                throw new Error("Invalid password");
            }
            const token = jsonwebtoken_1.default.sign({ userId: user._id }, process.env.JWT_SECRET, {
                expiresIn: "1h",
            });
            const refreshToken = jsonwebtoken_1.default.sign({ userId: user._id }, process.env.JWT_REFRESH_SECRET, {
                expiresIn: "7d",
            });
            yield this.userRepository.updateById(user._id.toString(), {
                refreshToken: refreshToken,
            });
            return { token, refreshToken, user };
        });
    }
    // Forgot password
    forgotPassword(email) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.userRepository.findByEmail(email);
            if (!user) {
                throw new Error("User not found");
            }
            console.log(user);
            const otp = (0, otpGenerator_1.generateOTP)();
            const otpExpiration = Date.now() + 10 * 60 * 1000;
            otpStore.set(email, { userId: user._id.toString(), otp, otpExpiration });
            console.log(otpStore);
            yield (0, sendEmail_1.sendEmail)(email, "Your OTP for user verification", `Your OTP is ${otp}. Please enter this code to verify your account.`);
        });
    }
    // Reset password
    resetPassword(email, otp, newPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            const otpEntry = otpStore.get(email);
            if (!otpEntry ||
                otpEntry.otp !== otp ||
                otpEntry.otpExpiration < Date.now()) {
                throw new Error("Invalid or expired OTP");
            }
            yield this.userRepository.updatePassword(email, newPassword);
            otpStore.delete(email);
        });
    }
    //Home
    home() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    //Get User Profle
    getUserProfile(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.userRepository.findById(userId);
            if (!user) {
                throw new Error("user not found");
            }
            return user;
        });
    }
    //Get User Portfolio
    getUserPortfolio(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.userRepository.findById(userId);
        });
    }
    getUpdatedPortfolio(user) {
        return __awaiter(this, void 0, void 0, function* () {
            let totalPortfolioValue = 0;
            let overallProfit = 0;
            let todaysProfit = 0;
            const updatedPortfolio = yield Promise.all(user.portfolio.map((item) => __awaiter(this, void 0, void 0, function* () {
                const stock = yield this.getStockById(item.stockId instanceof mongoose_1.default.Types.ObjectId
                    ? item.stockId.toString()
                    : item.stockId);
                if (!stock)
                    return item;
                const stockValue = stock.price * item.quantity;
                const profit = stockValue - stock.open * item.quantity;
                const todaysChange = stock.changePercent;
                totalPortfolioValue += stockValue;
                overallProfit += profit;
                todaysProfit += (profit * parseFloat(todaysChange)) / 100;
                return Object.assign(Object.assign({}, item), { stockData: stock, currentValue: stockValue, overallProfit: profit, todaysProfit });
            })));
            return {
                portfolio: updatedPortfolio,
                totalPortfolioValue,
                overallProfit,
                todaysProfit,
            };
        });
    }
    //Get All Stocks
    getAllStocks() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.stockRepository.getAllStocks();
        });
    }
    checkPortfolio(userId, stockId, quantity, type) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.userRepository.findByIdWithPortfolio(userId);
            if (!user) {
                return { success: false, message: "User not found" };
            }
            if (type === "SELL") {
                const portfolioItem = user.portfolio.find((item) => item.stockId.toString() === stockId);
                if (!portfolioItem || portfolioItem.quantity < quantity) {
                    return {
                        success: false,
                        message: "Insufficient stock in portfolio for this sell order",
                    };
                }
            }
            return { success: true, message: "Portfolio check passed" };
        });
    }
    handleGoogleLogin(profile) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            const email = (_b = (_a = profile.emails) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value;
            if (!email)
                throw new Error("Email not found in Google profile");
            let user = yield this.userRepository.findUserByGoogleId(profile.id);
            if (!user) {
                user = yield this.userRepository.save({
                    googleId: profile.id,
                    name: profile.displayName,
                    email,
                    profilePhoto: (_d = (_c = profile.photos) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.value,
                });
            }
            return user;
        });
    }
    //Place an Order
    placeOrder(user, stock, type, orderType, quantity, price, stopPrice, isIntraday) {
        return __awaiter(this, void 0, void 0, function* () {
            const orderData = {
                user,
                stock,
                type,
                orderType,
                quantity,
                price,
                stopPrice,
                isIntraday,
            };
            const order = yield this.orderRepository.create(orderData);
            return order;
        });
    }
    //Get Transactions of a user
    getTransactions(userId, skip, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            const transactions = yield this.transactionRepository.getTransactions(userId, skip, limit);
            return transactions;
        });
    }
    //Get Stock By ID
    getStockById(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.stockRepository.getStockById(userId);
        });
    }
    getWatchlist(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.watchlistRepository.getByUserId(userId);
        });
    }
    //Update User Portfolio After Sell
    updatePortfolioAfterSell(userId, stockId, quantityToSell) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.userRepository.updatePortfolioAfterSell(userId, stockId, quantityToSell);
        });
    }
    getMarketPrice(symbol) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.stockRepository.getMarketPrice(symbol);
        });
    }
    ensureWatchlistAndAddStock(userId, stocksymbol) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.watchlistRepository.ensureWatchlistAndAddStock(userId, stocksymbol);
        });
    }
    getStockData(symbol) {
        return __awaiter(this, void 0, void 0, function* () {
            const stockData = yield this.stockRepository.getStockData(symbol);
            const formattedData = stockData.map((stock) => ({
                time: stock.timestamp.getTime() / 1000, // Convert to seconds (Unix timestamp)
                open: stock.open,
                high: stock.high,
                low: stock.low,
                close: stock.close,
                volume: stock.volume,
            }));
            return formattedData;
        });
    }
    getHistorical(symbol) {
        return __awaiter(this, void 0, void 0, function* () {
            const stockData = yield this.stockRepository.getStockData(symbol);
            return stockData;
        });
    }
    getReferralCode(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.userRepository.findById(userId);
            if (!user) {
                throw new Error("User not found");
            }
            return user.referralCode;
        });
    }
    getOrders(userId, skip, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            const orders = yield this.orderRepository.findOrders(userId, skip, limit);
            return orders;
        });
    }
    getUserProfileWithRewards(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const promo = yield this.promotionRepository.findPromotion();
                return promo;
            }
            catch (error) {
                throw error;
            }
        });
    }
    // async getTradeDiary(userId: string | undefined): Promise<any> {
    //   try {
    //     const tradeData = await this.transactionRepository.getTradeDiary(userId);
    //     return tradeData;
    //   } catch (error) {
    //     throw error;
    //   }
    // }
    getTradeDiary(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const transactions = yield this.transactionRepository.getTransactions(userId, 0, 0);
            let totalTrades = 0;
            let totalPnl = 0;
            let totalCharges = 0;
            let totalBrokerage = 0;
            const tradeDetails = [];
            transactions.forEach((transaction) => {
                var _a, _b;
                const pnl = transaction.type === "BUY"
                    ? transaction.price * transaction.quantity
                    : 0;
                const charges = transaction.fees;
                const brokerage = charges * 0.1;
                totalTrades++;
                totalPnl += pnl;
                totalCharges += charges;
                totalBrokerage += brokerage;
                const date = transaction.createdAt.toISOString().split("T")[0];
                const buyOrderPrice = (0, helper_1.isIOrder)(transaction.buyOrder)
                    ? transaction.buyOrder.price
                    : 0;
                const sellOrderPrice = (0, helper_1.isIOrder)(transaction.sellOrder)
                    ? transaction.sellOrder.price
                    : 0;
                let dailyTrade = tradeDetails.find((trade) => trade.date === date);
                if (!dailyTrade) {
                    dailyTrade = {
                        date,
                        trades: 0,
                        overallPL: 0,
                        netPL: 0,
                        status: transaction.status,
                        details: [],
                    };
                    tradeDetails.push(dailyTrade);
                }
                dailyTrade.trades++;
                dailyTrade.overallPL += pnl;
                dailyTrade.netPL += pnl - charges - brokerage;
                dailyTrade.details.push({
                    time: transaction.createdAt.toLocaleTimeString(),
                    type: transaction.type,
                    symbol: (_b = (_a = transaction.stock) === null || _a === void 0 ? void 0 : _a.symbol) !== null && _b !== void 0 ? _b : "Unknown",
                    quantity: transaction.quantity,
                    entry: buyOrderPrice,
                    exit: sellOrderPrice,
                    pnl,
                    notes: "Example trade note",
                });
            });
            const winTrades = transactions.filter((transaction) => {
                const buyOrderPrice = (0, helper_1.isIOrder)(transaction.buyOrder)
                    ? transaction.buyOrder.price
                    : 0;
                const sellOrderPrice = (0, helper_1.isIOrder)(transaction.sellOrder)
                    ? transaction.sellOrder.price
                    : 0;
                return transaction.type === "BUY" && sellOrderPrice > buyOrderPrice;
            }).length;
            const lossTrades = totalTrades - winTrades;
            const winRate = (winTrades / totalTrades) * 100;
            const averageWin = winTrades ? totalPnl / winTrades : 0;
            const averageLoss = lossTrades ? totalPnl / lossTrades : 0;
            return {
                winRate,
                averageWin,
                averageLoss,
                overallPL: totalPnl,
                netPL: totalPnl - totalCharges - totalBrokerage,
                totalTrades,
                charges: totalCharges,
                brokerage: totalBrokerage,
                trades: tradeDetails,
            };
        });
    }
    getActiveSessions() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const sessionData = yield this.sessionRepository.getActiveSessions();
                return sessionData;
            }
            catch (error) {
                throw error;
            }
        });
    }
    getAssignedSession(instructorId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const instructorData = yield this.getUserProfile(instructorId);
                const email = instructorData === null || instructorData === void 0 ? void 0 : instructorData.email;
                console.log(email);
                const sessionData = yield this.sessionRepository.getAssigned(email);
                console.log(sessionData);
                return sessionData;
            }
            catch (error) {
                throw error;
            }
        });
    }
    getPurchased(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const sessionData = yield this.sessionRepository.getPurchased(userId);
                return sessionData;
            }
            catch (error) {
                throw error;
            }
        });
    }
    getBySearch(query) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.stockRepository.searchStocks(query);
        });
    }
    countOrders(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.orderRepository.countOrdersByUser(userId);
        });
    }
    refreshToken(refreshToken) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const decoded = jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
                const user = yield this.userRepository.findById(decoded.userId);
                if (!user || user.refreshToken !== refreshToken) {
                    return "no user";
                }
                // Generate a new access token
                const newToken = jsonwebtoken_1.default.sign({ userId: user._id }, process.env.JWT_SECRET, {
                    expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRY,
                });
                return newToken;
            }
            catch (error) {
                return "Failed to verify refresh token.";
            }
        });
    }
    getNotifications(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.notificationRepository.getNotifications(userId);
        });
    }
}
exports.UserService = UserService;
