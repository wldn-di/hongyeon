import { useCallback, useState } from "react";
import { toast } from "sonner";

import { createScenarioV2 } from "../api/scenariosApi";
import { useScenarioGeneration } from "../generation/ScenarioGenerationContext";

/**
 * 시나리오 생성 Hook (v2)
 * - 진행 상황은 SSE(/api/v2/scenarios/stream)로 전역 상태가 갱신됨
 * - pendingScenarioId(localStorage) / 폴링 로직은 사용하지 않음
 */
export function useCreateScenario() {
  const { generation, actions } = useScenarioGeneration();

  // 요청(POST) 자체의 로딩 상태
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const createScenario = useCallback(
    async (formData) => {
      if (generation.isScenarioGenerating) {
        toast.error("이미 시나리오를 생성 중입니다.");
        return { success: false, error: "already_generating" };
      }

      setIsGenerating(true);
      setError(null);

      try {
        const response = await createScenarioV2({
          title: formData.title,
          genre: formData.genre,
          suspectCount: formData.suspectCount,
          userSynopsis: formData.synopsis,
        });

        const scenarioId = Number(response?.scenarioId);
        const status = response?.status || "GENERATING";

        if (!Number.isFinite(scenarioId) || scenarioId <= 0) {
          toast.error("생성 응답 형식이 올바르지 않습니다.");
          return { success: false, error: "invalid_response" };
        }

        // 생성 시작 스냅샷(즉시 UX 차단)
        actions.setGeneratingSnapshot({
          scenarioId,
          progress: 0,
          generationMessage: "시나리오 생성을 시작합니다...",
        });

        toast.message("시나리오 생성 시작! 완료되면 알려드릴게요.");

        return {
          success: true,
          scenarioId,
          status,
        };
      } catch (err) {
        const message = err?.message || "시나리오 생성에 실패했습니다.";
        setError(message);
        toast.error(message);
        return { success: false, error: message };
      } finally {
        setIsGenerating(false);
      }
    },
    [generation.isScenarioGenerating, actions],
  );

  return {
    createScenario,
    isGenerating,
    error,
  };
}
