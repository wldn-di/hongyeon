import React from 'react'
import { Link, useLocation  } from 'wouter'
import { Button } from '@/components/ui/Button'
import { BookOpen, User, LogOut } from 'lucide-react'
import { useAuth } from "@/contexts/AuthContext"
import NotificationBell from '@/components/ui/NotificationBell'

export function Header() {
  const { state, actions } = useAuth()
  const user = state.user
  const [, setLocation] = useLocation()

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* 로고 */}
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer group">
              <div className="text-2xl font-bold gold-glow" style={{ color: 'var(--primary)' }}>
                HONG-YEON
              </div>
              <div className="error-code opacity-70 group-hover:opacity-100 transition-opacity">
              </div>
            </div>
          </Link>

          {/* 네비게이션 */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/">
              <span className="text-sm uppercase tracking-wider hover:text-primary transition-colors cursor-pointer">
                홈
              </span>
            </Link>
            <Link href="/scenarios">
              <span className="text-sm uppercase tracking-wider hover:text-primary transition-colors cursor-pointer">
                시나리오
              </span>
            </Link>
            {user ? (
              <Link href="/my-bookshelf">
                <span className="text-sm uppercase tracking-wider hover:text-primary transition-colors cursor-pointer flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  내 수사록
                </span>
              </Link>
            ) : (
              <span
                className="text-sm uppercase tracking-wider hover:text-primary transition-colors cursor-pointer flex items-center gap-1"
                onClick={() => actions.openLoginGate('/my-bookshelf')}
              >
                <BookOpen className="w-4 h-4" />
                내 수사록
              </span>
            )}
            <Link href="/ranking">
              <span className="text-sm uppercase tracking-wider hover:text-primary transition-colors cursor-pointer">
                랭킹
              </span>
            </Link>
          </nav>

                {/* 사용자 메뉴 */}
                  <div className="flex items-center gap-3">
                    {!user ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="neon-border-cyan"
                        onClick={()=>{actions.login()}}
                      >
                        LOGIN
                      </Button>
                    ) : (
                      <>
                        <div className="hidden sm:block text-sm text-muted-foreground">
                          <span className="text-foreground font-semibold">{user.nickname}</span> 님 반갑습니다
                        </div>

                        <NotificationBell />
        
                        <button
                          onClick={() => setLocation("/me")}
                          className="h-9 px-3 rounded-full border border-border bg-black/20 hover:bg-black/30 transition flex items-center gap-2"
                          aria-label="내 페이지"
                        >
                          <User className="w-4 h-4 text-primary" />
                          <span className="hidden md:block text-xs text-muted-foreground">PROFILE</span>
                        </button>
        
                        <Button variant="ghost" size="sm" onClick={() => actions.logout()} title="로그아웃">
                          <LogOut className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </header>
          )
        }
