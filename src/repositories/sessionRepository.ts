import session from "../models/sessionModel";
import { ISession } from "../models/interfaces/sessionInterface";
import { ISessionRepository } from "./interfaces/sessionRepoInterface";
import { Model } from "mongoose";

export class SessionRepository implements ISessionRepository {
  constructor(private SessionModel: Model<ISession>) {}
  async createSession(sessionData: ISession): Promise<ISession> {
    const newSession = new this.SessionModel(sessionData);
    return newSession.save();
  }

  // Get session by ID
  async getSessionById(sessionId: string): Promise<ISession | null> {
    return this.SessionModel.findById(sessionId).exec();
  }
  // Update session by ID
  async updateSession(
    sessionId: string,
    sessionData: Partial<ISession>
  ): Promise<ISession | null> {
    return this.SessionModel.findByIdAndUpdate(sessionId, sessionData, {
      new: true,
    }).exec();
  }

  async assignStudent(
    sessionId: string,
    studentId: string | undefined
  ): Promise<ISession | null> {
    return this.SessionModel.findByIdAndUpdate(
      sessionId,
      { student_id: studentId },
      { new: true }
    ).exec();
  }

  async getAllSessions(): Promise<ISession[]> {
    return this.SessionModel.find().exec();
  }

  async getPurchased(userId: string | undefined): Promise<ISession[]> {
    return this.SessionModel.find({ student_id: userId }).exec();
  }
  async getActiveSessions(): Promise<ISession[]> {
    return this.SessionModel.find({ status: "SCHEDULED" }).exec();
  }

  async updateSessionStatus(
    sessionId: string,
    newStatus: "SCHEDULED" | "COMPLETED" | "CANCELED"
  ): Promise<ISession | null> {
    return this.SessionModel.findByIdAndUpdate(
      sessionId,
      { status: newStatus, updated_at: new Date() },
      { new: true }
    ).exec();
  }
  async getAssigned(instructorEmail: string | undefined): Promise<ISession[]> {
    return this.SessionModel.find({ instructor_email: instructorEmail }).exec();
  }
}
