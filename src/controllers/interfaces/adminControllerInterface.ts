import { Request, Response } from "express";
export interface IAdminController {
  login(req: Request, res: Response): Promise<void>;
  getUserList(req: Request, res: Response): Promise<void>;
  disableUser(req: Request, res: Response): Promise<void>;
  getStockList(req: Request, res: Response): Promise<void>;
  getAllOrders(req: Request, res: Response): Promise<void>;
  getLimitOrders(req: Request, res: Response): Promise<void>;
  getMarketOrders(req: Request, res: Response): Promise<void>;
  getMatchedOrders(req: Request, res: Response): Promise<void>;
  getOrderDetails(req: Request, res: Response): Promise<void>;
  getAllTransactions(req: Request, res: Response): Promise<void>;
  getUserPortfolio(req: Request, res: Response): Promise<void>;
  getTotalFeesCollected(req: Request, res: Response): Promise<void>;
  cancelOrder(req: Request, res: Response): Promise<void>;
  updateLimit(req: Request, res: Response): Promise<void>;
  getLimits(req: Request, res: Response): Promise<void>;
  CreatePromotions(req: Request, res: Response): Promise<void>;
  createSession(req: Request, res: Response): Promise<void>;
  getAllSessions(req: Request, res: Response): Promise<void>;
  getSessionById(req: Request, res: Response): Promise<void>;
  updateSessionData(req: Request, res: Response): Promise<void>;
  cancelSession(req: Request, res: Response): Promise<void>;
  getDashboardSummary(req: Request, res: Response): Promise<void>;
}
