import { supabase } from "./supabaseClient";

// 檢查用戶是否可解鎖下一關
export const checkUnlockConditions = async (userId: string, nextStage: number) => {
    const { data } = await supabase
      .from("user_stage_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("stage_number", nextStage);
  
    return data.length > 0 ? data[0].is_unlocked : false;
  };
  
  // 計算關卡完成度
  export const calculateStageProgress = (progressData) => {
    return progressData.reduce((acc, curr) => {
      acc[curr.stage_number] = curr;
      return acc;
    }, {});
  };