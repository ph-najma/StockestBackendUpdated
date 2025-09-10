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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const dotenv_1 = __importDefault(require("dotenv"));
const dependencyInjection_1 = require("../dependencyInjection");
dotenv_1.default.config();
const googleStrategyOptions = {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.CALL_BACK_URL,
};
passport_1.default.use(new passport_google_oauth20_1.Strategy(googleStrategyOptions, (_, __, profile, done) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield dependencyInjection_1.userService.handleGoogleLogin(profile);
        return done(null, user);
    }
    catch (err) {
        return done(err);
    }
})));
passport_1.default.serializeUser(((user, done) => {
    done(null, user._id);
}));
passport_1.default.deserializeUser((id, done) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield dependencyInjection_1.userService.getUserProfile(id);
        done(null, user);
    }
    catch (err) {
        done(err);
    }
}));
exports.default = passport_1.default;
