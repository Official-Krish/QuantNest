import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { apiVerifyToken } from "@/http";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const [isVerifying, setIsVerifying] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const verifyAuth = async () => {
        const token = localStorage.getItem("token");
        
        if (!token) {
            setIsVerifying(false);
            setIsAuthenticated(false);
            return;
        }

        try {
            await apiVerifyToken();
            setIsAuthenticated(true);
        } catch (error) {
            console.error("Token verification failed:", error);
            localStorage.removeItem("token");
            setIsAuthenticated(false);
        } finally {
            setIsVerifying(false);
        }
        };

        verifyAuth();
    }, []);

    if (isVerifying) {
        return (
        <div className="flex min-h-screen items-center justify-center bg-black">
            <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-600 border-t-transparent" />
            <p className="text-sm text-neutral-400">Verifying session...</p>
            </div>
        </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/signin" replace />;
    }

    return <>{children}</>;
};
