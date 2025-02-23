"use client";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";

export default function Quiz() {
  const params = useParams();
  const { stage } = params;
  const { user, isLoading, isGuest } = useAuth();
  const router = useRouter();
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  // 載入題目
  useEffect(() => {
    if (!isLoading && !user && !isGuest) {
      router.push("/login");
      return;
    }

    const loadQuestions = async () => {
      const { data } = await supabase
        .from("questions")
        .select("*")
        .eq("stage_number", stage)
        .order("id", { ascending: true });
      
      setQuestions(data || []);
      const initialAnswers = {};
      data?.forEach(q => initialAnswers[q.id] = -1);
      setAnswers(initialAnswers);
    };

    loadQuestions();
  }, [stage, user, isLoading, isGuest]);

  // 提交測驗
  const submitQuiz = async () => {
    const correctCount = questions.filter(q => 
      answers[q.id] === q.correct_index
    ).length;
    const newScore = parseFloat((correctCount / questions.length * 100).toFixed(1));

    // 更新進度
    if (isGuest) {
      const guestProgress = JSON.parse(localStorage.getItem("guest_progress") || "{}");
      const currentStage = Number(stage);
      const nextStage = currentStage + 1;

      // 更新當前關卡分數
      guestProgress[currentStage] = {
        is_unlocked: true,
        highest_score: Math.max(
          newScore,
          guestProgress[currentStage]?.highest_score || 0
        )
      };

      // 解鎖下一關
      if (currentStage < 20) {
        guestProgress[nextStage] = guestProgress[nextStage] || {
          is_unlocked: true,
          highest_score: 0
        };
      }

      localStorage.setItem("guest_progress", JSON.stringify(guestProgress));
    } else {
      await supabase.from("user_stage_progress").upsert({
        user_id: user.id,
        stage_number: Number(stage),
        is_unlocked: true,
        highest_score: Math.max(
          newScore,
          (await supabase
            .from("user_stage_progress")
            .select("highest_score")
            .eq("user_id", user.id)
            .eq("stage_number", stage))
            .data[0]?.highest_score || 0
        )
      });

      // 解鎖下一關
      if (Number(stage) < 20) {
        await supabase.from("user_stage_progress").upsert({
          user_id: user.id,
          stage_number: Number(stage) + 1,
          is_unlocked: true
        });
      }
    }

    setScore(newScore);
    setShowResult(true);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
        <p className="text-black">載入中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8 pb-32">
      <h1 className="text-3xl font-bold text-center mb-8 text-black">第 {stage} 關測驗</h1>
      <div className="space-y-8 max-w-3xl mx-auto">
        {questions.map((q, index) => (
          <div key={q.id} className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-black">題目 {index + 1}</h3>
              {showResult && (
                <span className={`text-sm px-2 py-1 rounded ${
                  answers[q.id] === q.correct_index 
                    ? "bg-green-100 text-green-800" 
                    : "bg-red-100 text-red-800"
                }`}>
                  {answers[q.id] === q.correct_index ? "正確" : "錯誤"}
                </span>
              )}
            </div>
            
            <p className="mb-4 text-lg text-black">{q.question}</p>
            
            <div className="grid grid-cols-2 gap-3">
              {q.options.map((opt, optIndex) => (
                <button
                  key={optIndex}
                  onClick={() => setAnswers({...answers, [q.id]: optIndex})}
                  className={`p-3 text-left rounded-lg border ${
                    answers[q.id] === optIndex
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300"
                  } ${
                    showResult && 
                    (optIndex === q.correct_index 
                      ? "!border-green-500 !bg-green-50"
                      : answers[q.id] === optIndex 
                        ? "!border-red-500 !bg-red-50"
                        : "")
                  } text-black`}
                >
                  {opt}
                </button>
              ))}
            </div>

            {showResult && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="font-semibold text-sm text-black">解析：</p>
                <p className="text-black">{q.explanation}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {!showResult && (
        <div className="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-lg">
          <div className="max-w-3xl mx-auto text-center">
            <button
              onClick={submitQuiz}
              className="px-8 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              結束測驗
            </button>
            <p className="mt-2 text-sm text-black">
              已作答 {Object.values(answers).filter(v => v !== -1).length}/{questions.length} 題
            </p>
          </div>
        </div>
      )}

      {showResult && (
        <div className="max-w-3xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-center text-black">測驗結果</h2>
          <div className="text-center">
            <div className={`text-4xl font-bold ${
              score >= 70 ? "text-green-600" : "text-red-600"
            }`}>
              {score}%
            </div>
            <button
              onClick={() => router.push("/stages")}
              className="mt-6 bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
            >
              返回關卡選擇
            </button>
          </div>
        </div>
      )}
    </div>
  );
}