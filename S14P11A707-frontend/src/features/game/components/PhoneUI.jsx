import { ArrowLeft, Send, Users } from "lucide-react"
import { React, useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

// 조력자 대화용 휴대폰 UI 컴포넌트
export default function PhoneUI({ isOpen, onClose, helper, suspects, chatHistories, onSendMessage, currentChat, setCurrentChat }) {
  const [message, setMessage] = useState('')
  const [selectedContact, setSelectedContact] = useState(null)
  const chatEndRef = useRef(null)

  const allContacts = [helper, ...suspects]

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatHistories, selectedContact])

  const handleSend = () => {
    if (message.trim() && selectedContact) {
      onSendMessage(selectedContact.id, message)
      setMessage('')
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
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
    <div className="fixed right-6 bottom-24 w-80 h-[500px] bg-gray-900 rounded-3xl border-4 border-gray-700 shadow-2xl z-50 overflow-hidden flex flex-col">
      {/* 폰 노치 */}
      <div className="bg-black h-6 flex items-center justify-center">
        <div className="w-20 h-4 bg-gray-800 rounded-full" />
      </div>

      {selectedContact ? (
        // 채팅 화면
        <>
          <div className="bg-gray-800 p-3 flex items-center gap-3">
            <button onClick={() => setSelectedContact(null)} className="p-1 hover:bg-gray-700 rounded">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-full bg-muted overflow-hidden">
              {selectedContact.image ? (
                <img src={selectedContact.image} alt={selectedContact.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <Users className="w-5 h-5" />
                </div>
              )}
            </div>
            <div>
              <p className="font-bold text-sm">{selectedContact.name}</p>
              <p className="text-xs text-muted-foreground">{selectedContact.isHelper ? '조력자' : '용의자'}</p>
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
                  <p>{msg.text}</p>
                  <p className="text-xs opacity-60 mt-1">{msg.time}</p>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className="bg-gray-800 p-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="메시지 입력..."
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
        </>
      ) : (
        // 연락처 목록
        <>
          <div className="bg-gray-800 p-4">
            <h3 className="font-bold">연락처</h3>
          </div>

          <div className="flex-1 bg-gray-950 overflow-hidden">
            {allContacts.map(contact => {
              const unread = getUnreadCount(contact.id)
              const lastMessage = (chatHistories[contact.id] || []).slice(-1)[0]

              return (
                <button
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  className="w-full p-3 flex items-center gap-3 hover:bg-gray-800 transition-colors border-b border-gray-800"
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-muted overflow-hidden">
                      {contact.image ? (
                        <img src={contact.image} alt={contact.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <Users className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    {unread > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold">
                        {unread}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm">{contact.name}</p>
                      {contact.isHelper && (
                        <span className="text-xs px-1.5 py-0.5 bg-primary/20 text-primary rounded">조력자</span>
                      )}
                    </div>
                    {lastMessage && (
                      <p className="text-xs text-muted-foreground">{truncatePreview(lastMessage.text)}</p>
                    )}
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