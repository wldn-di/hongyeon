import axios from "axios";
import { openLoginGateGlobal } from "@/components/ui/LoginGate";

/**
 * API 기본 URL 가져오기
 * @returns {string}
 */
const getApiBaseUrl = () => {
  if (typeof import.meta !== "undefined" && import.meta.env) {
    return (
      import.meta.env.VITE_API_BASE_URL ||
      import.meta.env.VITE_API_URL ||
      "http://localhost:8080"
    );
  }
  if (typeof process !== "undefined" && process.env) {
    return process.env.REACT_APP_API_URL || "http://localhost:8080";
  }
  return "http://localhost:8080";
};

/**
 * Axios API 클라이언트 인스턴스
 */
export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  // timeout: 1800000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * 요청 인터셉터 - 모든 요청 전에 실행됨
 */
apiClient.interceptors.request.use(
  (config) => {
    // 필요한 경우 요청 전 처리 로직 추가
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

/**
 * 응답 인터셉터 - 모든 응답 후에 실행됨
 */
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 401 Unauthorized - 로그인 게이트 표시 (페이지 이동 없음)
    if (error.response?.status === 401) {
      openLoginGateGlobal();
    }
    return Promise.reject(error);
  },
);

export default apiClient;
