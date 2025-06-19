import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
const AuthContext = createContext(undefined);
export const AuthProvider = ({ children, }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        // Check active sessions and sets the user
        const getSession = async () => {
            try {
                const { data: { session }, error, } = await supabase.auth.getSession();
                if (error) {
                    console.error("Session error:", error);
                    // If there's an error getting the session, clear any stored auth data
                    await clearStoredSession();
                    setUser(null);
                }
                else {
                    setUser(session?.user ?? null);
                }
            }
            catch (error) {
                console.error("Failed to get session:", error);
                await clearStoredSession();
                setUser(null);
            }
            finally {
                setLoading(false);
            }
        };
        getSession();
        // Listen for changes on auth state (sign in, sign out, etc.)
        const { data: { subscription }, } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log("Auth state change:", event, session?.user?.id);
            if (event === "TOKEN_REFRESHED") {
                console.log("Token refreshed successfully");
            }
            else if (event === "SIGNED_OUT") {
                console.log("User signed out");
                setUser(null);
            }
            else if (event === "SIGNED_IN") {
                console.log("User signed in");
                setUser(session?.user ?? null);
            }
            // Handle token refresh errors
            if (event === "TOKEN_REFRESHED" && !session) {
                console.warn("Token refresh failed, clearing session");
                await clearStoredSession();
                setUser(null);
            }
            else {
                setUser(session?.user ?? null);
            }
            setLoading(false);
        });
        return () => {
            subscription.unsubscribe();
        };
    }, []);
    const clearStoredSession = async () => {
        try {
            // Clear local storage items related to Supabase auth
            localStorage.removeItem(`sb-${supabase.supabaseUrl.split("//")[1].split(".")[0]}-auth-token`);
            localStorage.removeItem("supabase.auth.token");
            // Clear any session storage items
            sessionStorage.clear();
            // Also call Supabase signOut to ensure cleanup
            await supabase.auth.signOut({ scope: "local" });
        }
        catch (error) {
            console.error("Error clearing stored session:", error);
        }
    };
    const clearSession = async () => {
        await clearStoredSession();
        setUser(null);
    };
    const signIn = async (email, password) => {
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) {
                // If sign in fails due to session issues, clear any stale data
                if (error.message.includes("refresh") ||
                    error.message.includes("token")) {
                    await clearStoredSession();
                }
                throw error;
            }
        }
        catch (error) {
            throw error;
        }
    };
    const signUp = async (email, password) => {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error)
            throw error;
    };
    const signOut = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error)
                throw error;
            await clearStoredSession();
        }
        catch (error) {
            // Even if signOut fails, clear local session
            await clearStoredSession();
            throw error;
        }
    };
    const value = {
        user,
        loading,
        signIn,
        signUp,
        signOut,
        clearSession,
    };
    return (_jsx(AuthContext.Provider, { value: value, children: !loading && children }));
};
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
