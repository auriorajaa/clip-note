import {apiClient} from "@/lib/api/client";
import {AuthResponse, LoginRequest, RegisterRequest} from "@/lib/api/types";

export const authApi = {
    async login(data: LoginRequest): Promise<AuthResponse> {
        const response = await apiClient.post("/auth/login", data);
        return response.data.data;
    },

    async register(data: RegisterRequest): Promise<AuthResponse> {
        const response = await apiClient.post("/auth/register", data);
        return response.data.data;
    },

    async getCurrentUser(): Promise<AuthResponse> {
        const response = await apiClient.get("/auth/me");
        return response.data.data;
    }
};