import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Sparkles, Users, BookOpen, Layers, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useCreateScenario } from "@/features/scenarios/hooks/useCreateScenario";
import { useScenarioGeneration } from "@/features/scenarios/generation/ScenarioGenerationContext";
import ScenarioGenerationStatusPanel from "@/components/ui/ScenarioGenerationStatusPanel";
import { useAuth } from "@/contexts/AuthContext";

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
  const { state, actions } = useAuth();
  const user = state.user;
  const authLoading = state.loading;
  const { generation } = useScenarioGeneration();
  const { createScenario, isGenerating } = useCreateScenario();

  const [formData, setFormData] = useState({
    title: "",
    synopsis: "",
    suspectCount: 4,
    genre: "crime",
  });

  // 전역 생성 상태가 true이면 새 생성 UX 차단
  const locked = generation.isScenarioGenerating || isGenerating;

  const handleChange = (field, value) => {
    if (locked) return;
    setFormData((prev) => ({ ...prev, [field]: value }));
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

    if (result.success) {
      setLocation("/scenarios");
    }
  };

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

          {authLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="text-center">
                <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-muted-foreground">로그인 상태를 확인하는 중...</p>
              </div>
            </div>
          ) : !user ? (
            <div className="bg-card/40 border border-border rounded-xl p-10 text-center mb-6">
              <p className="text-xl font-bold mb-2">로그인이 필요합니다</p>
              <p className="text-muted-foreground mb-6">시나리오를 만들려면 Google 로그인이 필요해요.</p>
              <Button variant="neon" onClick={() => actions.login()}>
                구글 로그인
              </Button>
            </div>
          ) : (
            <>
              <ScenarioGenerationStatusPanel />
              {locked && (
                <p className="mt-3 text-sm text-muted-foreground">
                  생성 중에는 새 시나리오 생성이 불가합니다. <span className="text-primary">🔔</span>에서 진행 상황을 확인하세요.
                </p>
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
              <p className="text-xs text-muted-foreground mt-2">* 제목은 AI에 의해 바뀔 수 있습니다.</p>
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
            </>
          )}
        </div>
      </main>
    </div>
  );
}
