import { AdminController } from "./controllers/adminController";
import { AdminService } from "./services/adminService";
import { UserController } from "./controllers/userController";
import { UserService } from "./services/userService";
import { PaymentController } from "./controllers/paymentController";
import { PaymentService } from "./services/paymentServices";
import { OrderMatchingService } from "./services/orderMatchingService";
import { Server } from "socket.io";
// repositories
import { UserRepository } from "./repositories/userRepository";
import { limitRepository } from "./repositories/limitRepository";
import { OrderRepository } from "./repositories/orderRepository";
import { StockRepository } from "./repositories/stockRepository";
import { TransactionRepository } from "./repositories/transactionRepository";
import { PromotionRepository } from "./repositories/promotionRepository";
import { SessionRepository } from "./repositories/sessionRepository";
import { WatchlistRepostory } from "./repositories/watchlistRepsoitory";
import { PaymentRepository } from "./repositories/paymentRepository";
// models
import userModel from "./models/userModel";
import stockModel from "./models/stockModel";
import promotionModel from "./models/promoModel";
import sessionModel from "./models/sessionModel";
import orderModel from "./models/orderModel";
import Watchlist from "./models/watchlistModel";
import Limit from "./models/limitModel";
import transactionModel from "./models/transactionModel";
import { IOrder } from "./models/interfaces/orderInterface";
import { Model } from "mongoose";
import { NotificationRepository } from "./repositories/notificationRepository";
import notificationModel from "./models/notificationModel";
import { io } from "./server";

// ---------- Repositories ----------
const userRepository = new UserRepository(userModel);
const limitRepo = new limitRepository(Limit);
const orderRepository = new OrderRepository(orderModel as Model<IOrder>);
const stockRepository = new StockRepository(stockModel);
const promotionRepository = new PromotionRepository(promotionModel);
const transactionRepository = new TransactionRepository(transactionModel);
const sessionRepository = new SessionRepository(sessionModel);
const watchlistRepsoitory = new WatchlistRepostory(Watchlist);
const notificationRepository = new NotificationRepository(notificationModel);
const paymentRepository = new PaymentRepository();

// ---------- Services ----------
const adminService = new AdminService(
  userRepository,
  limitRepo,
  orderRepository,
  stockRepository,
  transactionRepository,
  promotionRepository,
  sessionRepository
);
export const userService = new UserService(
  stockRepository,
  userRepository,
  transactionRepository,
  orderRepository,
  promotionRepository,
  watchlistRepsoitory,
  sessionRepository,
  notificationRepository
);
const paymentService = new PaymentService(
  paymentRepository,
  userRepository,
  sessionRepository
);

export const orderMatchingService = new OrderMatchingService(
  orderRepository,
  stockRepository,
  userRepository,
  transactionRepository,
  notificationRepository,
  io
);
export const paymentController = new PaymentController(paymentService);
export const adminController = new AdminController(adminService);
export const userController = new UserController(userService);
