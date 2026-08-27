import {useAuth} from "@/lib/hooks/auth";
import {useRouter} from "next/navigation";
import {useMutation} from "@tanstack/react-query";
import {authApi} from "@/lib/api/auth";

export function useLogin() {
    const {login} = useAuth();
    const router = useRouter();

    return useMutation({
        mutationFn: (data: any) => authApi.login(data),

        onSuccess: (data) => {
            login(data.token, data.user);

            router.push("/dashboard");
        },
    });
}

export function useRegister() {
    const {login} = useAuth();
    const router = useRouter();

    return useMutation({
        mutationFn: (data: any) => authApi.register(data),
        onSuccess: (data) => {
            login(data.token, data.user);
            router.push("/dashboard");
        }
    });
}