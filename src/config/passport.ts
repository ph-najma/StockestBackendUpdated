import passport from "passport";
import {
  Strategy as GoogleStrategy,
  StrategyOptions,
} from "passport-google-oauth20";
import dotenv from "dotenv";
// import { AuthService } from "../auth/authService";
import { IUser } from "../models/interfaces/userInterface";
import { userService } from "../dependencyInjection";
import { UserRepository } from "../repositories/userRepository";
dotenv.config();

const googleStrategyOptions: StrategyOptions = {
  clientID: process.env.GOOGLE_CLIENT_ID as string,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
  callbackURL: process.env.CALL_BACK_URL,
};

passport.use(
  new GoogleStrategy(googleStrategyOptions, async (_, __, profile, done) => {
    try {
      const user = await userService.handleGoogleLogin(profile);
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

passport.serializeUser(((
  user: IUser,
  done: (err: any, id?: unknown) => void
) => {
  done(null, user._id);
}) as (user: Express.User, done: (err: any, id?: unknown) => void) => void);

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await userService.getUserProfile(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

export default passport;
