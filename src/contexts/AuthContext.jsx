import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [tutorProfile, setTutorProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (authUser) => {
    if (!authUser) {
      setProfile(null);
      setStudentProfile(null);
      setTutorProfile(null);
      return;
    }

    const { data: p, error } = await supabase
      .from("profiles")
      .select("id,email,app_role,is_active")
      .eq("id", authUser.id)
      .single();

    if (error) throw error;
    if (!p?.is_active) throw new Error("This A's Online account is inactive.");

    setProfile(p);

    if (p.app_role === "student") {
      const { data, error: e } = await supabase
        .from("student_profiles")
        .select("user_id,first_name,last_name,display_name,phone,date_of_birth,school")
        .eq("user_id", authUser.id)
        .maybeSingle();
      if (e) throw e;
      setStudentProfile(data ?? null);
      setTutorProfile(null);
    } else if (p.app_role === "admin_tutor") {
      const { data, error: e } = await supabase
        .from("tutor_profiles")
        .select("user_id,first_name,last_name,display_name,phone,title")
        .eq("user_id", authUser.id)
        .maybeSingle();
      if (e) throw e;
      setTutorProfile(data ?? null);
      setStudentProfile(null);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (!active) return;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        if (currentSession?.user) await loadProfile(currentSession.user);
      } catch (error) {
        console.error("AEOS auth bootstrap failed:", error);
      } finally {
        if (active) setLoading(false);
      }
    }

    bootstrap();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      setTimeout(async () => {
        try {
          if (nextSession?.user) await loadProfile(nextSession.user);
          else {
            setProfile(null);
            setStudentProfile(null);
            setTutorProfile(null);
          }
        } catch (error) {
          console.error("AEOS profile refresh failed:", error);
        } finally {
          setLoading(false);
        }
      }, 0);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const value = useMemo(() => ({
    session, user, profile, studentProfile, tutorProfile, loading,
    isStudent: profile?.app_role === "student",
    isAdminTutor: profile?.app_role === "admin_tutor",
    signIn, signOut,
  }), [session, user, profile, studentProfile, tutorProfile, loading, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider.");
  return ctx;
}
