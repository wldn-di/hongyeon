import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Disc3, Minimize2, SkipBack, SkipForward, Play, Pause, Volume2, VolumeX } from 'lucide-react';

// 🎵 플레이리스트 설정
const MAIN_PLAYLIST = [
    { title: "메인 테마 1", file: "PageBgm1.mp3" },
    { title: "메인 테마 2", file: "PageBgm2.mp3" },
];
const GAME_PLAYLIST = [
    { title: "게임 BGM 1", file: "GameBgm1.mp3" },
    { title: "게임 BGM 2", file: "GameBgm2.mp3" },
];

export function Turntable() {
    const [location] = useLocation();
    const isGameMode = location.startsWith('/room/') || location.startsWith('/game/') || location.startsWith('/tutorial');
    const currentPlaylist = isGameMode ? GAME_PLAYLIST : MAIN_PLAYLIST;

    // 1. 기본 상태: 재생 중(true)
    const [isPlaying, setIsPlaying] = useState(true);

    // 2. [변경됨] 기본 상태: 펼쳐짐(false) - 처음에 팝업이 열려있음
    const [isMinimized, setIsMinimized] = useState(true);

    const [trackIndex, setTrackIndex] = useState(0);
    const [volume, setVolume] = useState(0.15);

    const audioRef = useRef(null);
    const prevModeRef = useRef(isGameMode);

    // 3. 초기화 및 자동 재생 (브라우저 정책 대응)
    useEffect(() => {
        audioRef.current = new Audio();
        audioRef.current.loop = true;
        audioRef.current.volume = volume;
        audioRef.current.src = `/assets/sound/bgm/${currentPlaylist[0].file}`;

        // 무조건 재생 시도
        const playPromise = audioRef.current.play();

        // 브라우저가 막았을 때 대비 (클릭 시 재생)
        const forcePlayOnInteraction = () => {
            if (audioRef.current) {
                audioRef.current.play()
                    .then(() => {
                        setIsPlaying(true);
                        document.removeEventListener('click', forcePlayOnInteraction);
                        document.removeEventListener('keydown', forcePlayOnInteraction);
                    })
                    .catch(e => console.log("아직 준비 안됨:", e));
            }
        };

        if (playPromise !== undefined) {
            playPromise.catch(() => {
                console.log("⚠️ 자동 재생 차단됨. 사용자 클릭 대기 중...");
                setIsPlaying(false); // 일단 멈춤 표시 (애니메이션 정지)

                // 유저가 화면 어디든 클릭하면 바로 재생 시작
                document.addEventListener('click', forcePlayOnInteraction);
                document.addEventListener('keydown', forcePlayOnInteraction);
            });
        }

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            document.removeEventListener('click', forcePlayOnInteraction);
            document.removeEventListener('keydown', forcePlayOnInteraction);
        };
    }, []);

    // 4. 볼륨 변경 반영
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    // 5. 모드 변경 감지
    useEffect(() => {
        if (!audioRef.current) return;
        const hasModeChanged = prevModeRef.current !== isGameMode;
        if (hasModeChanged) {
            setTrackIndex(0);
            audioRef.current.src = `/assets/sound/bgm/${currentPlaylist[0].file}`;
            audioRef.current.play()
                .then(() => setIsPlaying(true))
                .catch(e => console.log('Auto play error:', e));
            prevModeRef.current = isGameMode;
        }
    }, [isGameMode, currentPlaylist]);

    // 6. 트랙 변경 감지
    useEffect(() => {
        if (!audioRef.current) return;
        const nextSrc = `/assets/sound/bgm/${currentPlaylist[trackIndex].file}`;
        const currentSrcPath = audioRef.current.src.split('/').pop();

        if (decodeURIComponent(currentSrcPath) !== currentPlaylist[trackIndex].file) {
            audioRef.current.src = nextSrc;
            audioRef.current.play()
                .then(() => setIsPlaying(true))
                .catch(e => console.log(e));
        }
    }, [trackIndex, currentPlaylist]);

    // 컨트롤러 핸들러
    const togglePlay = (e) => {
        e?.stopPropagation();
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play().catch((e) => console.log(e));
            setIsPlaying(true);
        }
    };
    const nextTrack = (e) => {
        e?.stopPropagation();
        setTrackIndex((prev) => (prev + 1) % currentPlaylist.length);
    };
    const prevTrack = (e) => {
        e?.stopPropagation();
        setTrackIndex((prev) => (prev - 1 + currentPlaylist.length) % currentPlaylist.length);
    };
    const handleVolumeChange = (e) => {
        e.stopPropagation();
        setVolume(parseFloat(e.target.value));
    };
    const toggleSize = () => setIsMinimized(!isMinimized);

    const currentTrack = currentPlaylist[trackIndex] || currentPlaylist[0];

    return (
        <div data-board-safe-area="true" className="fixed bottom-6 right-6 z-[220] flex flex-col items-end">

            {/* ▼▼▼ 기본적으로 이 부분이 보임 (Open 상태) ▼▼▼ */}
            {!isMinimized && (
                <div className="bg-neutral-900/95 p-4 rounded-xl border border-neutral-700 shadow-2xl backdrop-blur-md mb-2 flex flex-col items-center w-[220px] animate-in slide-in-from-bottom-5 fade-in duration-300">

                    {/* 상단바 */}
                    <div className="flex justify-between items-center w-full mb-4">
                        <span className={`text-[10px] font-mono tracking-widest px-2 py-0.5 rounded ${isGameMode ? 'bg-red-900/50 text-red-400' : 'bg-primary/10 text-primary'}`}>
                            {isGameMode ? 'GAME MODE' : 'MAIN MODE'}
                        </span>
                        {/* 최소화 버튼 */}
                        <button onClick={toggleSize} className="text-neutral-400 hover:text-white transition-colors">
                            <Minimize2 size={16} />
                        </button>
                    </div>

                    {/* 턴테이블 본체 */}
                    <div
                        className="relative cursor-pointer mb-4 rounded-lg border border-neutral-600 shadow-inner overflow-hidden flex items-center justify-center bg-neutral-800"
                        onClick={togglePlay}
                        style={{ width: '160px', height: '140px' }}
                    >
                        {/* 이미지 */}
                        <img
                            src="/images/lp.png"
                            alt="LP Vinyl"
                            className={`
                                w-[136px] h-[136px] rounded-full object-cover
                                transition-transform duration-[0.5s]
                                ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}
                                ${isGameMode ? 'border-2 border-red-900/50 shadow-[0_0_15px_rgba(220,38,38,0.3)]' : 'border-2 border-neutral-900/50 shadow-lg'}
                            `}
                        />

                        {/* 톤암 (바늘) */}
                        <div
                            className="absolute top-2 right-2 w-1.5 h-20 bg-neutral-400 origin-top rounded-full transition-transform duration-500 shadow-lg border border-neutral-500 z-10"
                            style={{ transform: isPlaying ? 'rotate(25deg)' : 'rotate(-10deg)' }}
                        >
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-5 bg-neutral-300 rounded-sm" />
                        </div>
                    </div>

                    {/* 곡 정보 */}
                    <div className="w-full text-center mb-2 overflow-hidden">
                        <p className="text-sm font-bold text-white truncate px-2">{currentTrack.title}</p>
                        <p className="text-xs text-neutral-500 font-mono mt-0.5 truncate">{currentTrack.file}</p>
                    </div>

                    {/* 볼륨 슬라이더 */}
                    <div className="flex items-center gap-2 w-full px-2 mb-3">
                        {volume === 0 ? <VolumeX size={14} className="text-neutral-500"/> : <Volume2 size={14} className="text-neutral-400"/>}
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={volume}
                            onChange={handleVolumeChange}
                            className={`
                                w-full h-1 rounded-lg appearance-none cursor-pointer
                                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:hover:scale-125 [&::-webkit-slider-thumb]:transition-transform
                                ${isGameMode ? 'bg-red-900/50 accent-red-600' : 'bg-neutral-700 accent-primary'}
                            `}
                        />
                    </div>

                    {/* 재생 컨트롤러 */}
                    <div className="flex items-center justify-center gap-4 w-full border-t border-neutral-800 pt-3">
                        <button onClick={prevTrack} className="p-2 text-neutral-400 hover:text-white rounded-full transition-all active:scale-95">
                            <SkipBack size={20} fill="currentColor" />
                        </button>
                        <button
                            onClick={togglePlay}
                            className={`p-3 text-black rounded-full hover:scale-105 transition-all shadow-lg ${isGameMode ? 'bg-red-600 hover:bg-red-500 shadow-red-900/20' : 'bg-primary hover:bg-primary/90 shadow-primary/20'}`}
                        >
                            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
                        </button>
                        <button onClick={nextTrack} className="p-2 text-neutral-400 hover:text-white rounded-full transition-all active:scale-95">
                            <SkipForward size={20} fill="currentColor" />
                        </button>
                    </div>
                </div>
            )}

            {/* 접혔을 때 버튼 (최소화했을 때만 보임) */}
            {isMinimized && (
                <button
                    onClick={toggleSize}
                    className={`
                        w-14 h-14 rounded-full flex items-center justify-center shadow-2xl border-2
                        transition-all duration-300 hover:scale-110 hover:-translate-y-1
                        ${isPlaying
                        ? (isGameMode ? 'bg-neutral-900 border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.5)]' : 'bg-neutral-900 border-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]')
                        : 'bg-neutral-800 border-neutral-600'
                    }
                    `}
                >
                    <Disc3
                        size={28}
                        className={`
                             ${isPlaying
                            ? (isGameMode
                                    ? 'text-red-600 animate-[spin_3s_linear_infinite]'
                                    : 'text-primary animate-[spin_3s_linear_infinite]'
                            )
                            : 'text-neutral-400'}
                          transition-colors duration-300
                        `}
                    />
                    {isPlaying && (
                        <span className="absolute top-0 right-0 flex h-3 w-3">
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isGameMode ? 'bg-red-600' : 'bg-primary'}`}></span>
                          <span className={`relative inline-flex rounded-full h-3 w-3 ${isGameMode ? 'bg-red-600' : 'bg-primary'}`}></span>
                        </span>
                    )}
                </button>
            )}
        </div>
    );
}
