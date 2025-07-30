import session from "../models/sessionModel";
import { ISession } from "../models/interfaces/sessionInterface";
import { ISessionRepository } from "./interfaces/sessionRepoInterface";

export class sessionRepository implements ISessionRepository {
  public async createSession(sessionData: ISession): Promise<ISession> {
    try {
      const newSession = new session(sessionData);

      const savedSession = await newSession.save();

      return savedSession;
    } catch (error: any) {
      throw new Error("Error creating session: " + error.message);
    }
  }

  // Get session by ID
  public async getSessionById(sessionId: string): Promise<ISession | null> {
    try {
      const foundSession = await session.findById(sessionId).exec();
      if (!foundSession) {
        throw new Error("Session not found");
      }
      return foundSession;
    } catch (error: any) {
      throw new Error("Error retrieving session: " + error.message);
    }
  }

  // Update session by ID
  public async updateSession(
    sessionId: string,
    sessionData: Partial<ISession>
  ): Promise<ISession | null> {
    try {
      const updatedSession = await session
        .findByIdAndUpdate(sessionId, sessionData, { new: true })
        .exec();
      if (!updatedSession) {
        throw new Error("Session not found");
      }
      return updatedSession;
    } catch (error: any) {
      throw new Error("Error updating session: " + error.message);
    }
  }

  public async assignStudent(
    sessionId: string,
    student_id: string | undefined
  ): Promise<ISession | null> {
    try {
      const updatedSession = await session.findByIdAndUpdate(
        sessionId, // Assuming course_id matches the session _id
        { student_id: student_id },
        { new: true }
      );
      return updatedSession;
    } catch (error: any) {
      throw new Error("Error updating session: " + error.message);
    }
  }

  // Get all sessions
  public async getAllSessions(): Promise<ISession[]> {
    try {
      return await session.find().exec();
    } catch (error: any) {
      throw new Error("Error retrieving sessions: " + error.message);
    }
  }
  public async getPurchased(userId: string | undefined): Promise<ISession[]> {
    try {
      return await session.find({ student_id: userId }).exec();
    } catch (error: any) {
      throw new Error("Error retrieving sessions: " + error.message);
    }
  }
  public async getActiveSessions(): Promise<ISession[]> {
    try {
      return await session.find({ status: "SCHEDULED" }).exec();
    } catch (error: any) {
      throw new Error("Error retrieving sessions: " + error.message);
    }
  }
  public async updateSessionStatus(
    sessionId: string,
    newStatus: "SCHEDULED" | "COMPLETED" | "CANCELED"
  ): Promise<ISession | null> {
    try {
      // Find the session by ID and update the status
      const updatedSession = await session
        .findByIdAndUpdate(
          sessionId,
          { status: newStatus, updated_at: new Date() }, // Update status and timestamp
          { new: true } // Return the updated session
        )
        .exec();

      if (!updatedSession) {
        throw new Error("Session not found");
      }

      return updatedSession;
    } catch (error: any) {
      throw new Error("Error updating session status: " + error.message);
    }
  }
  async getAssigned(
    Instructoremail: string | undefined
  ): Promise<ISession[] | null> {
    try {
      const sessionData = await session.find({
        instructor_email: Instructoremail,
      });

      return sessionData;
    } catch (error: any) {
      throw new Error("Error finding sessions " + error.message);
    }
  }
}
