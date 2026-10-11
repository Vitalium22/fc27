import { useEffect, useState } from "react"
import { clubById } from "../lib/draw"
import {
  passNote,
  playerName,
  roundTitle,
  waitingLabel,
  type Match,
  type MatchSide,
  type Tournament,
} from "../lib/tournament"

type MatchCardProps = {
  tournament: Tournament
  match: Match
  compact?: boolean
  onWinner: (matchId: string, playerId: string) => void
  onClear: (matchId: string) => void
  onClubs: (matchId: string) => void
}

export function MatchCard({
  tournament,
  match,
  compact = false,
  onWinner,
  onClear,
  onClubs,
}: MatchCardProps) {
  const both = Boolean(match.aId && match.bId)
  const clubsReady = Boolean(match.clubA && match.clubB)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const pendingName = playerName(tournament, pendingId)

  useEffect(() => {
    setPendingId(null)
  }, [match.winnerId, match.aId, match.bId])

  function choose(playerId: string) {
    if (!both || match.winnerId === playerId) return
    setPendingId((current) => (current === playerId ? null : playerId))
  }

  return (
    <article
      className={`fixture${match.winnerId ? " is-done" : ""}${both && !match.winnerId ? " is-live" : ""}${compact ? " is-compact" : ""}`}
    >
      <div className="fixture-top">
        <span>
          {roundTitle(tournament, match)} · {match.index + 1}
        </span>
        <span className="fixture-actions">
          {both && (
            <button type="button" className="text-btn" onClick={() => onClubs(match.id)}>
              {compact ? (clubsReady ? "Ещё" : "4.5★") : clubsReady ? "Другие клубы" : "Клубы 4.5★"}
            </button>
          )}
          {match.winnerId && both && (
            <button type="button" className="text-btn" onClick={() => onClear(match.id)}>
              {compact ? "×" : "Сбросить"}
            </button>
          )}
        </span>
      </div>
      <Side
        tournament={tournament}
        match={match}
        side="a"
        pending={pendingId === match.aId}
        onChoose={choose}
      />
      <Side
        tournament={tournament}
        match={match}
        side="b"
        pending={pendingId === match.bId}
        onChoose={choose}
      />
      {(compact || (pendingId && pendingName)) && (
        <div className={`confirm-bar${pendingId && pendingName ? " is-open" : ""}`}>
          {pendingId && pendingName && (
            <>
              <button type="button" className="confirm-yes" onClick={() => onWinner(match.id, pendingId)}>
                {compact ? "Подтвердить" : `${pendingName} победил`}
              </button>
              <button type="button" className="text-btn" onClick={() => setPendingId(null)}>
                Отмена
              </button>
            </>
          )}
        </div>
      )}
    </article>
  )
}

function Side({
  tournament,
  match,
  side,
  pending,
  onChoose,
}: {
  tournament: Tournament
  match: Match
  side: MatchSide
  pending: boolean
  onChoose: (playerId: string) => void
}) {
  const playerId = side === "a" ? match.aId : match.bId
  const club = clubById(side === "a" ? match.clubA : match.clubB)
  const name = playerName(tournament, playerId)
  const winner = Boolean(playerId && match.winnerId === playerId)
  const loser = Boolean(playerId && match.winnerId && match.winnerId !== playerId)

  if (!name || !playerId) {
    return (
      <div className="slot is-empty">
        <span>{waitingLabel(tournament, match, side)}</span>
      </div>
    )
  }

  const note = passNote(tournament, match, side)

  return (
    <button
      type="button"
      className={`slot${winner ? " is-winner" : ""}${loser ? " is-loser" : ""}${pending ? " is-pending" : ""}`}
      disabled={!match.aId || !match.bId}
      onClick={() => onChoose(playerId)}
    >
      <span className="slot-copy">
        <span className="slot-name">{name}</span>
        {note && <em className="slot-note">{note}</em>}
        {club && (
          <span className="slot-club">
            {club.name}
            <small>{club.league}</small>
          </span>
        )}
      </span>
      {winner && <span className="tick">дальше</span>}
    </button>
  )
}
