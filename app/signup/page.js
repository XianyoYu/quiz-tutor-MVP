"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";

export default function Signup() {
  const { user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (user) router.push("/");
  }, [user]);

  const handleSignup = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
  
    if (password !== confirmPassword) {
      setError("密碼不一致，請重新確認。");
      setLoading(false);
      return;
    }
  
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
  
    if (error) {
      setError(error.message);
    } else {
      // 註冊成功後，插入第一關的解鎖狀態
      await supabase.from("user_stage_progress").upsert([
        {
          user_id: data.user?.id,
          category_id: 1, // 文法題
          stage_number: 1,
          is_unlocked: true,
          highest_score: 0,
        },
        {
          user_id: data.user?.id,
          category_id: 2, // 單字題
          stage_number: 1,
          is_unlocked: true,
          highest_score: 0,
        },
      ]);
  
      setSuccess("註冊成功！請檢查您的電子郵件進行驗證。");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    }
  
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-indigo-100 to-blue-100 flex justify-center items-center p-6 relative">
      {/* 返回主頁與登入按鈕 */}
      <div className="absolute top-4 left-4 space-x-4">
        <button
          onClick={() => router.push("/")}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full shadow-md transition duration-300 transform hover:scale-105"
        >
          返回主頁
        </button>
        <button
          onClick={() => router.push("/login")}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full shadow-md transition duration-300 transform hover:scale-105"
        >
          登入
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-md transition duration-300 transform hover:scale-105">
        <h1 className="text-4xl font-extrabold text-gray-800 mb-8 tracking-wide text-center">
          建立新帳號
        </h1>
        <div className="space-y-6">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-4 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-400 text-gray-700"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-4 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-400 text-gray-700"
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full p-4 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-400 text-gray-700"
          />
          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}
          {success && (
            <p className="text-green-500 text-sm text-center">{success}</p>
          )}
          <button
            onClick={handleSignup}
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white px-6 py-3 rounded-full shadow-xl hover:opacity-90 transition duration-300"
          >
            {loading ? "載入中..." : "註冊"}
          </button>
        </div>
      </div>
    </div>
  );
}
