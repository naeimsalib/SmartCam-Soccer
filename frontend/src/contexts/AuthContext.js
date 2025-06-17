import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
const AuthContext = createContext(undefined);
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        // Check active sessions and sets the user
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
            setLoading(false);
        };
        getSession();
        // Listen for changes on auth state (sign in, sign out, etc.)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });
        return () => {
            subscription.unsubscribe();
        };
    }, []);
    const signIn = async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error)
            throw error;
    };
    const signUp = async (email, password) => {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error)
            throw error;
    };
    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error)
            throw error;
    };
    const value = {
        user,
        loading,
        signIn,
        signUp,
        signOut,
    };
    return (_jsx(AuthContext.Provider, { value: value, children: !loading && children }));
};
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
