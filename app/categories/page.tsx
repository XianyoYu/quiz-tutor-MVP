"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";

export default function Categories() {
  const { user, isLoading, isGuest } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    if (!isLoading && !user && !isGuest) {
      router.push("/login");
      return;
    }

    const fetchCategories = async () => {
      const { data } = await supabase
        .from("categories")
        .select("*")
        .order("order");
      setCategories(data || []);
    };
    fetchCategories();
  }, [user, isLoading, isGuest]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
        <p className="text-black">載入中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 p-8">
      <button
        onClick={() => router.push("/")}
        className="fixed top-4 left-4 bg-gray-700 text-white px-4 py-2 rounded-lg shadow-md hover:bg-gray-600 transition"
      >
        返回主頁
      </button>

      <h1 className="text-5xl font-bold text-center mb-12 text-gray-800">選擇題目類別</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {categories.map((category) => (
          <div
            key={category.id}
            className="p-6 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-shadow transform hover:-translate-y-2"
          >
            <h3 className="text-2xl font-bold mb-3 text-gray-700">{category.name}</h3>
            <p className="text-md text-gray-600 mb-4">{category.description}</p>
            <button
              onClick={() => router.push(`/categories/${category.id}/stages`)}
              className="w-full bg-blue-500 text-white py-3 rounded-xl hover:bg-blue-600 transition"
            >
              選擇此類別
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}