import React, { useEffect, useMemo, useRef } from "react";
import gsap from "gsap";

/**
 * GSAP 타입라이터:
 * - text 바뀔 때마다 부드럽게 새로 타이핑
 * - prefers-reduced-motion이면 즉시 표시
 */
export function TypewriterText({ text, speed = 0.02, className, style }) {
  const spanRef = useRef(null);

  const reduceMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  }, []);

  useEffect(() => {
    const el = spanRef.current;
    if (!el) return;

    const next = (text ?? "").toString();

    if (reduceMotion || !next) {
      el.textContent = next;
      return;
    }

    // 기존 애니메이션 정리
    gsap.killTweensOf(el);
    el.textContent = "";

    // 한 글자씩 출력
    let i = 0;
    const tween = gsap.to(
      {},
      {
        duration: next.length * speed,
        ease: "none",
        onUpdate: () => {
          // 진행률 기반으로 글자 수 계산
          const p = tween.progress();
          const target = Math.floor(p * next.length);
          if (target !== i) {
            i = target;
            el.textContent = next.slice(0, i);
          }
        },
        onComplete: () => {
          el.textContent = next;
        },
      }
    );

    return () => tween.kill();
  }, [text, speed, reduceMotion]);

  return <span ref={spanRef} className={className} style={style} />;
}
