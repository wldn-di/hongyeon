import React, { createContext, useContext, useEffect, useMemo, useReducer, useRef } from "react"
import { alertError, alertWarning,alertInfo } from "@/components/ui/AlertModal"
import { POST_LOGIN_REDIRECT_KEY } from "@/app/routePaths"


const AuthContext = createContext(null)

const initialState = {
  user: null,
  loading: true,
  loginGate: { open: false, redirectTo: null },
}

function reducer(state, action) {
  switch (action.type) {
    case "SET_USER":
      return { ...state, user: action.user, loading: false }
    case "CLEAR_USER":
      return { ...state, user: null, loading: false }
    case "SET_LOADING":
      return { ...state, loading: action.loading }
    case "UPDATE_USER":
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.patch } : state.user,
        loading: false,
      }
    case "OPEN_LOGIN_GATE":
      return { ...state, loginGate: { open: true, redirectTo: action.redirectTo ?? null } }
    case "CLOSE_LOGIN_GATE":
      return { ...state, loginGate: { open: false, redirectTo: null } }
    default:
      return state
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const stateRef = useRef(state)
  stateRef.current = state

  const rawBase = import.meta.env.VITE_API_BASE_URL
  const base = rawBase ? rawBase.replace(/\/$/, "") : "" // 끝 슬래시 제거로 통일

  // 디버깅용
  // console.log("[AUTH] mode:", import.meta.env.MODE)
  // console.log("[AUTH] base:", base)
  // console.log("[AUTH] useMock:", useMock)

  // 앱 시작 시: 로그인 여부 확인(mock이면 스킵)
  useEffect(() => {
    if (!base) {
      dispatch({ type: "CLEAR_USER" })
      return
    }

    let alive = true
    ;(async () => {
      try {
        const res = await fetch(`${base}/api/auth/me`, { credentials: "include" })
        if (!alive) return
        if (res.ok) dispatch({ type: "SET_USER", user: await res.json() })
        else dispatch({ type: "CLEAR_USER" })
      } catch {
        if (alive) dispatch({ type: "CLEAR_USER" })
      }
    })()

    return () => {
      alive = false
    }
  }, [base])

  const actions = useMemo(
    () => ({
      // 1) 로그인
      login() {
        // 로그인 게이트에 redirectTo가 있으면 sessionStorage에 저장
        // (OAuth 후 복귀 시 AppShell이 읽어서 해당 경로로 이동)
        try {
          const redirectTo = stateRef.current.loginGate.redirectTo
          const fallback = window.location.pathname + window.location.search + window.location.hash
          window.sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, redirectTo || fallback || "/")
        } catch { /* ignore */ }

        dispatch({ type: "CLOSE_LOGIN_GATE" })

        if (!base) {
          dispatch({
            type: "SET_USER",
            user: {
              user_id: 1,
              email: "test@gmail.com",
              nickname: "셜록홈즈",
              picture: "/images/suspects/suspect1.png",
              created_at: "2026-01-14",
              updated_at: "2026-01-14",
            },
          })
          return
        }

        const url = `${base}/api/auth/login`
        console.log("LOGIN URL:", url)
        window.location.href = url
      },

      // 로그인 게이트 열기 (페이지 이동 없이 로그인 모달 표시)
      openLoginGate(redirectTo) {
        const fallback = typeof window !== 'undefined'
          ? window.location.pathname + window.location.search + window.location.hash
          : null
        dispatch({ type: "OPEN_LOGIN_GATE", redirectTo: redirectTo || fallback })
      },

      // 로그인 게이트 닫기
      closeLoginGate() {
        dispatch({ type: "CLOSE_LOGIN_GATE" })
      },

      // 2) 로그아웃
      async logout() {
        if (!base) {
          dispatch({ type: "CLEAR_USER" })
          return
        }

        try {
          await fetch(`${base}/api/auth/logout`, {
            method: "POST",
            credentials: "include",
          })
        } catch (e) {
          console.error("[AUTH] logout failed:", e)
        } finally {
          dispatch({ type: "CLEAR_USER" })
        }
      },

      // 3) 수동 재조회
      async refreshMe() {
        if (!base) {
          dispatch({ type: "SET_LOADING", loading: false })
          return
        }

        dispatch({ type: "SET_LOADING", loading: true })
        try {
          const res = await fetch(`${base}/api/auth/me`, { credentials: "include" })
          if (res.ok) dispatch({ type: "SET_USER", user: await res.json() })
          else dispatch({ type: "CLEAR_USER" })
        } catch {
          dispatch({ type: "CLEAR_USER" })
        }
      },

      // 4) 회원탈퇴 (서버 엔드포인트 준비되면 활성화)
      async deleteAccount() {
        if ( !base) {
          dispatch({ type: "CLEAR_USER" })
          return true
        }

        alertWarning("회원탈퇴 기능은 서버 준비 중입니다.")
        console.warn("[AUTH] deleteAccount not implemented yet. Waiting backend endpoint.")
        return false

        // 백엔드 준비되면 아래 주석 해제
        // const res = await fetch(`${base}/api/auth/me`, {
        //   method: "DELETE",
        //   credentials: "include",
        // })
        // if (!res.ok) {
        //   const text = await res.text().catch(() => "")
        //   throw new Error(`delete failed: ${res.status} ${text}`)
        // }
        // dispatch({ type: "CLEAR_USER" })
      },

      // 5) 프로필 수정 (닉네임은 서버에 저장)
      updateProfile(patch) {
        if (!patch || typeof patch !== "object") return

        const updated_at = new Date().toISOString().slice(0, 10)
        const { nickname, ...rest } = patch

        // picture 같은 로컬-only 필드는 기존처럼 즉시 반영
        if (Object.keys(rest).length > 0) {
          dispatch({
            type: "UPDATE_USER",
            patch: { ...rest, updated_at },
          })
        }

        // 닉네임 변경은 서버 반영(개발/Mock 모드에서는 로컬만)
        if (nickname == null) return
        if (!base) {
          dispatch({
            type: "UPDATE_USER",
            patch: { nickname, updated_at },
          })
          return
        }

        ;(async () => {
          try {
            const res = await fetch(`${base}/api/users/me/nickname`, {
              method: "PATCH",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ nickname }),
            })

            if (!res.ok) {
              let message = "닉네임 변경에 실패했습니다."
              try {
                const err = await res.json()
                if (err?.message) message = err.message
              } catch {
                // ignore
              }
              alertError(message)
              return
            }

            const data = await res.json()
            dispatch({
              type: "UPDATE_USER",
              patch: { ...data, updated_at },
            })
          } catch (e) {
            console.error("[AUTH] update nickname failed:", e)
            alert("닉네임 변경에 실패했습니다.")
          }
        })()
      },
    }),
    [base]
  )

  const value = useMemo(() => ({ state, actions }), [state, actions])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>")
  return ctx
}
