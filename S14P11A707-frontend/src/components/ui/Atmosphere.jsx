import { useEffect, useState } from 'react';

export function Atmosphere() {
    const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

    // 마우스 움직임에 따라 그림자(비네팅)가 살짝 움직이게 해서 입체감을 줌
    useEffect(() => {
        const handleMouseMove = (e) => {
            // 화면 전체 크기 대비 마우스 위치 (0~100%)
            const x = (e.clientX / window.innerWidth) * 100;
            const y = (e.clientY / window.innerHeight) * 100;
            setMousePos({ x, y });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">

            {/* 1. 필름 그레인 (Noise) 효과 */}
            {/* 투명도를 0.05~0.1 사이로 조절해서 '자글자글한' 느낌 강도 조절 */}
            <div
                className="absolute inset-0 opacity-[0.07] w-full h-full"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                    mixBlendMode: 'overlay',
                }}
            />

            {/* 2. 다이내믹 비네팅 (Vignette) 효과 */}
            {/* 마우스가 있는 곳이 조금 더 밝고, 주변은 어둡게 처리 */}
            <div
                className="absolute inset-0 transition-opacity duration-300"
                style={{
                    background: `radial-gradient(
            circle 1000px at ${mousePos.x}% ${mousePos.y}%, 
            transparent 10%, 
            rgba(0, 0, 0, 0.4) 60%, 
            rgba(0, 0, 0, 0.8) 100%
          )`,
                    mixBlendMode: 'multiply' // 배경과 자연스럽게 섞임
                }}
            />

            {/* (선택) 3. 아주 얇은 스캔라인 (구형 모니터 느낌) */}
            <div
                className="absolute inset-0 w-full h-full opacity-[0.03]"
                style={{
                    background: 'linear-gradient(to bottom, transparent 50%, #000 50%)',
                    backgroundSize: '100% 4px'
                }}
            />
        </div>
    );
}