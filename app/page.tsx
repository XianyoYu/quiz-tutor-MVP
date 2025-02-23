"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Dialog } from "@headlessui/react";

export default function Home() {
  const router = useRouter();
  const { user, isLoading, isGuest, setIsGuest, logout } = useAuth();
  const [showModal, setShowModal] = useState(false);

  const handleStartPractice = () => {
    if (user || isGuest) {
      router.push("/stages");
    } else {
      setShowModal(true);
    }
  };

  const handleGuestMode = () => {
    if (!localStorage.getItem("guest_progress")) {
      localStorage.setItem("guest_progress", JSON.stringify({
        1: { is_unlocked: true, highest_score: 0 },
      }));
    }
    setIsGuest(true);
    router.push("/stages");
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-indigo-100 to-blue-100 p-6">
        <p className="text-gray-700 text-2xl">載入中...</p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-indigo-100 to-blue-100 p-6">
      <div className="absolute top-6 right-6 space-x-4">
        {user || isGuest ? (
          <>
            <button
              onClick={() => router.push("/profile")}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full shadow-md transition duration-300 transform hover:scale-105"
            >
              個人資料
            </button>
            <button
              onClick={() => (user ? logout() : setIsGuest(false))}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full shadow-md transition duration-300 transform hover:scale-105"
            >
              {user ? "登出" : "切換帳號"}
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

      <div className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-2xl text-center transition duration-300 transform hover:scale-105">
        <h1 className="text-5xl font-extrabold text-gray-800 mb-8 tracking-wide">英文模擬考試網站</h1>
        <p className="text-lg text-gray-600 mb-10">提供英語練習與模擬考試，助您輕鬆提升英語能力！</p>
        <button
          onClick={handleStartPractice}
          className="bg-gradient-to-r from-blue-500 to-teal-500 text-white px-8 py-4 rounded-full shadow-xl hover:opacity-90 transition duration-300 text-xl"
        >
          開始練習
        </button>
      </div>

      <Dialog open={showModal} onClose={() => setShowModal(false)} className="fixed z-50 inset-0 flex items-center justify-center">
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
        <div className="relative bg-white rounded-2xl p-8 max-w-sm mx-auto shadow-lg transform transition-all scale-100">
          <Dialog.Title className="text-2xl font-bold mb-6 text-black">選擇模式</Dialog.Title>
          <div className="space-y-4">
            <button
              onClick={() => {
                setShowModal(false);
                router.push("/login");
              }}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition duration-300"
            >
              登入以保存進度
            </button>
            <button
              onClick={() => {
                setShowModal(false);
                handleGuestMode();
              }}
              className="w-full bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 transition duration-300"
            >
              訪客身份遊玩
            </button>
            <p className="text-sm text-red-500 text-center">注意：訪客進度僅保存於本裝置</p>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
