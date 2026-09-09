import React from "react";
import ReactDOM from "react-dom/client";

import App from "./app/App";

import { Providers } from "./app/providers";

import { useAuthStore } from "./store/authStore";
import AuthBootstrap from "./modules/auth/components/AuthBootstrap";

import "./styles/globals.css";


const savedSession = localStorage.getItem("auth_session");
const savedAccessToken = localStorage.getItem("access_token");
if (savedSession && savedAccessToken) {
    try {
        useAuthStore.getState().setAuth(JSON.parse(savedSession));
    } catch {
        localStorage.removeItem("auth_session");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        useAuthStore.getState().clearAuth();
    }
} else {
    localStorage.removeItem("auth_session");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
}


ReactDOM.createRoot(
    document.getElementById("root")
)
.render(

    <React.StrictMode>

        <Providers>

            <AuthBootstrap><App /></AuthBootstrap>

        </Providers>

    </React.StrictMode>

);
