import type { Request, Response, NextFunction } from "express";
import Stripe from "stripe";
import { SubscriptionService } from "../services/subscription.service.js";
import { StatusCodes } from "http-status-codes";
import { errorResponse, successResponse } from "../utils/response.js";

export class SubscriptionController {
  // Used only for verifying webhook signatures — separate from the
  // Stripe instance inside SubscriptionService.
  private static stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  // GET /subscriptions/plans
  static async getPlans(req: Request, res: Response, next: NextFunction) {
    try {
      const plans = await SubscriptionService.getPlans();
      return res.status(StatusCodes.OK).json(successResponse(plans));
    } catch (error) {
      next(error);
    }
  }

  // GET /subscriptions/plans/:id
  static async getPlan(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.params;
      const plan = await SubscriptionService.getPlan(id);
      return res.status(StatusCodes.OK).json(successResponse(plan));
    } catch (error) {
      next(error);
    }
  }

  // GET /subscriptions/me
  static async getUserSubscription(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId = req.user!.userId;
      const subscription =
        await SubscriptionService.getUserSubscription(userId);
      return res.status(StatusCodes.OK).json(successResponse(subscription));
    } catch (error) {
      next(error);
    }
  }

  // POST /subscriptions/checkout
  static async createCheckoutSession(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId = req.user!.userId;
      const { planId } = req.body;

      if (!planId) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json(errorResponse("planId is required"));
      }

      const result = await SubscriptionService.createCheckoutSession(
        userId,
        planId,
      );
      return res.status(StatusCodes.OK).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  // POST /subscriptions/cancel
  static async cancelSubscription(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId = req.user!.userId;
      const result = await SubscriptionService.cancelSubscription(userId);
      return res.status(StatusCodes.OK).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  // POST /subscriptions/webhook
  static async handleWebhook(req: Request, res: Response, next: NextFunction) {
    // Important: req.body must be a raw buffer for Stripe signature verification.
    // This is handled by the express.raw middleware applied in the route.
    const signature = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json(errorResponse("Missing Stripe signature or webhook secret"));
    }

    let event: Stripe.Event;

    try {
      event = SubscriptionController.stripe.webhooks.constructEvent(
        req.body,
        signature,
        webhookSecret,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json(
          errorResponse(`Webhook signature verification failed: ${message}`),
        );
    }

    try {
      const result = await SubscriptionService.handleWebhook(event);
      return res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }
}
