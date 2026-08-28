import * as z from "zod";

export const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string()
});

export const registerSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Password must match",
    path: ["confirmPassword"],
});

export type LoginSchemaData = z.infer<typeof loginSchema>;
export type RegisterSchemaData = z.infer<typeof registerSchema>;