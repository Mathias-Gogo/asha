import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [theme, setTheme] = useState("dark");

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) fetchProfile(session.user.id);
            else setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                setUser(session?.user ?? null);
                if (session?.user) fetchProfile(session.user.id);
                else {
                    setProfile(null);
                    setTheme("dark");
                    setLoading(false);
                }
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    async function fetchProfile(userId) {
        const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();
        setProfile(data);
        if (data?.theme) setTheme(data.theme);
        setLoading(false);
    }

    async function updateTheme(newTheme) {
        setTheme(newTheme);
        await supabase
            .from("profiles")
            .update({ theme: newTheme })
            .eq("id", user.id);
    }

    async function signOut() {
        await supabase.auth.signOut();
    }

    return (
        <AuthContext.Provider value={{ user, profile, loading, theme, signOut, fetchProfile, updateTheme }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);