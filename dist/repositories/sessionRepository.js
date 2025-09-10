"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionRepository = void 0;
class SessionRepository {
    constructor(SessionModel) {
        this.SessionModel = SessionModel;
    }
    createSession(sessionData) {
        return __awaiter(this, void 0, void 0, function* () {
            const newSession = new this.SessionModel(sessionData);
            return newSession.save();
        });
    }
    // Get session by ID
    getSessionById(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.SessionModel.findById(sessionId).exec();
        });
    }
    // Update session by ID
    updateSession(sessionId, sessionData) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.SessionModel.findByIdAndUpdate(sessionId, sessionData, {
                new: true,
            }).exec();
        });
    }
    assignStudent(sessionId, studentId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.SessionModel.findByIdAndUpdate(sessionId, { student_id: studentId }, { new: true }).exec();
        });
    }
    getAllSessions() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.SessionModel.find().exec();
        });
    }
    getPurchased(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.SessionModel.find({ student_id: userId }).exec();
        });
    }
    getActiveSessions() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.SessionModel.find({ status: "SCHEDULED" }).exec();
        });
    }
    updateSessionStatus(sessionId, newStatus) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.SessionModel.findByIdAndUpdate(sessionId, { status: newStatus, updated_at: new Date() }, { new: true }).exec();
        });
    }
    getAssigned(instructorEmail) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.SessionModel.find({ instructor_email: instructorEmail }).exec();
        });
    }
}
exports.SessionRepository = SessionRepository;
