import { useState, useCallback } from "react";
import { createScenario as createScenarioApi } from "../api/scenariosApi";
import { mapScenarioCreateResponse } from "../api/scenarioMappers";
import { toast } from "sonner";
import {
  setPendingScenarioId,
  clearPendingScenarioId,
  getPendingScenarioId,
} from "@/features/scenarios/polling/scenarioJobStore";

/**
 * 시나리오 생성 Hook (전역 watcher(AppShell)와 연동)
 * 여기서는 생성 시작까지만 책임지고,
 * 완료/실패 알림은 AppShell watcher가 status 폴링으로 처리
 */
export function useCreateScenario() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(null);

  const createScenario = useCallback(async (formData) => {
    const pending = getPendingScenarioId();
    if (pending) {
      toast.error("이미 시나리오를 생성 중입니다. 취소 후 다시 시도해주세요.");
      return { success: false, error: "pending_exists" };
    }

    setIsGenerating(true);
    setProgress(0);
    setMessage("시나리오 생성을 시작합니다...");
    setError(null);

    try {
      const response = await createScenarioApi({
        title: formData.title,
        genre: formData.genre,
        suspectCount: formData.suspectCount,
        userSynopsis: formData.synopsis,
      });

      const result = mapScenarioCreateResponse(response);
      if (!result) throw new Error("생성 요청 실패");

      // 즉시 실패
      if (result.status === "FAILED") {
        setIsGenerating(false);
        setError(result.errorMessage || "생성 요청이 실패했습니다.");
        toast.error(result.errorMessage || "생성 요청이 실패했습니다.");
        return { success: false, error: result.errorMessage };
      }

      // 즉시 완료 (서버가 바로 완성본을 준 경우)
      if (result.status === "COMPLETED") {
        setIsGenerating(false);
        setProgress(100);
        setMessage("시나리오 생성 완료!");
        clearPendingScenarioId();
        toast.success("시나리오가 생성되었습니다.");
        return {
          success: true,
          scenarioId: result.scenarioId,
          status: "COMPLETED",
        };
      }

      // 진행형(PENDING/RUNNING 등): 전역 watcher가 추적하도록 등록
      if (result.scenarioId) {
        setPendingScenarioId(result.scenarioId);

        // Create 페이지에 오래 붙잡아둘 필요 없이 안내만 하고 끝
        setIsGenerating(false);
        setProgress(20);
        setMessage("생성 중입니다. 완료되면 알려드립니다.");
        toast.message("시나리오 생성 시작! 완료되면 알림으로 알려드립니다.");

        return {
          success: true,
          scenarioId: result.scenarioId,
          status: result.status ?? "PENDING",
          pending: true,
        };
      }

      // 예외 처리
      setIsGenerating(false);
      toast.error("생성 응답 형식이 올바르지 않습니다.");
      return { success: false, error: "invalid_response" };
    } catch (err) {
      setIsGenerating(false);
      setError(err.message || "시나리오 생성에 실패했습니다.");
      toast.error(err.message || "시나리오 생성에 실패했습니다.");
      return { success: false, error: err.message };
    }
  }, []);

  return {
    createScenario,
    isGenerating,
    progress,
    message,
    error,
  };
}
