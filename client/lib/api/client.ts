import axios from "axios";

const BASE_URL = "http://localhost:8080/api/v1";

// function to get the current token
let getToken: () => string | null = () => localStorage.getItem("token");

// function to set the token
export const setTokenGetter = (fn: () => string | null) => {
    getToken = fn;
};

export const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        "Content-Type": "application/json",
    }
});

// add request interceptor
apiClient.interceptors.request.use((config) => {
    const token = getToken();

    // add token as jwt in authorization
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

// add response interceptor
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // handle 401 error
        if (error.response?.status === 401) {
            localStorage.removeItem("token");
            window.location.href = "/auth/login";
        }

        return Promise.reject(error);
    }
);