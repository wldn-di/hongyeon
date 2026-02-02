import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';

export function Atmosphere() {
    const [location] = useLocation();
    const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

    // 1. 게임 관련 페이지인지 확인
    const isGameMode = location.startsWith('/room/') || location.startsWith('/game/') || location.startsWith('/tutorial');

    // [수정됨] 여기서 return null을 하지 않습니다. (DOM 안정성 유지)

    useEffect(() => {
        // 게임 모드일 때는 이벤트 리스너도 붙이지 않아서 성능 최적화
        if (isGameMode) return;

        const handleMouseMove = (e) => {
            const x = (e.clientX / window.innerWidth) * 100;
            const y = (e.clientY / window.innerHeight) * 100;
            setMousePos({ x, y });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [isGameMode]); // isGameMode가 바뀔 때마다 실행 여부 결정

    return (
        // [핵심 수정] isGameMode가 true면 'hidden' 클래스를 추가해 CSS로 숨깁니다.
        // 이렇게 하면 컴포넌트가 사라지지 않고 숨기만 하므로 화면 깨짐 방지에 좋습니다.
        <div className={`fixed inset-0 pointer-events-none z-40 overflow-hidden ${isGameMode ? 'hidden' : ''}`}>

            {/* 1. 필름 그레인 */}
            <div
                className="absolute inset-0 opacity-[0.07] w-full h-full"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                    mixBlendMode: 'overlay',
                }}
            />

            {/* 2. 다이내믹 비네팅 */}
            <div
                className="absolute inset-0 transition-opacity duration-300"
                style={{
                    background: `radial-gradient(
            circle 1000px at ${mousePos.x}% ${mousePos.y}%, 
            transparent 10%, 
            rgba(0, 0, 0, 0.4) 60%, 
            rgba(0, 0, 0, 0.8) 100%
          )`,
                    mixBlendMode: 'multiply'
                }}
            />

            {/* 3. 스캔라인 */}
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