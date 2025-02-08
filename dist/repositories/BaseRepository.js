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
exports.BaseRepository = void 0;
class BaseRepository {
    constructor(model) {
        this.model = model;
    }
    // Find by ID
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.model.findById(id).exec();
        });
    }
    // Find one
    findOne(filter) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.model.findOne(filter).exec();
        });
    }
    // Find all
    findAll() {
        return __awaiter(this, arguments, void 0, function* (filter = {}) {
            return this.model.find(filter).exec();
        });
    }
    // Create
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const document = new this.model(data);
            return document.save();
        });
    }
    // Update by ID
    updateById(id, updateData) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.model.findByIdAndUpdate(id, updateData, { new: true }).exec();
        });
    }
    // Delete by ID
    deleteById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.model.findByIdAndDelete(id).exec();
        });
    }
}
exports.BaseRepository = BaseRepository;
