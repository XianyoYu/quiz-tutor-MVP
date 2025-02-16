"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";

export default function Profile() {
  const { user, isLoading, logout } = useAuth();
  const [quizResults, setQuizResults] = useState([]);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
      return;
    }

    const fetchResults = async () => {
      const { data } = await supabase
        .from("quiz_results")
        .select("*")
        .eq("user_id", user.id);
      setQuizResults(data || []);
    };

    if (user) fetchResults();
  }, [user, isLoading]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
        <p className="text-black">載入中...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-extrabold text-black mb-6 tracking-wide">個人頁面</h1>
      <div className="w-full max-w-md space-y-4">
        <p className="text-black">Email: {user?.email}</p>
        <h2 className="text-2xl font-bold text-black">測驗歷史</h2>
        {quizResults.length > 0 ? (
          quizResults.map((result, index) => (
            <div key={index} className="p-4 bg-white rounded-lg shadow-md border border-gray-200">
              <p>分數: {result.score}%</p>
              <p>測驗時間: {new Date(result.created_at).toLocaleString()}</p>
            </div>
          ))
        ) : (
          <p className="text-black">尚未有任何測驗紀錄。</p>
        )}
        <button
          onClick={logout}
          className="w-full bg-red-500 text-white px-6 py-3 rounded-xl shadow-lg hover:bg-red-600 transition duration-300"
        >
          登出
        </button>
      </div>
    </div>
  );
}