package com.ssafy.s14p11a707.scenario.v2.node;

import java.util.ArrayDeque;
import java.util.Deque;

/**
 * 시나리오 v2 JSON 문자열 전처리 유틸리티
 * <p>
 * LLM 응답에서 종종 포함되는 마크다운 코드 펜스(예: {@code ```json})를 제거하여
 * JSON 파싱 가능 형태로 정규화한다.
 * </p>
 *
 * @see com.fasterxml.jackson.databind.ObjectMapper
 */
public final class ScenarioV2JsonUtils {

    private ScenarioV2JsonUtils() {
    }

    /**
     * 마크다운 코드 펜스 제거
     * <p>
     * 입력 문자열에서 {@code ```}로 감싸진 코드 블록 표기를 제거하고, 앞뒤 공백을 {@link String#trim()} 처리한다.
     * </p>
     *
     * @param text 원본 응답 문자열
     * @return 코드 펜스가 제거된 문자열(입력이 {@code null}이면 빈 문자열)
     */
    public static String stripCodeFences(String text) {
        if (text == null) {
            return "";
        }
        return text.replaceAll("```[a-zA-Z]*\\s*", "")
                .replaceAll("```\\s*$", "")
                .trim();
    }

    /**
     * LLM 출력에서 JSON 값(오브젝트/배열) 구간만 추출
     * <p>
     * 모델이 JSON 외의 안내 문구를 앞뒤에 덧붙이는 경우를 대비해,
     * 문자열에서 첫 번째 JSON 시작 토큰({@code \{} 또는 {@code [})부터
     * 괄호 짝이 맞는 지점까지의 구간을 잘라 반환한다.
     * </p>
     *
     * @param text 원본 문자열
     * @return 추출된 JSON 값 문자열(추출 불가 시 원본을 trim하여 반환)
     */
    public static String extractJsonValue(String text) {
        if (text == null) {
            return "";
        }

        String trimmed = text.trim();
        int objectStart = trimmed.indexOf('{');
        int arrayStart = trimmed.indexOf('[');
        int start;
        if (objectStart < 0 && arrayStart < 0) {
            return trimmed;
        }
        if (objectStart < 0) {
            start = arrayStart;
        } else if (arrayStart < 0) {
            start = objectStart;
        } else {
            start = Math.min(objectStart, arrayStart);
        }

        Deque<Character> stack = new ArrayDeque<>();
        boolean inString = false;
        boolean escape = false;

        for (int i = start; i < trimmed.length(); i++) {
            char c = trimmed.charAt(i);

            if (escape) {
                escape = false;
                continue;
            }

            if (inString) {
                if (c == '\\') {
                    escape = true;
                    continue;
                }
                if (c == '"') {
                    inString = false;
                }
                continue;
            }

            if (c == '"') {
                inString = true;
                continue;
            }

            if (c == '{' || c == '[') {
                stack.push(c);
                continue;
            }

            if (c == '}' || c == ']') {
                if (stack.isEmpty()) {
                    break;
                }

                char open = stack.pop();
                boolean matched = (open == '{' && c == '}') || (open == '[' && c == ']');
                if (!matched) {
                    break;
                }

                if (stack.isEmpty()) {
                    return trimmed.substring(start, i + 1);
                }
            }
        }

        char open = trimmed.charAt(start);
        int end = open == '[' ? trimmed.lastIndexOf(']') : trimmed.lastIndexOf('}');
        if (end < 0 || end <= start) {
            return trimmed;
        }
        return trimmed.substring(start, end + 1);
    }

    /**
     * JSON 파싱을 방해하는 제어 문자 제거/치환
     * <p>
     * LLM이 문자열 값 내부에 줄바꿈(\n) 등 제어 문자를 그대로 포함시키는 경우
     * Jackson 파싱이 실패할 수 있어, ASCII 제어 문자(0x00~0x1F)를 공백으로 치환한다.
     * </p>
     *
     * @param text 후보 JSON 문자열
     * @return 제어 문자가 치환된 문자열(입력이 {@code null}이면 빈 문자열)
     */
    public static String sanitizeControlChars(String text) {
        if (text == null) {
            return "";
        }
        return text.replaceAll("[\\u0000-\\u001F]", " ");
    }

    /**
     * 닫힘 토큰 누락 가능성이 있는 JSON을 자동 보정
     * <p>
     * 문자열을 순회하며 열림 토큰({@code \{} / {@code [})을 스택에 쌓고,
     * 닫힘 토큰({@code \}} / {@code ]})을 만나면 매칭되는 열림 토큰을 pop 한다.
     * 문자열 종료 시 스택에 남아있는 열림 토큰을 역순으로 닫아 JSON 파싱 성공 가능성을 높인다.
     * </p>
     * <p>
     * 본 메서드는 LLM 응답이 마지막 닫힘 괄호를 누락하는 흔한 케이스를 완화하기 위한 용도이며,
     * 근본적으로 잘못된 JSON을 완전히 복구한다는 보장은 없다.
     * </p>
     *
     * @param json 후보 JSON 문자열
     * @return 닫힘 토큰이 보정된 문자열(입력이 {@code null}이면 빈 문자열)
     */
    public static String autoCloseJson(String json) {
        if (json == null) {
            return "";
        }

        Deque<Character> stack = new ArrayDeque<>();
        boolean inString = false;
        boolean escape = false;

        for (int i = 0; i < json.length(); i++) {
            char c = json.charAt(i);

            if (escape) {
                escape = false;
                continue;
            }

            if (inString) {
                if (c == '\\') {
                    escape = true;
                    continue;
                }
                if (c == '"') {
                    inString = false;
                }
                continue;
            }

            if (c == '"') {
                inString = true;
                continue;
            }

            if (c == '{' || c == '[') {
                stack.push(c);
                continue;
            }

            if (c == '}' || c == ']') {
                if (stack.isEmpty()) {
                    continue;
                }

                char open = stack.peek();
                boolean matched = (open == '{' && c == '}') || (open == '[' && c == ']');
                if (matched) {
                    stack.pop();
                }
            }
        }

        if (stack.isEmpty()) {
            return json;
        }

        StringBuilder sb = new StringBuilder(json);
        while (!stack.isEmpty()) {
            char open = stack.pop();
            sb.append(open == '{' ? '}' : ']');
        }
        return sb.toString();
    }

    /**
     * LLM 응답을 JSON 파싱 가능한 형태로 정규화
     * <p>
     * 다음 처리를 순서대로 수행한다.
     * </p>
     * <ul>
     *   <li>마크다운 코드 펜스 제거({@link #stripCodeFences(String)})</li>
     *   <li>JSON 값 구간 추출({@link #extractJsonValue(String)})</li>
     *   <li>제어 문자 치환({@link #sanitizeControlChars(String)})</li>
     * </ul>
     *
     * @param text 원본 응답 문자열
     * @return 파싱 친화적으로 정리된 JSON 문자열
     */
    public static String normalizeJsonText(String text) {
        String noFence = stripCodeFences(text);
        String extracted = extractJsonValue(noFence);
        String sanitized = sanitizeControlChars(extracted).trim();
        return autoCloseJson(sanitized);
    }
}
