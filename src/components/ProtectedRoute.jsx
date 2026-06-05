import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
    const { user, profile, loading } = useAuth();
    const location = useLocation();

    if (loading) return (
        <div style={{
            height: "100vh", display: "flex",
            alignItems: "center", justifyContent: "center",
            background: "#09090b", color: "rgba(255,255,255,0.3)",
            fontFamily: "Montserrat, sans-serif", fontSize: "13px"
        }}>
            Loading...
        </div>
    );

    if (!user) return <Navigate to="/login" replace />;

    // Don't redirect if already on /onboarding
    if (profile && !profile.onboarded && location.pathname !== "/onboarding") {
        return <Navigate to="/onboarding" replace />;
    }

    // If already onboarded, don't let them back to /onboarding
    if (profile?.onboarded && location.pathname === "/onboarding") {
        return <Navigate to="/" replace />;
    }

    return children;
}