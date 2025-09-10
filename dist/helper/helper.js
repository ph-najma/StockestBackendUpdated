"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendResponse = void 0;
exports.isIOrder = isIOrder;
const sendResponse = (res, statusCode, success, message, data = null, error = null) => {
    res.status(statusCode).json({ success, message, data, error });
};
exports.sendResponse = sendResponse;
function isIOrder(order) {
    return order && typeof order.price === "number";
}
