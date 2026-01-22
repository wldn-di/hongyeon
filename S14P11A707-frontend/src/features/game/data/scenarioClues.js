const ROOM_COUNT = 6

const cluePositions = [
  { roomIndex: 0, localX: 90, localY: 200 },
  { roomIndex: 1, localX: 235, localY: 220 },
  { roomIndex: 2, localX: 150, localY: 260 },
  { roomIndex: 3, localX: 210, localY: 190 },
  { roomIndex: 4, localX: 120, localY: 160 },
  { roomIndex: 5, localX: 240, localY: 250 },
]

const makeRooms = (names) =>
  names.slice(0, ROOM_COUNT).map((name, idx) => ({
    id: idx + 1,
    name,
    unlocked: true,
  }))

const scenarioRoomsById = {
  1: makeRooms(['범행 현장', '피해자 사무실', '창고', '용의자 거주지', 'CCTV 관제실', '주차장']),
  2: makeRooms(['호텔 객실', '복도', '프론트', '청소실', '보안실', '옥상']),
  3: makeRooms(['상속녀의 방', '가족 서재', '차고', '정원', '금고실', '부두']),
  4: makeRooms(['1등석', '2등석', '식당칸', '화장실', '연결통로', '기관실']),
  5: makeRooms(['현관', '거실', '서재', '다락', '지하실', '정원']),
}

const scenarioEvidenceById = {
  1: [
    {
      id: 1,
      name: '피 묻은 장갑',
      location: '범행 현장 (Room 1)',
      image: '/images/evidence/bloody-glove.png',
      description: '피해자의 혈액이 묻어있는 가죽 장갑. 남성용 L사이즈로 추정된다.',
      storyHint: '남성용 장갑(L) 사이즈로 추정된다.',
    },
    {
      id: 2,
      name: '지문 카드',
      location: '피해자 사무실 (Room 2)',
      image: '/images/evidence/fingerprint-card.png',
      description: '책상 서랍 손잡이에서 채취한 지문. 특정 인물과의 대조가 필요하다.',
      storyHint: '서랍 손잡이 지문은 대조가 필요하다.',
    },
    {
      id: 3,
      name: '협박 편지',
      location: '창고 (Room 3)',
      image: null,
      description: "신문 글자를 오려 붙인 협박 편지. '비밀을 폭로하겠다'는 내용.",
      storyHint: '신문 글자를 오려붙인 협박 편지다.',
    },
    {
      id: 4,
      name: '진흙 발자국',
      location: '주차장 (Room 6)',
      image: null,
      description: '바닥에서 발견된 진흙 발자국. 270mm 운동화로 추정된다.',
      storyHint: '270mm 운동화로 추정되는 발자국이다.',
    },
    {
      id: 5,
      name: '깨진 유리잔',
      location: '용의자 거주지 (Room 4)',
      image: null,
      description: '바닥에 깨진 와인잔. 수면제 성분이 검출되었다.',
      storyHint: '수면제 성분이 검출되었다.',
    },
    {
      id: 6,
      name: '목격자 진술서',
      location: 'CCTV 관제실 (Room 5)',
      image: '/images/evidence/witness-statement.png',
      description: '목격자의 진술이 담긴 문서. 시간대가 일부 모순된다.',
      storyHint: '진술 시간대에 모순이 있다.',
    },
  ],
  2: [
    {
      id: 1,
      name: '객실 카드키',
      location: '호텔 객실 (Room 1)',
      image: null,
      description: '객실 출입에 사용되는 카드키. 사용 기록이 남아있을 수 있다.',
      storyHint: '카드키 사용 기록을 확인할 수 있다.',
    },
    {
      id: 2,
      name: '잠금장치 파편',
      location: '복도 (Room 2)',
      image: null,
      description: '문틈에서 발견된 작은 금속 파편. 잠금장치 손상 흔적으로 보인다.',
      storyHint: '잠금장치 손상 흔적으로 보인다.',
    },
    {
      id: 3,
      name: '프론트 로그',
      location: '프론트 (Room 3)',
      image: null,
      description: '투숙객 출입 기록. 사건 시간대에 누가 드나들었는지 확인 가능하다.',
      storyHint: '사건 시간대 출입 동선을 확인할 수 있다.',
    },
    {
      id: 4,
      name: '청소 카트 영수증',
      location: '청소실 (Room 4)',
      image: null,
      description: '청소 도구 구매 내역. 특정 화학약품이 포함되어 있다.',
      storyHint: '특정 화학약품 구매 내역이 남아있다.',
    },
    {
      id: 5,
      name: '보안실 CCTV 캡처',
      location: '보안실 (Room 5)',
      image: null,
      description: '복도 CCTV 화면 캡처본. 인물의 실루엣이 희미하게 보인다.',
      storyHint: '희미한 인물 실루엣이 포착됐다.',
    },
    {
      id: 6,
      name: '옥상 열쇠고리',
      location: '옥상 (Room 6)',
      image: null,
      description: '낡은 열쇠고리. 특정 장소의 열쇠를 묶어두는 용도로 보인다.',
      storyHint: '특정 장소의 열쇠를 묶어둔 흔적이다.',
    },
  ],
  3: [
    {
      id: 1,
      name: '찢어진 편지',
      location: '상속녀의 방 (Room 1)',
      image: null,
      description: '급히 찢긴 편지 조각. 유산과 관련된 단어가 보인다.',
      storyHint: '유산과 관련된 단어가 보인다.',
    },
    {
      id: 2,
      name: '서재 금고 메모',
      location: '가족 서재 (Room 2)',
      image: null,
      description: '금고 비밀번호 힌트로 보이는 메모. 날짜와 이니셜이 적혀 있다.',
      storyHint: '금고 비밀번호 힌트로 보인다.',
    },
    {
      id: 3,
      name: '차고 블랙박스',
      location: '차고 (Room 3)',
      image: null,
      description: '차량 블랙박스 메모리. 삭제된 구간이 있다.',
      storyHint: '삭제된 구간이 있다.',
    },
    {
      id: 4,
      name: '정원 흙 묻은 장갑',
      location: '정원 (Room 4)',
      image: '/images/evidence/bloody-glove.png',
      description: '흙이 잔뜩 묻은 장갑. 최근 사용된 흔적이 있다.',
      storyHint: '최근 사용 흔적이 있다.',
    },
    {
      id: 5,
      name: '금고실 열쇠',
      location: '금고실 (Room 5)',
      image: null,
      description: '무겁고 낡은 금속 열쇠. 표면에 긁힌 자국이 많다.',
      storyHint: '표면에 긁힌 자국이 많다.',
    },
    {
      id: 6,
      name: '부두 출항 기록',
      location: '부두 (Room 6)',
      image: null,
      description: '소형 선박 출항 기록. 사건 당일 밤에 기록이 비어 있다.',
      storyHint: '사건 당일 밤 기록이 비어 있다.',
    },
  ],
  4: [
    {
      id: 1,
      name: '1등석 티켓 조각',
      location: '1등석 (Room 1)',
      image: null,
      description: '찢긴 승차권 조각. 좌석 번호가 일부 지워져 있다.',
      storyHint: '좌석 번호가 일부 지워져 있다.',
    },
    {
      id: 2,
      name: '분실물 보관표',
      location: '2등석 (Room 2)',
      image: null,
      description: '승객의 분실물 보관표. 사건 시간대에 발급된 흔적이 있다.',
      storyHint: '사건 시간대에 발급된 흔적이 있다.',
    },
    {
      id: 3,
      name: '식당칸 주문서',
      location: '식당칸 (Room 3)',
      image: null,
      description: '주문서에 적힌 필체가 특정 용의자와 유사하다.',
      storyHint: '필체가 특정 용의자와 유사하다.',
    },
    {
      id: 4,
      name: '화장실 물자국',
      location: '화장실 (Room 4)',
      image: null,
      description: '바닥에 남은 물자국. 약품 냄새가 희미하게 난다.',
      storyHint: '약품 냄새가 희미하게 난다.',
    },
    {
      id: 5,
      name: '연결통로 CCTV 캡처',
      location: '연결통로 (Room 5)',
      image: null,
      description: '연결통로 CCTV 캡처본. 후드 쓴 인물이 포착됐다.',
      storyHint: '후드 쓴 인물이 포착됐다.',
    },
    {
      id: 6,
      name: '기관실 정비일지',
      location: '기관실 (Room 6)',
      image: null,
      description: '정비일지에 기록된 시간대가 실제 운행 기록과 다르다.',
      storyHint: '기록된 시간대가 실제와 다르다.',
    },
  ],
  5: [
    {
      id: 1,
      name: '현관 발자국',
      location: '현관 (Room 1)',
      image: null,
      description: '젖은 발자국. 특정 방향으로 이어진다.',
      storyHint: '젖은 발자국이 특정 방향으로 이어진다.',
    },
    {
      id: 2,
      name: '거실 촛농',
      location: '거실 (Room 2)',
      image: null,
      description: '바닥에 떨어진 촛농. 의도적으로 연출된 듯하다.',
      storyHint: '의도적으로 연출된 흔적이다.',
    },
    {
      id: 3,
      name: '서재 숨겨진 문서',
      location: '서재 (Room 3)',
      image: null,
      description: '장부 속에 끼워진 문서. 오래된 가족 비밀이 적혀 있다.',
      storyHint: '오래된 가족 비밀이 적혀 있다.',
    },
    {
      id: 4,
      name: '다락 낡은 장난감',
      location: '다락 (Room 4)',
      image: null,
      description: '낡은 장난감. 특정 인물의 어린 시절과 연결된다.',
      storyHint: '특정 인물의 어린 시절과 연결된다.',
    },
    {
      id: 5,
      name: '지하실 쇠사슬',
      location: '지하실 (Room 5)',
      image: null,
      description: '벽에 고정된 쇠사슬. 최근에 사용된 흔적이 있다.',
      storyHint: '최근에 사용된 흔적이 있다.',
    },
    {
      id: 6,
      name: '정원 오래된 열쇠',
      location: '정원 (Room 6)',
      image: null,
      description: "숫자 '3'이 희미하게 새겨진 열쇠. 어떤 잠금을 여는지 확인이 필요하다.",
      storyHint: "숫자 '3'이 새겨진 열쇠다.",
    },
  ],
}

export const getScenarioRooms = (scenarioId) =>
  scenarioRoomsById[scenarioId] || scenarioRoomsById[1] || makeRooms([])

export const getScenarioEvidence = (scenarioId) =>
  scenarioEvidenceById[scenarioId] || scenarioEvidenceById[1] || []

export const getScenarioClues = (scenarioId) => {
  const rooms = getScenarioRooms(scenarioId)
  const evidence = getScenarioEvidence(scenarioId)

  return evidence.slice(0, ROOM_COUNT).map((e, idx) => {
    const pos = cluePositions[idx] || cluePositions[0]
    const roomName = rooms[pos.roomIndex]?.name || `Room ${pos.roomIndex + 1}`

    return {
      clueId: `${scenarioId}-${e.id}`,
      evidenceId: e.id,
      title: e.name,
      body: `${roomName}\n\n${e.description}`,
      ...pos,
    }
  })
}

export const getScenarioRoomCount = () => ROOM_COUNT
