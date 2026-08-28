export interface User {
    id: string;
    email: string;
    name: string;
    isEmailVerified: boolean;
    lastLoginAt: string;
    createdAt: string;
    updatedAt: string;
}

export interface AuthResponse {
    user: User;
    token: string;
}

export interface ApiResponse<T> {
    status: string;
    data: T;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest extends LoginRequest {
    name: string;
}