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
exports.UserRepository = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const BaseRepository_1 = require("./BaseRepository");
class UserRepository extends BaseRepository_1.BaseRepository {
    constructor(userModel) {
        super(userModel);
        this.userModel = userModel;
    }
    // Find user by email
    findByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.userModel.findOne({ email }).exec();
        });
    }
    // Find user by OTP
    findByOtp(otp) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.userModel.findOne({ otp }).exec();
        });
    }
    //Find by ID
    findById(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.userModel
                .findById(userId)
                .populate({
                path: "portfolio.stockId",
                model: "Stock",
            })
                .exec();
        });
    }
    // Save a new user
    save(userData) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(userData);
            const user = new this.userModel(userData);
            return user.save();
        });
    }
    findUserByGoogleId(googleId) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.userModel.findOne({ googleId }));
        });
    }
    // Update user data
    updateById(userId, updateData) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.userModel.findByIdAndUpdate(userId, updateData, { new: true });
        });
    }
    // Update user password
    updatePassword(email, newPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.userModel.findOne({ email });
            if (user) {
                user.password = newPassword;
                yield user.save();
            }
        });
    }
    findByIdWithPortfolio(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.userModel.findById(userId).populate("portfolio.stockId");
        });
    }
    // Find or create Google user
    findOrCreateGoogleUser(googleId, userData) {
        return __awaiter(this, void 0, void 0, function* () {
            let user = yield this.userModel.findOne({ googleId });
            if (!user) {
                user = new this.userModel(userData);
                yield user.save();
            }
            return user;
        });
    }
    //Find an admin by email
    findAdminByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.userModel.findOne({ email, is_Admin: true });
        });
    }
    //Find all users
    findAllUsers() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.userModel.find({ is_Admin: false }).exec();
        });
    }
    //Save a user
    saveUser(user) {
        return __awaiter(this, void 0, void 0, function* () {
            return user.save();
        });
    }
    // Fetch user balance
    getUserBalance(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.userModel.findById(userId);
            return (user === null || user === void 0 ? void 0 : user.balance) || null;
        });
    }
    // Update user balance
    updateUserBalance(userId, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.userModel.findByIdAndUpdate(userId, { $inc: { balance: amount } }, { new: true });
        });
    }
    addSignupBonus(userId, type) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.userModel.findById(userId);
            if (!user) {
                throw new Error("User not found");
            }
            if (type == "signup") {
                user.isEligibleForSignupBonus = true;
            }
            else {
                user.isEligibleForReferralBonus = true;
            }
            yield user.save();
            return user;
        });
    }
    updatePortfolioAfterSell(userId, stockId, quantityToSell) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.userModel.findById(userId);
            if (!user)
                throw new Error("User not found");
            // Check if the stock exists in the portfolio
            const stockIdObject = new mongoose_1.default.Types.ObjectId(stockId);
            const stockIndex = user.portfolio.findIndex((item) => item.stockId.toString() === stockIdObject.toString());
            if (stockIndex === -1) {
                throw new Error("Stock not found in portfolio");
            }
            const stockInPortfolio = user.portfolio[stockIndex];
            if (stockInPortfolio.quantity < quantityToSell) {
                throw new Error("Not enough stock to sell");
            }
            if (stockInPortfolio.quantity === quantityToSell) {
                user.portfolio.splice(stockIndex, 1);
            }
            else {
                stockInPortfolio.quantity -= quantityToSell;
            }
            return yield user.save();
        });
    }
    findByRefferalCode(refferalcode) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.userModel.findOne({ referralCode: refferalcode });
        });
    }
    getPromotions(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.userModel.findById(userId).exec();
            return user;
        });
    }
    countUser() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.userModel.countDocuments({ is_Admin: false }).exec();
        });
    }
    updatePortfolio(userId, stockId, isBuy, quantity) {
        return __awaiter(this, void 0, void 0, function* () {
            if (isBuy) {
                return this.userModel.findOneAndUpdate({ _id: userId, "portfolio.stockId": stockId }, { $inc: { "portfolio.$.quantity": quantity } }, { new: true, upsert: true });
            }
            else {
                return this.userModel.findOneAndUpdate({ _id: userId, "portfolio.stockId": stockId }, { $inc: { "portfolio.$.quantity": -quantity } }, { new: true });
            }
        });
    }
}
exports.UserRepository = UserRepository;
