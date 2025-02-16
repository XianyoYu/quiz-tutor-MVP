"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";

export default function Login() {
  const { user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) router.push("/");
  }, [user]);

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      router.push("/");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-indigo-100 to-blue-100 flex justify-center items-center p-6 relative">
      {/* 返回主頁與註冊按鈕 */}
      <div className="absolute top-4 left-4 space-x-4">
        <button
          onClick={() => router.push("/")}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full shadow-md transition duration-300 transform hover:scale-105"
        >
          返回主頁
        </button>
        <button
          onClick={() => router.push("/signup")}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full shadow-md transition duration-300 transform hover:scale-105"
        >
          註冊
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-md transition duration-300 transform hover:scale-105">
        <h1 className="text-4xl font-extrabold text-gray-800 mb-8 tracking-wide text-center">
          登入
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
          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-500 to-blue-500 text-white px-6 py-3 rounded-full shadow-xl hover:opacity-90 transition duration-300"
          >
            {loading ? "載入中..." : "登入"}
          </button>
        </div>
      </div>
    </div>
  );
}
