import notificationModel from "../models/notificationModel";
import { INotification } from "../interfaces/modelInterface";
import { INotificationRepository } from "./interfaces/notificationRepoInterface";

export class NotificationRepository implements INotificationRepository {
  async getNotifications(
    userId: string | undefined
  ): Promise<INotification[] | null> {
    return notificationModel.find({ user: userId }).sort({ createdAt: -1 });
  }
}
