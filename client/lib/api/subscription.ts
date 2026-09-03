import { isAxiosError } from "axios";
import { apiClient } from "./client";
import {
  ApiResponse,
  CheckoutSessionRequest,
  CheckoutSessionResponse,
  ChangePlanResponse,
  SubscriptionPlan,
  UsageSummary,
  UserSubscription,

} from "./types";

export const getSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {
  const response = await apiClient.get<ApiResponse<SubscriptionPlan[]>>(
    "/subscriptions/plans",
  );
  return response.data.data;
};

export const getUserSubscription =
  async (): Promise<UserSubscription | null> => {
    try {
      const response =
        await apiClient.get<ApiResponse<UserSubscription>>("/subscriptions/me");
      return response.data.data;
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  };

export const createCheckoutSession = async (
  data: CheckoutSessionRequest,
): Promise<CheckoutSessionResponse> => {
  const response = await apiClient.post<ApiResponse<CheckoutSessionResponse>>(
    "/subscriptions/checkout",
    data,
  );
  return response.data.data;
};


export const changeSubscriptionPlan = async (
  data: CheckoutSessionRequest,
): Promise<ChangePlanResponse> => {
  const response = await apiClient.post<ApiResponse<ChangePlanResponse>>(
    "/subscriptions/change-plan",
    data,
  );
  return response.data.data;
};
export const cancelSubscription = async (): Promise<{ message: string }> => {
  const response = await apiClient.post<ApiResponse<{ message: string }>>(
    "/subscriptions/cancel",
  );
  return response.data.data;
};

export const getUsageSummary = async (): Promise<UsageSummary> => {
  const response = await apiClient.get<ApiResponse<UsageSummary>>(
    "/subscriptions/usage",
  );
  return response.data.data;
};

export const resumeSubscription = async (): Promise<{ message: string }> => {
  const response = await apiClient.post<ApiResponse<{ message: string }>>(
    "/subscriptions/resume",
  );
  return response.data.data;
};