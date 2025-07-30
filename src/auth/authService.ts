import { AuthRepository } from "./authRepository";
import { IUser } from "../models/interfaces/userInterface";

export class AuthService {
  public authRepository: AuthRepository;

  constructor() {
    this.authRepository = new AuthRepository();
  }

  async handleGoogleLogin(profile: any): Promise<IUser> {
    const email = profile.emails?.[0]?.value;
    if (!email) throw new Error("Email not found in Google profile");

    let user = await this.authRepository.findUserByGoogleId(profile.id);
    if (!user) {
      user = await this.authRepository.createUser({
        googleId: profile.id,
        name: profile.displayName,
        email,
        profilePhoto: profile.photos?.[0]?.value,
      });
    }
    return user;
  }
}
