"use client";

import {loginSchema, LoginSchemaData} from "@/lib/validations/auth";
import {zodResolver} from "@hookform/resolvers/zod";
import {useState} from "react";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {useForm} from "react-hook-form";
import {Alert, AlertDescription} from "@/components/ui/alert";
import {Eye, EyeOff, Loader2, TriangleAlertIcon} from "lucide-react";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {useLogin} from "@/lib/hooks/queries/auth";
import {toast} from "sonner";
import {FieldDescription} from "@/components/ui/field";

export function LoginForm() {
    const login = useLogin();
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const form = useForm<LoginSchemaData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        }
    });

    const onSubmit = async (data: LoginSchemaData) => {
        try {
            setError(null);
            await login.mutateAsync({
                email: data.email,
                password: data.password,
            });
            toast.success("Login successfully.");
        } catch (error: any) {
            const errorMessage = error.response?.data?.message;
            if (errorMessage?.toLowerCase().includes("credentials")) {
                setError("Invalid credentials. Please try again.");
            } else if (errorMessage?.toLowerCase().includes("verify")) {
                setError("Please check email to verify your account before you logging in.");
            } else {
                setError(errorMessage || "Something went wrong.");
            }
        }
    };
    return (
        <div>
            <div className="flex flex-col items-center gap-1 text-center mb-6">
                <h1 className="text-2xl font-bold">Welcome back!</h1>
                <p className="text-sm text-balance text-muted-foreground">
                    Fill in the form below to login to your account
                </p>
            </div>

            {error && (
                <Alert variant="destructive" className="text-sm border-0 px-0 pb-5">
                    <TriangleAlertIcon className="size-4"/>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <Form {...form}>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.handleSubmit(onSubmit)(e);
                    }}
                    className="flex flex-col gap-5">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input placeholder="c@example.com" {...field}/>
                                </FormControl>
                                <FormMessage className="text-xs"/>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="password"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>Password</FormLabel>
                                <div className="relative">
                                    <FormControl>
                                        <Input placeholder="********" type={showPassword ? "text" : "password"}
                                               {...field}/>
                                    </FormControl>
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-0 top-0 flex h-full w-10 items-center justify-center text-muted-foreground hover:text-foreground"
                                        aria-label={
                                            showPassword
                                                ? "Hide password"
                                                : "Show password"
                                        }
                                    >
                                        {showPassword ? (
                                            <EyeOff className="size-4"/>
                                        ) : (
                                            <Eye className="size-4"/>
                                        )}
                                    </button>
                                </div>
                                <FormMessage className="text-xs"/>
                            </FormItem>
                        )}
                    />

                    <Button type="submit" disabled={login.isPending}>
                        {login.isPending ? (
                            <Loader2 className="size-4 animate-spin"/>
                        ) : ("Login")}
                    </Button>

                    <FieldDescription className="text-center">
                        Don&apos;t have an account? <a href="/auth/register">Sign up</a>
                    </FieldDescription>
                </form>
            </Form>
        </div>
    );
}
