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
exports.WatchlistRepostory = void 0;
class WatchlistRepostory {
    constructor(watchlistModel) {
        this.watchlistModel = watchlistModel;
    }
    getByUserId(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!userId) {
                console.error("User ID is undefined");
                return null;
            }
            // Fetch the watchlist
            const watchlist = yield this.watchlistModel
                .findOne({ user: userId })
                .lean();
            if (!watchlist) {
                return null;
            }
            return watchlist;
        });
    }
    ensureWatchlistAndAddStock(userId, stockSymbol) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!userId) {
                throw new Error("User ID is required.");
            }
            let watchlist = yield this.watchlistModel.findOne({ user: userId });
            if (watchlist) {
                const stockExists = watchlist.stocks.some((stock) => stock.symbol === stockSymbol);
                if (!stockExists) {
                    watchlist.stocks.push({ symbol: stockSymbol, addedAt: new Date() });
                    yield watchlist.save();
                }
            }
            else {
                watchlist = new this.watchlistModel({
                    user: userId,
                    stocks: [{ symbol: stockSymbol, addedAt: new Date() }],
                });
                yield watchlist.save();
            }
            return watchlist;
        });
    }
}
exports.WatchlistRepostory = WatchlistRepostory;
