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
exports.StockRepository = void 0;
class StockRepository {
    constructor(stockModel) {
        this.stockModel = stockModel;
    }
    getAllStocks() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.stockModel.aggregate([
                { $sort: { timestamp: -1 } },
                {
                    $group: {
                        _id: "$symbol",
                        latest: { $first: "$$ROOT" },
                    },
                },
                { $replaceRoot: { newRoot: "$latest" } },
            ]);
        });
    }
    // Create a new stock
    createStock(stockData) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.stockModel.create(stockData);
        });
    }
    // Fetch a single stock by ID
    getStockById(stockId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.stockModel.findById(stockId).exec();
        });
    }
    updateStock(stockId, updatedData) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.stockModel
                .findByIdAndUpdate(stockId, updatedData, { new: true })
                .exec();
        });
    }
    // Delete a stock by ID
    deleteStock(stockId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.stockModel.findByIdAndDelete(stockId).exec();
        });
    }
    getMarketPrice(symbol) {
        return __awaiter(this, void 0, void 0, function* () {
            const stockData = yield this.stockModel
                .findOne({ symbol })
                .sort({ timestamp: -1 })
                .exec();
            return stockData ? stockData.price : null;
        });
    }
    getStockData(symbol) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.stockModel
                .find({ symbol })
                .sort({ timestamp: 1 })
                .limit(10)
                .exec();
        });
    }
    searchStocks(query) {
        return __awaiter(this, void 0, void 0, function* () {
            const filters = {};
            if (query.symbol)
                filters.symbol = { $regex: query.symbol, $options: "i" };
            if (query.timestamp)
                filters.timestamp = query.timestamp;
            if (query.price)
                filters.price = query.price;
            if (query.change)
                filters.change = query.change;
            return this.stockModel.aggregate([
                { $match: filters },
                { $sort: { timestamp: -1 } },
                { $group: { _id: "$symbol", latest: { $first: "$$ROOT" } } },
                { $replaceRoot: { newRoot: "$latest" } },
            ]);
        });
    }
    save(stock) {
        return __awaiter(this, void 0, void 0, function* () {
            return stock.save();
        });
    }
}
exports.StockRepository = StockRepository;
