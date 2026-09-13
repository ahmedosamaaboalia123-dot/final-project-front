import axios from "axios";


import { appConfig } from "@/app/config";
import { useAuthStore } from "@/store/authStore";
import { updateAdminSocketToken, disconnectAdminSocket } from "@/services/realtime";



const apiClient = axios.create({


    baseURL: appConfig.apiBaseUrl,


    timeout:30000,


    headers:{


        "Content-Type":"application/json"


    }


});

let refreshPromise = null;

const clearSession = () => {
    localStorage.removeItem(appConfig.tokenKey);
    localStorage.removeItem(appConfig.refreshTokenKey);
    localStorage.removeItem("auth_session");
    useAuthStore.getState().clearAuth();
    disconnectAdminSocket();
};





// Request Interceptor

apiClient.interceptors.request.use(


(config)=>{


    const token =
    localStorage.getItem(
        appConfig.tokenKey
    );



    if(token){


        config.headers.Authorization =
        `Bearer ${token}`;


    }



    return config;


},


(error)=>{


    return Promise.reject(error);


}

);





// Response Interceptor

apiClient.interceptors.response.use(


(response)=>{

    if(typeof window !== "undefined") window.dispatchEvent(new CustomEvent("api-availability",{detail:{available:true}}));


    return response.data;


},


(error)=>{

    if(typeof window !== "undefined" && (!error.response || error.response?.status === 503)){
        window.dispatchEvent(new CustomEvent("api-availability",{detail:{available:false}}));
    }


    const originalRequest = error.config;
    const isAuthRequest = originalRequest?.url?.includes("/auth/login") || originalRequest?.url?.includes("/auth/refresh");
    const refreshToken = localStorage.getItem(appConfig.refreshTokenKey);

    if(error.response?.status === 401 && !isAuthRequest && refreshToken && !originalRequest?._retry){
        originalRequest._retry = true;
        if(!refreshPromise){
            const refreshBase = String(appConfig.apiBaseUrl).replace(/\/+$/, "");
            const refreshUrl = /\/v1$/i.test(refreshBase) ? `${refreshBase}/auth/refresh` : `${refreshBase}/v1/auth/refresh`;
            refreshPromise = axios.post(refreshUrl, { refreshToken })
                .then((response) => {
                    const tokens = response.data?.data;
                    if (!response.data?.ok || !tokens?.accessToken || !tokens?.refreshToken) throw new Error("Refresh response is incomplete");
                    localStorage.setItem(appConfig.tokenKey, tokens.accessToken);
                    localStorage.setItem(appConfig.refreshTokenKey, tokens.refreshToken);
                    useAuthStore.getState().setAccessToken(tokens.accessToken);
                    updateAdminSocketToken(tokens.accessToken);
                    return tokens.accessToken;
                })
                .finally(() => { refreshPromise = null; });
        }

        return refreshPromise
            .then((accessToken) => {
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return apiClient(originalRequest);
            })
            .catch((refreshError) => {
                clearSession();
                return Promise.reject(refreshError);
            });
    }

    if(error.response?.status === 401){
        clearSession();
    }

    return Promise.reject(error);


}

);



export default apiClient;
