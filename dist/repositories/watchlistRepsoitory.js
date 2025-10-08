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
                .populate("stocks") // 👈 populates stock details from Stock model
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
                const stockExists = watchlist.stocks.some((s) => s.symbol.toString() === stockSymbol.toString());
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
    removeStockFromWatchlist(userId, stockSymbol) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!userId) {
                throw new Error("User ID is required.");
            }
            // Find user's watchlist
            const watchlist = yield this.watchlistModel.findOne({ user: userId });
            if (!watchlist) {
                throw new Error("Watchlist not found.");
            }
            console.log("Watchlist stocks before removal:", watchlist.stocks);
            console.log("Trying to remove symbol:", stockSymbol);
            // ✅ FIX: use `symbol`, not `stock`
            const updatedStocks = watchlist.stocks.filter((s) => s.symbol !== stockSymbol);
            if (updatedStocks.length === watchlist.stocks.length) {
                throw new Error(`Stock ${stockSymbol} not found in watchlist.`);
            }
            watchlist.stocks = updatedStocks;
            yield watchlist.save();
            return watchlist;
        });
    }
}
exports.WatchlistRepostory = WatchlistRepostory;
