// 더미 로그 데이터
const initialGameLogs = [
  {
    id: 1,
    time: "00:05:23",
    type: "evidence",
    message: "범행 현장에서 [피 묻은 장갑] 발견",
  },
  {
    id: 2,
    time: "00:12:45",
    type: "memo",
    message: "메모 추가: 범행 시각 추정 22:00~23:00",
  },
  {
    id: 3,
    time: "00:18:30",
    type: "interrogation",
    message: "김철수 심문 완료",
  },
  { id: 4, time: "00:25:10", type: "save", message: "추리보드 저장됨" },
  {
    id: 5,
    time: "00:32:15",
    type: "evidence",
    message: "피해자 사무실에서 [협박 편지] 발견",
  },
  {
    id: 6,
    time: "00:38:42",
    type: "interrogation",
    message: "이영희 심문 완료",
  },
];

// 더미 증거 목록
const initialEvidenceList = [
  {
    id: 1,
    name: "피 묻은 장갑",
    location: "범행 현장",
    image: "/images/evidence/bloody-glove.png",
    description:
      "피해자의 혈액이 묻어있는 가죽 장갑. 남성용 L사이즈로 추정된다.",
  },
  {
    id: 2,
    name: "발자국",
    location: "범행 현장",
    image: null,
    description: "창고 바닥에서 발견된 진흙 발자국. 270mm 운동화로 추정.",
  },
  {
    id: 3,
    name: "협박 편지",
    location: "피해자 사무실",
    image: null,
    description: "신문 글자를 오려 붙인 협박 편지. '비밀을 폭로하겠다'는 내용.",
  },
  {
    id: 4,
    name: "깨진 유리잔",
    location: "범행 현장",
    image: null,
    description: "바닥에 깨진 와인잔. 수면제 성분 검출됨.",
  },
];

// 더미 방 목록
const roomList = [
  { id: 1, name: "범행 현장", image: "/images/img1.png", unlocked: true },
  { id: 2, name: "피해자 사무실", image: "/images/img2.png", unlocked: true },
  { id: 3, name: "주차장", image: "/images/img3.png", unlocked: true },
  { id: 4, name: "CCTV 관제실", image: "/images/img4.png", unlocked: false },
  { id: 5, name: "피해자 자택", image: "/images/img5.png", unlocked: false },
];

const scenarioRoomImages = {
  1: "/images/rooms/crime-scene.jpg",
  2: "/images/rooms/hotel-room.jpg",
  3: "/images/rooms/mansion.jpg",
  4: "/images/rooms/train.jpg",
  5: "/images/rooms/old-house.jpg",
};

const scenarioThumbnails = {
  1: "/images/img1.png",
  2: "/images/img2.png",
  3: "/images/img3.png",
  4: "/images/img4.png",
  5: "/images/img5.png",
};

// 조력자 정보
const helperInfo = {
  id: "helper",
  name: "조수 왓슨",
  image: "/images/helper.png",
  isHelper: true,
};

// 조력자 초기 메시지
const getHelperInitialMessage = (scenarioTitle) => ({
  id: Date.now(),
  sender: "helper",
  text: `안녕하세요, 탐정님. "${scenarioTitle}" 사건 수사를 도와드리겠습니다. 궁금한 점이 있으시면 언제든 물어보세요!`,
  time: new Date().toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  }),
});

const generateDummyReport = (playerName = "탐정") => ({
  playerName,
  scenarioTitle: "살인의 추억",
  playTime: "42:15",
  grade: "A",
  accuracy: 85,
  hintsUsed: 2,
  interrogations: 5,
  evidenceFound: 8,
  correctDeductions: 6,
  totalDeductions: 7,
  summary:
    "훌륭한 추리력을 보여주셨습니다. 대부분의 증거를 정확하게 분석했으며, 범인의 동기를 정확히 파악했습니다.",
  timeline: [
    { time: "00:05", event: "첫 번째 증거 발견" },
    { time: "00:15", event: "용의자 김철수 심문" },
    { time: "00:25", event: "핵심 단서 발견" },
    { time: "00:35", event: "범인 특정" },
    { time: "00:42", event: "사건 해결" },
  ],
});

// TODO: 플레이 정상 작동 하지 않아서 해당 데이터 export
export {
  initialGameLogs,
  initialEvidenceList,
  roomList,
  scenarioRoomImages,
  scenarioThumbnails,
  helperInfo,
  getHelperInitialMessage,
  generateDummyReport,
}