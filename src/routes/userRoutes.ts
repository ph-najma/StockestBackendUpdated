import express, { Router, Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import { verifyTokenWithRole } from "../middleware/auth";
import dotenv from "dotenv";
import { UserController } from "../controllers/userController";
import User from "../models/userModel";
import { IUser } from "../models/interfaces/userInterface";
import jwt from "jsonwebtoken";
import { checkPortfolio } from "../controllers/checkPortfolio";
import { UserService } from "../services/userService";
import { StockRepository } from "../repositories/stockRepository";
import { UserRepository } from "../repositories/userRepository";
import { transactionRepository } from "../repositories/transactionRepository";
import { OrderRepository } from "../repositories/orderRepository";
import { PromotionRepository } from "../repositories/promotionRepository";
import { watchlistRepostory } from "../repositories/watchlistRepsoitory";
import { PaymentController } from "../controllers/paymentController";
import { sessionRepository } from "../repositories/sessionRepository";
import { PaymentService } from "../services/paymentServices";
import { PaymentRepository } from "../repositories/paymentRepository";
import { NotificationRepository } from "../repositories/notificationRepository";
import orderModel from "../models/orderModel";
import { IOrder } from "../models/interfaces/orderInterface";
import { Model } from "mongoose";
const userRepository = new UserRepository();
const payemntRepository = new PaymentRepository();
const stockRepository = new StockRepository();
const TransactionRepository = new transactionRepository();
const orderRepository = new OrderRepository(orderModel as Model<IOrder>);
const promotionRepository = new PromotionRepository();
const watchlistRepository = new watchlistRepostory();
const sessionRepsoitory = new sessionRepository();
const notificationRepository = new NotificationRepository();
const paymentController = new PaymentController(
  new PaymentService(payemntRepository, userRepository, sessionRepsoitory)
);

const userController = new UserController(
  new UserService(
    stockRepository,
    userRepository,
    TransactionRepository,
    orderRepository,
    promotionRepository,
    watchlistRepository,
    sessionRepsoitory,
    notificationRepository
  )
);

dotenv.config();

const router: Router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function generateToken(user: IUser): string {
  const payload = { userId: user._id };
  return jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: "1h",
  });
}

// User authentication routes
router.post("/signup", userController.signup);
router.post("/resendOtp", userController.resendOtp);
router.post("/verifyOtp", userController.verifyOtp);
router.post("/login", userController.login);
router.post("/forgotPassword", userController.forgotPassword);
router.post("/resetPassword", userController.resetPassword);

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
router.post("/checkPortfolio", checkPortfolio);
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

router.post("/create-order", verifyTokenWithRole("user"), (req, res) =>
  paymentController.createOrder(req, res)
);
router.post("/verify-payment", verifyTokenWithRole("user"), (req, res) =>
  paymentController.verifyPayment(req, res)
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

// Google OAuth routes
// router.get(
//   "/auth/google",
//   passport.authenticate("google", {
//     scope: ["profile", "email"], // Request access to the user's profile and email
//   })
// );

// router.get(
//   "/auth/google/callback",
//   passport.authenticate("google", { failureRedirect: "/" }),
//   (req: Request, res: Response) => {
//     res.redirect("/home"); // Redirect on successful authentication
//   }
// );
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

// Google Login API route
router.post(
  "/auth/google/login",
  async (req: Request, res: Response): Promise<void> => {
    const { id_token } = req.body;

    try {
      // Verify the Google token
      const ticket = await client.verifyIdToken({
        idToken: id_token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      const googleId = payload?.sub;
      const email = payload?.email;
      const name = payload?.name;
      const profilePicture = payload?.picture;

      if (!googleId || !email || !name) {
        res.status(400).json({ message: "Invalid token payload" });
        return;
      }

      // Find or create the user
      let user = await User.findOne({ googleId });

      if (!user) {
        user = new User({
          googleId,
          name,
          email,
          profilePicture,
        });
        await user.save();
      }

      // Generate and return a JWT token
      const token = generateToken(user);

      res.json({ token });
    } catch (err) {
      console.error("Error during Google login:", err);
      res.status(500).json({ message: "Something went wrong" });
    }
  }
);

export default router;
