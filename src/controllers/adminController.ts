import { Request, Response } from "express";
import { IAdminService } from "../services/interfaces/adminServiceInterface";
import Order from "../models/orderModel";
import transactionModel from "../models/transactionModel";
import { ILimitOrderQuery } from "../interfaces/Interfaces";
import mongoose from "mongoose";
import { HttpStatusCode } from "../interfaces/Interfaces";
import { IAdminController } from "./interfaces/adminControllerInterface";
import { sendResponse } from "../helper/helper";
import { MESSAGES } from "../helper/Message";

export const ERROR_MESSAGES = {
  BAD_REQUEST: "Bad Request",
};

export class AdminController implements IAdminController {
  private adminService: IAdminService;

  constructor(adminService: IAdminService) {
    this.adminService = adminService;
  }

  // Admin Login
  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;
      const { token } = await this.adminService.loginAdmin(email, password);
      sendResponse(res, HttpStatusCode.OK, true, MESSAGES.LOGIN_SUCCESS, {
        token,
      });
    } catch (error: any) {
      sendResponse(
        res,
        HttpStatusCode.BAD_REQUEST,
        false,
        error.message,
        null,
        error
      );
    }
  };

  // Get User List
  public getUserList = async (req: Request, res: Response): Promise<void> => {
    try {
      const usersData = await this.adminService.getUserList();
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;
      const skip = (page - 1) * limit;
      const totalUsers = await this.adminService.countUsers();
      sendResponse(res, HttpStatusCode.OK, true, MESSAGES.USERS_RETRIEVED, {
        usersData,
        totalUsers,
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
      });
    } catch (error: any) {
      sendResponse(
        res,
        HttpStatusCode.BAD_REQUEST,
        false,
        error.message,
        null,
        error
      );
    }
  };

  // Disable User
  public disableUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.params.id;
      const token = req.headers.authorization?.split(" ")[1];
      const result = await this.adminService.toggleUserBlockStatus(
        userId,
        token
      );
      sendResponse(
        res,
        HttpStatusCode.OK,
        true,
        MESSAGES.USER_DISABLED,
        result
      );
    } catch (error: any) {
      sendResponse(
        res,
        HttpStatusCode.BAD_REQUEST,
        false,
        error.message,
        null,
        error
      );
    }
  };

  // Get Stock List
  public getStockList = async (req: Request, res: Response): Promise<void> => {
    try {
      const stocks = await this.adminService.getAllStocks();

      sendResponse(res, HttpStatusCode.OK, true, MESSAGES.STOCK_LIST, stocks);
    } catch (error: any) {
      sendResponse(
        res,
        HttpStatusCode.BAD_REQUEST,
        false,
        error.message,
        null,
        error
      );
    }
  };

  // Get All Orders
  public getAllOrders = async (req: Request, res: Response): Promise<void> => {
    try {
      const orders = await this.adminService.getAllOrders();

      sendResponse(res, HttpStatusCode.OK, true, MESSAGES.ALL_ORDERS, orders);
    } catch (error: any) {
      sendResponse(
        res,
        HttpStatusCode.BAD_REQUEST,
        false,
        error.message,
        null,
        error
      );
    }
  };

  // Get Limit Orders
  public getLimitOrders = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { status, user, dateRange } = req.query;
      const query: ILimitOrderQuery = { orderType: "LIMIT" };

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
        const date = new Date(dateRange as string);
        query.createdAt = {
          $gte: new Date(date.setHours(0, 0, 0, 0)),
          $lte: new Date(date.setHours(23, 59, 59, 999)),
        };
      }

      const orders = await this.adminService.getLimitOrders(query);

      sendResponse(res, HttpStatusCode.OK, true, MESSAGES.LIMIT_ORDERS, orders);
    } catch (error: any) {
      sendResponse(
        res,
        HttpStatusCode.BAD_REQUEST,
        false,
        error.message,
        null,
        error
      );
    }
  };

  // Get Market Orders
  public getMarketOrders = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { status, user, dateRange } = req.query;
      const query: ILimitOrderQuery = { orderType: "MARKET" };

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
        const date = new Date(dateRange as string);
        query.createdAt = {
          $gte: new Date(date.setHours(0, 0, 0, 0)),
          $lte: new Date(date.setHours(23, 59, 59, 999)),
        };
      }

      const orders = await this.adminService.getMarketOrders(query);

      sendResponse(
        res,
        HttpStatusCode.OK,
        true,
        MESSAGES.MARKET_ORDERS,
        orders
      );
    } catch (error: any) {
      sendResponse(
        res,
        HttpStatusCode.BAD_REQUEST,
        false,
        error.message,
        null,
        error
      );
    }
  };

  // Matched Orders
  public getMatchedOrders = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const orders = await Order.find({ status: "COMPLETED" })
        .populate("user", "name")
        .populate("stock", "symbol")
        .exec();

      sendResponse(
        res,
        HttpStatusCode.OK,
        true,
        MESSAGES.MATCHED_ORDERS,
        orders
      );
    } catch (error: any) {
      sendResponse(
        res,
        HttpStatusCode.BAD_REQUEST,
        false,
        error.message,
        null,
        error
      );
    }
  };

  // Get Order Details
  public getOrderDetails = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const orderId = req.params.orderId;
      const order = await Order.findById(orderId)
        .populate("user")
        .populate("stock")
        .exec();
      const transactions = await transactionModel
        .find({ $or: [{ buyOrder: orderId }, { sellOrder: orderId }] })
        .populate("buyer seller")
        .populate("stock")
        .exec();

      if (!order) {
        res
          .status(HttpStatusCode.NOT_FOUND)
          .json({ message: "Order not found" });
      } else {
        sendResponse(res, HttpStatusCode.OK, true, MESSAGES.ORDER_DETAILS, {
          order,
          transactions,
        });
      }
    } catch (error: any) {
      sendResponse(
        res,
        HttpStatusCode.BAD_REQUEST,
        false,
        error.message,
        null,
        error
      );
    }
  };
  public getAllTransactions = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const transactions = await this.adminService.getAllTransactions();

      sendResponse(
        res,
        HttpStatusCode.OK,
        true,
        MESSAGES.TRANSACTIONS_RETRIEVED,
        transactions
      );
    } catch (error: any) {
      sendResponse(
        res,
        HttpStatusCode.BAD_REQUEST,
        false,
        error.message,
        null,
        error
      );
    }
  };

  public getUserPortfolio = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const userId = req.params.userId;

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        res.status(400).json({ message: "Invalid User ID format" });
      }
      const portfolio = await this.adminService.getUserPortfolio(userId);

      sendResponse(
        res,
        HttpStatusCode.OK,
        true,
        MESSAGES.USER_PORTFOLIO,
        portfolio
      );
    } catch (error: any) {
      sendResponse(
        res,
        HttpStatusCode.BAD_REQUEST,
        false,
        error.message,
        null,
        error
      );
    }
  };
  public getTotalFeesCollected = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const fees = await this.adminService.getTotalFeesCollected();

      sendResponse(
        res,
        HttpStatusCode.OK,
        true,
        MESSAGES.TOTAL_FEES_COLLECTED,
        fees
      );
    } catch (error: any) {
      sendResponse(
        res,
        HttpStatusCode.BAD_REQUEST,
        false,
        error.message,
        null,
        error
      );
    }
  };
  public cancelOrder = async (req: Request, res: Response): Promise<void> => {
    try {
      const orderId = req.params.orderId;

      const updatedOrder = await this.adminService.cancelOrder(orderId);

      sendResponse(
        res,
        HttpStatusCode.OK,
        true,
        MESSAGES.ORDER_DETAILS,
        updatedOrder
      );
    } catch (error: any) {
      sendResponse(
        res,
        HttpStatusCode.BAD_REQUEST,
        false,
        error.message,
        null,
        error
      );
    }
  };
  public updateLimit = async (req: Request, res: Response): Promise<void> => {
    try {
      const limitData = req.body;

      const updatedLimit = await this.adminService.updateLimit(limitData);

      sendResponse(
        res,
        HttpStatusCode.OK,
        true,
        MESSAGES.UPDATE_LIMIT,
        updatedLimit
      );
    } catch (error: any) {
      sendResponse(
        res,
        HttpStatusCode.BAD_REQUEST,
        false,
        error.message,
        null,
        error
      );
    }
  };
  public getLimits = async (req: Request, res: Response): Promise<void> => {
    try {
      const limits = await this.adminService.getLimits();

      sendResponse(
        res,
        HttpStatusCode.OK,
        true,
        MESSAGES.CURRENT_LIMIT,
        limits
      );
    } catch (error: any) {
      sendResponse(
        res,
        HttpStatusCode.BAD_REQUEST,
        false,
        error.message,
        null,
        error
      );
    }
  };
  public CreatePromotions = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const promotions = await this.adminService.CreatePromotions(req.body);

      sendResponse(
        res,
        HttpStatusCode.OK,
        true,
        MESSAGES.PROMOTION_CREATED,
        promotions
      );
    } catch (error: any) {
      sendResponse(
        res,
        HttpStatusCode.BAD_REQUEST,
        false,
        error.message,
        null,
        error
      );
    }
  };
  public createSession = async (req: Request, res: Response): Promise<void> => {
    try {
      const session = await this.adminService.createSsession(req.body);

      sendResponse(
        res,
        HttpStatusCode.OK,
        true,
        MESSAGES.SESSION_CREATED,
        session
      );
    } catch (error: any) {
      sendResponse(
        res,
        HttpStatusCode.BAD_REQUEST,
        false,
        error.message,
        null,
        error
      );
    }
  };
  public getAllSessions = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const sessions = await this.adminService.getAllSessions();

      sendResponse(
        res,
        HttpStatusCode.OK,
        true,
        MESSAGES.SESSION_RETRIEVED,
        sessions
      );
    } catch (error: any) {
      sendResponse(
        res,
        HttpStatusCode.BAD_REQUEST,
        false,
        error.message,
        null,
        error
      );
    }
  };
  public getSessionById = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const sessionId = req.params.sessionId;
      const session = await this.adminService.getSessionById(sessionId);

      sendResponse(
        res,
        HttpStatusCode.OK,
        true,
        MESSAGES.SESSION_RETRIEVED,
        session
      );
    } catch (error: any) {
      sendResponse(
        res,
        HttpStatusCode.BAD_REQUEST,
        false,
        error.message,
        null,
        error
      );
    }
  };
  public updateSessionData = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const sessionId = req.params.sessionId;
      const updatedSession = await this.adminService.updateSessionData(
        sessionId,
        req.body
      );

      sendResponse(
        res,
        HttpStatusCode.OK,
        true,
        MESSAGES.SESSION_CREATED,
        updatedSession
      );
    } catch (error: any) {
      sendResponse(
        res,
        HttpStatusCode.BAD_REQUEST,
        false,
        error.message,
        null,
        error
      );
    }
  };
  public cancelSession = async (req: Request, res: Response): Promise<void> => {
    try {
      const sessionId = req.params.id;
      const { status } = req.body;

      const updatedSession = await this.adminService.cancelSession(
        sessionId,
        status
      );

      sendResponse(
        res,
        HttpStatusCode.OK,
        true,
        MESSAGES.SESSION_CANCELLED,
        updatedSession
      );
    } catch (error: any) {
      sendResponse(
        res,
        HttpStatusCode.BAD_REQUEST,
        false,
        error.message,
        null,
        error
      );
    }
  };
  public getDashboardSummary = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const summary = await this.adminService.getAdminDashboard();
      sendResponse(res, HttpStatusCode.OK, true, MESSAGES.SUMMARY, summary);
    } catch (error: any) {
      sendResponse(
        res,
        HttpStatusCode.BAD_REQUEST,
        false,
        error.message,
        null,
        error
      );
    }
  };
}
