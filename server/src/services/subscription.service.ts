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
    const subscription = await this.findActiveUserSubscription(userId);

    if (!subscription) {
      throw new AppError(StatusCodes.NOT_FOUND, "Subscription not found");
    }

    return subscription;
  }

  public static async createCheckoutSession(userId: string, planId: string) {
    const user = await this.userRepository.findOneBy({ id: userId });
    // Check if the user exists
    // If not, throw a NOT_FOUND error
    if (!user) {
      throw new AppError(StatusCodes.NOT_FOUND, "User not found");
    }

    const plan = await this.planRepository.findOneBy({ id: planId });
    // Check if the plan exists
    // If not, throw a NOT_FOUND error
    if (!plan) {
      throw new AppError(StatusCodes.NOT_FOUND, "Plan not found");
    }

    const activeSubscription = await this.findActiveUserSubscription(userId);
    // Check if the user already has an active subscription
    // If so, throw a CONFLICT error
    if (activeSubscription) {
      throw new AppError(
        StatusCodes.CONFLICT,
        "User already has an active subscription",
      );
    }

    // If the user does not have a Stripe customer ID, create one
    // and associate it with the user
    if (!user.stripeCustomerId) {
      const customer = await this.stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user.id },
      });

      user.stripeCustomerId = customer.id;
      await this.userRepository.save(user);
    }

    // Create the checkout session
    // This session will be used to redirect the user to the Stripe checkout page
    const session = await this.stripe.checkout.sessions.create({
      customer: user.stripeCustomerId,
      line_items: [
        {
          price: plan.stripePriceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.CLIENT_URL}/subscriptions/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/subscriptions/cancel`,
      metadata: {
        userId: user.id,
        planId: plan.id,
      },
    });

    return { url: session.url };
  }

  public static async changePlan(userId: string, planId: string) {
    const subscription = await this.getUserSubscription(userId);
    const targetPlan = await this.getPlan(planId);

    if (subscription.plan.id === targetPlan.id) {
      if (subscription.pendingPlan && subscription.stripeScheduleId) {
        await this.stripe.subscriptionSchedules.release(subscription.stripeScheduleId);
        subscription.pendingPlan = null;
        subscription.pendingChangeAt = null;
        subscription.stripeScheduleId = null;
        await this.subscriptionRepository.save(subscription);
        return { message: "Scheduled plan change canceled", subscription };
      }
      throw new AppError(StatusCodes.BAD_REQUEST, "You are already on this plan");
    }
    if (!subscription.stripeSubscriptionId) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Subscription is missing its Stripe ID");
    }

    const stripeSubscription = await this.stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
    const item = stripeSubscription.items.data[0];
    if (!item) {
      throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, "Stripe subscription has no items");
    }

    if (Number(targetPlan.price) > Number(subscription.plan.price)) {
      if (subscription.stripeScheduleId) {
        await this.stripe.subscriptionSchedules.release(subscription.stripeScheduleId);
      }
      await this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        items: [{ id: item.id, price: targetPlan.stripePriceId }],
        proration_behavior: "always_invoice",
        cancel_at_period_end: false,
      });
      subscription.plan = targetPlan;
      subscription.pendingPlan = null;
      subscription.pendingChangeAt = null;
      subscription.stripeScheduleId = null;
      subscription.cancelAt = null;
      subscription.canceledAt = null;
      await this.subscriptionRepository.save(subscription);
      return { message: "Subscription upgraded successfully", subscription };
    }

    if (subscription.cancelAt) {
      await this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: false,
      });
      subscription.cancelAt = null;
      subscription.canceledAt = null;
    }
    if (subscription.stripeScheduleId) {
      await this.stripe.subscriptionSchedules.release(subscription.stripeScheduleId);
    }

    const schedule = await this.stripe.subscriptionSchedules.create({
      from_subscription: subscription.stripeSubscriptionId,
    });
    const periodStart = item.current_period_start;
    const periodEnd = item.current_period_end;
    await this.stripe.subscriptionSchedules.update(schedule.id, {
      end_behavior: "release",
      phases: [
        {
          items: [{ price: subscription.plan.stripePriceId, quantity: 1 }],
          start_date: periodStart,
          end_date: periodEnd,
        },
        {
          items: [{ price: targetPlan.stripePriceId, quantity: 1 }],
          start_date: periodEnd,
        },
      ],
    });

    subscription.pendingPlan = targetPlan;
    subscription.pendingChangeAt = new Date(periodEnd * 1000);
    subscription.stripeScheduleId = schedule.id;
    await this.subscriptionRepository.save(subscription);
    return { message: "Downgrade scheduled for the end of the current period", subscription };
  }

  public static async resumeSubscription(userId: string) {
    const subscription = await this.getUserSubscription(userId);
    if (!subscription.stripeSubscriptionId) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Subscription is missing its Stripe ID");
    }
    await this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });
    subscription.cancelAt = null;
    subscription.canceledAt = null;
    await this.subscriptionRepository.save(subscription);
    return { message: "Subscription cancellation has been resumed" };
  }
  // Handle the webhook event
  public static async handleWebhook(event: Stripe.Event) {
    switch (event.type) {
      // Handle the checkout session completed event
      case "checkout.session.completed":
        await this.handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;
      // Handle the invoice paid event
      case "invoice.paid":
        await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      // Handle the invoice payment failed event
      case "invoice.payment_failed":
        await this.handleInvoicePaymentFailed(
          event.data.object as Stripe.Invoice,
        );
        break;
      // Handle the subscription updated event
      case "customer.subscription.updated":
        await this.handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
        );
        break;
      // Handle the subscription deleted event
      case "customer.subscription.deleted":
        await this.handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        );
        break;
    }

    // Return a success response
    return { received: true };
  }

  // Handle the checkout session completed event
  private static async handleCheckoutSessionCompleted(
    session: Stripe.Checkout.Session,
  ) {
    const { userId, planId } = session.metadata || {};
    if (!session.subscription || !userId || !planId) {
      return;
    }
    // Retrieve the subscription from Stripe
    const subscription = await this.stripe.subscriptions.retrieve(
      session.subscription as string,
    );

    // Create the user subscription if the session is completed successfully
    if (userId && planId) {
      await this.createUserSubscription(userId, planId, subscription);
    }
  }

  // Handle the invoice paid event
  // Resolve the subscription ID and update the user's subscription in the database
  public static async handleInvoicePaid(invoice: Stripe.Invoice) {
    // Check if the invoice is a subscription invoice
    if (invoice.parent?.type !== "subscription_details") {
      return;
    }

    const subscriptionId = invoice.parent.subscription_details?.subscription;

    if (!subscriptionId) {
      return;
    }

    // Resolve the subscription ID
    // Convert the subscription ID to a string if it is an object
    const resolvedSubscriptionId =
      typeof subscriptionId === "string" ? subscriptionId : subscriptionId.id;

    // Retrieve the subscription from Stripe
    const subscription = await this.stripe.subscriptions.retrieve(
      resolvedSubscriptionId,
    );

    // Retrieve the user's subscription from the database
    const stripeCustomerId = subscription.customer as string;

    // Retrieve the user from the database
    const user = await this.userRepository.findOneBy({ stripeCustomerId });

    // Retrieve the user's subscription from the database
    if (user) {
      const userSubscription = await this.subscriptionRepository.findOne({
        where: { stripeSubscriptionId: resolvedSubscriptionId },
      });

      // Retrieve the subscription item from the subscription
      const subscriptionItem = subscription.items.data[0];

      if (!subscriptionItem) {
        throw new AppError(
          StatusCodes.INTERNAL_SERVER_ERROR,
          "Stripe subscription has no items",
        );
      }

      // Update the user's subscription details if it exists
      if (userSubscription) {
        userSubscription.currentPeriodStart = new Date(
          subscriptionItem.current_period_start * 1000,
        );
        userSubscription.currentPeriodEnd = new Date(
          subscriptionItem.current_period_end * 1000,
        );
        userSubscription.status = "active";

        await this.subscriptionRepository.save(userSubscription);
      }
    }
  }

  // Handle the invoice payment failed event
  // Marks the subscription as past_due so access can be gated,
  // and leaves a record of when the failure happened.
  private static async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    // Check if the invoice is a subscription invoice
    if (invoice.parent?.type !== "subscription_details") {
      return;
    }

    const subscriptionId = invoice.parent.subscription_details?.subscription;

    if (!subscriptionId) {
      return;
    }

    // Resolve the subscription ID
    // Convert the subscription ID to a string if it is an object
    const resolvedSubscriptionId =
      typeof subscriptionId === "string" ? subscriptionId : subscriptionId.id;

    // Retrieve the user's subscription from the database
    const userSubscription = await this.subscriptionRepository.findOne({
      where: { stripeSubscriptionId: resolvedSubscriptionId },
    });

    // Mark the subscription as past_due if it exists
    // Stripe will automatically retry the payment based on the account's
    // retry schedule; customer.subscription.updated or .deleted will follow
    // once Stripe exhausts retries or the customer updates their card.
    if (userSubscription) {
      userSubscription.status = "past_due";
      await this.subscriptionRepository.save(userSubscription);
    }
  }

  // Handle the subscription updated event from Stripe
  private static async handleSubscriptionUpdated(
    subscription: Stripe.Subscription,
  ) {
    const stripeCustomerId = subscription.customer as string;
    const user = await this.userRepository.findOneBy({ stripeCustomerId });

    if (user) {
      const userSubscription = await this.subscriptionRepository.findOne({
        where: { stripeSubscriptionId: subscription.id },
      });

      // Get the first subscription item
      const subscriptionItem = subscription.items.data[0];

      if (!subscriptionItem) {
        throw new AppError(
          StatusCodes.INTERNAL_SERVER_ERROR,
          "Stripe subscription has no items",
        );
      }

      // Update the user subscription with the latest subscription data
      if (userSubscription) {
        userSubscription.status = subscription.status as any;
        userSubscription.currentPeriodStart = new Date(
          subscriptionItem.current_period_start * 1000,
        );
        userSubscription.currentPeriodEnd = new Date(
          subscriptionItem.current_period_end * 1000,
        );

        const updatedPlan = await this.planRepository.findOneBy({
          stripePriceId: subscriptionItem.price.id,
        });
        if (updatedPlan) {
          userSubscription.plan = updatedPlan;
          if (userSubscription.pendingPlan?.id === updatedPlan.id) {
            userSubscription.pendingPlan = null;
            userSubscription.pendingChangeAt = null;
            userSubscription.stripeScheduleId = null;
          }
        }

        userSubscription.cancelAt = subscription.cancel_at
          ? new Date(subscription.cancel_at * 1000)
          : null;
        userSubscription.canceledAt = subscription.canceled_at
          ? new Date(subscription.canceled_at * 1000)
          : null;

        await this.subscriptionRepository.save(userSubscription);
      }
    }
  }

  // Handle the subscription deleted event by marking the user's subscription as canceled
  // If the subscription is found, mark it as canceled and save the changes
  private static async handleSubscriptionDeleted(
    subscription: Stripe.Subscription,
  ) {
    // Find the user's subscription by the stripe subscription id
    const userSubscription = await this.subscriptionRepository.findOne({
      where: { stripeSubscriptionId: subscription.id },
    });

    // If the subscription is found, mark it as canceled and save the changes
    if (userSubscription) {
      // Set the status to canceled and save the changes
      userSubscription.status = "canceled";
      // Set the canceledAt date to the current date
      userSubscription.canceledAt = new Date();
      await this.subscriptionRepository.save(userSubscription);
    }
  }

  // Create the user subscription if the session is completed successfully
  private static async createUserSubscription(
    userId: string,
    planId: string,
    stripeSubscription: Stripe.Subscription,
  ) {
    const user = await this.userRepository.findOneBy({ id: userId });
    const plan = await this.planRepository.findOneBy({ id: planId });

    if (!user || !plan) {
      return;
    }

    // Get the first subscription item
    const subscriptionItem = stripeSubscription.items.data[0];

    if (!subscriptionItem) {
      throw new AppError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Stripe subscription has no items",
      );
    }

    const existingSubscription = await this.subscriptionRepository.findOne({
      where: { stripeSubscriptionId: stripeSubscription.id },
      relations: { plan: true, pendingPlan: true },
    });
    const subscription = existingSubscription ?? new UserSubscription();
    subscription.user = user;
    subscription.plan = plan;
    subscription.stripeCustomerId = user.stripeCustomerId;
    subscription.status = stripeSubscription.status as any;
    subscription.stripeSubscriptionId = stripeSubscription.id;
    subscription.currentPeriodStart = new Date(
      subscriptionItem.current_period_start * 1000,
    );
    subscription.currentPeriodEnd = new Date(
      subscriptionItem.current_period_end * 1000,
    );

    await this.subscriptionRepository.save(subscription);
  }

  // Check if the user has exceeded their subscription limits
  // Throws an error if the user has exceeded their video or minutes limit
  public static async checkSubscriptionLimits(
    userId: string,
    videoDurationInSeconds: number,
  ) {
    const userSubscription = await this.findActiveUserSubscription(userId);

    if (!userSubscription) {
      const freePlan = await this.planRepository.findOne({
        where: { name: "Free" },
      });

      // Check if the free plan exists
      if (!freePlan) {
        throw new AppError(
          StatusCodes.INTERNAL_SERVER_ERROR,
          "Free plan configuration not found. Please contact support.",
        );
      }

      const totalVideos = await this.countUserVideos(userId);
      const totalMinutes = await this.countUserMinutes(userId);
      const minutesNeeded = Math.ceil(videoDurationInSeconds / 60);

      if (totalVideos >= freePlan.videoLimit) {
        throw new AppError(
          StatusCodes.PAYMENT_REQUIRED,
          `You have exceeded the free tier video limit of ${freePlan.videoLimit} videos.`,
        );
      }

      if (totalMinutes + minutesNeeded > freePlan.minutesLimit) {
        throw new AppError(
          StatusCodes.PAYMENT_REQUIRED,
          `You have exceeded the free tier minutes limit of ${freePlan.minutesLimit} minutes. Please upgrade to continue.`,
        );
      }

      return true;
    }

    // Paid subscription
    const plan = userSubscription.plan;
    const minutesNeeded = Math.ceil(videoDurationInSeconds / 60);

    if (plan.videoLimit > 0 && userSubscription.videosUsed >= plan.videoLimit) {
      throw new AppError(
        StatusCodes.PAYMENT_REQUIRED,
        `You have exceeded the video limit of ${plan.videoLimit} videos. Please upgrade to continue.`,
      );
    }

    if (
      plan.minutesLimit > 0 &&
      userSubscription.minutesUsed + minutesNeeded > plan.minutesLimit
    ) {
      throw new AppError(
        StatusCodes.PAYMENT_REQUIRED,
        `You have exceeded the minutes limit of ${plan.minutesLimit} minutes. Please upgrade to continue.`,
      );
    }

    return true;
  }

  // Find the user's active subscription without throwing if none exists.
  // Used internally by methods that need to distinguish "no subscription"
  // from an actual error (e.g. checkout, limit checks).
  private static async findActiveUserSubscription(userId: string) {
    return this.subscriptionRepository.findOne({
      where: { user: { id: userId }, status: "active" },
      relations: { plan: true, pendingPlan: true },
      order: { createdAt: "DESC" },
    });
  }

  // Cancels the user's subscription at the end of the current period
  public static async cancelSubscription(userId: string) {
    const subscription = await this.getUserSubscription(userId);

    // If the subscription is not found, throw an error
    if (!subscription) {
      throw new AppError(StatusCodes.NOT_FOUND, "Subscription not found");
    }

    // Cancel the subscription at the end of the current period
    await this.stripe.subscriptions.update(subscription.stripeSubscriptionId!, {
      cancel_at_period_end: true,
    });
    subscription.cancelAt = subscription.currentPeriodEnd;
    subscription.canceledAt = null;
    await this.subscriptionRepository.save(subscription);

    return {
      message:
        "Subscription will be cancelled at the end of the current period",
    };
  }

  // Increment the user's usage of videos and minutes
  public static async incrementUsage(
    userId: string,
    videoDurationInSeconds: number,
  ) {
    const userSubscription = await this.getUserSubscription(userId);
    // Calculate the number of minutes used for the video
    const minutesUsed = Math.ceil(videoDurationInSeconds / 60);

    // If the user has a subscription, increment their usage
    if (userSubscription) {
      // Increment the number of videos used
      userSubscription.videosUsed += 1;
      // Increment the number of minutes used
      userSubscription.minutesUsed += minutesUsed;
      await this.subscriptionRepository.save(userSubscription);
    }
  }

  // Get the user's usage summary, including videos and minutes used
  public static async getUsageSummary(userId: string) {
    const userSubscription = await this.findActiveUserSubscription(userId);
    // If the user has a subscription, return their usage summary
    if (userSubscription) {
      return {
        videosUsed: userSubscription.videosUsed,
        videoLimit: userSubscription.plan.videoLimit,
        minutesUsed: userSubscription.minutesUsed,
        minutesLimit: userSubscription.plan.minutesLimit,
        planName: userSubscription.plan.name,
      };
    }
    // If the user does not have a subscription, return the free plan usage summary
    const freePlan = await this.planRepository.findOne({
      where: { name: "Free" },
    });
    // If the free plan is not found, throw an error
    if (!freePlan) {
      throw new AppError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Free plan configuration not found",
      );
    }
    const videosUsed = await this.countUserVideos(userId);
    const minutesUsed = await this.countUserMinutes(userId);
    // Return the free plan usage summary
    return {
      videosUsed,
      videoLimit: freePlan.videoLimit,
      minutesUsed,
      minutesLimit: freePlan.minutesLimit,
      planName: freePlan.name,
    };
  }

  // Count the number of videos the user has uploaded
  // Returns the number of videos the user has uploaded
  private static async countUserVideos(userId: string): Promise<number> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: { videos: true },
    });

    return user?.videos?.length || 0;
  }

  // Count the total duration of the user's videos in minutes
  private static async countUserMinutes(userId: string): Promise<number> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: { videos: true },
    });

    // Count the total duration of the user's videos
    if (!user?.videos?.length) {
      return 0;
    }

    // Sum the duration of all videos in seconds
    // Convert to minutes and round up to the nearest whole number
    const totalSeconds = user.videos.reduce((total, video) => {
      return total + (video.duration || 0);
    }, 0);

    // Round up to the nearest minute
    return Math.ceil(totalSeconds / 60);
  }
}
