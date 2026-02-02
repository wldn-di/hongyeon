import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Sparkles, Users, BookOpen, Layers, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useCreateScenario } from "@/features/scenarios/hooks/useCreateScenario";

import { getPendingScenarioId, clearPendingScenarioId } from "@/features/scenarios/polling/scenarioJobStore";
import { useScenarioJob } from "@/features/scenarios/polling/ScenarioJobContext";
import { deleteScenario } from "@/features/scenarios/api/scenariosApi";

// 장르 옵션
const genreOptions = [
  { value: "crime", label: "범죄/수사", icon: "🔍" },
  { value: "mystery", label: "미스터리", icon: "🔍" },
  { value: "horror", label: "공포/스릴러", icon: "🔍" }
];

// 용의자 수 옵션
const suspectCountOptions = [4, 5];

export default function CreateScenario() {
  const [, setLocation] = useLocation();
  const { createScenario, isGenerating, progress, message } = useCreateScenario();
  const { job, setJob } = useScenarioJob();

  // pendingId를 state로 관리해서 생성 취소 즉시 UI 반영
  const [pendingId, setPendingId] = useState(() => getPendingScenarioId());

  const [formData, setFormData] = useState({
    title: "",
    synopsis: "",
    suspectCount: 4,
    genre: "crime",
  });

  // pending으로 로컬스토리지에 저장돼 있거나 생성 중(isGenerating)이면 폼 잠금
  const locked = !!pendingId || isGenerating;

  const handleChange = (field, value) => {
    if (locked) return;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCancelPending = async () => {
    if (!pendingId) return;

    // UX: 즉시 버튼 잠금 느낌 주고 싶으면 toast.loading도 가능
    toast.message("생성 취소를 요청했어요...");

    try {
      // best effort: 백이 delete를 취소로 처리해주면 실제로도 멈춤
      await deleteScenario(pendingId);
      toast.success("생성 작업을 취소했어요. 이제 새로 만들 수 있어요.");
    } catch (e) {
      console.warn("[cancel] deleteScenario failed", e);
      // 서버가 취소 미지원이어도 UX는 풀어주되, 안내
      toast.message("취소 요청은 처리하지 못했지만, 새로 만들 수 있도록 화면을 해제했어요.");
    } finally {
      // 중요: 로컬 pending 제거 + UI 즉시 해제
      clearPendingScenarioId();
      setPendingId(null);
      setJob(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (locked) {
      toast.error("현재 다른 시나리오를 생성 중입니다. 취소 후 다시 시도해주세요.");
      return;
    }

    if (!formData.title.trim()) {
      toast.error("제목을 입력해주세요.");
      return;
    }
    if (!formData.synopsis.trim()) {
      toast.error("스토리 내용을 입력해주세요.");
      return;
    }

    const result = await createScenario(formData);
    console.log("[createScenario result]", result);

    // createScenario가 PENDING이면 success:true로 주고 목록으로 보내는 흐름
    if (result.success) {
      // 생성 시작/완료 여부와 상관없이 목록으로 이동(전역 watcher가 완료/실패 토스트)
      if (result.scenarioId) setPendingId(result.scenarioId);
      setLocation("/scenarios");
    }
  };

  const uiProgress = job?.progress ?? progress ?? 0;
  const uiMessage = job?.message ?? message ?? "";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 py-12">
        <div className="container max-w-2xl">
          {/* 뒤로가기 */}
          <Link href="/scenarios">
            <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              시나리오 목록으로
            </button>
          </Link>

          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold gold-glow mb-2">시나리오 만들기</h1>
            <p className="text-muted-foreground">AI가 당신만의 추리 시나리오를 생성해드립니다</p>
          </div>

          {/* pending이면 항상 생성 카드 표시 + 취소 버튼 */}
          {pendingId && (
            <div className="mb-6 bg-card border border-primary/30 rounded-lg p-6">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  <span className="font-bold text-primary">현재 AI가 시나리오 생성 중...</span>
                </div>

                <Button type="button" variant="outline" onClick={handleCancelPending}>
                  생성 취소
                </Button>
              </div>

              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div className="h-full bg-primary transition-all duration-300" style={{ width: `${uiProgress}%` }} />
              </div>
              <p className="text-sm text-muted-foreground mt-2">{uiMessage || "생성 중입니다. 완료되면 알림으로 알려드릴게요."}</p>
            </div>
          )}

          {/* 폼 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 제목 */}
            <div className="bg-card border border-border rounded-lg p-6">
              <label className="flex items-center gap-2 font-bold mb-3">
                <BookOpen className="w-5 h-5 text-primary" />
                시나리오 제목
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="시나리오의 제목을 입력하세요"
                className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={locked}
              />
              <p className="text-xs text-muted-foreground mt-2">* 제목은 AI에 의해 바뀔 수 있습니다.ㅂㅈ</p>
            </div>

            {/* 시놉시스 */}
            <div className="bg-card border border-border rounded-lg p-6">
              <label className="flex items-center gap-2 font-bold mb-3">
                <Sparkles className="w-5 h-5 text-primary" />
                스토리 아이디어
              </label>
              <textarea
                value={formData.synopsis}
                onChange={(e) => handleChange("synopsis", e.target.value)}
                placeholder="대략적인 스토리를 적어주세요&#10;&#10;예시:&#10;- 폐쇄된 섬에서 일어난 연쇄 살인&#10;- 키워드: 복수, 유산 분쟁, 과거의 비밀&#10;- 반전: 피해자가 실은 범인이었다"
                rows={6}
                className="w-full bg-muted border border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                disabled={locked}
              />
            </div>

            {/* 용의자 수 */}
            <div className="bg-card border border-border rounded-lg p-6">
              <label className="flex items-center gap-2 font-bold mb-3">
                <Users className="w-5 h-5 text-primary" />
                용의자 수
              </label>
              <div className="flex gap-3">
                {suspectCountOptions.map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => handleChange("suspectCount", count)}
                    className={cn(
                      "flex-1 py-3 rounded-lg border-2 font-bold transition-all",
                      formData.suspectCount === count ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50",
                      locked && "opacity-50 cursor-not-allowed"
                    )}
                    disabled={locked}
                  >
                    {count}명
                  </button>
                ))}
              </div>
            </div>

            {/* 장르 */}
            <div className="bg-card border border-border rounded-lg p-6">
              <label className="flex items-center gap-2 font-bold mb-3">
                <Layers className="w-5 h-5 text-primary" />
                장르
              </label>
              <div className="grid grid-cols-3 gap-3">
                {genreOptions.map((genre) => (
                  <button
                    key={genre.value}
                    type="button"
                    onClick={() => handleChange("genre", genre.value)}
                    className={cn(
                      "py-3 px-4 rounded-lg border-2 transition-all text-left",
                      formData.genre === genre.value ? "border-primary bg-primary/10" : "border-border hover:border-primary/50",
                      locked && "opacity-50 cursor-not-allowed"
                    )}
                    disabled={locked}
                  >
                    <span className="text-xl mr-2">{genre.icon}</span>
                    <span className="text-sm font-medium">{genre.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 제출 버튼 */}
            <div className="flex gap-4">
              <Link href="/scenarios" className="flex-1">
                <Button type="button" variant="outline" className="w-full py-6" disabled={locked}>
                  취소
                </Button>
              </Link>
              <Button type="submit" variant="neon" className="flex-[2] py-6" disabled={locked}>
                {locked ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    생성 중...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    시나리오 생성하기
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
