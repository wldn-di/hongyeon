import { useEffect, useRef } from "react";
import { fetchScenarioStatus } from "@/features/scenarios/api/scenariosApi";
import {
  getPendingScenarioId,
  clearPendingScenarioId,
} from "./scenarioJobStore";

/**
 * 앱이 켜져 있는 동안 pendingScenarioId가 있으면 주기적으로 상태 확인
 * onTick: 진행율 업데이트용
 * COMPLETED / FAILED 시 pending을 지우고 콜백 호출
 */
export function useScenarioJobWatcher({
  intervalMs = 3000, //3초 간격 풀링
  onCompleted,
  onFailed,
  onTick,
} = {}) {
  const timerRef = useRef(null);

  useEffect(() => {
    let alive = true;

    const tick = async () => {
      const scenarioId = getPendingScenarioId();
      if (!scenarioId || !alive) return;

      try {
        const res = await fetchScenarioStatus(scenarioId); // 서버로 시나리오 상태 보내달라고 요청 보내기

        // 진행상태 전달 (progress/message 포함 가능)
        onTick?.(res);

        // 완료면 작업 중인 시나리오를 저장해둔 로컬저장소에서 삭제
        if (res?.status === "COMPLETED") {
          clearPendingScenarioId();
          onCompleted?.(res);
          return;
        }

        // 실패 시에도 마찬가지
        if (res?.status === "FAILED") {
          clearPendingScenarioId();
          onFailed?.(res);
          return;
        }
        // PENDING / RUNNING 같은 상태면 그냥 계속 기다림
      } catch (e) {
        // 네트워크 일시 오류면 다음 tick에서 다시 시도
        // (여기서 pending을 지우면 안 됨)
        console.warn("[ScenarioJobWatcher] status check failed", e);
      }
    };

    tick(); // 시작 즉시 1번 체크
    timerRef.current = setInterval(tick, intervalMs); // 그 다음부터는 interval마다 체크

    // 컴포넌트가 언마운트되면 interval 정리
    return () => {
      alive = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [intervalMs, onCompleted, onFailed, onTick]);
}
