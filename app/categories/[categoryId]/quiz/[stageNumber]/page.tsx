"use client";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import ReactMarkdown from "react-markdown";

export default function Quiz() {
  const { categoryId, stageNumber } = useParams<{ categoryId: string; stageNumber: string }>();
  const { user, isLoading, isGuest } = useAuth();
  const router = useRouter();
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [explanationVisibility, setExplanationVisibility] = useState<Record<string, boolean>>({});

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
        .eq("stage_number", stageNumber)
        .eq("category_id", categoryId)
        .order("id", { ascending: true });

      setQuestions(data || []);
      const initialAnswers: Record<string, number> = {};
      data?.forEach(q => (initialAnswers[q.id] = -1));
      setAnswers(initialAnswers);
    };
    loadQuestions();
  }, [stageNumber, categoryId, user, isLoading, isGuest]);

  // 當顯示結果時，自動捲動到頁面最上方
  useEffect(() => {
    if (showResult) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [showResult]);

  // 提交測驗
  const submitQuiz = async () => {
    try {
      const correctCount = questions.filter(
        (q) => answers[q.id] === q.correct_index
      ).length;
      const newScore = parseFloat(((correctCount / questions.length) * 100).toFixed(1));
      setScore(newScore);
  
      // 更新進度邏輯
      const updateProgress = async () => {
        const currentStage = Number(stageNumber);
        const nextStage = currentStage + 1;
  
        // 訪客模式處理
        if (isGuest) {
          const guestProgress = JSON.parse(localStorage.getItem("guest_progress") || "{}");
          const categoryProgress = guestProgress[categoryId] || {};
  
          // 更新當前關卡
          categoryProgress[currentStage] = {
            is_unlocked: true,
            highest_score: Math.max(newScore, categoryProgress[currentStage]?.highest_score || 0),
          };
  
          // 解鎖下一關
          if (currentStage < 20) {
            // 假設最多20關
            categoryProgress[nextStage] = categoryProgress[nextStage] || {
              is_unlocked: true,
              highest_score: 0,
            };
          }
  
          guestProgress[categoryId] = categoryProgress;
          localStorage.setItem("guest_progress", JSON.stringify(guestProgress));
        }
        // 登入用戶處理
        else if (user) {
          // 更新測驗紀錄
          const { error: quizError } = await supabase
            .from("quiz_results")
            .insert({
              user_id: user.id,
              category_id: categoryId,
              stage_number: currentStage,
              score: newScore,
              total_questions: questions.length, // 新增 total_questions
            });
  
          if (quizError) throw new Error("測驗紀錄儲存失敗：" + quizError.message);
  
          // 更新關卡進度
          const { error: progressError } = await supabase
            .from("user_stage_progress")
            .upsert({
              user_id: user.id,
              category_id: categoryId,
              stage_number: currentStage,
              is_unlocked: true,
              highest_score: Math.max(
                newScore,
                (await supabase
                  .from("user_stage_progress")
                  .select("highest_score")
                  .eq("user_id", user.id)
                  .eq("category_id", categoryId)
                  .eq("stage_number", currentStage))
                  .data?.[0]?.highest_score || 0
              ),
            });
  
          if (progressError) throw new Error("進度更新失敗：" + progressError.message);
  
          // 解鎖下一關
          if (currentStage < 20) {
            await supabase
              .from("user_stage_progress")
              .upsert({
                user_id: user.id,
                category_id: categoryId,
                stage_number: nextStage,
                is_unlocked: true,
                highest_score: 0,
              });
          }
        }
      };
  
      await updateProgress();
      setShowResult(true);
  
      // 強制刷新父頁面資料
      if (window.parent) {
        window.parent.postMessage("refreshProgress", "*");
      }
    } catch (error) {
      console.error("測驗提交錯誤：", error);
      alert("儲存測驗結果時發生錯誤，請檢查網路連線");
    }
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
      {/* 返回主頁按鈕 */}
      <button
        onClick={() => router.push("/")}
        className="absolute top-4 right-4 p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600"
      >
        返回主頁
      </button>

      <h1 className="text-3xl font-bold text-center mb-8 text-black">第 {stageNumber} 關測驗</h1>

      {showResult && (
        <div className="max-w-3xl mx-auto mb-8 p-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl shadow-2xl text-white">
          <h2 className="text-3xl font-bold text-center mb-4">測驗結果</h2>
          <div className="text-center">
            <div className={`text-5xl font-extrabold ${score >= 70 ? "text-green-200" : "text-red-200"}`}>
              {score}%
            </div>
            <p className="mt-2 text-lg">您的答題表現</p>
            <button
              onClick={() => router.push(`/categories/${categoryId}/stages`)}
              className="mt-6 bg-white text-indigo-600 font-semibold px-6 py-3 rounded-full hover:bg-gray-100 transition duration-300"
            >
              返回關卡選擇
            </button>
          </div>
        </div>
      )}

      <div className="space-y-8 max-w-3xl mx-auto">
        {questions.map((q, index) => (
          <div key={q.id} className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-black">題目 {index + 1}</h3>
              {showResult && (
                <span
                  className={`text-sm px-2 py-1 rounded ${
                    answers[q.id] === q.correct_index ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}
                >
                  {answers[q.id] === q.correct_index ? "正確" : "錯誤"}
                </span>
              )}
            </div>
            <p className="mb-4 text-lg text-black">{q.question}</p>
            <div className="grid grid-cols-2 gap-3">
              {q.options.map((opt, optIndex) => (
                <button
                  key={optIndex}
                  onClick={() => setAnswers({ ...answers, [q.id]: optIndex })}
                  className={`p-3 text-left rounded-lg border ${
                    answers[q.id] === optIndex ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"
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
              <>
                <button
                  onClick={() =>
                    setExplanationVisibility({ ...explanationVisibility, [q.id]: !explanationVisibility[q.id] })
                  }
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
                >
                  {explanationVisibility[q.id] ? "隱藏解析" : "顯示解析"}
                </button>
                {explanationVisibility[q.id] && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-300">
                    <p className="font-bold text-lg text-black mb-2">解析：</p>
                    <div className="text-black leading-relaxed">
                      <ReactMarkdown components={{ em: ({ node, ...props }) => <strong {...props} /> }}>
                        {q.explanation}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </>
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
              已作答 {Object.values(answers).filter((v) => v !== -1).length}/{questions.length}題
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
