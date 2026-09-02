import type { Request, Response, NextFunction } from "express";
import { SubscriptionService } from "../services/subscription.service.js";
import { StatusCodes } from "http-status-codes";
import { errorResponse } from "../utils/response.js";

export const requiresSubscription = (tier: "basic" | "pro" | "business") => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id;

      const subscription =
        await SubscriptionService.getUserSubscription(userId);

      // Check if the user has an active subscription
      // If not, return a 402 Payment Required error
      if (!subscription) {
        return res
          .status(StatusCodes.PAYMENT_REQUIRED)
          .json(
            errorResponse(
              `This feature requires a ${tier} subscription. Please upgrade to continue.`,
            ),
          );
      }

      // Check subscription tier
      const planName = subscription.plan.name.toLowerCase();

      // Check if the user has the required subscription tier
      // If not, return a 402 Payment Required error
      // If the user has the required tier, proceed to the next middleware
      if (
        tier === "basic" &&
        !["basic", "pro", "business"].includes(planName)
      ) {
        return res
          .status(StatusCodes.PAYMENT_REQUIRED)
          .json(
            errorResponse(
              `This feature requires at least basic subscription. Please upgrade to continue.`,
            ),
          );
      } else if (tier === "pro" && !["pro", "business"].includes(planName)) {
        return res
          .status(StatusCodes.PAYMENT_REQUIRED)
          .json(
            errorResponse(
              `This feature requires at least pro subscription. Please upgrade to continue.`,
            ),
          );
      } else if (tier === "business" && planName !== "business") {
        return res
          .status(StatusCodes.PAYMENT_REQUIRED)
          .json(
            errorResponse(
              `This feature requires at least business subscription. Please upgrade to continue.`,
            ),
          );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
