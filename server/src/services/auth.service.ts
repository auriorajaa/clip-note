import { AppDataSource } from "../config/database.js";
import { User } from "../entities/user.entity.js";
import { AppError } from "../utils/errors.js";
import { StatusCodes } from "http-status-codes";
import crypto from "crypto";
import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import { EmailService } from "./email.service.js";

export class AuthService {
  private static readonly userRepository = AppDataSource.getRepository(User);
  private static readonly JWT_SECRET: Secret =
    process.env.JWT_SECRET || "secret";
  private static readonly JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN ||
    "24h") as NonNullable<SignOptions["expiresIn"]>;

  static async register(email: string, password: string, name?: string) {
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    // Check if certain user already exist before
    if (existingUser) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Invalid credentials");
    }

    // Verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const tokenExpires = new Date();
    tokenExpires.setHours(tokenExpires.getHours() + 24); //  Expires at 24hr

    const user = new User();
    user.email = email;
    user.password = password;
    user.name = name || "";
    user.emailverificationToken = verificationToken;
    user.emailVerificationTokenExpires = tokenExpires;

    await this.userRepository.save(user);

    // Send verification code to user email
    await EmailService.sendVerificationEmail(email, verificationToken);

    const token = this.generateToken(user);

    return { user, token };
  }

  static async login(email: string, password: string) {
    const user = await this.userRepository.findOne({ where: { email } });

    // If certain user is not exist
    if (!user) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Invalid credentials");
    }

    const isPasswordValid = await user.comparePassword(password);

    // If user password is wrong or not valid
    if (!isPasswordValid) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Invalid credentials");
    }

    // Insert current time to lastLogin information on database
    user.lastLogin = new Date();
    await this.userRepository.save(user);

    const token = this.generateToken(user);

    return { user, token };
  }

  static async verifyEmail(token: string) {
    const user = await this.userRepository.findOne({
      where: { emailverificationToken: token },
    });

    if (!user) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Invalid verification token");
    }

    if (
      !user.emailVerificationTokenExpires ||
      user.emailVerificationTokenExpires < new Date()
    ) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Verification token expired");
    }

    user.isEmailVerified = true;
    user.emailverificationToken = null;
    user.emailVerificationTokenExpires = null;
    await this.userRepository.save(user);

    // Send welcome email
    await EmailService.sendWelcomeEmail(user.email, user.name);

    return { message: "Email verified successfully!" };
  }

  static async resendVerificationEmail(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new AppError(StatusCodes.BAD_REQUEST, "User not found");
    }

    if (user.isEmailVerified) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Email already verified");
    }

    // Create a New Verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const tokenExpires = new Date();
    tokenExpires.setHours(tokenExpires.getHours() + 24); //  Expires at 24hr

    user.emailverificationToken = verificationToken;
    user.emailVerificationTokenExpires = tokenExpires;
    await this.userRepository.save(user);

    await EmailService.sendVerificationEmail(email, verificationToken);

    return { message: "Verification email sent" };
  }

  static generateToken(user: User): string {
    return jwt.sign({ userId: user.id, email: user.email }, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
    });
  }

  static verifyToken(token: string): { userId: string; email: string } {
    try {
      return jwt.verify(token, this.JWT_SECRET) as {
        userId: string;
        email: string;
      };
    } catch (error) {
      throw new AppError(StatusCodes.UNAUTHORIZED, "Invalid token");
    }
  }

  static async getUserById(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: { videos: true },
    });

    if (!user) {
      throw new AppError(StatusCodes.NOT_FOUND, "User not found");
    }

    return user;
  }
}
