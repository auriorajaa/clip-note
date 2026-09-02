import { AppDataSource } from "../config/database.js";
import { SubscriptionPlan } from "../entities/subscription-plan.entity.js";
import logger from "../utils/logger.js";

export const seedSubscriptionPlans = async () => {
  const planRepository = AppDataSource.getRepository(SubscriptionPlan);

  // Check if there any plans in the db
  const existingPlans = await planRepository.find();

  if (existingPlans.length > 0) {
    logger.info("Subscription plans already exist. Skipping seed.");
    return;
  }

  // Define the plans
  const plans = [
    {
      name: "Free",
      description:
        "Try it out with a limited number of videos, no credit card required.",
      price: 0,
      currency: "USD",
      billingInterval: "monthly",
      stripePriceId: "price_1UAo0UH3jUCdoS6tl4q1vxCB",
      videoLimit: 3,
      minutesLimit: 30,
      isActive: true,
    },
    {
      name: "Basic",
      description:
        "Great for casual use — transcribe and analyze your favorite videos.",
      price: 4.99,
      currency: "USD",
      billingInterval: "monthly",
      stripePriceId: "price_1UAo18H3jUCdoS6tT54WW5B5",
      videoLimit: 15,
      minutesLimit: 180,
      isActive: true,
    },
    {
      name: "Pro",
      description: "For creators and researchers who process videos regularly.",
      price: 14.99,
      currency: "USD",
      billingInterval: "monthly",
      stripePriceId: "price_1UAo1cH3jUCdoS6tebGVqguB",
      videoLimit: 60,
      minutesLimit: 900,
      isActive: true,
    },
    {
      name: "Business",
      description:
        "Higher limits and priority processing for teams and heavy usage.",
      price: 39.99,
      currency: "USD",
      billingInterval: "monthly",
      stripePriceId: "price_1UAo23H3jUCdoS6tTFihgUg6",
      videoLimit: 200,
      minutesLimit: 3000,
      isActive: true,
    },
  ];
};
