// Tutorial case data (used by `src/pages/Tutorial.jsx`)

export const tutorialStory = {
  title: '첫 번째 사건: 저택의 비밀',
  synopsis: '신입 탐정인 당신에게 첫 번째 사건이 배정되었습니다.\n\n오래된 저택에서 발생한 의문의 사망 사건.\n진실을 밝혀낼 수 있을까요?',

  truthReveal: `사건의 전말이 밝혀졌습니다.

범인은 피해자의 딸, 이영희.

그녀는 아버지의 유산을 독차지하기 위해
치밀한 계획을 세웠습니다.

사건 당일 밤, 이영희는 식칼로 아버지를 살해하고
급히 증거를 인멸하려 했습니다.

구겨진 편지는 그녀가 아버지에게 보내려던 협박장이었고,
3번 보관함 열쇠는 유언장이 든 금고의 것이었습니다.

모든 것이 완벽하다고 생각했지만...
당신의 날카로운 추리 앞에 무너졌습니다.`,

  culpritConfession: `...결국 들켰군요.

그 식칼... 급하게 씻었는데도 혈흔이 남았나요.
편지도 찢어버렸어야 했는데...

아버지는 유언장에서 저를 완전히 배제했어요.
"딸은 상속 자격이 없다"고...

그 열쇠로 금고를 열어 유언장을 바꾸려 했어요.
...후회는 없어요.`,

  culpritEscape: `...그럴 줄 알았어요.

당신도 결국 아무것도 찾지 못했군요.
식칼의 혈흔? 편지 조각? 열쇠?
아무도 연결하지 못하겠죠.

이 비밀은 영원히 묻힐 거예요.

...안녕히 계세요, 탐정님.`,
}

export const tutorialVictim = {
  id: 'victim-1',
  name: '박코난',
  age: 74,
  gender: '남성',
  role: '피해자 (저택 주인)',
  discoveryLocation: '지하실',
  estimatedDeathTime: '자정~새벽 2시',
  causeOfDeath: '자상으로 인한 과다출혈',
  background: '재벌 그룹의 은퇴한 회장. 최근 유산 분배 문제로 가족들과 갈등이 있었다.',
}

export const tutorialSuspects = [
  { id: 'suspect-1', name: '김철수', role: '집사', image: null, isCulprit: false },
  { id: 'suspect-2', name: '이영희', role: '피해자의 딸', image: null, isCulprit: true },
  { id: 'suspect-3', name: '박민수', role: '경호원', image: null, isCulprit: false },
]

export const tutorialEvidence = [
  {
    id: 1,
    name: '혈흔이 묻은 식칼',
    location: '지하실 (Room 1)',
    description: '누군가의 혈흔이 묻어있는 식칼이다.\n\n🔍 분석 결과:\n• 손잡이에 마른 진흙과 미세한 섬유가 엉겨 있음\n• 최근에 급하게 씻어낸 흔적 발견\n• 섬유는 이영희의 옷 재질과 일치\n\n💡 핵심: 급하게 세척했지만 혈흔이 남아있다.',
    storyHint: '이영희의 옷 섬유가 묻어있다...',
    suggestSuspect: 'suspect-2',
  },
  {
    id: 2,
    name: '구겨진 편지',
    location: '지하실 (Room 2)',
    description: '급히 찢었다가 다시 주워 담은 듯한 편지 조각이다.\n\n🔍 분석 결과:\n• "…오늘 밤… 엘리베이터…" 라는 단어가 희미하게 읽힘\n• 잉크가 번져 있어 원문 복원 필요\n• 필적이 이영희의 것과 92% 일치\n\n💡 핵심: 이영희가 쓴 편지를 왜 찢으려 했을까?',
    storyHint: '이영희의 필적... 왜 찢으려 했을까?',
    suggestSuspect: 'suspect-1',
  },
  {
    id: 3,
    name: '낡은 열쇠',
    location: '지하실 (Room 3)',
    description: '묵직한 금속 열쇠다.\n\n🔍 분석 결과:\n• 표면에 긁힌 자국이 많음\n• 숫자 "3"이 새겨져 있음\n• 피해자의 서재 금고 번호가 "3"번\n\n💡 핵심: 금고에는 유언장이 보관되어 있었다.',
    storyHint: '3번 금고... 유언장이 들어있었다.',
    suggestSuspect: 'suspect-3',
  },
]

export const tutorialRooms = [
  { id: 1, floor: 1, name: '1층 - 침실', unlocked: true },
  { id: 2, floor: 2, name: '2층 - 서재', unlocked: true },
  { id: 3, floor: 3, name: '3층 - 거실', unlocked: false },
]

// AgitRoom clue placement (local room coordinates)
export const tutorialClues = [
  {
    clueId: 'tutorial-1',
    evidenceId: 1,
    roomIndex: 0,
    localX: 90,
    localY: 200,
    title: '혈흔이 묻은 식칼',
    body: "누군가의 혈흔이 묻어있는 식칼이다.\n손잡이에는 마른 진흙과 미세한 섬유가 엉겨 있다.\n최근에 급하게 씻어낸 흔적이 보인다.",
  },
  {
    clueId: 'tutorial-2',
    evidenceId: 2,
    roomIndex: 1,
    localX: 235,
    localY: 220,
    title: '구겨진 편지',
    body: "급히 찢었다가 다시 주워 담은 듯한 편지 조각이다.\n'…오늘 밤… 엘리베이터…' 라는 단어가 희미하게 읽힌다.\n잉크가 번져 있어 원문은 복원해야 할 것 같다.",
  },
  {
    clueId: 'tutorial-3',
    evidenceId: 3,
    roomIndex: 2,
    localX: 150,
    localY: 260,
    title: '낡은 열쇠',
    body: "묵직한 금속 열쇠다.\n표면에 긁힌 자국이 많고 숫자 '3'이 새겨져 있다.\n어딘가의 보관함이나 문을 여는 열쇠일 가능성이 크다.",
  },
]

export const watsonDialogs = {
  welcome: {
    speaker: '왓슨',
    avatar: '🧑‍💼',
    messages: [
      '탐정님, 드디어 오셨군요!',
      '저는 조수 왓슨입니다. 이번 사건을 함께 해결해봐요.',
      '저는 탐정님의 조력자예요. 스토리 진행 중 힌트가 필요하거나 궁금한 점이 있으면 언제든 저한테 물어보세요!',
      '휴대폰의 연락처에서 저를 찾을 수 있어요.',
    ],
  },
  movement: {
    speaker: '왓슨',
    avatar: '🧑‍💼',
    messages: [
      '먼저 현장을 탐색해봐요.',
      'WASD 키로 이동하고, 단서 근처에서 스페이스바를 누르면 조사할 수 있어요.',
      '저기 뭔가 반짝이는 게 보이네요... 한번 확인해볼까요?',
    ],
  },
  firstClue: {
    speaker: '왓슨',
    avatar: '🧑‍💼',
    messages: [
      '혈흔이 묻은 식칼을 찾았어요!',
      '급하게 씻은 흔적이 있고, 이영희 씨 옷의 섬유가 묻어있대요.',
      '왼쪽 증거 목록에 추가됐어요. 클릭해서 자세히 확인해보세요!',
    ],
  },
  evidenceListIntro: {
    speaker: '왓슨',
    avatar: '🧑‍💼',
    messages: [
      '잘 하셨어요! 증거를 클릭하면 상세 정보를 볼 수 있어요.',
      '그리고 오른쪽을 보세요. 수사 로그가 업데이트됐죠?',
    ],
  },
  logIntro: {
    speaker: '왓슨',
    avatar: '🧑‍💼',
    messages: [
      '수사 로그는 중요한 이벤트를 기록해요.',
      '증거 발견, 추리보드 업데이트, 시스템 안내 등이 여기에 남아요.',
      '나중에 뭘 했는지 헷갈릴 때 유용하답니다!',
    ],
  },
  suggestChat1: {
    speaker: '왓슨',
    avatar: '🧑‍💼',
    messages: [
      '이 증거... 이영희 씨한테 물어보면 어떨까요?',
      '휴대폰으로 용의자에게 직접 질문할 수 있어요.',
      '📱 버튼을 눌러서 이영희 씨와 대화해보세요!',
    ],
  },
  secondClue: {
    speaker: '왓슨',
    avatar: '🧑‍💼',
    messages: [
      '좋아요! 이제 두 번째 단서를 찾으러 가요.',
      '현장에 "구겨진 편지"가 있다고 들었어요.',
      '엘리베이터로 다른 방을 탐색하고, 반짝이는 단서를 찾아보세요!',
    ],
  },
  secondClueFound: {
    speaker: '왓슨',
    avatar: '🧑‍💼',
    messages: [
      '구겨진 편지를 발견했어요!',
      '필적이 이영희 씨와 92%나 일치한대요.',
      '왜 자기가 쓴 편지를 찢으려 했을까요...?',
    ],
  },
  suggestChat2: {
    speaker: '왓슨',
    avatar: '🧑‍💼',
    messages: [
      '이 편지에 대해 집사 김철수 씨가 뭔가 알고 있을 것 같아요.',
      '그분은 저택의 모든 일을 알고 있으니까요.',
      '📱 버튼을 눌러서 김철수 씨와 대화해보세요!',
    ],
  },
  thirdClue: {
    speaker: '왓슨',
    avatar: '🧑‍💼',
    messages: [
      '마지막 단서가 남았어요!',
      '현장에 "낡은 열쇠"가 있을 거예요.',
      '엘리베이터로 이동해서 마지막 단서를 찾아보세요!',
    ],
  },
  thirdClueFound: {
    speaker: '왓슨',
    avatar: '🧑‍💼',
    messages: [
      '마지막 증거! 낡은 열쇠를 찾았어요.',
      '숫자 "3"이 새겨져 있고... 피해자의 금고 번호가 3번이래요.',
      '금고에는 유언장이 들어있었다고 하네요!',
    ],
  },
  suggestChat3: {
    speaker: '왓슨',
    avatar: '🧑‍💼',
    messages: [
      '열쇠에 대해 경호원 박민수 씨한테 물어볼까요?',
      '그분은 저택 출입을 관리했으니 뭔가 봤을 수도 있어요.',
      '📱 버튼을 눌러서 박민수 씨와 대화해보세요!',
    ],
  },
  phoneIntro: {
    speaker: '왓슨',
    avatar: '🧑‍💼',
    messages: [
      '증거는 충분히 모았어요. 이제 용의자들과 대화해볼까요?',
      '오른쪽 하단의 📱 휴대폰 버튼을 눌러보세요.',
      '각 용의자에게 메시지를 보내서 반응을 살펴보세요!',
      '💡 튜토리얼에서는 간단한 질문만 하지만, 실제 게임에서는 원하는 모든 질문을 자유롭게 할 수 있어요!',
    ],
  },
  phoneChatDone: {
    speaker: '왓슨',
    avatar: '🧑‍💼',
    messages: [
      '용의자들의 반응이 흥미롭죠?',
      '이영희 씨만 유독 방어적인 태도를 보이네요...',
      '이제 증거들을 정리해볼 시간이에요!',
    ],
  },
  boardIntro: {
    speaker: '왓슨',
    avatar: '🧑‍💼',
    messages: [
      '이제 증거들을 정리해볼 시간이에요!',
      '하단의 "추리보드" 버튼을 눌러보세요.',
      '추리보드에는 피해자와 용의자들이 이미 배치되어 있어요.',
    ],
  },
  boardDetail: {
    speaker: '왓슨',
    avatar: '🧑‍💼',
    messages: [
      '📌 추리보드 사용법을 알려드릴게요!',
      '1️⃣ 카드를 드래그해서 위치를 자유롭게 옮길 수 있어요.',
      '2️⃣ 왼쪽 증거 목록에서 "보드에 추가" 버튼을 눌러 증거를 추가하세요.',
      '3️⃣ 연결하고 싶은 카드 2개를 선택 후 연결하기 버튼을 누르세요! 선 종류도 선택할 수 있어요.',
      '4️⃣ 삭제하고 싶은 연결선을 클릭해 연결을 끊을 수 있어요.',
      '메모 추가 버튼으로 생각을 정리할 수도 있어요.',
      '한번 직접 해보세요! 닫으려면 하단 버튼을 누르세요.',
    ],
  },
  submit: {
    speaker: '왓슨',
    avatar: '🧑‍💼',
    messages: [
      '탐정님, 모든 준비가 끝났어요!',
      '증거를 다시 정리해볼게요:',
      '1️⃣ 혈흔이 묻은 식칼 → 이영희의 옷 섬유 발견',
      '2️⃣ 구겨진 편지 → 이영희 필적 92% 일치',
      '3️⃣ 낡은 열쇠 → 유언장 금고의 열쇠',
      '상단의 "최종 정답 제출"을 눌러 범인을 지목하세요!',
      '⚠️ 실제 게임에서는 1회만 가능하니 신중하게요!',
    ],
  },
}

