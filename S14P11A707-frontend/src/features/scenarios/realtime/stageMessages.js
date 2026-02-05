// ScenarioV2StreamEvent.EventType 기준
export function buildStageMessage({ stageType, progress, message, meta }) {
  // 서버에서 message를 내려주면 그게 1순위(팀 합의로 고정 문구일 확률 높음)
  const m = (message ?? "").trim();
  if (m) return m;

  const p = typeof progress === "number" ? progress : 0;
  const getNum = (k) => {
    const v = meta?.[k];
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : null;
  };

  // 보조 데이터
  const retry = getNum("retry");
  const maxRetry = getNum("maxRetry") ?? 3;
  const done = getNum("done");
  const total = getNum("total");

  switch (stageType) {
    case "WAITING":
      return "생성 대기 중이에요. 잠시만 기다려 주세요.";
    case "TIMELINE":
      return "탐정이 사건 개요를 받아 적는 중이에요.";
    case "CHARACTERS_CLUES_TRUTH":
      return "탐정이 증거물들을 검토하고 있어요…";
    case "ROOMS":
      return "현장을 재구성하고 있어요…";
    case "CRITIQUE":
      return "알리바이의 모순을 찾는 중…";
    case "REFINE":
      return `허점을 보강하고 있어요… (재검토 ${retry ?? "?"}/${maxRetry})`;
    case "IMAGE_PROMPT":
      return "증거 사진 촬영 지시서를 작성 중…";
    case "IMAGE_PROGRESS":
      return `증거 사진을 확보 중… (${done ?? "?"}/${total ?? "?"})`;
    case "FINALIZE":
      return "수사 보고서를 마무리하는 중…";
    case "VALIDATE":
      return "단서들의 정합성을 확인 중…";
    case "PERSIST":
      return "사건 기록을 보관 중…";
    default:
      // stageType이 없거나 CONNECT/PING 등일 때는 progress 기반 fallback
      if (p < 20) return "탐정이 사건 개요를 받아 적는 중이에요.";
      if (p < 40) return "탐정이 증거물들을 검토하고 있어요…";
      if (p < 55) return "현장을 재구성하고 있어요…";
      if (p < 65) return "알리바이의 모순을 찾는 중…";
      if (p < 95) return "증거 사진을 확보 중…";
      return "수사 보고서를 마무리하는 중…";
  }
}
