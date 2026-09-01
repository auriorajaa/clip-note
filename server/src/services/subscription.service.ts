import Stripe from "stripe";
import { AppDataSource } from "../config/database.js";
import { User } from "../entities/user.entity.js";
import { SubscriptionPlan } from "../entities/subscription-plan.entity.js";
import { UserSubscription } from "../entities/user-subscription.entity.js";
import { AppError } from "../utils/errors.js";
import { StatusCodes } from "http-status-codes";

export class SubscriptionService {
  private static stripe: Stripe;
  private static userRepository = AppDataSource.getRepository(User);
  private static planRepository = AppDataSource.getRepository(SubscriptionPlan);
  private static subscriptionRepository =
    AppDataSource.getRepository(UserSubscription);

  public static async initialize() {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }

  public static async getPlans() {
    return this.planRepository.find({
      where: { isActive: true },
      order: { price: "ASC" },
    });
  }

  // Get a plan by its ID
  // Returns the plan if found, throws an error if not found
  public static async getPlan(id: string) {
    const plan = await this.planRepository.findOneBy({ id });

    if (!plan) {
      throw new AppError(StatusCodes.NOT_FOUND, "Plan not found");
    }

    return plan;
  }

  // Get the user's active subscription
  // Returns the subscription if found, throws an error if not found
  public static async getUserSubscription(userId: string) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { user: { id: userId }, status: "active" },
      relations: { plan: true },
      order: { createdAt: "DESC" },
    });

    if (!subscription) {
      throw new AppError(StatusCodes.NOT_FOUND, "Subscription not found");
    }

    return subscription;
  }

  
}
