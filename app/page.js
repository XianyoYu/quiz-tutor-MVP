"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState(null); // 用戶狀態
  const [loading, setLoading] = useState(true); // 載入狀態

  // 獲取用戶登入狀態
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    fetchUser();
  }, []);

  // 處理 TOEIC 測驗按鈕點擊
  const handleQuizClick = () => {
    if (!user) {
      alert("請先登入以進行測驗！");
      router.push("/login");
    } else {
      router.push("/quiz");
    }
  };

  // 處理登出
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-indigo-100 to-blue-100 p-6">
        <p className="text-gray-700 text-2xl">載入中...</p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-indigo-100 to-blue-100 p-6">
      {/* 右上角按鈕 */}
      <div className="absolute top-6 right-6 space-x-4">
        {user ? (
          <>
            <button
              onClick={() => router.push("/profile")}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full shadow-md transition duration-300 transform hover:scale-105"
            >
              個人資料
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full shadow-md transition duration-300 transform hover:scale-105"
            >
              登出
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => router.push("/login")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full shadow-md transition duration-300 transform hover:scale-105"
            >
              登入
            </button>
            <button
              onClick={() => router.push("/signup")}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full shadow-md transition duration-300 transform hover:scale-105"
            >
              註冊
            </button>
          </>
        )}
      </div>

      {/* 主頁內容 */}
      <div className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-2xl text-center transition duration-300 transform hover:scale-105">
        <h1 className="text-5xl font-extrabold text-gray-800 mb-8 tracking-wide">
          英文模擬考試網站
        </h1>
        <p className="text-lg text-gray-600 mb-10">
          提供 TOEIC 練習與模擬考試，助您輕鬆提升英語能力！
        </p>
        <button
          onClick={() => router.push("/stages")}
          className="bg-gradient-to-r from-blue-500 to-teal-500 text-white px-8 py-4 rounded-full shadow-xl hover:opacity-90 transition duration-300 text-xl"
        >
          開始練習
        </button>
      </div>
    </div>
  );
}
