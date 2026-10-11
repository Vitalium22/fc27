import { useState } from "react"
import { Bracket } from "./Bracket"
import { MatchCard } from "./MatchCard"
import { clubById } from "../lib/draw"
import {
  byeCount,
  championOf,
  isDouble,
  isLegacyDraw,
  lossCount,
  playedCount,
  playersLabel,
  playerName,
  playerState,
  readyMatches,
  roundTitle,
  type Tournament,
} from "../lib/tournament"

type TournamentScreenProps = {
  tournament: Tournament
  onWinner: (matchId: string, playerId: string) => void
  onClear: (matchId: string) => void
  onClubs: (matchId: string) => void
  onRename: (playerId: string, name: string) => void
  onReshuffle: () => void
  onReset: () => void
}

const statusLabel = {
  active: "в верхней",
  lower: "в нижней",
  out: "вылетел",
  champion: "чемпион",
} as const

export function TournamentScreen({
  tournament,
  onWinner,
  onClear,
  onClubs,
  onRename,
  onReshuffle,
  onReset,
}: TournamentScreenProps) {
  const [tab, setTab] = useState<"live" | "done" | "names">("live")
  const ready = readyMatches(tournament)
  const done = tournament.matches.filter((match) => match.winnerId && match.aId && match.bId)
  const played = playedCount(tournament)
  const eliminated = tournament.players.filter((player) => lossCount(tournament, player.id) >= (isDouble(tournament) ? 2 : 1)).length
  const total = tournament.size - 1
  const champion = championOf(tournament)

  return (
    <section className="cup">
      <div className="cup-head">
        <div>
          <p className="eyebrow">{playersLabel(tournament.size)}</p>
          <h2>{champion ? "Турнир завершён" : "Сетка кубка"}</h2>
        </div>
        <div className="cup-tools">
          <div className="progress" aria-label="Сыграно матчей">
            <span>
              {isDouble(tournament)
                ? `Сыграно ${played} · вылетело ${eliminated} из ${total}`
                : `Сыграно ${played} из ${total}`}
            </span>
            <div>
              <i
                style={{
                  width: `${total === 0 ? 0 : Math.min(100, ((isDouble(tournament) ? eliminated : played) / total) * 100)}%`,
                }}
              />
            </div>
          </div>
          <button type="button" className="ghost" onClick={onReshuffle}>
            Новая жеребьёвка
          </button>
          <button type="button" className="ghost danger" onClick={onReset}>
            Закрыть турнир
          </button>
        </div>
      </div>

      {champion && (
        <div className="champion">
          <span>Чемпион</span>
          <strong>{champion.name}</strong>
        </div>
      )}

      {!isDouble(tournament) && (
        <p className="warn">
          Это одиночная сетка: один проигрыш сразу выбивает. «Новая жеребьёвка» соберёт
          верхнюю и нижнюю сетки. Текущие результаты сотрутся.
        </p>
      )}

      <p className="hint">
        {isDouble(tournament)
          ? "Победитель идёт по верхней сетке. Проигравший падает в нижнюю и может дойти до финала. Вторая потеря выбивает. Нажми на игрока и подтверди победу."
          : "Победитель матча играет с победителем соседней пары. Нажми на игрока и подтверди победу."}
        {byeCount(tournament.size) > 0 &&
          !isLegacyDraw(tournament) &&
          (byeCount(tournament.size) === 1
            ? " 1 без соперника в первом раунде и уже стоит в следующем."
            : ` ${byeCount(tournament.size)} без соперника в первом раунде и уже стоят в следующем.`)}
        {" "}Кнопка «Клубы 4.5★» назначает обоим случайные команды.
      </p>

      <div className="cup-layout">
        <Bracket
          tournament={tournament}
          onWinner={onWinner}
          onClear={onClear}
          onClubs={onClubs}
        />

        <aside className="side-panel">
          <div className="seg" role="tablist">
            <button type="button" className={tab === "live" ? "is-on" : ""} onClick={() => setTab("live")}>
              Текущие матчи {ready.length}
            </button>
            <button type="button" className={tab === "done" ? "is-on" : ""} onClick={() => setTab("done")}>
              Итоги
            </button>
            <button type="button" className={tab === "names" ? "is-on" : ""} onClick={() => setTab("names")}>
              Имена
            </button>
          </div>

          {tab === "live" && (
            <div className="stack">
              {ready.length === 0 && (
                <p className="empty">
                  {champion ? "Все матчи сыграны." : "Следующие пары появятся после текущих матчей."}
                </p>
              )}
              {ready.map((match) => (
                <MatchCard
                  key={match.id}
                  tournament={tournament}
                  match={match}
                  onWinner={onWinner}
                  onClear={onClear}
                  onClubs={onClubs}
                />
              ))}
            </div>
          )}

          {tab === "done" && (
            <div className="results-wrap">
              {done.length === 0 && <p className="empty">Пока нет сыгранных матчей.</p>}
              {done.length > 0 && (
                <table className="results">
                  <thead>
                    <tr>
                      <th>Раунд</th>
                      <th>Матч</th>
                      <th>Победитель</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {done.map((match) => {
                      const left = playerName(tournament, match.aId)
                      const right = playerName(tournament, match.bId)
                      const winner = playerName(tournament, match.winnerId)
                      const clubLeft = clubById(match.clubA)?.name
                      const clubRight = clubById(match.clubB)?.name
                      return (
                        <tr key={match.id}>
                          <td>{roundTitle(tournament, match)}</td>
                          <td>
                            {left} — {right}
                            {(clubLeft || clubRight) && (
                              <small>
                                {clubLeft ?? "—"} / {clubRight ?? "—"}
                              </small>
                            )}
                          </td>
                          <td>{winner}</td>
                          <td>
                            <button type="button" className="text-btn" onClick={() => onClear(match.id)}>
                              Сбросить
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {tab === "names" && (
            <div className="names-list">
              {tournament.players.map((player) => {
                const state = playerState(tournament, player.id)
                return (
                  <label key={player.id} className={`name-row is-${state}`}>
                    <input
                      value={player.name}
                      onChange={(event) => onRename(player.id, event.target.value)}
                    />
                    <em>{state === "active" && !isDouble(tournament) ? "в сетке" : statusLabel[state]}</em>
                  </label>
                )
              })}
            </div>
          )}
        </aside>
      </div>
    </section>
  )
}
