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
exports.limitRepository = void 0;
class limitRepository {
    constructor(limitModel) {
        this.limitModel = limitModel;
    }
    updateLimit(limitData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const limit = yield this.limitModel
                    .findOneAndUpdate({}, limitData, {
                    new: true,
                    upsert: true,
                })
                    .exec();
                return limit;
            }
            catch (error) {
                throw new Error(`Failed to update limits: ${error.message}`);
            }
        });
    }
    getLimits() {
        return __awaiter(this, void 0, void 0, function* () {
            const limit = yield this.limitModel.findOne();
            return limit;
        });
    }
}
exports.limitRepository = limitRepository;
