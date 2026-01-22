import { DoorOpen, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"

// 탐사할 방(범행 관련 장소) 선택 토글 (플레이 화면 오른쪽 하단)
export default function RoomSelector({ isOpen, onToggle, rooms, currentRoom, onRoomSelect }) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="w-14 h-14 bg-card/90 border-2 border-primary rounded-full shadow-lg hover:scale-105 transition-transform flex items-center justify-center text-2xl"
      >
        🚪
      </button>

      {isOpen && (
        <div className="absolute bottom-16 right-0 w-64 bg-card border border-border rounded-lg shadow-xl overflow-hidden">
          <div className="p-3 border-b border-border">
            <p className="text-sm font-bold flex items-center gap-2">
              <DoorOpen className="w-4 h-4 text-primary" />
              방 이동
            </p>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {rooms.map(room => (
              <button
                key={room.id}
                onClick={() => room.unlocked && onRoomSelect(room)}
                disabled={!room.unlocked}
                className={cn(
                  "w-full p-3 flex items-center gap-3 text-left transition-colors",
                  room.id === currentRoom?.id && "bg-primary/10",
                  room.unlocked ? "hover:bg-muted/50" : "opacity-50 cursor-not-allowed"
                )}
              >
                <MapPin className={cn("w-4 h-4", room.id === currentRoom?.id ? "text-primary" : "text-muted-foreground")} />
                <span className="text-sm">{room.name}</span>
                {!room.unlocked && <span className="text-xs text-muted-foreground ml-auto">잠김</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}