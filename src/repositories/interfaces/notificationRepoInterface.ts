import { INotification } from "../../interfaces/modelInterface";
export interface INotificationRepository {
  getNotifications(userId: string | undefined): Promise<INotification[] | null>;
}
