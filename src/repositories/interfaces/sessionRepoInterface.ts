import { ISession } from "../../models/interfaces/sessionInterface";
export interface ISessionRepository {
  createSession(sessionData: ISession): Promise<ISession>;
  getSessionById(sessionId: string): Promise<ISession | null>;
  updateSession(
    sessionId: string,
    sessionData: Partial<ISession>
  ): Promise<ISession | null>;
  getAllSessions(): Promise<ISession[]>;
  updateSessionStatus(
    sessionId: string,
    newStatus: "SCHEDULED" | "COMPLETED" | "CANCELED"
  ): Promise<ISession | null>;
  getActiveSessions(): Promise<ISession[]>;
  assignStudent(
    sessionId: string,
    student_id: string | undefined
  ): Promise<ISession | null>;
  getPurchased(userId: string | undefined): Promise<ISession[]>;
  getAssigned(Instructoremail: string | undefined): Promise<ISession[] | null>;
}
