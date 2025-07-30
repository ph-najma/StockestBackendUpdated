import { IUser } from "./userInterface";
export interface ISession extends Document {
  student_id: IUser["_id"] | null;
  instructor_name: string;
  instructorId: string;
  instructor_email: string;
  specialization: string;
  hourly_rate: number;
  start_time: Date;
  end_time: Date;
  status: "SCHEDULED" | "COMPLETED" | "CANCELED";
  created_at: Date;
  updated_at: Date;
  connection_status: "CONNECTED" | "DISCONNECTED" | "NOT CONNECTED";
}
