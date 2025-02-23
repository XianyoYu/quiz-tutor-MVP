"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  email?: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isGuest: boolean;
  logout: () => Promise<void>;
  setIsGuest: (value: boolean) => void;
  mergeGuestProgress: (userId: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isGuest: false,
  logout: async () => {},
  setIsGuest: () => {},
  mergeGuestProgress: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const router = useRouter();

  // 合併訪客進度到資料庫
  const mergeGuestProgress = async (userId: string) => {
    const guestProgress = localStorage.getItem("guest_progress");
    if (guestProgress) {
      const progress: Record<string, { is_unlocked: boolean; highest_score: number }> = 
        JSON.parse(guestProgress);
        
      for (const [stage, data] of Object.entries(progress)) {
        await supabase.from("user_stage_progress").upsert({
          user_id: userId,
          stage_number: Number(stage),
          is_unlocked: data.is_unlocked,
          highest_score: Math.max(
            data.highest_score,
            (await supabase
              .from("user_stage_progress")
              .select("highest_score")
              .eq("user_id", userId)
              .eq("stage_number", stage))
              .data?.[0]?.highest_score || 0
          ),
        });
      }
      localStorage.removeItem("guest_progress");
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user ? { id: user.id, email: user.email } : null);
      setIsLoading(false);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user;
      if (event === "SIGNED_IN" && currentUser && isGuest) {
        await mergeGuestProgress(currentUser.id);
        setIsGuest(false);
      }
      setUser(currentUser ? { id: currentUser.id, email: currentUser.email } : null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsGuest(false);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      isGuest,
      logout,
      setIsGuest,
      mergeGuestProgress
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);