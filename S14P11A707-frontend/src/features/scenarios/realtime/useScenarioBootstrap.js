import { useEffect, useRef, useState } from "react";
import { useScenarioGenerationGate } from "./useScenarioGenerationGate";

/**
 * 부팅 시 1회: "내 시나리오 중 GENERATING이 있나?"
 * GET /api/users/me/scenarios?page=0&size=20
 *
 * - 반복 호출 금지(= 폴링 아님)
 * - enabled가 true로 바뀌는 순간 딱 1회 실행되도록 가드
 */
export function useScenarioBootstrap({
  enabled = true,
  page = 0,
  size = 20,
  endpoint = "/api/users/me/scenarios",
} = {}) {
  const { dispatch } = useScenarioGenerationGate();
  const [bootstrapped, setBootstrapped] = useState(false);
  const ranRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    if (ranRef.current) return;

    ranRef.current = true;

    const run = async () => {
      try {
        const url = `${endpoint}?page=${page}&size=${size}`;
        const res = await fetch(url, { credentials: "include" });
        if (!res.ok) throw new Error(`bootstrap failed: ${res.status}`);

        const json = await res.json();
        const content = Array.isArray(json?.content) ? json.content : [];

        // Item: { id, status, progress, generationMessage, ... }
        const generating = content.find((it) => it?.status === "GENERATING");

        if (generating) {
          dispatch({
            type: "BOOTSTRAP_FOUND_GENERATING",
            payload: {
              scenarioId: generating.id,
              progress: generating.progress ?? 0,
              message: generating.generationMessage ?? "시나리오 생성 중…",
            },
          });
        } else {
          dispatch({ type: "BOOTSTRAP_NO_GENERATING" });
        }
      } catch (e) {
        // bootstrap 실패 시: 잠금 “오탐”보단 “미탐”이 UX는 낫지만,
        // 정확도 최우선이면 여기서 별도 에러 처리(토스트 등) 추가 가능
        // 일단 상태는 건드리지 않고 넘어감.
        console.warn(e);
      } finally {
        setBootstrapped(true);
      }
    };

    run();
  }, [enabled, endpoint, page, size, dispatch]);

  return { bootstrapped };
}
