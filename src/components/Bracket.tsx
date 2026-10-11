import { MatchCard } from "./MatchCard"
import { lanesOf, roundTitle, type Tournament } from "../lib/tournament"

type BracketProps = {
  tournament: Tournament
  onWinner: (matchId: string, playerId: string) => void
  onClear: (matchId: string) => void
  onClubs: (matchId: string) => void
}

export function Bracket({ tournament, onWinner, onClear, onClubs }: BracketProps) {
  const lanes = lanesOf(tournament)

  return (
    <div className="bracket-scroll">
      {lanes.map((lane) => (
        <section className="bracket-lane" key={lane.id}>
          {lane.title && <h3 className="lane-title">{lane.title}</h3>}
          <div className="bracket">
            {lane.rounds.map((matches, round) => {
              const next = lane.rounds[round + 1]
              const paired = Boolean(next && matches.length === next.length * 2)
              const aligned = Boolean(next && matches.length === next.length)
              return (
                <section className="round-col" key={`${lane.id}-${matches[0]?.id ?? round}`}>
                  <h3>{roundTitle(tournament, matches[0])}</h3>
                  <div className="round-body">
                    {paired
                      ? chunk(matches).map((pair) => (
                          <div className="pair" key={pair[0].id}>
                            {pair.map((match) => (
                              <div className="cell" key={match.id}>
                                <MatchCard
                                  tournament={tournament}
                                  match={match}
                                  compact
                                  onWinner={onWinner}
                                  onClear={onClear}
                                  onClubs={onClubs}
                                />
                              </div>
                            ))}
                            <span className="pair-link" aria-hidden="true" />
                          </div>
                        ))
                      : matches.map((match) => (
                          <div className="cell" key={match.id}>
                            <MatchCard
                              tournament={tournament}
                              match={match}
                              compact
                              onWinner={onWinner}
                              onClear={onClear}
                              onClubs={onClubs}
                            />
                            {aligned && <span className="solo-link" aria-hidden="true" />}
                          </div>
                        ))}
                  </div>
                </section>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}

function chunk<T>(items: T[]) {
  const pairs: T[][] = []
  for (let index = 0; index < items.length; index += 2) {
    pairs.push(items.slice(index, index + 2))
  }
  return pairs
}
