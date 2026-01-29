// 브라우저에 '진행 중인 시나리오 생성 작업'을 기록
// 폴링을 통해 시나리오 생성이 완료/실패 됐을 시 알림을 보내줄 용도
const KEY = "pendingScenarioId";

export function setPendingScenarioId(id) {
  localStorage.setItem(KEY, String(id));
}

export function getPendingScenarioId() {
  const v = localStorage.getItem(KEY);
  return v ? Number(v) : null;
}

export function clearPendingScenarioId() {
  localStorage.removeItem(KEY);
}
