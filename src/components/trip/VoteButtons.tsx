"use client"

import { ThumbsUp, ThumbsDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface VoteButtonsProps {
  up: number
  down: number
  userVote: -1 | 0 | 1
}

export function VoteButtons({ up, down, userVote: initialVote }: VoteButtonsProps) {
  const [vote, setVote] = useState(initialVote)
  const [counts, setCounts] = useState({ up, down })

  const handleVote = (newVote: -1 | 1) => {
    if (vote === newVote) {
      // Toggle off
      setCounts((prev) => ({
        up: newVote === 1 ? prev.up - 1 : prev.up,
        down: newVote === -1 ? prev.down - 1 : prev.down,
      }))
      setVote(0)
    } else {
      setCounts((prev) => ({
        up: prev.up + (newVote === 1 ? 1 : 0) - (vote === 1 ? 1 : 0),
        down: prev.down + (newVote === -1 ? 1 : 0) - (vote === -1 ? 1 : 0),
      }))
      setVote(newVote)
    }
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={(e) => {
          e.stopPropagation()
          handleVote(1)
        }}
        className={cn(vote === 1 && "text-emerald-600 bg-emerald-50")}
      >
        <ThumbsUp className="size-3" />
      </Button>
      {counts.up > 0 && (
        <span className="text-xs text-emerald-600 font-medium">{counts.up}</span>
      )}
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={(e) => {
          e.stopPropagation()
          handleVote(-1)
        }}
        className={cn(vote === -1 && "text-red-500 bg-red-50")}
      >
        <ThumbsDown className="size-3" />
      </Button>
      {counts.down > 0 && (
        <span className="text-xs text-red-500 font-medium">{counts.down}</span>
      )}
    </div>
  )
}
