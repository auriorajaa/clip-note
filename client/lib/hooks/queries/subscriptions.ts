import {
  cancelSubscription,
  changeSubscriptionPlan,
  createCheckoutSession,
  getSubscriptionPlans,
  getUsageSummary,
  getUserSubscription,
  resumeSubscription,
} from "@/lib/api/subscription";
import {
  CheckoutSessionRequest,
  CheckoutSessionResponse,
  SubscriptionPlan,
  UsageSummary,
  UserSubscription,

} from "@/lib/api/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Get the available subscription plans
export function useSubscriptionPlans() {
  return useQuery<SubscriptionPlan[]>({
    queryKey: ["subscription-plans"],
    queryFn: getSubscriptionPlans,
  });
}

// Get the user's subscription
export function useUserSubscription() {
  return useQuery<UserSubscription | null>({
    queryKey: ["user-subscription"],
    queryFn: getUserSubscription,
  });
}

// Create a checkout session for the user's subscription
export function useCreateCheckoutSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CheckoutSessionRequest) => createCheckoutSession(data),
    onSuccess: (data: CheckoutSessionResponse) => {
      queryClient.invalidateQueries({ queryKey: ["user-subscription"] });

      // Redirect to the checkout URL if available
      if (data.url && typeof window !== "undefined") {
        window.location.href = data.url;
      }
    },
  });
}

export function useChangeSubscriptionPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: changeSubscriptionPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-subscription"] });
      queryClient.invalidateQueries({ queryKey: ["usage-summary"] });
    },
  });
}
// Cancel the user's subscription
export function useCancelSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-subscription"] });
    },
  });
}

// Get the usage summary for the user's subscription
export function useUsageSummary() {
  return useQuery<UsageSummary>({
    queryKey: ["usage-summary"],
    queryFn: getUsageSummary,
  });
}

export function useResumeSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: resumeSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-subscription"] });
    },
  });
}