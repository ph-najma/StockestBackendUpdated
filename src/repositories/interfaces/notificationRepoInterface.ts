import { INotification } from "../../models/interfaces/notificationInterface";
export interface INotificationRepository {
  getNotifications(userId: string | undefined): Promise<INotification[] | null>;
  create(notification: any): Promise<any>;
}
