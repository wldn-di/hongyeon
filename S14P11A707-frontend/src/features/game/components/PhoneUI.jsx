import { ArrowLeft, Send, Users, Plus, X, Search } from "lucide-react"
import { React, useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

// 용의자 심문용 휴대폰 UI 컴포넌트
export default function PhoneUI({ isOpen, onClose, helper, suspects, chatHistories, onSendMessage, currentChat, setCurrentChat, onContactSelect, onMarkAsRead, clues = [] }) {
  const [message, setMessage] = useState('')
  const [selectedContact, setSelectedContact] = useState(null)
  const [selectedClue, setSelectedClue] = useState(null) // 선택된 단서
  const [clueModalOpen, setClueModalOpen] = useState(false) // 단서 선택 모달
  const chatEndRef = useRef(null)

  // 용의자만 표시 (조수 왓슨 제외)
  const allContacts = suspects.filter(Boolean)

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatHistories, selectedContact])

  // 채팅방 입장 시 읽음 처리
  useEffect(() => {
    if (selectedContact && onMarkAsRead) {
      onMarkAsRead(selectedContact.id)
    }
  }, [selectedContact, onMarkAsRead])

  // 연락처 변경 시 선택된 단서 초기화
  useEffect(() => {
    setSelectedClue(null)
  }, [selectedContact?.id])

  const handleSend = () => {
    if (message.trim() && selectedContact) {
      onSendMessage(selectedContact.id, message, selectedClue?.id || null)
      setMessage('')
      setSelectedClue(null) // 전송 후 단서 선택 초기화
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleClueSelect = (clue) => {
    setSelectedClue(clue)
    setClueModalOpen(false)
  }

  const handleRemoveClue = () => {
    setSelectedClue(null)
  }

  const getUnreadCount = (contactId) => {
    const history = chatHistories[contactId] || []
    return history.filter(m => m.sender !== 'user' && !m.read).length
  }

  // 미리보기용 텍스트 자르기 (10글자 이상이면 ...)
  const truncatePreview = (text) => {
    if (!text) return ''
    return text.length > 10 ? text.substring(0, 10) + '...' : text
  }

  if (!isOpen) return null

  return (
    <div data-board-safe-area="true" className="fixed right-6 bottom-24 w-80 h-[500px] bg-gray-900 rounded-3xl border-4 border-gray-700 shadow-2xl z-[210] overflow-hidden flex flex-col">
      {/* 폰 노치 */}
      <div className="bg-black h-6 flex items-center justify-center">
        <div className="w-20 h-4 bg-gray-800 rounded-full" />
      </div>

      {selectedContact ? (
        // 채팅 화면
        <>
          <div className="bg-gray-800 p-3 flex items-center gap-3 border-b border-gray-700">
            <button onClick={() => setSelectedContact(null)} className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-full bg-muted overflow-hidden border-2 border-gray-600">
              {selectedContact.image ? (
                <img src={selectedContact.image} alt={selectedContact.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-gray-700">
                  <Users className="w-5 h-5" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-bold text-sm truncate">{selectedContact.name}</p>
                {selectedContact.isHelper ? (
                  <span className="text-[10px] px-1.5 py-0.5 bg-primary/20 text-primary rounded">조력자</span>
                ) : (
                  <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded">용의자</span>
                )}
              </div>
              <p className="text-xs text-gray-400 truncate">
                {selectedContact.isHelper
                  ? '수사를 도와드립니다'
                  : (selectedContact.role || selectedContact.occupation || '관련자')
                }
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-950 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {(chatHistories[selectedContact.id] || []).map((msg, idx) => (
              <div key={idx} className={cn("flex", msg.sender === 'user' ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                  msg.sender === 'user'
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-gray-800 rounded-bl-sm"
                )}>
                  {msg.isTyping ? (
                    <div className="flex items-center gap-1 h-4">
                      <span className="inline-block w-1.5 h-1.5 bg-gray-200/90 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="inline-block w-1.5 h-1.5 bg-gray-200/90 rounded-full animate-bounce" style={{ animationDelay: '120ms' }} />
                      <span className="inline-block w-1.5 h-1.5 bg-gray-200/90 rounded-full animate-bounce" style={{ animationDelay: '240ms' }} />
                    </div>
                  ) : (
                    <>
                      {/* 단서 태그 표시 */}
                      {msg.usedClueName && (
                        <span className="inline-block px-1.5 py-0.5 bg-blue-500/30 text-blue-300 text-xs rounded mr-1 mb-1">
                          @{msg.usedClueName}
                        </span>
                      )}
                      <p>{msg.text}</p>
                      <p className="text-xs opacity-60 mt-1">{msg.time}</p>
                    </>
                  )}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* 선택된 단서 표시 */}
          {selectedClue && (
            <div className="bg-gray-800 px-3 py-2 border-t border-gray-700 flex items-center gap-2">
              <span className="text-xs text-gray-400">첨부 단서:</span>
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30">
                <Search className="w-3 h-3" />
                @{selectedClue.name}
                <button
                  onClick={handleRemoveClue}
                  className="ml-1 hover:text-blue-200 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            </div>
          )}

          <div className="bg-gray-800 p-2">
            <div className="flex gap-2">
              {/* 단서 추가 버튼 */}
              <button
                onClick={() => setClueModalOpen(true)}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                  selectedClue
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                    : "bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-gray-200"
                )}
                title="단서 첨부"
              >
                <Plus className="w-5 h-5" />
              </button>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                onKeyPress={handleKeyPress}
                autoFocus
                placeholder={selectedClue ? `@${selectedClue.name} 관련 질문...` : "메시지 입력..."}
                className="flex-1 bg-gray-700 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                onClick={handleSend}
                className="w-10 h-10 bg-primary rounded-full flex items-center justify-center hover:bg-primary/80"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 단서 선택 모달 */}
          {clueModalOpen && (
            <div className="absolute inset-0 bg-black/80 z-10 flex flex-col rounded-3xl overflow-hidden">
              <div className="bg-gray-800 p-3 flex items-center justify-between border-b border-gray-700">
                <h3 className="font-bold text-sm">단서 선택</h3>
                <button
                  onClick={() => setClueModalOpen(false)}
                  className="p-1 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto bg-gray-950 p-2">
                {clues.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">발견한 단서가 없습니다</p>
                    <p className="text-xs mt-1">현장을 조사하여 단서를 찾아보세요</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {clues.map((clue) => (
                      <button
                        key={clue.id}
                        onClick={() => handleClueSelect(clue)}
                        className={cn(
                          "w-full p-2 rounded-lg text-left transition-colors flex items-center gap-3",
                          selectedClue?.id === clue.id
                            ? "bg-blue-500/20 border border-blue-500/30"
                            : "bg-gray-800 hover:bg-gray-700"
                        )}
                      >
                        {/* 단서 이미지 */}
                        <div className="w-12 h-12 rounded-lg bg-gray-700 overflow-hidden flex-shrink-0">
                          {clue.image || clue.imageUrl || clue.detailImageUrl ? (
                            <img
                              src={clue.image || clue.imageUrl || clue.detailImageUrl}
                              alt={clue.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                              <Search className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate">{clue.name}</p>
                          {clue.location && (
                            <p className="text-xs text-gray-400 truncate">{clue.location}</p>
                          )}
                          {clue.description && (
                            <p className="text-xs text-gray-500 truncate mt-0.5">{truncatePreview(clue.description)}</p>
                          )}
                        </div>
                        {selectedClue?.id === clue.id && (
                          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedClue && (
                <div className="bg-gray-800 p-3 border-t border-gray-700">
                  <button
                    onClick={() => setClueModalOpen(false)}
                    className="w-full py-2 bg-blue-500 text-white rounded-lg font-bold text-sm hover:bg-blue-600 transition-colors"
                  >
                    @{selectedClue.name} 첨부하기
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        // 연락처 목록
        <>
          <div className="bg-gray-800 p-4">
            <h3 className="font-bold">연락처</h3>
            <p className="text-xs text-gray-400 mt-1">용의자와 대화하여 정보를 수집하세요</p>
          </div>

          <div className="flex-1 bg-gray-950 overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {allContacts.map(contact => {
              const unread = getUnreadCount(contact.id)
              const lastMessage = (chatHistories[contact.id] || []).slice(-1)[0]

              return (
                <button
                  key={contact.id}
                  onClick={() => {
                    setSelectedContact(contact)
                    onContactSelect?.(contact)
                  }}
                  className="w-full p-3 flex items-center gap-3 hover:bg-gray-800 transition-colors border-b border-gray-800 group"
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-muted overflow-hidden border-2 border-gray-700 group-hover:border-amber-500/50 transition-colors">
                      {contact.image ? (
                        <img src={contact.image} alt={contact.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-gray-800">
                          <Users className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    {unread > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold animate-pulse">
                        {unread}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm truncate">{contact.name}</p>
                      {contact.isHelper ? (
                        <span className="text-[10px] px-1.5 py-0.5 bg-primary/20 text-primary rounded flex-shrink-0">조력자</span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded flex-shrink-0">용의자</span>
                      )}
                    </div>
                    {/* 역할 표시 */}
                    {(contact.role || contact.occupation) && !contact.isHelper && (
                      <p className="text-xs text-gray-500 truncate">{contact.role || contact.occupation}</p>
                    )}
                    {/* 마지막 메시지 또는 한줄 소개 */}
                    {lastMessage ? (
                      <p className="text-xs text-gray-400 truncate mt-0.5">{truncatePreview(lastMessage.text)}</p>
                    ) : contact.oneLiner && !contact.isHelper ? (
                      <p className="text-xs text-gray-500 italic truncate mt-0.5">"{truncatePreview(contact.oneLiner)}"</p>
                    ) : null}
                  </div>
                </button>
              )
            })}
          </div>
        </>
      )}

      {/* 폰 하단 바 */}
      <div className="bg-black h-4 flex items-center justify-center">
        <div className="w-24 h-1 bg-gray-600 rounded-full" />
      </div>
    </div>
  )
}
