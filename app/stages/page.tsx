"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";

export default function Stages() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [stages, setStages] = useState([]);
  const [progress, setProgress] = useState({});

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
      return;
    }

    const fetchData = async () => {
      const { data: stagesData } = await supabase.from("stages").select("*");
      setStages(stagesData);

      const { data: progressData } = await supabase
        .from("user_stage_progress")
        .select("*")
        .eq("user_id", user.id);
      
      const progressMap = {};
      progressData.forEach(p => progressMap[p.stage_number] = p);
      setProgress(progressMap);
    };

    if (user) fetchData();
  }, [user, isLoading]);

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

      <h1 className="text-5xl font-bold text-center mb-12 text-gray-800">選擇關卡</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {stages.map(stage => (
          <div 
            key={stage.stage_number}
            className="p-6 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-shadow transform hover:-translate-y-2"
          >
            <h3 className="text-2xl font-bold mb-3 text-gray-700">第 {stage.stage_number} 關</h3>
            <p className="text-md text-gray-600 mb-4">{stage.title}</p>
            
            {progress[stage.stage_number]?.is_unlocked ? (
              <>
                <p className="text-green-500 font-semibold mb-4">
                  最高分：{progress[stage.stage_number].highest_score}%
                </p>
                <button
                  onClick={() => router.push(`/quiz/${stage.stage_number}`)}
                  className="w-full bg-blue-500 text-white py-3 rounded-xl hover:bg-blue-600 transition"
                >
                  {progress[stage.stage_number].highest_score > 0 ? '重新挑戰' : '開始挑戰'}
                </button>
              </>
            ) : (
              <div className="bg-gray-200 p-3 rounded-xl text-center">
                <p className="text-gray-500">需完成前一關卡解鎖</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
