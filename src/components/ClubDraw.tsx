import { useEffect, useRef, useState } from "react"
import { clubById, clubPool, drawPair } from "../lib/draw"
import type { Club } from "../data/clubs"

type ClubDrawProps = {
  includeWomen: boolean
  avoidRepeats: boolean
  usedClubIds: string[]
  currentPair: { homeId: string; awayId: string } | null
  history: { homeId: string; awayId: string; at: number }[]
  onToggleWomen: (value: boolean) => void
  onToggleRepeats: (value: boolean) => void
  onDraw: (homeId: string, awayId: string) => void
  onResetPool: () => void
}

export function ClubDraw({
  includeWomen,
  avoidRepeats,
  usedClubIds,
  currentPair,
  history,
  onToggleWomen,
  onToggleRepeats,
  onDraw,
  onResetPool,
}: ClubDrawProps) {
  const pool = clubPool(includeWomen)
  const used = new Set(avoidRepeats ? usedClubIds : [])
  const remaining = pool.filter((club) => !used.has(club.id)).length
  const home = clubById(currentPair?.homeId ?? null)
  const away = clubById(currentPair?.awayId ?? null)
  const [spin, setSpin] = useState<{ home: Club; away: Club } | null>(null)
  const [empty, setEmpty] = useState(false)
  const timers = useRef<number[]>([])
  const busy = useRef(false)

  useEffect(() => {
    return () => {
      timers.current.forEach((id) => window.clearTimeout(id))
    }
  }, [])

  function roll() {
    if (busy.current) return
    const pair = drawPair(includeWomen, usedClubIds, avoidRepeats)
    if (!pair) {
      setEmpty(true)
      return
    }
    busy.current = true
    setEmpty(false)
    const preview = window.setInterval(() => {
      const next = drawPair(includeWomen, [], false)
      if (next) setSpin(next)
    }, 80)
    const stop = window.setTimeout(() => {
      window.clearInterval(preview)
      busy.current = false
      setSpin(null)
      onDraw(pair.home.id, pair.away.id)
    }, 700)
    timers.current = [preview, stop]
  }

  const shownHome = spin?.home ?? home
  const shownAway = spin?.away ?? away

  return (
    <section className="draw">
      <div className="draw-copy">
        <p className="eyebrow">Жеребьёвка клубов</p>
        <h2>Случайная пара 4.5★</h2>
        <p>
          Берутся клубы EA FC 27 с рейтингом ровно 4.5 звезды, в том числе из остального мира, чтобы пара была одного уровня.
        </p>
      </div>

      <div className="draw-stage">
        <ClubFace club={shownHome} label="Хозяева" spinning={Boolean(spin)} />
        <div className="vs">VS</div>
        <ClubFace club={shownAway} label="Гости" spinning={Boolean(spin)} />
      </div>

      <div className="draw-actions">
        <button type="button" className="primary" onClick={roll} disabled={Boolean(spin)}>
          {shownHome ? "Новая пара" : "Составить пару"}
        </button>
        <button type="button" className="ghost" onClick={onResetPool}>
          Сбросить пул
        </button>
        <span className="remain">
          {avoidRepeats ? `Свободно клубов: ${remaining}` : `В пуле: ${pool.length}`}
        </span>
      </div>

      {empty && (
        <p className="warn">
          Свободных клубов меньше двух. Сбрось пул, чтобы разыграть пары заново.
        </p>
      )}

      <div className="toggles">
        <label className="check">
          <input
            type="checkbox"
            checked={avoidRepeats}
            onChange={(event) => onToggleRepeats(event.target.checked)}
          />
          Без повторов, пока пул не кончится
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={includeWomen}
            onChange={(event) => onToggleWomen(event.target.checked)}
          />
          Добавить женские клубы 4.5★
        </label>
      </div>

      {history.some((item) => clubById(item.homeId) && clubById(item.awayId)) && (
        <div className="history">
          <h3>Последние пары</h3>
          <ul>
            {history.slice(0, 8).map((item) => {
              const left = clubById(item.homeId)
              const right = clubById(item.awayId)
              if (!left || !right) return null
              return (
                <li key={item.at}>
                  <span className="history-side">
                    {left && <Crest id={left.id} />}
                    {left?.name ?? "—"}
                  </span>
                  <em>против</em>
                  <span className="history-side">
                    {right && <Crest id={right.id} />}
                    {right?.name ?? "—"}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </section>
  )
}

function ClubFace({
  club,
  label,
  spinning,
}: {
  club: Club | null
  label: string
  spinning: boolean
}) {
  return (
    <div className={`club-face${spinning ? " is-spinning" : ""}${club ? "" : " is-blank"}`}>
      {club ? <Crest id={club.id} spinning={spinning} /> : <span className="club-crest is-empty" aria-hidden="true" />}
      <span>{label}</span>
      <strong>{club?.name ?? "Ждём жеребьёвку"}</strong>
      <small>{club ? `${club.league} · 4.5★` : "FC 27"}</small>
    </div>
  )
}

function Crest({ id, spinning = false }: { id: string; spinning?: boolean }) {
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [id])

  if (failed) return <span className="club-crest is-empty" aria-hidden="true" />

  return (
    <img
      className={`club-crest${spinning ? " is-spinning" : ""}`}
      src={`/logos/${id}.png`}
      alt=""
      onError={() => setFailed(true)}
    />
  )
}
