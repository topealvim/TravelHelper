"use client"

import { MapPin, Users, History, Plus, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { Profile } from "@/lib/types"

interface HeaderProps {
  tripName?: string
  members?: Profile[]
  onToggleSidebar?: () => void
  onShare?: () => void
}

export function Header({ tripName, members = [], onToggleSidebar, onShare }: HeaderProps) {
  return (
    <header className="flex h-12 sm:h-14 items-center justify-between border-b bg-white px-3 sm:px-4">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {onToggleSidebar && (
          <Button variant="ghost" size="icon-sm" onClick={onToggleSidebar} className="shrink-0">
            <Menu className="size-5" />
          </Button>
        )}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <MapPin className="size-4 sm:size-5 text-primary shrink-0" />
          <h1 className="text-sm sm:text-lg font-semibold truncate">
            {tripName || "TravelHelper"}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {members.length > 0 && (
          <div className="hidden sm:flex -space-x-2">
            {members.slice(0, 4).map((member) => (
              <Avatar key={member.id} className="size-7 border-2 border-white">
                <AvatarFallback className="bg-primary/10 text-xs font-medium">
                  {member.display_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            ))}
            {members.length > 4 && (
              <Avatar className="size-7 border-2 border-white">
                <AvatarFallback className="bg-muted text-xs">
                  +{members.length - 4}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        )}

        {/* Mobile: compact members count */}
        {members.length > 0 && (
          <Button variant="ghost" size="icon-sm" className="sm:hidden">
            <Users className="size-4" />
          </Button>
        )}

        {onShare && (
          <Button variant="outline" size="sm" onClick={onShare} className="hidden sm:flex">
            <Plus className="size-3.5" />
            Invite
          </Button>
        )}

        <Button variant="ghost" size="icon-sm">
          <History className="size-4" />
        </Button>
      </div>
    </header>
  )
}
