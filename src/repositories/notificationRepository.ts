import notificationModel from "../models/notificationModel";
import { INotification } from "../models/interfaces/notificationInterface";
import { INotificationRepository } from "./interfaces/notificationRepoInterface";
import { Model } from "mongoose";

export class NotificationRepository implements INotificationRepository {
  constructor(private notificationModel: Model<INotification>) {}
  async getNotifications(
    userId: string | undefined
  ): Promise<INotification[] | null> {
    return this.notificationModel
      .find({ user: userId })
      .sort({ createdAt: -1 });
  }
  async create(notification: any) {
    return notificationModel.create(notification);
  }
}
