// import { INotificationRepository } from "../repositories/interfaces/notificationRepoInterface";
// import { sendEmail } from "../utils/sendEmail";
// import { Server } from "socket.io";
// import mongoose from "mongoose";

// export class NotificationService {
//   constructor(
//     private readonly notificationRepo: INotificationRepository,

//     private readonly io: Server
//   ) {}

//   async notifyUser(userId: string, message: string, email?: string) {
//     await this.notificationRepo.create({
//       user: userId, // string is fine now
//       message,
//     });

//     this.io.emit("notification", { userId, message });
//     if (email) {
//       await sendEmail(email, "Trade Notification", message);
//     }
//   }
// }
