import { useEffect, useState } from "react"
import { ClubDraw } from "./components/ClubDraw"
import { SetupScreen } from "./components/SetupScreen"
import { TournamentScreen } from "./components/TournamentScreen"
import { drawPair, releaseDroppedClubs } from "./lib/draw"
import { loadData, saveData, type AppData } from "./lib/storage"
import {
  clearWinner,
  createTournament,
  renamePlayer,
  setMatchClubs,
  setWinner,
  type Tournament,
} from "./lib/tournament"

type Page = "cup" | "clubs"
type Ask = {
  title: string
  text: string
  confirm: string
  run: () => void
}

function pinnedClubIds(data: AppData) {
  const ids: string[] = []
  if (data.currentPair) {
    ids.push(data.currentPair.homeId, data.currentPair.awayId)
  }
  for (const pair of data.pairHistory) {
    ids.push(pair.homeId, pair.awayId)
  }
  return ids
}

function withTournament(data: AppData, tournament: Tournament): AppData {
  if (!data.tournament) return { ...data, tournament }
  return {
    ...data,
    tournament,
    usedClubIds: releaseDroppedClubs(
      data.usedClubIds,
      data.tournament,
      tournament,
      pinnedClubIds(data),
    ),
  }
}

export default function App() {
  const [data, setData] = useState<AppData>(() => loadData())
  const [page, setPage] = useState<Page>("cup")
  const [notice, setNotice] = useState<string | null>(null)
  const [ask, setAsk] = useState<Ask | null>(null)

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 3400)
    return () => window.clearTimeout(timer)
  }, [notice])

  function commit(recipe: (prev: AppData) => AppData) {
    setData((prev) => {
      const next = recipe(prev)
      saveData(next)
      return next
    })
  }

  function createCup() {
    const names = data.draftNames.map((name) => name.trim())
    if (names.length !== data.draftSize || names.some((name) => !name)) return
    commit((prev) => ({
      ...prev,
      tournament: createTournament(names, prev.draftSize, {
        shufflePlayers: prev.draftShuffle,
      }),
    }))
  }

  function pickWinner(matchId: string, playerId: string) {
    commit((prev) => {
      if (!prev.tournament) return prev
      return withTournament(prev, setWinner(prev.tournament, matchId, playerId))
    })
  }

  function undoMatch(matchId: string) {
    commit((prev) => {
      if (!prev.tournament) return prev
      return withTournament(prev, clearWinner(prev.tournament, matchId))
    })
  }

  function giveClubs(matchId: string) {
    const tournament = data.tournament
    if (!tournament) return
    const match = tournament.matches.find((item) => item.id === matchId)
    if (!match?.aId || !match.bId) return
    const released = new Set(
      [match.clubA, match.clubB].filter((id): id is string => Boolean(id)),
    )
    const used = data.avoidRepeats
      ? data.usedClubIds.filter((id) => !released.has(id))
      : data.usedClubIds
    const pair = drawPair(data.includeWomen, used, data.avoidRepeats)
    if (!pair) {
      setNotice("Свободных клубов 4.5★ меньше двух. Сбрось пул во вкладке «Клубы».")
      return
    }
    commit((prev) => {
      if (!prev.tournament) return prev
      const nextUsed = prev.avoidRepeats
        ? [...prev.usedClubIds.filter((id) => !released.has(id)), pair.home.id, pair.away.id]
        : prev.usedClubIds
      return {
        ...prev,
        usedClubIds: nextUsed,
        tournament: setMatchClubs(prev.tournament, matchId, pair.home.id, pair.away.id),
      }
    })
  }

  return (
    <div className="app">
      <header className="top">
        <div className="brand">
          <span className="mark">27</span>
          <div>
            <strong>FC 27 Кубок</strong>
            <span>Сетка турнира и клубы 4.5★</span>
          </div>
        </div>
        <nav>
          <button
            type="button"
            className={page === "cup" ? "is-on" : ""}
            onClick={() => setPage("cup")}
          >
            Турнир
          </button>
          <button
            type="button"
            className={page === "clubs" ? "is-on" : ""}
            onClick={() => setPage("clubs")}
          >
            Клубы 4.5★
          </button>
        </nav>
      </header>

      <main>
        {page === "clubs" ? (
          <ClubDraw
            includeWomen={data.includeWomen}
            avoidRepeats={data.avoidRepeats}
            usedClubIds={data.usedClubIds}
            currentPair={data.currentPair}
            history={data.pairHistory}
            onToggleWomen={(includeWomen) => commit((prev) => ({ ...prev, includeWomen }))}
            onToggleRepeats={(avoidRepeats) => commit((prev) => ({ ...prev, avoidRepeats }))}
            onDraw={(homeId, awayId) =>
              commit((prev) => ({
                ...prev,
                currentPair: { homeId, awayId },
                pairHistory: [{ homeId, awayId, at: Date.now() }, ...prev.pairHistory].slice(0, 24),
                usedClubIds: prev.avoidRepeats
                  ? [...prev.usedClubIds, homeId, awayId]
                  : prev.usedClubIds,
              }))
            }
            onResetPool={() =>
              commit((prev) => ({
                ...prev,
                currentPair: null,
                pairHistory: [],
                usedClubIds: clubsStillOnBracket(prev),
              }))
            }
          />
        ) : data.tournament ? (
          <TournamentScreen
            tournament={data.tournament}
            onWinner={pickWinner}
            onClear={undoMatch}
            onClubs={giveClubs}
            onRename={(playerId, name) =>
              commit((prev) =>
                prev.tournament
                  ? { ...prev, tournament: renamePlayer(prev.tournament, playerId, name) }
                  : prev,
              )
            }
            onReshuffle={() =>
              setAsk({
                title: "Перемешать сетку заново?",
                text: "Имена останутся, а текущие результаты и пары матчей сотрутся.",
                confirm: "Перемешать",
                run: () =>
                  commit((prev) => {
                    if (!prev.tournament) return prev
                    const names = prev.tournament.players.map((player) => player.name)
                    const tournament = createTournament(names, prev.tournament.size, {
                      shufflePlayers: true,
                    })
                    return withTournament(prev, tournament)
                  }),
              })
            }
            onReset={() =>
              setAsk({
                title: "Закрыть турнир?",
                text: "Сетка удалится с этого устройства. Список имён останется в поле набора.",
                confirm: "Закрыть",
                run: () =>
                  commit((prev) => ({
                    ...prev,
                    draftNames: prev.tournament
                      ? prev.tournament.players.map((player) => player.name)
                      : prev.draftNames,
                    draftSize: prev.tournament?.size ?? prev.draftSize,
                    tournament: null,
                  })),
              })
            }
          />
        ) : (
          <SetupScreen
            count={data.draftSize}
            names={data.draftNames}
            shuffle={data.draftShuffle}
            onCount={(count) =>
              commit((prev) => ({
                ...prev,
                draftSize: count,
                draftNames: Array.from({ length: count }, (_, index) => prev.draftNames[index] ?? ""),
              }))
            }
            onName={(index, value) =>
              commit((prev) => ({
                ...prev,
                draftNames: prev.draftNames.map((name, item) => (item === index ? value : name)),
              }))
            }
            onShuffle={(draftShuffle) => commit((prev) => ({ ...prev, draftShuffle }))}
            onFill={() =>
              commit((prev) => ({
                ...prev,
                draftNames: prev.draftNames.map((name, index) => name.trim() || `Игрок ${index + 1}`),
              }))
            }
            onCreate={createCup}
          />
        )}
      </main>

      {notice && <div className="toast">{notice}</div>}

      {ask && (
        <div className="modal-back" role="dialog" aria-modal="true">
          <div className="modal">
            <h3>{ask.title}</h3>
            <p>{ask.text}</p>
            <div>
              <button type="button" className="ghost" onClick={() => setAsk(null)}>
                Отмена
              </button>
              <button
                type="button"
                className="primary"
                onClick={() => {
                  ask.run()
                  setAsk(null)
                }}
              >
                {ask.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function clubsStillOnBracket(data: AppData) {
  if (!data.avoidRepeats || !data.tournament) return []
  const ids: string[] = []
  for (const match of data.tournament.matches) {
    if (match.clubA) ids.push(match.clubA)
    if (match.clubB) ids.push(match.clubB)
  }
  return ids
}
