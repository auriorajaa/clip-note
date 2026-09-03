import { Router } from "express";
import express from "express";
import { SubscriptionController } from "../controller/subscription.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

// Public routes — anyone can view available plans, no auth required
router.get("/plans", SubscriptionController.getPlans);
router.get("/plans/:id", SubscriptionController.getPlan);

// Stripe webhook — MUST use raw body for signature verification,
// and MUST be registered before any global express.json() middleware
// (or excluded from it) so the body isn't parsed into an object first.
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  SubscriptionController.handleWebhook,
);

// Authenticated routes — require a logged-in user
router.get("/me", authenticate, SubscriptionController.getUserSubscription);
router.post(
  "/checkout",
  authenticate,
  SubscriptionController.createCheckoutSession,
);
router.post("/change-plan", authenticate, SubscriptionController.changePlan);
router.post("/cancel", authenticate, SubscriptionController.cancelSubscription);
router.post("/resume", authenticate, SubscriptionController.resumeSubscription);
router.get("/usage", authenticate, SubscriptionController.getUsageSummary);

export default router;
