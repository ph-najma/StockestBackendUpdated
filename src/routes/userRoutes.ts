import express, { Router, Request, Response } from "express";
import { verifyTokenWithRole } from "../middleware/auth";
// import { checkPortfolio } from "../controllers/checkPortfolio";
import { userController } from "../dependencyInjection";
import { paymentController } from "../dependencyInjection";
const router: Router = express.Router();

// User authentication routes
router.post("/signup", userController.signup);
router.post("/resendOtp", userController.resendOtp);
router.post("/verifyOtp", userController.verifyOtp);
router.post("/login", userController.login);
router.post("/forgotPassword", userController.forgotPassword);
router.post("/resetPassword", userController.resetPassword);
router.get("/auth/google", userController.googleAuth);
router.get("/auth/google/callback", userController.googleCallback);
router.get("/logout", userController.logout);
router.get("/stocks", verifyTokenWithRole("user"), userController.getStockList);
router.get(
  "/UserProfile",
  verifyTokenWithRole("user"),
  userController.getUserProfile
);
router.post("/orders", verifyTokenWithRole("user"), userController.placeOrder);
router.get(
  "/portfolio",
  verifyTokenWithRole("user"),
  userController.getUserportfolio
);
router.post("/checkPortfolio", userController.checkPortfolio);
router.get(
  "/transactions",
  verifyTokenWithRole("user"),
  userController.getTransaction
);
router.post("/updatePortfolio", userController.updatePortfolioAfterSell);
router.get(
  "/getWatchlist",
  verifyTokenWithRole("user"),
  userController.getWatchlist
);
router.post(
  "/ensureAndAddStock",
  verifyTokenWithRole("user"),
  userController.ensureWatchlistAndAddStock
);

router.get(
  "/getStockData",
  verifyTokenWithRole("user"),
  userController.getStockData
);

router.get(
  "/gethistorical",
  verifyTokenWithRole("user"),
  userController.getHistorical
);

router.get("/getOrders", verifyTokenWithRole("user"), userController.getOrders);

router.post(
  "/create-order",
  verifyTokenWithRole("user"),
  paymentController.createOrder.bind(paymentController)
);
router.post(
  "/verify-payment",
  verifyTokenWithRole("user"),
  paymentController.verifyPayment.bind(paymentController)
);

router.get(
  "/promotions",
  verifyTokenWithRole("user"),
  userController.getPromotions
);
router.get(
  "/tradeDiary",
  verifyTokenWithRole("user"),
  userController.getTradeDiary
);
router.get(
  "/getPurchased",
  verifyTokenWithRole("user"),
  userController.getPurchased
);
router.get(
  "/getAssigned",
  verifyTokenWithRole("user"),
  userController.getAssigned
);
router.get("/refresh", userController.refreshToken);

router.get("/search", verifyTokenWithRole("user"), userController.getBySearch);

router.get(
  "/activeSessions",
  verifyTokenWithRole("user"),
  userController.getActiveSessions
);

router.get(
  "/get-signed-url",
  verifyTokenWithRole("user"),
  userController.getSignedUrl
);

router.post(
  "/update-profile",
  verifyTokenWithRole("user"),
  userController.saveProfile
);

router.post("/generate", userController.generate);

router.get(
  "/notifications",
  verifyTokenWithRole("user"),
  userController.getNotifications
);
router.get("/logout", (req: Request, res: Response) => {
  req.logout((err: any) => {
    if (err) {
      console.error("Error during logout:", err);
      return res.status(500).send("Error logging out");
    }
    res.redirect("/"); // Redirect after logout
  });
});

export default router;
