"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";

export default function Profile() {
  const { user, isLoading, logout, isGuest } = useAuth();
  const [categoriesProgress, setCategoriesProgress] = useState<any[]>([]);
  const [stageCountMap, setStageCountMap] = useState<Record<number, number>>({}); // 新增 stageCountMap 狀態
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user && !isGuest) {
      router.push("/login");
      return;
    }

    const fetchProgress = async () => {
      try {
        // 取得所有分類
        const { data: categories } = await supabase
          .from("categories")
          .select("*")
          .order("order");

        // 取得各分類的關卡總數
        const { data: categoryStages } = await supabase
          .from("category_stages")
          .select("category_id");

        // 計算每個分類的關卡數量
        const stageCountMap = categoryStages?.reduce((acc, stage) => {
          acc[stage.category_id] = (acc[stage.category_id] || 0) + 1;
          return acc;
        }, {} as Record<number, number>); // 確保是 `Record<number, number>` 型別

        setStageCountMap(stageCountMap || {}); // 將 stageCountMap 存入狀態

        // 取得使用者的進度
        let progressData;
        if (isGuest) {
          const guestProgress = JSON.parse(
            localStorage.getItem("guest_progress") || "{}"
          );
          progressData = Object.entries(guestProgress).flatMap(
            ([categoryId, stages]) =>
              Object.entries(stages as object).map(([stageNumber, data]) => ({
                category_id: Number(categoryId),
                stage_number: Number(stageNumber),
                ...(data as object),
              }))
          );
        } else {
          const { data } = await supabase
            .from("user_stage_progress")
            .select("*")
            .eq("user_id", user?.id);
          progressData = data || [];
        }

        // 合併分類與進度數據
        const combined = categories?.map((category) => {
          const categoryStages = progressData
            .filter((p) => p.category_id === category.id)
            .sort((a, b) => a.stage_number - b.stage_number);

          // 取得該分類的關卡總數
          const totalStages = stageCountMap[category.id] || 1; // 避免除以 0

          // 計算總進度（最高分加總 / (關卡數 * 100) * 100%）
          const completedPercentage = categoryStages.reduce(
            (sum, stage) => sum + (stage.highest_score || 0),
            0
          );
          const totalPercentage = (completedPercentage / (totalStages * 100)) * 100;

          return {
            ...category,
            stages: categoryStages,
            totalProgress: totalPercentage.toFixed(1),
          };
        });

        setCategoriesProgress(combined || []);
      } catch (error) {
        console.error("資料載入失敗:", error);
      }
    };

    if (user || isGuest) fetchProgress();
  }, [user, isLoading, isGuest, router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
        <p className="text-black">載入中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800">學習進度總覽</h1>
          <button
            onClick={logout}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl shadow-lg transition duration-300"
          >
            {isGuest ? "切換帳號" : "登出"}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {categoriesProgress.map((category) => (
            <div
              key={category.id}
              className="bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-shadow"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">
                  {category.name}
                </h2>
                <span className="text-lg font-bold text-blue-600">
                  {category.totalProgress}%
                </span>
              </div>

              {/* 總進度條 */}
              <div className="h-4 bg-gray-200 rounded-full mb-6 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${category.totalProgress}%` }}
                />
              </div>

              <div className="space-y-4">
                {Array.from({ length: stageCountMap[category.id] || 0 }).map(
                  (_, index) => {
                    const stageNumber = index + 1;
                    const stage = category.stages.find(
                      (s: any) => s.stage_number === stageNumber
                    );
                    const score = stage?.highest_score || 0;

                    return (
                      <div
                        key={stageNumber}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="relative w-12 h-12">
                            <svg className="w-full h-full" viewBox="0 0 100 100">
                              <circle
                                className="text-gray-200"
                                strokeWidth="8"
                                stroke="currentColor"
                                fill="transparent"
                                r="46"
                                cx="50"
                                cy="50"
                              />
                              <circle
                                className="text-blue-500"
                                strokeWidth="8"
                                strokeDasharray={`${2 * Math.PI * 46}`}
                                strokeDashoffset={
                                  2 * Math.PI * 46 * (1 - score / 100)
                                }
                                strokeLinecap="round"
                                stroke="currentColor"
                                fill="transparent"
                                r="46"
                                cx="50"
                                cy="50"
                                transform="rotate(-90 50 50)"
                              />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-700">
                              {score}%
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800">
                              第 {stageNumber} 關
                            </h3>
                            <p className="text-sm text-gray-500">
                              最佳成績: {score}%
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            router.push(
                              `/categories/${category.id}/quiz/${stageNumber}`
                            )
                          }
                          className="px-4 py-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition"
                        >
                          {score > 0 ? "重新挑戰" : "開始挑戰"}
                        </button>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}