"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { useAuth } from "@/context/AuthContext";

export default function Stages() {
  const params = useParams() as { categoryId: string }; // 確保 categoryId 是 string
  const categoryId = params.categoryId;
  const router = useRouter();
  const { user, isLoading, isGuest } = useAuth();
  const [stages, setStages] = useState<any[]>([]);
  const [progress, setProgress] = useState<Record<number, any>>({});
  const [initialStage, setInitialStage] = useState(1);
  const [isFetching, setIsFetching] = useState(true);

  // 防錯機制：檢查 categoryId 是否有效
  if (isNaN(Number(params.categoryId))) {
    console.error("Invalid category ID:", params.categoryId);
    router.push("/categories");
    return null;
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. 獲取分類初始關卡
        const { data: categoryData } = await supabase
          .from("categories")
          .select("initial_stage_number")
          .eq("id", categoryId)
          .single();

        setInitialStage(categoryData?.initial_stage_number || 1);

        // 2. 獲取關卡資料
        const { data: stagesData, error: stagesError } = await supabase
          .from("category_stages")
          .select("*")
          .eq("category_id", categoryId)
          .order("stage_number", { ascending: true })
          .range(0, 50); // 限制最大 50 筆

        if (stagesError) throw stagesError;

        // 3. 若無資料顯示錯誤
        if (!stagesData?.length) {
          console.error("No stages found for category:", categoryId);
          router.push("/categories");
          return;
        }

        setStages(stagesData);

        // 4. 獲取用戶進度
        if (isGuest) {
          // 訪客模式：從本地存儲獲取進度
          const guestProgress = JSON.parse(
            localStorage.getItem("guest_progress") || "{}"
          );
          const categoryProgress = guestProgress[categoryId] || {};
          setProgress(categoryProgress);
        } else if (user) {
          // 登入用戶：從資料庫獲取進度
          const { data: progressData, error: progressError } = await supabase
            .from("user_stage_progress")
            .select("*")
            .eq("user_id", user.id)
            .eq("category_id", categoryId);

          if (progressError) throw progressError;

          const progressMap = progressData?.reduce((acc, curr) => {
            acc[curr.stage_number] = curr;
            return acc;
          }, {});
          setProgress(progressMap || {});
        }
      } catch (error) {
        console.error("資料獲取失敗:", error);
      } finally {
        setIsFetching(false);
      }
    };

    fetchData();
  }, [categoryId, user, isGuest]);

  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-blue-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-opacity-75"></div>
        <p className="mt-4 text-xl font-semibold text-gray-700 animate-pulse">載入中，請稍候...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 p-8">
      <button
        onClick={() => router.push("/categories")}
        className="fixed top-4 left-4 bg-gray-700 text-white px-4 py-2 rounded-lg shadow-md hover:bg-gray-600 transition"
      >
        返回分類
      </button>

      <h1 className="text-5xl font-bold text-center mb-12 text-gray-800">選擇關卡</h1>

      {stages.length === 0 ? (
        <div className="bg-yellow-100 p-6 rounded-xl shadow-lg max-w-md mx-auto text-center">
          <p className="text-gray-700">此分類暫無可用關卡，請聯繫管理員</p>
          <button
            onClick={() => router.push("/categories")}
            className="mt-4 bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-600 transition"
          >
            返回分類選擇
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {stages.map((stage) => {
            const stageProgress = progress[stage.stage_number];
            const isUnlocked =
              stageProgress?.is_unlocked || stage.stage_number === initialStage;
            const highestScore = stageProgress?.highest_score || 0;

            return (
              <div
                key={stage.stage_number}
                className="p-6 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition transform hover:-translate-y-2"
              >
                <h3 className="text-2xl font-bold mb-3 text-gray-700">{stage.title}</h3>
                <p className="text-md text-gray-600 mb-4">{stage.description}</p>

                {isUnlocked ? (
                  <>
                    <p className="text-green-500 font-semibold mb-4">
                      最高分：{highestScore}%
                    </p>
                    <button
                      onClick={() =>
                        router.push(`/categories/${categoryId}/quiz/${stage.stage_number}`)
                      }
                      className="w-full bg-blue-500 text-white py-3 rounded-xl hover:bg-blue-600 transition"
                    >
                      {highestScore > 0 ? "重新挑戰" : "開始挑戰"}
                    </button>
                  </>
                ) : (
                  <div className="bg-gray-200 p-3 rounded-xl text-center">
                    <p className="text-gray-500">需完成前一關卡解鎖</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}