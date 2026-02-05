package com.ssafy.s14p11a707.scenario.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.s14p11a707.config.RedisConfig;
import com.ssafy.s14p11a707.exception.BaseException;
import com.ssafy.s14p11a707.exception.ErrorCode;
import com.ssafy.s14p11a707.game.entity.ScenarioRanking;
import com.ssafy.s14p11a707.game.repository.ScenarioRankingRepository;
import com.ssafy.s14p11a707.scenario.dto.*;
import com.ssafy.s14p11a707.scenario.entity.*;
import com.ssafy.s14p11a707.scenario.repository.*;
import com.ssafy.s14p11a707.scenario.service.RoomLayoutService; // ??추�???
import com.ssafy.s14p11a707.scenario.service.ScenarioService;
import com.ssafy.s14p11a707.user.entity.User;
import com.ssafy.s14p11a707.user.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.Objects;
import java.util.Random;
import java.util.stream.Collectors;

@Slf4j
@Service
public class ScenarioServiceImpl implements ScenarioService {

    // Keep clue placement consistent with room object layout rules
    private static final int ROOM_WIDTH = 320;
    private static final int ROOM_HEIGHT = 320;
    private static final int PADDING = 30;
    private static final int ITEM_GAP = 5;
    private static final int CLUE_WIDTH = 24;
    private static final int CLUE_HEIGHT = 24;
    private static final int DOOR_SAFE_RADIUS = 60;

    private final Random random = new Random();

    private final ChatClient chatClient;
    private final EmbeddingModel embeddingModel;
    //private final ScenarioReActHandler reActHandler;
    private final ScenarioRepository scenarioRepository;
    private final VictimRepository victimRepository;
    private final SuspectRepository suspectRepository;
    private final ClueRepository clueRepository;
    private final RoomRepository roomRepository;
    private final ScenarioRankingRepository scenarioRankingRepository;
    private final UserRepository userRepository;

    // ★ 랜덤 가구 배치 서비스 주입
    private final RoomLayoutService roomLayoutService;

    public ScenarioServiceImpl(
            @Qualifier("genAiChatClient") ChatClient chatClient,
            @Qualifier("googleGenAiTextEmbedding") EmbeddingModel embeddingModel,
            ScenarioRepository scenarioRepository,
            VictimRepository victimRepository,
            SuspectRepository suspectRepository,
            ClueRepository clueRepository,
            RoomRepository roomRepository,
            ScenarioRankingRepository scenarioRankingRepository,
            UserRepository userRepository,
            RoomLayoutService roomLayoutService) {
        this.chatClient = chatClient;
        this.embeddingModel = embeddingModel;
        this.scenarioRepository = scenarioRepository;
        this.victimRepository = victimRepository;
        this.suspectRepository = suspectRepository;
        this.clueRepository = clueRepository;
        this.roomRepository = roomRepository;
        this.scenarioRankingRepository = scenarioRankingRepository;
        this.userRepository = userRepository;
        this.roomLayoutService = roomLayoutService;
    }

    @Override
    @Transactional
    public ScenarioCreateResponse createScenario(ScenarioCreateRequest request, long userId) {
        User creator = userRepository.findById(userId)
                .orElseThrow(() -> new BaseException(ErrorCode.UNAUTHORIZED));
        int estimatedSeconds = Math.max(20, Math.min(120, 25 + request.suspectCount() * 10));
        //log.info("createScenario request suspectCount={}", request.suspectCount()); 프론트에서 백으로 요청이 잘 전달되는지 디버깅용
        ScenarioCreateResponse.OriginalRequest originalRequest = new ScenarioCreateResponse.OriginalRequest(request.title(), request.userSynopsis(), request.genre(), request.suspectCount());
        try {
            // 1. 사용자 입력 메시지
            String userMessage = String.format("""
                    {
                      "title": "%s",
                      "genre": "%s",
                      "suspect_count": %d,
                      "synopsis": "%s"
                    }
                    """, request.title(), request.genre(), request.suspectCount(), request.userSynopsis());

            // ========================================================================
            // 1단계: 타임라인 생성
            // ========================================================================
            int suspectCount = request.suspectCount();

            String timelineSystemMessage = String.format("""
                                         첫번째 AI 호출 작업 = 사건과 사건이 일어난 하루의 Timeline 생성과 관련 인물 기본 배경 생성
                    
                                         Persona: 당신은 전문 추리 게임 시나리오 작가입니다. 당신은 논리적으로 사건의 트릭, 반전, 그리고 타임라인이 독자 및 게임의 사용자들이 납득할 수 있는 시나리오를 작성하는데 있어서 특화되어 있습니다.
                                         당신은 사용자가 제공한 '장르', '인원수', '간단한 시놉시스'를 바탕으로 사건의 기본 인물 명단과 타임라인을 우선 작성해야 합니다. 아래 명시된 형식과 내용을 기반으로 응답하고, 절대 사담을 섞지 마십시오. 반드시 순수한 JSON 형식으로만 출력하십시오, 작업의 순서는 다음과 같습니다:
                    
                                         사건이 일어난 하루의 타임라인을 30분 간격으로 JSON 배열 형식으로 작성하십시오.
                    
                                         당신은 전문 추리 게임 시나리오 작가입니다. 사용자의 입력을 바탕으로 사건의 트릭과 개연성이 확보된 타임라인을 작성하십시오. 사담 없이 JSON 형식으로만 응답하십시오.
                    
                    		             [요청 정보]
                                            - 요청된 용의자 수: %d명 (피해자 제외)
                    
                    		             [절대 규칙]
                                            - suspects 배열의 원소 개수는 반드시 %d개여야 한다.
                                            - 많거나 적으면 실패로 간주한다. (추가 설명 금지, JSON만 출력)
                    
                                         [작성 규칙]
                                         1. 사건 당일의 타임라인을 30분 간격으로 구성하십시오.
                                         2. 범인 은닉: 살해 행위를 특정 인물과 연결하지 말고 "비명 소리", "사건 발생" 등 객관적 현상으로 서술하십시오.
                                         3. 중립적 서술: 모든 인물의 행동은 알리바이 증명이나 의심스러운 정황 위주로 구성하십시오.
                                         4. 결말 포함 금지: 사인 확인이나 엔딩 내용은 배제하고 사건 발견 직후의 혼란 상황까지만 묘사하십시오.
                    		             5. 인물 생성: 반드시 "피해자 1명"과 "용의자 %d명"을 생성하십시오. (총 인원 %d명)
                    		             6. suspects 배열의 길이는 정확히 %d여야 합니다.
                                         7. 나이 제외: 인물의 '나이'는 서사적 개연성을 위해 이후 단계에서 결정할 예정이므로 여기서는 포함하지 마십시오.
                    
                                         출력 예시:
                                        {
                                           "cast": {
                                                     "victim": { "name": "이름", "gender": "남성/여성", "occupation": "직업" },
                                                     "suspects": [
                                                       { "id": 1, "name": "이름", "gender": "성별", "occupation": "직업" },
                    				                   { "id": 2, "name": "이름", "gender": "성별", "occupation": "직업" },
                                                      ]
                                                     },
                                                     "timeline": [
                                                       {"time": "22:00", "event": "피해자가 연구실에 도착"},
                                                       ...
                                                       ]
                                                      }
                    				  Response strictly in JSON format.
                    """, suspectCount, suspectCount, suspectCount + 1, suspectCount, suspectCount);

            StringBuilder timelineSb = new StringBuilder();
            String content = chatClient.prompt()
                    .system(timelineSystemMessage)
                    .user(userMessage)
                    .call()
                    .content();
            timelineSb.append(content);
            String timelineJson = timelineSb.toString();
            timelineJson = timelineJson.replaceAll("```json\\s*", "")
                    .replaceAll("```\\s*$", "")
                    .trim();

            log.info("1단계 타임라인 생성 완료: {}", timelineJson);

            // ========================================================================
            // 2단계: 시나리오 기본 정보 생성 (타임라인 기반)
            // ========================================================================
            String scenarioSystemMessage1 = String.format("""
                                        Persona: 당신은 전문 추리 게임 시나리오 작가입니다. 당신은 논리적으로 사건의 트릭, 반전, 그리고 타임라인이 독자 및 게임의 사용자들이 납득할 수 있는 시나리오를 작성하는데 있어서 특화되어 있습니다.
                                        당신은 [1단계 데이터]를 바탕으로 하여 시나리오의 전체 설정을 JSON 형식으로 작성하십시오. 아래 명시된 형식과 내용을 기반으로 응답하고, 절대 사담을 섞지 마십시오. 반드시 순수한 JSON 형식으로만 출력하십시오.
                    
                                        [작성 규칙]
                                        1. 유저가 입력한 제목과 시놉시스를 확장하여 200자 내외의 synopsisDetail을 작성하십시오.
                                        2. story_config_json 내의 timeline에는 1단계의 내용을 사용하여 필드를 추가하십시오.
                                        3. 인명 준수: 반드시 1단계에서 생성된 이름(cast 데이터)만 사용하십시오.
                    
                                        [1단계 데이터]:
                                        %s
                    
                                        [1단계 타임라인 데이터] 기반으로 scenario 객체(title, synopsis, synopsisDetail, story_config_json)를 생성하십시오.
                    
                    시나리오 작성 형식:
                    
                    {
                       "scenario": {
                         "title": "[시나리오 제목]",
                         "synopsis": "[한 줄 요약]",
                         "synopsisDetail": "[상세 줄거리]",
                         "thumbnailUrl": "[썸네일 이미지 URL]",
                         "story_config_json": {
                           "incident_time": "[YYYY-MM-DD HH:MM 형식의 발생 시각]",
                           "twist": "[반전 요소]",
                           "timeline": [
                             {
                               "time": "HH:MM",
                               "event": "내용",
                             }
                           ],
                         }
                       }
                     }
                    
                    Response strictly in JSON format without any markdown code blocks or prose.
                    """, timelineJson);

            StringBuilder step1Sb = new StringBuilder();
            String content1 = chatClient.prompt()
                    .system(scenarioSystemMessage1)
                    .user("Generate scenario based on the timeline above.")
                    .call()
                    .content();
            step1Sb.append(content1);
            String step1Response = step1Sb.toString();
            step1Response = step1Response.replaceAll("```json\\s*", "")
                    .replaceAll("```\\s*$", "")
                    .trim();

            log.info("2단계 기본 정보 생성 완료: {}", step1Response);

            // ========================================================================
            // 3단계: 용의자, 피해자, 증거 정보 생성
            // ========================================================================
            String scenarioSystemMessage2 = String.format("""
                    
                                                   Persona: 당신은 전문 추리 게임 시나리오 작가입니다. 당신은 논리적으로 사건의 트릭, 반전, 그리고 타임라인이 독자 및 게임의 사용자들이 납득할 수 있는 시나리오를 작성하는데 있어서 특화되어 있습니다.
                                                   당신은 이전 호출에서 생성한 [scenario 객체(Timeline, title, synopsis, synopsisDetail, story_config_json) 를 포함한 이전 시나리오 설정]을 바탕으로 피해자, 용의자(요청된 수만큼), 증거(8~12개)를 JSON 형식으로 작성하십시오. 아래 명시된 형식과 내용을 기반으로 응답하고, 절대 사담을 섞지 마십시오. 반드시 순수한 JSON 형식으로만 출력하십시오.
                    
                                                    [핵심 요청 사항]
                    				                    - 유저가 요청한 용의자 수: %d명
                    
                                                       [작성 규칙]
                                                       1. 데이터 연동: 1단계의 이름과 성별 그리고 직업은 절대 변경하지 마십시오.
                                                       2. 정합성: 모든 용의자의 weakness_clue는 반드시 하단의 clues 배열에 동일한 정보로 존재해야 합니다.
                                                       3. 레드 헤링: 단서 중 최소 2개는 사건과 무관한 용의자의 개인적 비밀(도박, 불륜 등)을 담으십시오.
                                                       4. 익명화: revealed_truth에서 "A의 지문" 대신 "누군가의 지문"과 같이 서술하여 유저의 대조 추리를 유도하십시오.
                                                       5. 실명 금지: 메모나 일기 단서에서 용의자 이름을 직접 쓰지 말고 이니셜이나 지칭어를 사용하십시오.
                                                       6. 증거 개수: clues 배열은 반드시 8개 이상 12개 이하로 구성하십시오.
                                                       7. 나이 설정: 각 인물의 직업, 피해자와의 관계, 범행 동기의 깊이를 고려하여 가장 개연성 있는 '나이(age)'를 숫자로 부여하십시오. (예: 피해자와 20년 전 원한 관계라면 나이는 최소 30대 후반 이상이어야 함)
                                                       8. 증거 정합성: 생성된 '나이'나 '성격'이 증거(clues)의 설명과 모순되지 않아야 합니다. (예: 근력이 필요한 증거인데 나이가 너무 많지 않은지 확인)
                                                       9. 알리바이: 타임라인에 맞춰 각 용의자가 숨기고 있는 비밀과 거짓말을 설계하십시오.
                    
                                                       위 설정을 바탕으로 victim, suspects 배열, clues 배열, truth_config_json을 생성하십시오. 용의자 수는 반드시 유저가 요청한 수와 일치해야 합니다.
                    
                                                       [이전 단계 시나리오 정보]:
                                                       %s
                    
                                                       시나리오 작성 형식:
                                                       {
                                                         "truth_config_json": {
                                                           "culprit_id": 0,
                                                           "motive": "[상세 동기(유저가 설정한 동기가 있다면 핵심 내용을 포함하여 확장하고, 없다면 개연성 있는 동기를 창작)]",
                                                           "weapon_clue_id": 0,
                                                           "method": "[상세 수법(유저가 설계한 트릭과 수법을 무조건 반영하되, 묘사가 부족한 부분만 논리적으로 보완)]",
                                                           "location_floor": 0,
                                                           "cause_of_death": "[사인 상세(유저가 설정한 사인(예: 독살, 자상 등)이 있다면 그 사인을 포함하여 확장하고, 없다면 개연성 있는 사인을 창작)]"
                                                         },
                                                         "victim": {
                                                           "name": "[이름]",
                                                           "age": 0,
                                                           "gender": "[남성/여성]",
                                                           "occupation": "[직업]",
                                                           "background": "[배경 설명]",
                                                           "discovery_location": "[장소]",
                                                           "estimated_death_time": "[시각]",
                                                           "cause_of_death": "[사인]",
                                                           "victim_detail_json": {
                                                             "secret": "[비밀]",
                                                             "hidden_info": "[정보]"
                                                           }
                                                         },
                                                         "suspects": [
                                                           { "name": "[이름]",
                                                             "age": 0,
                                                             "gender": "[성별]",
                                                             "occupation": "[직업]",
                                                             "one_liner": "[성격 요약]",
                                                             "is_culprit": false,
                                                             "motive": "[동기]",
                                                             "ai_config_json": {
                                                               "personality": "[성격]",
                                                               "relationship": "[관계]",
                                                               "knowledge_scope": {
                                                                 "knows_about": "[아는 정보 목록 문자열]",
                                                                 "doesnt_know": "[모르는 정보 목록 문자열]"
                                                               },
                                                               "secret": {
                                                                 "title": "[비밀 제목]",
                                                                 "content": "[비밀 내용]",
                                                                 "weakness_clue": {
                                                                   "id": 0,
                                                                   "name": "[단서명]",
                                                                   "description": "[설명]"
                                                                 },
                                                                 "alibi_progression": {
                                                                   "level1_lie": "[거짓말 확고 태도 (범행이 일어날 당시 하고 있었다고 주장할 장소 기반 주장)]",
                                                                   "level2_weak": "[거짓말 붕괴 태도(범행이 일어날 당시 실제로 있었던 장소 기반 주장)]"
                                                                 }
                                                               },
                                                               "deflection_strategy": {
                                                                 "target_name": "[타겟 이름]",
                                                                 "suspicion_point": "[의심 포인트]",
                                                                 "dialogue_hint": "[대화 힌트]"
                                                               },
                                                               "timeline_alibi": [
                                                                 {
                                                                   "time": "HH:MM",
                                                                   "location": "장소",
                                                                   "activity": "활동",
                                                                   "is_verified": false
                                                                 }
                                                               ]
                                                             }
                                                           }
                                                         ],
                                                         "clues": [
                                                           {
                                                             "name": "[단서명]",
                                                             "description": "[설명]",
                                                             "importance": "[LOW/MEDIUM/HIGH/CRITICAL]",
                                                             "assistant_comment": "[조수 코멘트]",
                                                             "clue_detail_json": {
                                                               "revealed_truth": "[밝혀지는 사실]",
                                                               "related_suspect_ids": [0, 1],
                                                               "discovery_script": "[발견 대사]",
                                                               "is_weakness_clue_for": 0
                                                             }
                                                           }
                                                         ]
                                                       }
                                   Response strictly in JSON format.
                    """, suspectCount, step1Response);

            StringBuilder step2Sb = new StringBuilder();
            String content2 =  chatClient.prompt()
                    .system(scenarioSystemMessage2)
                    .user("Generate victim, suspects, and clues based on the scenario above.")
                    .call()
                    .content();

            step2Sb.append(content2);
            String step2Response = step2Sb.toString();
            step2Response = step2Response.replaceAll("```json\\s*", "")
                    .replaceAll("```\\s*$", "")
                    .trim();

            log.info("3단계 용의자/증거 생성 완료: {}", step2Response);

            // ========================================================================
            // 4단계: 방 배열 정보 생성
            // ========================================================================
            String combinedContext = String.format("""
   		[기본 설정 및 타임라인]: %s
   		[인물 및 상세 단서 목록]: %s
   """, step1Response, step2Response);

            String scenarioSystemMessage3 = String.format("""

                    Persona: 당신은 전문 추리 게임 시나리오 작가입니다. 당신은 논리적으로 사건의 트릭, 반전, 그리고 타임라인이 독자 및 게임의 사용자들이 납득할 수 있는 시나리오를 작성하는데 있어서 특화되어 있습니다.
                    이전까지의 모든 AI호출 작업의 결과물(Timeline, title, synopsis, synopsisDetail, story_config_json, victim, suspects 배열, clues 배열, truth_config_json)를 포함한 이전 시나리오 설정)을 기반으로 6개의 층별 방(rooms) 정보를 생성하여 JSON 형식으로 작성하십시오. 아래 명시된 형식과 내용을 기반으로 응답하고, 절대 사담을 섞지 마십시오. 반드시 순수한 JSON 형식으로만 출력하십시오.
      
                    [작성 규칙]
                    1. 층수: 1층부터 6층까지 순차적으로 floor_number를 할당하고 층별 유형과 이름을 정하십시오.
                    2. 단서 배치: [필수 참고 데이터]의 clues들을 각 방의 description에 자연스럽게 녹여내십시오. (예: 주방 묘사 시 '싱크대 위의 혈흔' 언급)
                    3. 조수 코멘트: assistant_comment는 추리에 직접적인 정답을 주지 말고 기괴함이나 의문점만 친근하게 제시하십시오.
                    4. 현장 묘사: "여기가 범행 장소다"라는 확정적 서술을 피하고 객관적인 상태만 묘사하십시오.
                    5. narration 섹션(오프닝, 에필로그 등)을 극적인 톤으로 작성하십시오.
        
                    [필수 참고 데이터]:
                    %s
        
        
                    시나리오 작성 형식:
                          {
                       "rooms": [
                         {
                           "floor_number": 1,
                           "room_type": "[1층 유형]",
                           "room_name": "[1층 이름]",
                           "description": "[1층 설명]",
                           "assistant_comment": "[조수 코멘트]"
                         },
                         {
                           "floor_number": 2,
                           "room_type": "[2층 유형]",
                           "room_name": "[2층 이름]",
                           "description": "[2층 설명]",
                           "assistant_comment": "[조수 코멘트]"
                         },
                         {
                           "floor_number": 3,
                           "room_type": "[3층 유형]",
                           "room_name": "[3층 이름]",
                           "description": "[3층 설명]",
                           "assistant_comment": "[조수 코멘트]"
                         },
                         {
                           "floor_number": 4,
                           "room_type": "[4층 유형]",
                           "room_name": "[4층 이름]",
                           "description": "[4층 설명]",
                           "assistant_comment": "[조수 코멘트]"
                         },
                         {
                           "floor_number": 5,
                           "room_type": "[5층 유형]",
                           "room_name": "[5층 이름]",
                           "description": "[5층 설명]",
                           "assistant_comment": "[조수 코멘트]"
                         },
                         {
                           "floor_number": 6,
                           "room_type": "[6층 유형]",
                           "room_name": "[6층 이름]",
                           "description": "[6층 설명]",
                           "assistant_comment": "[조수 코멘트]"
                         }
                       ],
                       "scenario": {
                         "story_config_json": {
                           "narration": {
                             "opening": "[시작 나레이션]",
                             "epilogue": "[엔딩 나레이션]",
                             "culprit_monologue": "[범인 검거 시 독백]",
                             "unsolved_monologue": "[미해결 시 독백]"
                           }
                         }
                       }
                     }
                     Response strictly in JSON format without any markdown code blocks or prose.
        """, combinedContext);

            StringBuilder step3Sb = new StringBuilder();
           String content3 = chatClient.prompt()
                    .system(scenarioSystemMessage3)
                    .user("Generate 6 rooms based on the scenario above.")
                    .call()
                    .content();
            step2Sb.append(content3);
            String step3Response = step3Sb.toString();
            step3Response = step3Response.replaceAll("```json\\s*", "")
                    .replaceAll("```\\s*$", "")
                    .trim();

            log.info("4단계 방 배열 생성 완료: {}", step3Response);

            // ========================================================================
            // 5단계: 모든 JSON 병합 및 파싱
            // ========================================================================
            ObjectMapper mapper = new ObjectMapper();

            // step1Response에서 scenario 기본 정보 추출
            JsonNode step1Root = mapper.readTree(step1Response);
            JsonNode scenarioNode = step1Root.path("scenario");

            String title = scenarioNode.path("title").asText();
            String synopsis = scenarioNode.path("synopsis").asText();
            String synopsisDetail = scenarioNode.path("synopsisDetail").asText();
            JsonNode storyConfig = scenarioNode.path("story_config_json");

            // step2Response에서 victim, suspects, clues, truth_config 추출
            JsonNode step2Root = mapper.readTree(step2Response);
            JsonNode victimNode = step2Root.path("victim");
            JsonNode suspectsNode = step2Root.path("suspects");
            JsonNode cluesNode = step2Root.path("clues");
            JsonNode truthConfig = step2Root.path("truth_config_json");

            // step3Response에서 rooms 추출
            JsonNode step3Root = mapper.readTree(step3Response);
            JsonNode roomsNode = step3Root.path("rooms");

            // scenarioNode에 truth_config_json 추가
            ((com.fasterxml.jackson.databind.node.ObjectNode) scenarioNode).set("truth_config_json", truthConfig);

            log.info("모든 단계 JSON 병합 완료");

            // Embedding 생성
            String motiveText = truthConfig.path("motive").asText();
            String causeOfDeathText = truthConfig.path("cause_of_death").asText();

            float[] motiveEmbedding = embeddingModel.embed(motiveText);
            float[] causeEmbedding = embeddingModel.embed(causeOfDeathText);

            // float[] → 문자열로 변환
            String motiveEmbeddingStr = arrayToVectorString(motiveEmbedding);
            String causeEmbeddingStr = arrayToVectorString(causeEmbedding);

            // 6. Scenario 엔티티 저장
            Scenario scenario = Scenario.builder()
                    .creator(creator)
                    .title(title)
                    .userSynopsis(request.userSynopsis())
                    .synopsis(synopsis)
                    .synopsisDetail(synopsisDetail)
                    .genre(request.genre())
                    .suspectCount(request.suspectCount())
                    .playCount(0)
                    .generationStatus(Scenario.GenerationStatus.COMPLETED)
                    .generationError(null)
                    .storyConfigJson(storyConfig)
                    .truthConfigJson(truthConfig)
                    .correctMotiveEmbedding(motiveEmbeddingStr)
                    .build();

            scenarioRepository.saveScenario(scenario);


            // 7. Victim 저장
            Victim victim = Victim.builder()
                    .scenario(scenario)
                    .name(victimNode.path("name").asText())
                    .age(victimNode.path("age").asInt())
                    .gender(victimNode.path("gender").asText())
                    .occupation(victimNode.path("occupation").asText())
                    .background(victimNode.path("background").asText())
                    .discoveryLocation(victimNode.path("discovery_location").asText())
                    .estimatedDeathTime(victimNode.path("estimated_death_time").asText())
                    .causeOfDeath(victimNode.path("cause_of_death").asText())
                    .victimDetailJson(victimNode.path("victim_detail_json"))
                    .portraitUrl("https://example.com/victim.jpg")
                    .build();
            victimRepository.saveVictim(victim);

            // 8. Suspects 저장
            List<Suspect> suspects = new ArrayList<>();
            int displayOrder = 1;
            for (JsonNode suspectNode : suspectsNode) {
                Suspect suspect = Suspect.builder()
                        .scenario(scenario)
                        .name(suspectNode.path("name").asText())
                        .age(suspectNode.path("age").asInt())
                        .gender(suspectNode.path("gender").asText())
                        .occupation(suspectNode.path("occupation").asText())
                        .culprit(suspectNode.path("is_culprit").asBoolean())
                        .motive(suspectNode.path("motive").asText())
                        .oneLiner(suspectNode.path("one_liner").asText())
                        .aiConfigJson(suspectNode.path("ai_config_json"))
                        .displayOrder(displayOrder++)
                        .portraitUrl("https://example.com/suspect.jpg")
                        .build();
                suspects.add(suspect);
            }
            suspectRepository.saveSuspects(suspects);

            // 9. culprit_id를 실제 DB ID로 업데이트
            // AI가 생성한 culprit_id는 suspects 배열의 인덱스이므로, is_culprit=true인 용의자의 실제 DB ID를 찾아야 함
            Long actualCulpritId = null;
            for (Suspect s : suspects) {
                if (s.isCulprit()) {
                    actualCulpritId = s.getId();
                    break;
                }
            }

            if (actualCulpritId != null) {
                // truthConfig의 culprit_id를 실제 DB ID로 업데이트
                ((com.fasterxml.jackson.databind.node.ObjectNode) truthConfig).put("culprit_id", actualCulpritId);
                // Scenario의 truthConfigJson 업데이트
                scenario.setTruthConfigJson(truthConfig);
                scenarioRepository.saveScenario(scenario);
                log.info("culprit_id 업데이트 완료: 실제 ID {}", actualCulpritId);
            } else {
                log.warn("culprit_id를 찾을 수 없음. suspects size={}", suspects.size());
            }

            // 10. Rooms 저장
            // ★ RoomLayoutService를 호출하여 랜덤 가구 배치 적용
            Map<Integer, Room> roomMap = new LinkedHashMap<>();
            for (JsonNode roomNode : roomsNode) {
                String roomType = roomNode.path("room_type").asText("living");
                int rawFloor = roomNode.path("floor_number").asInt();
                int floorNumber = normalizeFloorNumber(roomType, rawFloor, roomMap);

                // 같은 floor_number가 없을 때만 추가
                if (!roomMap.containsKey(floorNumber)) {
                    // AI가 생성한 방 타입 (living, kitchen 등)

                    // ★ 랜덤 배치 서비스 호출
                    JsonNode objectLayout = roomLayoutService.generateRandomLayout(roomType);

                    Room room = Room.builder()
                            .scenario(scenario)
                            .floorNumber(floorNumber)
                            .roomType(roomType) // AI가 준 타입 사용
                            .roomName(roomNode.path("room_name").asText())
                            .description(roomNode.path("description").asText())
                            .assistantComment(roomNode.path("assistant_comment").asText())
                            .objectJson(objectLayout) // ★ 생성된 가구 배치 JSON 저장
                            .build();
                    roomMap.put(floorNumber, room);
                }
            }
            if (roomMap.size() < 6) {
                String[] defaultTypes = {"living", "kitchen", "bedroom", "bathroom", "living", "basement"};
                for (int floor = 1; floor <= 6; floor++) {
                    if (roomMap.containsKey(floor)) continue;
                    String roomType = defaultTypes[floor - 1];
                    JsonNode objectLayout = roomLayoutService.generateRandomLayout(roomType);
                    Room room = Room.builder()
                            .scenario(scenario)
                            .floorNumber(floor)
                            .roomType(roomType)
                            .roomName("Floor " + floor)
                            .description("")
                            .assistantComment("")
                            .objectJson(objectLayout)
                            .build();
                    roomMap.put(floor, room);
                }
            }
            List<Room> savedRooms = roomRepository.saveRooms(new ArrayList<>(roomMap.values()));

            // 10. Clues 저장
            List<Clue> clues = new ArrayList<>();
            List<Room> roomsByFloor = savedRooms.stream()
                    .sorted(Comparator.comparingInt(Room::getFloorNumber))
                    .toList();
            Map<Long, List<Rect>> occupiedByRoomId = new HashMap<>();

            int clueIndex = 0;
            for (JsonNode clueNode : cluesNode) {
                String importanceStr = clueNode.path("importance").asText("SUPPORTING");
                Clue.Importance importance = "CRITICAL".equalsIgnoreCase(importanceStr)
                        ? Clue.Importance.CRITICAL
                        : "RED_HERRING".equalsIgnoreCase(importanceStr)
                        ? Clue.Importance.RED_HERRING
                        : Clue.Importance.SUPPORTING;

                Room targetRoom = roomsByFloor.isEmpty()
                        ? null
                        : roomsByFloor.get(clueIndex % roomsByFloor.size());
                JsonNode transform = mapper.createObjectNode();
                if (targetRoom != null) {
                    List<Rect> occupied = occupiedByRoomId.computeIfAbsent(
                            targetRoom.getId(),
                            key -> new ArrayList<>()
                    );
                    transform = generateRandomClueTransform(mapper, occupied);
                }

                Clue clue = Clue.builder()
                        .scenario(scenario)
                        .room(targetRoom)
                        .name(clueNode.path("name").asText())
                        .importance(importance)
                        .description(clueNode.path("description").asText())
                        .clueDetailJson(clueNode.path("clue_detail_json"))
                        .detailImageUrl("https://example.com/clue.jpg")
                        .assistantComment(clueNode.path("assistant_comment").asText())
                        .transformJson(transform)
                        .build();
                clues.add(clue);
                clueIndex++;
            }
            clueRepository.saveClues(clues);

            ScenarioCreateResponse.OriginalRequest originalRequest1 = new ScenarioCreateResponse.OriginalRequest(request.title(), synopsis, request.genre(), request.suspectCount());

            // 11. 응답 반환
            return new ScenarioCreateResponse(
                    scenario.getId(),
                    "COMPLETED",
                    estimatedSeconds,
                    null,
                    originalRequest1
            );

        } catch (Exception e) {
            log.error("Scenario generation failed", e);
            Scenario scenario = Scenario.builder()
                    .creator(creator)
                    .title(request.title())
                    .userSynopsis(request.userSynopsis())
                    .synopsis(request.userSynopsis())
                    .genre(request.genre())
                    .suspectCount(request.suspectCount())
                    .generationStatus(Scenario.GenerationStatus.FAILED)
                    .generationError(e.getMessage())
                    .build();
            scenarioRepository.saveScenario(scenario);

            return new ScenarioCreateResponse(
                    -1L,
                    "FAILED",
                    estimatedSeconds,
                    e.getMessage(),
                    originalRequest
            );

        }
    }

    @Override
    @Transactional
    public ScenarioDeleteResponse deleteScenario(long scenarioId) {
        if (!scenarioRepository.existsById(scenarioId)) {
            throw new BaseException(ErrorCode.SCENARIO_NOT_FOUND);
        }

        // 연관 데이터 삭제 (순서 중요: 외래키 제약 조건 고려)
        // 1. Clue 먼저 삭제 (Room과 Scenario 모두 참조)
        clueRepository.deleteByScenarioId(scenarioId);

        // 2. Suspect 삭제
        suspectRepository.deleteByScenarioId(scenarioId);

        // 3. Victim 삭제
        victimRepository.deleteByScenarioId(scenarioId);

        // 4. Room 삭제
        roomRepository.deleteByScenarioId(scenarioId);

        // 5. Scenario 삭제
        scenarioRepository.deleteById(scenarioId);

        return new ScenarioDeleteResponse(scenarioId, true);
    }

    @Override
    public ScenarioRankingResponse getScenarioRankings(long scenarioId, Long userId) {
        List<ScenarioRanking> rankings = scenarioRankingRepository
                .findByScenarioIdOrderByScoreDescClearTimeAsc(scenarioId);

        List<ScenarioRankingResponse.Ranking> rankingResponses = rankings.stream()
                .map(ranking -> new ScenarioRankingResponse.Ranking(
                        rankings.indexOf(ranking) + 1, // rank (1-based index)
                        ranking.getUser().getId(),
                        ranking.getUser().getNickname(),
                        ranking.getScore(),
                        ranking.getClearTime(),
                        ranking.getRankGrade().name()
                ))
                .toList();

        // 현재 사용자의 클리어 여부 확인
        boolean hasUserCleared = false;
        if (userId != null) {
            hasUserCleared = rankings.stream()
                    .anyMatch(ranking -> ranking.getUser().getId() == userId);
        }

        return new ScenarioRankingResponse(scenarioId, hasUserCleared, rankingResponses);
    }

    @Override
    @Transactional(readOnly = true)
    public RoomListResponse getRooms(long scenarioId) {
        Scenario scenario = scenarioRepository.findById(scenarioId)
                .orElseThrow(() -> new BaseException(ErrorCode.SCENARIO_NOT_FOUND));

        List<Room> rooms = roomRepository.findByScenarioIdOrderByFloorNumberAsc(scenarioId);

        List<RoomListResponse.Room> roomResponses = rooms.stream()
                .map(room -> new RoomListResponse.Room(
                        room.getId(),
                        room.getFloorNumber(),
                        room.getRoomType(),
                        room.getRoomName(),
                        room.getDescription(),
                        room.getAssistantComment(),
                        room.getBackgroundImageUrl(),
                        room.getObjectJson()
                ))
                .toList();

        return new RoomListResponse(scenarioId, scenario.getTitle(), roomResponses);
    }

    @Override
    @Transactional(readOnly = true)
    public VictimResponse getVictim(long scenarioId) {
        Victim victim = victimRepository.findByScenarioId(scenarioId)
                .orElseThrow(() -> new BaseException(ErrorCode.VICTIM_NOT_FOUND));

        VictimResponse.Victim response = new VictimResponse.Victim(
                victim.getId(),
                victim.getName(),
                victim.getAge() != null ? victim.getAge() : 0,
                victim.getGender(),
                victim.getOccupation(),
                victim.getDiscoveryLocation(),
                victim.getEstimatedDeathTime(),
                victim.getCauseOfDeath(),
                victim.getBackground(),
                victim.getPortraitUrl()
        );

        return new VictimResponse(scenarioId, response);
    }

    @Override
    @Transactional(readOnly = true)
    public SuspectListResponse getSuspects(long scenarioId) {
        List<Suspect> suspects =
                suspectRepository.findByScenarioIdOrderByDisplayOrderAsc(scenarioId);

        List<SuspectListResponse.Suspect> suspectResponses = suspects.stream()
                .map(suspect -> new SuspectListResponse.Suspect(
                        suspect.getId(),
                        suspect.getName(),
                        suspect.getAge() != null ? suspect.getAge() : 0,
                        suspect.getGender(),
                        suspect.getOccupation(),
                        suspect.getOneLiner(),
                        suspect.getPortraitUrl(),
                        suspect.getDisplayOrder() != null ? suspect.getDisplayOrder() : 0
                ))
                .toList();

        return new SuspectListResponse(scenarioId, suspectResponses);
    }

    @Override
    @Transactional(readOnly = true)
    public ScenarioListResponse listScenarios(ScenarioListRequest request) {
        ScenarioSortBy sortBy = request == null || request.sortBy() == null ? ScenarioSortBy.LATEST : request.sortBy();
        int page = request == null ? 0 : Math.max(0, request.page());
        int size = request == null ? 1000 : Math.max(1, Math.min(1000, request.size()));

        Specification<Scenario> spec = (root, query, cb) -> cb.conjunction();

        Pageable pageable = switch (sortBy) {
            case POPULAR -> PageRequest.of(page, size, Sort.by(
                    Sort.Order.desc("playCount"),
                    Sort.Order.desc("createdAt"),
                    Sort.Order.desc("id")
            ));
            case LATEST -> PageRequest.of(page, size, Sort.by(
                    Sort.Order.desc("createdAt"),
                    Sort.Order.desc("id")
            ));
            case RATING -> {
                spec = spec.and((root, query, cb) -> {
                    if (!Long.class.equals(query.getResultType()) && !long.class.equals(query.getResultType())) {
                        var avgRating = root.<BigDecimal>get("avgRating");
                        query.orderBy(
                                cb.asc(cb.isNull(avgRating)),
                                cb.desc(avgRating),
                                cb.desc(root.get("createdAt")),
                                cb.desc(root.get("id"))
                        );
                    }
                    return cb.conjunction();
                });
                yield PageRequest.of(page, size);
            }
        };

        if (request != null) {
            if (request.keyword() != null && !request.keyword().isBlank()) {
                String keyword = request.keyword().trim().toLowerCase();
                spec = spec.and((root, query, cb) -> cb.like(cb.lower(root.get("title")), "%" + keyword + "%"));
            }

            Set<String> genres = request.genres() == null
                    ? Set.of()
                    : request.genres().stream()
                            .filter(genre -> genre != null && !genre.isBlank() && !"all".equalsIgnoreCase(genre.trim()))
                            .map(genre -> genre.trim().toLowerCase())
                            .collect(Collectors.toSet());
            if (!genres.isEmpty()) {
                spec = spec.and((root, query, cb) -> cb.lower(root.get("genre")).in(genres));
            }

            Set<ScenarioDifficultyTier> difficultyTiers = request.difficulties() == null
                    ? Set.of()
                    : request.difficulties().stream()
                            .filter(Objects::nonNull)
                            .collect(Collectors.toSet());
            if (!difficultyTiers.isEmpty()) {
                spec = spec.and((root, query, cb) -> {
                    var avgDifficulty = root.<BigDecimal>get("avgDifficulty");
                    List<Predicate> predicates = new ArrayList<>();

                    // Match frontend mapping: <=2 easy, <=4 medium, else hard. Null treated as easy.
                    if (difficultyTiers.contains(ScenarioDifficultyTier.EASY)) {
                        predicates.add(cb.or(
                                cb.isNull(avgDifficulty),
                                cb.lessThanOrEqualTo(avgDifficulty, BigDecimal.valueOf(2))
                        ));
                    }
                    if (difficultyTiers.contains(ScenarioDifficultyTier.MEDIUM)) {
                        predicates.add(cb.and(
                                cb.isNotNull(avgDifficulty),
                                cb.greaterThan(avgDifficulty, BigDecimal.valueOf(2)),
                                cb.lessThanOrEqualTo(avgDifficulty, BigDecimal.valueOf(4))
                        ));
                    }
                    if (difficultyTiers.contains(ScenarioDifficultyTier.HARD)) {
                        predicates.add(cb.and(
                                cb.isNotNull(avgDifficulty),
                                cb.greaterThan(avgDifficulty, BigDecimal.valueOf(4))
                        ));
                    }

                    return cb.or(predicates.toArray(Predicate[]::new));
                });
            }
        }

        Page<ScenarioListProjection> scenarioPage = scenarioRepository.findBy(spec, query ->
                query.as(ScenarioListProjection.class).page(pageable)
        );

        List<ScenarioListResponse.Item> items = scenarioPage.getContent().stream()
                .map(this::toScenarioListItem)
                .toList();

        return new ScenarioListResponse(
                items,
                scenarioPage.getTotalPages(),
                scenarioPage.getTotalElements(),
                scenarioPage.getNumber()
        );
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(cacheNames = RedisConfig.SCENARIO_TOP10_PLAY_COUNT, key = "'v1'")
    public ScenarioListResponse topScenariosByPlayCount() {
        return listScenarios(new ScenarioListRequest(null, null, null, ScenarioSortBy.POPULAR, 0, 10));
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(cacheNames = RedisConfig.SCENARIO_TOP10_RATING, key = "'v1'")
    public ScenarioListResponse topScenariosByRating() {
        return listScenarios(new ScenarioListRequest(null, null, null, ScenarioSortBy.RATING, 0, 10));
    }

    private int normalizeFloorNumber(String roomType, int rawFloor, Map<Integer, Room> roomMap) {
        int normalized = rawFloor;
        if ("basement".equalsIgnoreCase(roomType)) {
            normalized = 6;
        }
        if (normalized < 1 || normalized > 6) {
            normalized = Math.min(6, Math.max(1, normalized));
        }
        if (!roomMap.containsKey(normalized)) {
            return normalized;
        }
        for (int floor = 1; floor <= 6; floor++) {
            if (!roomMap.containsKey(floor)) {
                return floor;
            }
        }
        return normalized;
    }

    private ScenarioListResponse.Item toScenarioListItem(ScenarioListProjection scenario) {
        return new ScenarioListResponse.Item(
                scenario.getId(),
                scenario.getTitle(),
                scenario.getSynopsis(),
                scenario.getGenre(),
                scenario.getThumbnailUrl(),
                scenario.getPlayCount(),
                scenario.getAvgRating(),
                scenario.getAvgDifficulty(),
                scenario.getGenerationStatus() != null ? scenario.getGenerationStatus().name() : "UNKNOWN",
                null,
                scenario.getGenerationError()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public ScenarioDetailResponse getScenario(long scenarioId) {
        Scenario scenario = scenarioRepository.findById(scenarioId)
                .orElseThrow(() -> new BaseException(ErrorCode.SCENARIO_NOT_FOUND));

        // Victim 정보
        ScenarioDetailResponse.Victim victim = null;
        var victimEntity = victimRepository.findByScenarioId(scenarioId).orElse(null);
        if (victimEntity != null) {
            victim = new ScenarioDetailResponse.Victim(
                    victimEntity.getId(),
                    victimEntity.getName(),
                    victimEntity.getAge() != null ? victimEntity.getAge() : 0,
                    victimEntity.getGender(),
                    victimEntity.getOccupation(),
                    victimEntity.getBackground(),
                    victimEntity.getDiscoveryLocation(),
                    victimEntity.getEstimatedDeathTime(),
                    victimEntity.getCauseOfDeath(),
                    victimEntity.getPortraitUrl()
            );
        }

        // Suspects 정보
        List<Suspect> suspectEntities =
                suspectRepository.findByScenarioIdOrderByDisplayOrderAsc(scenarioId);
        List<ScenarioDetailResponse.Suspect> suspects = suspectEntities.stream()
                .map(s -> new ScenarioDetailResponse.Suspect(
                        s.getId(),
                        s.getName(),
                        s.getAge() != null ? s.getAge() : 0,
                        s.getGender(),
                        s.getOccupation(),
                        s.getOneLiner(),
                        s.getPortraitUrl(),
                        s.getDisplayOrder() != null ? s.getDisplayOrder() : 0
                ))
                .toList();

        // Rankings
        List<ScenarioRanking> rankingEntities = scenarioRankingRepository
                .findByScenarioIdOrderByScoreDescClearTimeAsc(scenarioId);

        List<ScenarioDetailResponse.ScenarioRanking> rankings = rankingEntities.stream()
                .map(ranking -> new ScenarioDetailResponse.ScenarioRanking(
                        rankingEntities.indexOf(ranking) + 1, // rank
                        ranking.getUser().getId(),
                        ranking.getUser().getNickname(),
                        ranking.getScore(),
                        ranking.getClearTime(),
                        ranking.getRankGrade().name()
                ))
                .toList();

        return new ScenarioDetailResponse(
                scenario.getId(),
                scenario.getTitle(),
                scenario.getSynopsis(),
                scenario.getSynopsisDetail(),
                scenario.getGenre(),
                scenario.getThumbnailUrl(),
                scenario.getPlayCount(),
                scenario.getAvgRating(),
                scenario.getAvgDifficulty(),
                victim,
                suspects,
                rankings
        );
    }

    @Override
    public ScenarioStatusResponse getScenarioStatus(long scenarioId) {
        Scenario scenario = scenarioRepository.findById(scenarioId)
                .orElseThrow(() -> new BaseException(ErrorCode.SCENARIO_NOT_FOUND));

        String status = scenario.getGenerationStatus() != null
                ? scenario.getGenerationStatus().name()
                : "UNKNOWN";

        int progress = switch (Objects.requireNonNull(scenario.getGenerationStatus())) {
            case GENERATING -> 50;
            case COMPLETED -> 100;
            case FAILED -> 0;
        };

        String message = scenario.getGenerationError();
        if (message == null && scenario.getGenerationStatus() == Scenario.GenerationStatus.COMPLETED) {
            message = "Scenario generation completed successfully";
        } else if (message == null && scenario.getGenerationStatus() == Scenario.GenerationStatus.GENERATING) {
            message = "Scenario is being generated...";
        }

        return new ScenarioStatusResponse(scenarioId, status, progress, message);
    }

    /**
     * float[] 배열을 문자열 형식으로 변환
     */
    private String arrayToVectorString(float[] array) {
        if (array == null) return null;
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < array.length; i++) {
            if (i > 0) sb.append(",");
            sb.append(array[i]);
        }
        sb.append("]");
        return sb.toString();
    }

    private record Rect(int x, int y, int width, int height) {
        public boolean intersects(Rect other) {
            return this.x < other.x + other.width &&
                    this.x + this.width > other.x &&
                    this.y < other.y + other.height &&
                    this.y + this.height > other.y;
        }
    }

    private JsonNode generateRandomClueTransform(ObjectMapper mapper, List<Rect> occupiedRects) {
        int attempts = 0;
        int doorX = ROOM_WIDTH / 2;
        int doorY = ROOM_WIDTH - 40;

        while (attempts < 20) {
            attempts++;
            int x = PADDING + random.nextInt(ROOM_WIDTH - 2 * PADDING - CLUE_WIDTH);
            int y = PADDING + random.nextInt(ROOM_HEIGHT - 2 * PADDING - CLUE_HEIGHT);

            Rect newRect = new Rect(
                    x - ITEM_GAP,
                    y - ITEM_GAP,
                    CLUE_WIDTH + ITEM_GAP * 2,
                    CLUE_HEIGHT + ITEM_GAP * 2
            );

            double distToDoor = Math.sqrt(
                    Math.pow(x + CLUE_WIDTH / 2.0 - doorX, 2) +
                            Math.pow(y + CLUE_HEIGHT / 2.0 - doorY, 2)
            );
            if (distToDoor < DOOR_SAFE_RADIUS) {
                continue;
            }

            boolean collision = false;
            for (Rect existing : occupiedRects) {
                if (newRect.intersects(existing)) {
                    collision = true;
                    break;
                }
            }
            if (collision) {
                continue;
            }

            occupiedRects.add(newRect);
            var node = mapper.createObjectNode();
            node.put("x", x);
            node.put("y", y);
            return node;
        }

        var fallback = mapper.createObjectNode();
        fallback.put("x", ROOM_WIDTH / 2);
        fallback.put("y", ROOM_HEIGHT / 2);
        return fallback;
    }
}
