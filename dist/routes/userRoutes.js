"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
// import { checkPortfolio } from "../controllers/checkPortfolio";
const dependencyInjection_1 = require("../dependencyInjection");
const dependencyInjection_2 = require("../dependencyInjection");
const router = express_1.default.Router();
// User authentication routes
router.post("/signup", dependencyInjection_1.userController.signup);
router.post("/resendOtp", dependencyInjection_1.userController.resendOtp);
router.post("/verifyOtp", dependencyInjection_1.userController.verifyOtp);
router.post("/login", dependencyInjection_1.userController.login);
router.post("/forgotPassword", dependencyInjection_1.userController.forgotPassword);
router.post("/resetPassword", dependencyInjection_1.userController.resetPassword);
router.get("/auth/google", dependencyInjection_1.userController.googleAuth);
router.get("/auth/google/callback", dependencyInjection_1.userController.googleCallback);
router.get("/logout", dependencyInjection_1.userController.logout);
router.get("/stocks", (0, auth_1.verifyTokenWithRole)("user"), dependencyInjection_1.userController.getStockList);
router.get("/UserProfile", (0, auth_1.verifyTokenWithRole)("user"), dependencyInjection_1.userController.getUserProfile);
router.post("/orders", (0, auth_1.verifyTokenWithRole)("user"), dependencyInjection_1.userController.placeOrder);
router.get("/portfolio", (0, auth_1.verifyTokenWithRole)("user"), dependencyInjection_1.userController.getUserportfolio);
router.post("/checkPortfolio", dependencyInjection_1.userController.checkPortfolio);
router.get("/transactions", (0, auth_1.verifyTokenWithRole)("user"), dependencyInjection_1.userController.getTransaction);
router.post("/updatePortfolio", dependencyInjection_1.userController.updatePortfolioAfterSell);
router.get("/getWatchlist", (0, auth_1.verifyTokenWithRole)("user"), dependencyInjection_1.userController.getWatchlist);
router.post("/ensureAndAddStock", (0, auth_1.verifyTokenWithRole)("user"), dependencyInjection_1.userController.ensureWatchlistAndAddStock);
router.get("/getStockData", (0, auth_1.verifyTokenWithRole)("user"), dependencyInjection_1.userController.getStockData);
router.get("/gethistorical", (0, auth_1.verifyTokenWithRole)("user"), dependencyInjection_1.userController.getHistorical);
router.get("/getOrders", (0, auth_1.verifyTokenWithRole)("user"), dependencyInjection_1.userController.getOrders);
router.post("/create-order", (0, auth_1.verifyTokenWithRole)("user"), dependencyInjection_2.paymentController.createOrder.bind(dependencyInjection_2.paymentController));
router.post("/verify-payment", (0, auth_1.verifyTokenWithRole)("user"), dependencyInjection_2.paymentController.verifyPayment.bind(dependencyInjection_2.paymentController));
router.get("/promotions", (0, auth_1.verifyTokenWithRole)("user"), dependencyInjection_1.userController.getPromotions);
router.get("/tradeDiary", (0, auth_1.verifyTokenWithRole)("user"), dependencyInjection_1.userController.getTradeDiary);
router.get("/getPurchased", (0, auth_1.verifyTokenWithRole)("user"), dependencyInjection_1.userController.getPurchased);
router.get("/getAssigned", (0, auth_1.verifyTokenWithRole)("user"), dependencyInjection_1.userController.getAssigned);
router.get("/refresh", dependencyInjection_1.userController.refreshToken);
router.get("/search", (0, auth_1.verifyTokenWithRole)("user"), dependencyInjection_1.userController.getBySearch);
router.get("/activeSessions", (0, auth_1.verifyTokenWithRole)("user"), dependencyInjection_1.userController.getActiveSessions);
router.get("/get-signed-url", (0, auth_1.verifyTokenWithRole)("user"), dependencyInjection_1.userController.getSignedUrl);
router.post("/update-profile", (0, auth_1.verifyTokenWithRole)("user"), dependencyInjection_1.userController.saveProfile);
router.post("/generate", dependencyInjection_1.userController.generate);
router.get("/notifications", (0, auth_1.verifyTokenWithRole)("user"), dependencyInjection_1.userController.getNotifications);
router.get("/logout", (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error("Error during logout:", err);
            return res.status(500).send("Error logging out");
        }
        res.redirect("/"); // Redirect after logout
    });
});
exports.default = router;
