import { supabase } from "./supabaseClient";

export const getUnlockStatus = async (
  userId: string | null,
  categoryId: number,
  stageNumber: number,
  isGuest: boolean
) => {
  // 獲取分類初始關卡設定
  const { data: categoryData } = await supabase
    .from("categories")
    .select("initial_stage_number")
    .eq("id", categoryId)
    .single();

  const initialStage = categoryData?.initial_stage_number || 1;

  // 初始關卡強制解鎖
  if (stageNumber === initialStage) return true;

  // 其他關卡維持原有邏輯
  if (isGuest) {
    const guestProgress = JSON.parse(localStorage.getItem("guest_progress") || "{}");
    return guestProgress[categoryId]?.[stageNumber]?.is_unlocked || false;
  } else {
    const { data } = await supabase
      .from("user_stage_progress")
      .select("is_unlocked")
      .eq("user_id", userId)
      .eq("category_id", categoryId)
      .eq("stage_number", stageNumber)
      .single();
    return data?.is_unlocked || false;
  }
};