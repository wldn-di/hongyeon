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
      '💡 화면 중앙의 손전등 범위 안에서만 단서가 보여요. 어두운 곳은 직접 이동해서 비춰봐야 해요!',
      '❤️ 상단의 체력 게이지도 중요해요. 체력이 높을수록 최종 점수가 올라가요!',
    ],
  },
  movement: {
    speaker: '왓슨',
    avatar: '🧑‍💼',
    messages: [
      '먼저 현장을 탐색해봐요.',
      '🎮 Shift키를 누르면 손전등을 켜고 끌 수 있어요',
      '🎮 WASD로 이동, 반짝이는 단서 근처에서 Space로 수집!',
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
      '증거를 클릭하면 이렇게 상세 정보를 볼 수 있어요.',
      '이제 오른쪽을 보세요. 수사 로그가 업데이트됐을 거에요.',
    ],
  },
  logIntro: {
    speaker: '왓슨',
    avatar: '🧑‍💼',
    messages: [
      '수사 로그는 중요한 이벤트를 기록해요.',
      '증거 발견, 용의자 심문, 시스템 안내 등이 여기에 남아요.',
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
      '이영희 씨, 당황하는 모습이 어딘가 수상쩍어 보이는데요?',
      '좋아요! 이제 2층으로 올라가봐요.',
      '엘리베이터 앞에서 Space바를 누르고, 방향을 선택하세요!',
      '저는 먼저 올라가서 사건 현장을 살펴보고 있을 테니, 길 잃지말고 잘 찾아오세요!',
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
      '이영희 씨의 섬유조각이 붙어 있는 칼,',
      '이영희 씨의 필적이 담긴 편지..그리고 당황한 모습까지,',
      '이영희 씨가 범인이 확실해 보이죠?',
      '이제 증거들을 정리해볼 시간이에요!',
    ],
  },
  boardIntro: {
    speaker: '왓슨',
    avatar: '🧑‍💼',
    messages: [
      '헤매지 않고 잘 찾아오셨군요!',
      '그럼 이제 하단의 추리보드를 한번 열어볼까요?.',
    ],
  },
  boardDetail: {
    speaker: '왓슨',
    avatar: '🧑‍💼',
    messages: [
      '📌 추리보드 사용법을 알려드릴게요!',
      '1️⃣ 왼쪽 패널에서 항목을 드래그해서 추리보드에 올릴 수 있어요.',
      '2️⃣ 카드 위에 마우스를 올리면 상세정보를 볼 수 있어요.',
      '3️⃣ "확정"(빨간선) 또는 "의심"(노란선) 버튼 클릭 후 카드 2개를 클릭하면 연결돼요!',
      '4️⃣ 연결선을 클릭하면 삭제할 수 있어요.',
    ],
  },
  boardPractice: {
    speaker: '왓슨',
    avatar: '🧑‍💼',
    messages: [
      '🎯 이제 직접 해볼게요!',
      '✨ 왼쪽 패널에서 깜빡이는 항목들을 보드에 드래그하세요!',
      '📍 이영희 씨, 혈흔이 묻은 식칼, 1층 - 침실이에요!',
      '다 추가하면 다음 단계로 넘어갈게요!',
    ],
  },
  boardConnect: {
    speaker: '왓슨',
    avatar: '🧑‍💼',
    messages: [
      '🔗 이제 카드들을 연결해볼게요!',
      '1️⃣ 상단 "확정" 버튼(빨간선)을 클릭하세요.',
      '2️⃣ 피해자와 이영희, 혈흔이 묻은 식칼, 그리고 침실을 빨간 실로 연결하세요!',
      '💡 힌트: 4개 항목이 모두 연결되어야 제출할 수 있어요.',
    ],
  },
  boardSave: {
    speaker: '왓슨',
    avatar: '🧑‍💼',
    messages: [
      '✅ 잘 했어요! 마지막으로 "저장" 버튼을 눌러주세요.',
      '💾 "저장" 버튼을 꼭 눌러야 보드가 저장돼요!',
    ],
  },
  submit: {
    speaker: '왓슨',
    avatar: '🧑‍💼',
    messages: [
      '탐정님, 이제 모든 준비가 끝났어요!',
      '상단의 "최종 정답 제출"을 눌러주세요!',
      '🔴 빨간선으로 연결된 추리보드가 정답으로 제출돼요.',
      '⚠️ 범행 동기 입력은 필수!',
      '⚠️ 실제 게임에서는 제출 횟수가 점수에 영향을 줘요!',
    ],
  },
  review: {
    speaker: '왓슨',
    avatar: '🧑‍💼',
    messages: [
      '🎉 사건이 해결됐어요!',
      '📝 탐정님, 난이도와 별점을 매겨주세요!',
      '다른 탐정들에게 큰 도움이 될 거예요.',
    ],
  },
  report: {
    speaker: '왓슨',
    avatar: '🧑‍💼',
    messages: [
      '📋 수사보고서가 생성됐어요!',
      '이번 사건의 요약과 탐정님의 추리 과정이 기록되어 있어요.',
      '내 책장에서 다시 확인할 수도 있답니다!',
    ],
  },
  score: {
    speaker: '왓슨',
    avatar: '🧑‍💼',
    messages: [
      '📊 제가 몰래 최종 점수 산정 방법을 알려드릴게요!',
      '기본 점수는 50점에서 시작하고,',
      '체력, 단서, 추리보드 연결관계, 단서 수집 수...',
      '앗, 이제 가봐야 할 것 같아요.',
      'S등급은 얻기 정말 힘들다고 하는데, 탐정님이라면 꼭 얻으실 수 있을 거에요!',
      '그럼, 다음 수사도 같이 화이팅해봐요, 다음 사건 현장에서 기다리고 있을게요!',
    ],
  },
}

