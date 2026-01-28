package com.ssafy.s14p11a707.scenario.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.s14p11a707.game.entity.ScenarioRanking;
import com.ssafy.s14p11a707.game.repository.ScenarioRankingRepository;
import com.ssafy.s14p11a707.scenario.dto.*;
import com.ssafy.s14p11a707.scenario.entity.*;
import com.ssafy.s14p11a707.scenario.repository.*;
import com.ssafy.s14p11a707.scenario.service.RoomLayoutService; // ??ì¶”ê???
import com.ssafy.s14p11a707.scenario.service.ScenarioService;
import com.ssafy.s14p11a707.user.entity.User;
import com.ssafy.s14p11a707.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Random;

@Slf4j
@Service
@RequiredArgsConstructor
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

    // ???œë¤ ê°€êµ?ë°°ì¹˜ ?œë¹„??ì£¼ì…
    private final RoomLayoutService roomLayoutService;

    @Override
    public ScenarioCreateResponse createScenario(ScenarioCreateRequest request) {
        int estimatedSeconds = Math.max(20, Math.min(120, 25 + request.suspectCount() * 10));

        ScenarioCreateResponse.OriginalRequest originalRequest = new ScenarioCreateResponse.OriginalRequest(request.title(), request.userSynopsis(), request.genre(), request.suspectCount());
        try {
            // 1. ?¬ìš©???…ë ¥ ë©”ì‹œì§€
            String userMessage = String.format("""
                    {
                      "title": "%s",
                      "genre": "%s",
                      "suspect_count": %d,
                      "synopsis": "%s"
                    }
                    """, request.title(), request.genre(), request.suspectCount(), request.userSynopsis());

            // 2. ì²?ë²ˆì§¸ AI ?¸ì¶œ: ?¬ê±´ ?€?„ë¼???ì„±
            String timelineSystemMessage = """
                    ì¶”ë¦¬ ê²Œì„???œë‚˜ë¦¬ì˜¤ë¥??ì„±?˜ê¸° ?„í•œ ?‘ì—…?´ì•¼ ?„ë˜??ëª…ì‹œ?´ì£¼???´ìš©ê³??•ì‹ ê¸°ë°˜?¼ë¡œ ?‘ë‹µ???˜ê³  ê·??¸ì— ?¬ë‹´???ì? ë§ê³  ?‘ë‹µ???œê³µ??
                    
                    ì²«ë²ˆì§?AI ?¸ì¶œ ?‘ì—… = Timeline ?ì„±
                    
                    Persona: ?¹ì‹ ?€ ?„ë¬¸ ì¶”ë¦¬ ê²Œì„ ?œë‚˜ë¦¬ì˜¤ ?‘ê??…ë‹ˆ?? ?¹ì‹ ?€ ?¼ë¦¬?ìœ¼ë¡??¬ê±´???¸ë¦­, ë°˜ì „, ê·¸ë¦¬ê³??€?„ë¼?¸ì´ ?…ì ë°?ê²Œì„???¬ìš©?ë“¤???©ë“?????ˆëŠ” ?œë‚˜ë¦¬ì˜¤ë¥??‘ì„±?˜ëŠ”???ˆì–´???¹í™”?˜ì–´ ?ˆìŠµ?ˆë‹¤.
                    ?¹ì‹ ?€ ?¬ìš©?ê? ?œê³µ??'?¥ë¥´', '?¸ì›??, 'ê°„ë‹¨???œë†‰?œìŠ¤'ë¥?ë°”íƒ•?¼ë¡œ ?¬ê±´???€?„ë¼?¸ì„ ?°ì„  ?‘ì„±?´ì•¼ ?©ë‹ˆ???‘ì—…???œì„œ???¤ìŒê³?ê°™ìŠµ?ˆë‹¤:
                    
                    ?¬ê±´???¼ì–´???˜ë£¨???€?„ë¼?¸ì„ 30ë¶?ê°„ê²©?¼ë¡œ JSON ë°°ì—´ ?•ì‹?¼ë¡œ ?‘ì„±?˜ì‹­?œì˜¤.
                    
                    1) ?¬ê±´ê³??¬ê±´???¼ì–´???˜ë£¨??TImeline ?ì„± ?¨ê³„ ?˜í–‰
                    
                    1) ?¬ê±´ê³??¬ê±´???¼ì–´???˜ë£¨??TImeline ?ì„± ?¨ê³„ ?˜í–‰ ??ì£¼ì˜?¬í•­:
                    
                    - ë²”ì¸ ?€?? ?€?„ë¼?¸ìƒ?ì„œ ë²”ì¸???´ë¦„??ì§ì ‘?ìœ¼ë¡??´í•´ ?‰ìœ„("?¬ê±´ ë°œìƒ ??ìµœë„?¤ì´ ?ˆì??¸ë? ?´í•´")?€ ?°ê²°?˜ì? ë§ˆì‹­?œì˜¤. ?€??"?¬ê±´ ë°œìƒ ?œê°", "ë¹„ëª… ?Œë¦¬ ë°œìƒ", ?ëŠ” "?•ì „ ë°œìƒ"ê³?ê°™ì´ ê°ê??ì¸ ?„ìƒ ?„ì£¼ë¡??œìˆ ?˜ì‹­?œì˜¤.
                    - ì¤‘ë¦½???œìˆ : ëª¨ë“  ?©ì˜?ì˜ ?‰ë™?€ ë²”í–‰ ?¬ë??€ ê´€ê³„ì—†???˜ì‹¬?¤ëŸ½ê±°ë‚˜ ?Œë¦¬ë°”ì´ë¥?ì¦ëª…?˜ëŠ” ?œë™ ?„ì£¼ë¡?êµ¬ì„±?˜ì‹­?œì˜¤. (?? "?œì¬ ê·¼ì²˜?ì„œ ëª©ê²©??, "?ë¦¬ë¥?ë¹„ì?" ??
                    - ê²°ë§ ?¬í•¨ ê¸ˆì?: 1?¨ê³„ ?€?„ë¼?¸ì—?œëŠ” 'ë²”ì¸ ì²´í¬', 'ë²”í–‰ ?ë°±', '?¬ì¸ ?•ì¸'ê³?ê°™ì? ?˜ì‚¬ ê²°ê³¼???”ë”© ?´ìš©???¬í•¨?˜ì? ë§ˆì‹­?œì˜¤. ?€?„ë¼?¸ì? ?¬ê±´ ë°œìƒ ë°?ë°œê²¬ ?œì ê¹Œì?ë§?êµ¬ì„±?˜ê±°?? ë°œê²¬ ?´í›„???¼ë? ?í™©ê¹Œì?ë§?ë¬˜ì‚¬?˜ì‹­?œì˜¤.
                    - ì¦ê±° ?„ì£¼ êµ¬ì„±: ?¹ì • ?¸ë¬¼??ë²”ì¸?¼ë¡œ ?•ì • ì§“ëŠ” ë¬¸êµ¬ ?€?? ?˜ì¤‘???¨ì„œê°€ ?????ˆëŠ” ë³µì„ (?? "?Œë§¤ê°€ ??–´ì§?, "ë¬´ì–¸ê°€ë¥??¨ì–´?¨ë¦¼")??ê°„ì ‘?ìœ¼ë¡?ë°°ì¹˜?˜ì‹­?œì˜¤.
                    
                    ì¶œë ¥ ?ˆì‹œ:
                    {
                      "timeline": [
                        {"time": "22:00", "event": "?¼í•´?ê? ?°êµ¬?¤ì— ?„ì°©"},
                        {"time": "23:00", "event": "?©ì˜??A?€ ?¼í•´?ê? ?¸ìŸ"},
                        {"time": "23:30", "event": "?¬ê±´ ë°œìƒ"}
                      ]
                    }
                    """;

            StringBuilder timelineSb = new StringBuilder();
            chatClient.prompt()
                    .system(timelineSystemMessage)
                    .user(userMessage)
                    .stream()
                    .content()
                    .doOnNext(timelineSb::append)
                    .blockLast();

            String timelineJson = timelineSb.toString();

            // 3. ??ë²ˆì§¸ AI ?¸ì¶œ: ?€?„ë¼?¸ì„ ë°”íƒ•?¼ë¡œ ?œë‚˜ë¦¬ì˜¤ ?„ì²´ ?ì„±
            // ??ì¤‘ìš”: rooms ë¶€ë¶??„ë¡¬?„íŠ¸ ?˜ì • (room_type??ëª…í™•?˜ê²Œ ì§€??
            String scenarioSystemMessage = """
                    Persona: ?¹ì‹ ?€ ?„ë¬¸ ì¶”ë¦¬ ê²Œì„ ?œë‚˜ë¦¬ì˜¤ ?‘ê??…ë‹ˆ?? ?¹ì‹ ?€ ?¼ë¦¬?ìœ¼ë¡??¬ê±´???¸ë¦­, ë°˜ì „, ê·¸ë¦¬ê³??€?„ë¼?¸ì´ ?…ì ë°?ê²Œì„???¬ìš©?ë“¤???©ë“?????ˆëŠ” ?œë‚˜ë¦¬ì˜¤ë¥??‘ì„±?˜ëŠ”???ˆì–´???¹í™”?˜ì–´ ?ˆìŠµ?ˆë‹¤. ?´ë•Œ ?¹ì‹ ?€ ? ì?ê°€ ì§ì ‘ ?¨ì„œë¥??µí•´ ?¬ê±´???™ê¸°, ë²”ì¸, ë²”í–‰ ?˜ë²• ?±ì„ ?¤ìŠ¤ë¡?ì¶”ë¦¬?˜ë©° ?Œì•„?????ˆë„ë¡??¼ë¦¬??ê·¼ê±°?€ ?¨ê»˜ ì¦ê±°ë¬¼ê³¼ ?œë‚˜ë¦¬ì˜¤ë¥?êµ¬ì„±?˜ì—¬???©ë‹ˆ??
                    
                    ?„ë˜???¬ê±´ ?€?„ë¼?¸ì„ ì°¸ê³ ?˜ì—¬ ?œë‚˜ë¦¬ì˜¤ë¥?JSON ?•ì‹?¼ë¡œ ?‘ì„±?˜ì„¸??
                    
                    ê°??„ë“œ???´ë‹¹?˜ëŠ” ?´ìš©???‘ì„±?˜ì„¸??
                    
                    2-1) ?¬ê±´ ë°??€?„ë¼??ê¸°ë°˜ ?œë‚˜ë¦¬ì˜¤ ?ì„± ?¨ê³„ ?˜í–‰
                    ?„ë˜???¬ê±´ ?€?„ë¼?¸ì„ ì°¸ê³ ?˜ì—¬ ?œë‚˜ë¦¬ì˜¤ë¥?JSON ?•ì‹?¼ë¡œ ?‘ì„±?˜ì‹­?œì˜¤.
                    ê°??„ë“œ???´ë‹¹?˜ëŠ” ?´ìš©???œëª©ê³??•ì‹???™ì¼?˜ê²Œ ? ì??˜ë©° ê·¸ì— ë§ì¶°???‘ì„±?˜ì‹­?œì˜¤.
                    
                    ?¬ê±´ ë°??€?„ë¼??ê¸°ë°˜ ?œë‚˜ë¦¬ì˜¤ ?ì„± ?¨ê³„ ?˜í–‰ ???¤ìŒ ê·œì¹™???„ê²©??ì¤€?˜í•˜??‹œ??
                    
                        - ?€?„ë¼??ê°ì²´ ?•ì¥: 1?¨ê³„?ì„œ ?ì„±??ëª¨ë“  ?€?„ë¼????ª©???˜ë‚˜??ë¹ ì§?†ì´ story_config_json ?´ì˜ timeline ë°°ì—´??ì§‘ì–´?£ìœ¼??‹œ??
                    
                        - Witness ?„ë“œ ?„ìˆ˜ ì¶”ê?: ê°??€?„ë¼??ê°ì²´??{"time": "HH:MM", "event": "?´ìš©""} ?•ì‹??? ì??´ì•¼ ?©ë‹ˆ??
                    
                        - ?°ì´???•í•©?? 1?¨ê³„??30ë¶??¨ìœ„ ê¸°ë¡???”ì•½?˜ì? ë§ê³ , ?”ë”© ?œì ê¹Œì???ëª¨ë“  JSON ë°°ì—´ ?ì†Œë¥?ê·¸ë?ë¡?? ì??˜ì‹­?œì˜¤.
                    
                        - Room ?•ë³´ ?ì„±?€ 6ê°??ì„±?¼ë¡œ ê³ ì •.
                        - ê°?ì¸µì—??ë¬´ì¡°ê±?ë°??˜ë‚˜?©ì´ ?ˆëŠ” ?•íƒœ.
                        - ì¦ê±°?ˆì˜ ?˜ëŠ” ìµœë? 20ê°œë? ?˜ì–´ê°€ì§€ ?Šë„ë¡??œí•œ.
                    
                    ?œë‚˜ë¦¬ì˜¤ ?‘ì„± ?•ì‹:
                    {
                      "scenario": {
                        "title": "[?œë‚˜ë¦¬ì˜¤ ?œëª©]",
                        "synopsis": "[??ì¤??”ì•½]",
                        "synopsisDetail": "[?ì„¸ ì¤„ê±°ë¦?200???´ì™¸]",
                        "thumbnailUrl": "[?¸ë„¤???´ë?ì§€ URL]",
                        "story_config_json": {
                          "incident_time": "[?¬ê±´ ë°œìƒ ?œê°]",
                          "twist": "[ë°˜ì „ ?”ì†Œ]",
                          "timeline": "[?¬ê±´ ?œê°„??ë°°ì—´]",
                          "narration": {
                            "opening": "[ê²Œì„ ?œì‘ ?˜ë ˆ?´ì…˜]",
                            "epilogue": "[?¬ê±´ ?´ê²° ?”ë”© ?˜ë ˆ?´ì…˜]",
                            "culprit_monologue": "[ë²”ì¸ ?…ë°±]",
                            "unsolved_monologue": "[ë¯¸í•´ê²??…ë°±]"
                          }
                        },
                        "truth_config_json": {
                          "culprit_id": "[ë²”ì¸ ID]",
                          "motive": "[ë²”í–‰ ?™ê¸°]",
                          "weapon_clue_id": "[?‰ê¸° ?¨ì„œ ID]",
                          "method": "[ë²”í–‰ ?˜ë²•]",
                          "location_floor": "[ë²”í–‰ ë°œìƒ ì¸?ë²ˆí˜¸]",
                          "cause_of_death": "[?¬ì¸]"
                        }
                      },
                      "victim": {
                        "name": "[?´ë¦„]",
                        "age": "[?˜ì´]",
                        "gender": "[?±ë³„]",
                        "occupation": "[ì§ì—…]",
                        "background": "[ë°°ê²½]",
                        "discovery_location": "[ë°œê²¬ ?¥ì†Œ]",
                        "estimated_death_time": "[?¬ë§ ?œê°]",
                        "cause_of_death": "[?¬ì¸]",
                        "victim_detail_json": {
                          "secret": "[ë¹„ë?]",
                          "hidden_info": "[?¨ê²¨ì§??•ë³´]"
                        }
                      },
                      "suspects": [
                        {
                          "name": "[?´ë¦„]",
                          "age": "[?˜ì´]",
                          "gender": "[?±ë³„]",
                          "occupation": "[ì§ì—…]",
                          "one_liner": "[??ì¤??Œê°œ]",
                          "is_culprit": "[ë²”ì¸ ?¬ë?]",
                          "motive": "[?™ê¸°]",
                          "ai_config_json": {
                            "personality": "[?±ê²©]",
                            "relationship": "[ê´€ê³?",
                            "knowledge_scope": {
                              "knows_about": [],
                              "doesnt_know": []
                            },
                            "secret": {
                              "title": "[ë¹„ë? ?œëª©]",
                              "content": "[ë¹„ë? ?´ìš©]",
                              "weakness_clue": {
                                "id": "[?½ì  ?¨ì„œ ID]",
                                "name": "[?´ë¦„]",
                                "description": "[?¤ëª…]"
                              },
                              "alibi_progression": {
                                "level1_lie": "...",
                                "level2_partial": "...",
                                "level3_truth": "..."
                              }
                            },
                            "deflection_strategy": {
                              "target_name": "...",
                              "suspicion_point": "...",
                              "dialogue_hint": "..."
                            },
                            "timeline_alibi": "..."
                          }
                        }
                      ],
                      "clues": [
                        {
                          "name": "[?´ë¦„]",
                          "description": "[?¤ëª…]",
                          "importance": "CRITICAL",
                          "assistant_comment": "[ì½”ë©˜??",
                          "clue_detail_json": {
                            "revealed_truth": "...",
                            "related_suspect_ids": "...",
                            "discovery_script": "...",
                            "is_weakness_clue_for": "..."
                          }
                        }
                      ],
                      "rooms": [
                        {
                          "floor_number": "[ì¸?ë²ˆí˜¸ - ?«ì]",
                          "room_type": "[?„ìˆ˜: living, kitchen, bedroom, bathroom, basement ì¤??˜ë‚˜ë¥?? íƒ]",
                          "room_name": "[ë°??´ë¦„ - ?? ê±°ì‹¤, ë¶€??",
                          "description": "[ë°??¤ëª…]",
                          "assistant_comment": "[ì½”ë©˜??"
                        }
                      ]
                    }
                    """;

            StringBuilder scenarioSb = new StringBuilder();
            chatClient.prompt()
                    .system(scenarioSystemMessage)
                    .user(timelineJson) // ì²?ë²ˆì§¸ ?‘ë‹µ(?€?„ë¼??????ë²ˆì§¸ ?„ë¡¬?„íŠ¸??ì£¼ì…
                    .stream()
                    .content()
                    .doOnNext(scenarioSb::append)
                    .blockLast();

            String scenarioJson = scenarioSb.toString();

            // Markdown ì½”ë“œ ë¸”ë¡ ?œê±°
            scenarioJson = scenarioJson.replaceAll("```json\\s*", "")
                    .replaceAll("```\\s*$", "")
                    .trim();

            // 5. JSON ?Œì‹±
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(scenarioJson);


            String title = root.path("scenario").path("title").asText();
            String synopsis = root.path("scenario").path("synopsis").asText();
            String synopsisDetail = root.path("scenario").path("synopsisDetail").asText();

            JsonNode storyConfig = root.path("scenario").path("story_config_json");
            JsonNode truthConfig = root.path("scenario").path("truth_config_json");

            // Embedding ?ì„±
            String motiveText = truthConfig.path("motive").asText();
            String causeOfDeathText = truthConfig.path("cause_of_death").asText();

            float[] motiveEmbedding = embeddingModel.embed(motiveText);
            float[] causeEmbedding = embeddingModel.embed(causeOfDeathText);

            // float[] ??ë¬¸ì?´ë¡œ ë³€??
            String motiveEmbeddingStr = arrayToVectorString(motiveEmbedding);
            String causeEmbeddingStr = arrayToVectorString(causeEmbedding);

            // 6. Scenario ?”í‹°???€??
            Scenario scenario = Scenario.builder()
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


            // 7. Victim ?€??
            JsonNode victimNode = root.path("victim");
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

            // 8. Suspects ?€??
            List<Suspect> suspects = new ArrayList<>();
            int displayOrder = 1;
            for (JsonNode suspectNode : root.path("suspects")) {
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

            // 9. Rooms ?€??
            // ??RoomLayoutServiceë¥??¸ì¶œ?˜ì—¬ ?œë¤ ê°€êµ?ë°°ì¹˜ ?ìš©
            Map<Integer, Room> roomMap = new LinkedHashMap<>();
            for (JsonNode roomNode : root.path("rooms")) {
                int floorNumber = roomNode.path("floor_number").asInt();

                // ê°™ì? floor_numberê°€ ?†ì„ ?Œë§Œ ì¶”ê?
                if (!roomMap.containsKey(floorNumber)) {
                    // AIê°€ ?ì„±??ë°??€??(living, kitchen ??
                    String roomType = roomNode.path("room_type").asText("living");

                    // ???œë¤ ë°°ì¹˜ ?œë¹„???¸ì¶œ
                    JsonNode objectLayout = roomLayoutService.generateRandomLayout(roomType);

                    Room room = Room.builder()
                            .scenario(scenario)
                            .floorNumber(floorNumber)
                            .roomType(roomType) // AIê°€ ì¤€ ?€???¬ìš©
                            .roomName(roomNode.path("room_name").asText())
                            .description(roomNode.path("description").asText())
                            .assistantComment(roomNode.path("assistant_comment").asText())
                            .objectJson(objectLayout) // ???ì„±??ê°€êµ?ë°°ì¹˜ JSON ?€??
                            .build();
                    roomMap.put(floorNumber, room);
                }
            }
            List<Room> savedRooms = roomRepository.saveRooms(new ArrayList<>(roomMap.values()));

            // 10. Clues ?€??
            List<Clue> clues = new ArrayList<>();
            List<Room> roomsByFloor = savedRooms.stream()
                    .sorted(Comparator.comparingInt(Room::getFloorNumber))
                    .toList();
            Map<Long, List<Rect>> occupiedByRoomId = new HashMap<>();

            int clueIndex = 0;
            for (JsonNode clueNode : root.path("clues")) {
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
                        .assistantComment(null)
                        .transformJson(transform)
                        .build();
                clues.add(clue);
                clueIndex++;
            }
            clueRepository.saveClues(clues);

            ScenarioCreateResponse.OriginalRequest originalRequest1 = new ScenarioCreateResponse.OriginalRequest(request.title(), synopsis, request.genre(), request.suspectCount());

            // 11. ?‘ë‹µ ë°˜í™˜
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
    public ScenarioDeleteResponse deleteScenario(long scenarioId) {
        scenarioRepository.deleteById(scenarioId);
        return new ScenarioDeleteResponse(scenarioId, true);
    }

    @Override
    public ScenarioRankingResponse getScenarioRankings(long scenarioId, OidcUser oidcUser) {
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

        // ?„ì¬ ?¬ìš©?ì˜ ?´ë¦¬???¬ë? ?•ì¸
        boolean hasUserCleared = false;
        if (oidcUser != null) {
            String googleId = oidcUser.getSubject();
            User currentUser = userRepository.findByGoogleId(googleId).orElse(null);

            if (currentUser != null) {
                hasUserCleared = rankings.stream()
                        .anyMatch(ranking -> ranking.getUser().getId() == currentUser.getId());
            }
        }

        return new ScenarioRankingResponse(scenarioId, hasUserCleared, rankingResponses);
    }

    @Override
    @Transactional(readOnly = true)
    public RoomListResponse getRooms(long scenarioId) {
        Scenario scenario = scenarioRepository.findById(scenarioId)
                .orElseThrow(() -> new IllegalArgumentException("Scenario not found: " + scenarioId));

        List<Room> rooms = roomRepository.findByScenarioIdOrderByFloorNumberAsc(scenarioId);

        List<RoomListResponse.Room> roomResponses = rooms.stream()
                .map(room -> new RoomListResponse.Room(
                        room.getId(),
                        room.getFloorNumber(),
                        room.getRoomType(),
                        room.getRoomName(),
                        room.getDescription(),
                        room.getAssistantComment(),
                        room.getObjectJson()
                ))
                .toList();

        return new RoomListResponse(scenarioId, scenario.getTitle(), roomResponses);
    }

    @Override
    @Transactional(readOnly = true)
    public VictimResponse getVictim(long scenarioId) {
        Victim victim = victimRepository.findByScenarioId(scenarioId)
                .orElseThrow(() -> new IllegalArgumentException("Victim not found for scenario: " + scenarioId));

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
    public ScenarioListResponse listScenarios() {
        List<Scenario> scenarios = scenarioRepository.findAll();

        List<ScenarioListResponse.Item> items = scenarios.stream()
                .map(scenario -> new ScenarioListResponse.Item(
                        scenario.getId(),
                        scenario.getTitle(),
                        scenario.getSynopsis(),
                        scenario.getGenre(),
                        scenario.getThumbnailUrl(),
                        scenario.getPlayCount(),
                        scenario.getAvgRating(),
                        scenario.getAvgDifficulty(),
                        scenario.getGenerationStatus() != null ? scenario.getGenerationStatus().name() : "UNKNOWN",
                        null, // progress - ì¶”í›„ êµ¬í˜„
                        scenario.getGenerationError()
                ))
                .toList();

        return new ScenarioListResponse(items, 1, items.size(), 0);
    }

    @Override
    @Transactional(readOnly = true)
    public ScenarioListResponse searchScenarios(String keyword) {
        List<Scenario> scenarios;

        if (keyword == null || keyword.isBlank()) {
            scenarios = scenarioRepository.findAll();
        } else {
            scenarios = scenarioRepository.findByTitleContainingOrSynopsisContaining(
                    keyword.trim()
            );
        }

        List<ScenarioListResponse.Item> items = scenarios.stream()
                .map(scenario -> new ScenarioListResponse.Item(
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
                ))
                .toList();

        return new ScenarioListResponse(items, 1, items.size(), 0);
    }

    @Override
    @Transactional(readOnly = true)
    public ScenarioDetailResponse getScenario(long scenarioId) {
        Scenario scenario = scenarioRepository.findById(scenarioId)
                .orElseThrow(() -> new IllegalArgumentException("Scenario not found: " + scenarioId));

        // Victim ?•ë³´
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

        // Suspects ?•ë³´
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
                .orElseThrow(() -> new IllegalArgumentException("Scenario not found: " + scenarioId));

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
     * float[] ë°°ì—´??ë¬¸ì???•ì‹?¼ë¡œ ë³€??
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

