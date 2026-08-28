"use client";

import {registerSchema, RegisterSchemaData} from "@/lib/validations/auth";
import {zodResolver} from "@hookform/resolvers/zod";
import {useState} from "react";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {useForm} from "react-hook-form";
import {Alert, AlertDescription} from "@/components/ui/alert";
import {Eye, EyeOff, Loader2, TriangleAlertIcon} from "lucide-react";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {useRegister} from "@/lib/hooks/queries/auth";
import {toast} from "sonner";
import {FieldDescription} from "@/components/ui/field";

export function SignupForm() {
    const register = useRegister();
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const form = useForm<RegisterSchemaData>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            confirmPassword: ""
        }
    });

    const onSubmit = async (data: RegisterSchemaData) => {
        try {
            setError(null);
            await register.mutateAsync({
                name: data.name,
                email: data.email,
                password: data.password,
            });
            toast.success("Signup successfully.");
        } catch (error: any) {
            const errorMessage = error.response?.data?.message;
            if (errorMessage?.toLowerCase().includes("email")) {
                setError("Email address already exists!");
            } else {
                setError("Something went wrong!");
            }
        }
    };
    return (
        <div>
            <div className="flex flex-col items-center gap-1 text-center mb-6">
                <h1 className="text-2xl font-bold">Create your account</h1>
                <p className="text-sm text-balance text-muted-foreground">
                    Fill in the form below to create your account
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
                        name="name"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="John doe" {...field}/>
                                </FormControl>
                                <FormMessage className="text-xs"/>
                            </FormItem>
                        )}
                    />

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
                                        <Input placeholder="Must be at least 8 characters long"
                                               type={showPassword ? "text" : "password"}{...field}/>
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

                    <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>Confirm Password</FormLabel>
                                <div className="relative">
                                    <FormControl>
                                        <Input placeholder="" type={showPassword ? "text" : "password"}{...field}/>
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
                    <Button type="submit" disabled={register.isPending}>
                        {register.isPending ? (
                            <Loader2 className="size-4 animate-spin"/>
                        ) : ("Create account")}
                    </Button>

                    <FieldDescription className="text-center">
                        Already have an account? <a href="/auth/login">Login</a>
                    </FieldDescription>
                </form>
            </Form>

            <FieldDescription className="pt-4 text-center">
                By clicking continue, you agree to our <a href="/terms-of-service">Terms of Service</a>{" "}
                and <a href="/privacy-policy">Privacy Policy</a>.
            </FieldDescription>
        </div>
    );
}
