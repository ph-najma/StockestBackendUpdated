import express, { Router } from "express";
import { verifyTokenWithRole } from "../middleware/auth";
import { AdminController } from "../controllers/adminController";
import { AdminService } from "../services/adminService";
import { UserRepository } from "../repositories/userRepository";
import { limitRepository } from "../repositories/limitRepository";
import { StockRepository } from "../repositories/stockRepository";
import { OrderRepository } from "../repositories/orderRepository";
import { transactionRepository } from "../repositories/transactionRepository";
import { PromotionRepository } from "../repositories/promotionRepository";
import { sessionRepository } from "../repositories/sessionRepository";
import orderModel from "../models/orderModel";
import { IOrder } from "../models/interfaces/orderInterface";
import { Model } from "mongoose";
const userRepository = new UserRepository();
const LimitRepository = new limitRepository();
const orderRepository = new OrderRepository(orderModel as Model<IOrder>);
const stockRepository = new StockRepository();
const promotionRepository = new PromotionRepository();
const TransactionRepository = new transactionRepository();
const SessionRepository = new sessionRepository();
const adminController = new AdminController(
  new AdminService(
    userRepository,
    LimitRepository,
    orderRepository,
    stockRepository,
    TransactionRepository,
    promotionRepository,
    SessionRepository
  )
);
const router: Router = express.Router();

router.post("/adminLogin", adminController.login);
router.get(
  "/adminHome",
  verifyTokenWithRole("admin"),
  adminController.getDashboardSummary
);
router.get(
  "/userList",
  verifyTokenWithRole("admin"),
  adminController.getUserList
);
router.post(
  "/disableUser/:id",
  verifyTokenWithRole("admin"),
  adminController.disableUser
);

router.get(
  "/stocklist",
  verifyTokenWithRole("admin"),
  adminController.getStockList
);

router.get(
  "/orders",
  verifyTokenWithRole("admin"),
  adminController.getAllOrders
);
router.get(
  "/limitorders",
  verifyTokenWithRole("admin"),
  adminController.getLimitOrders
);
router.get(
  "/marketorders",
  verifyTokenWithRole("admin"),
  adminController.getMarketOrders
);
router.get("/matchedorders", adminController.getMatchedOrders);
router.get(
  "/orderDetails/:orderId",
  verifyTokenWithRole("admin"),
  adminController.getOrderDetails
);
router.get(
  "/allTransactions",
  verifyTokenWithRole("admin"),
  adminController.getAllTransactions
);
router.get(
  "/userPortfolio/:userId",
  verifyTokenWithRole("admin"),
  adminController.getUserPortfolio
);
router.get(
  "/getFees",
  verifyTokenWithRole("admin"),
  adminController.getTotalFeesCollected
);
router.post(
  "/changeStatus/:orderId",
  verifyTokenWithRole("admin"),
  adminController.cancelOrder
);
router.post(
  "/updateLimit",
  verifyTokenWithRole("admin"),
  adminController.updateLimit
);
router.post(
  "/createSession",
  verifyTokenWithRole("admin"),
  adminController.createSession
);
router.post("/createPromotions", adminController.CreatePromotions);
router.get("/limit", verifyTokenWithRole("admin"), adminController.getLimits);
router.get(
  "/getSessions",
  verifyTokenWithRole("admin"),
  adminController.getAllSessions
);
router.get(
  "/getSessionById/:sessionId",
  verifyTokenWithRole("admin"),
  adminController.getSessionById
);
router.post(
  "/updateSession/:sessionId",
  verifyTokenWithRole("admin"),
  adminController.updateSessionData
);
router.post(
  "/cancelSession/:id",
  verifyTokenWithRole("admin"),
  adminController.cancelSession
);
export default router;
