import { clubs, type Club } from "../data/clubs"
import { shuffle, type Tournament } from "./tournament"

export function clubPool(includeWomen: boolean) {
  return includeWomen ? clubs : clubs.filter((club) => !club.women)
}

export function drawPair(
  includeWomen: boolean,
  usedIds: string[],
  avoidRepeats: boolean,
  rng: () => number = Math.random,
): { home: Club; away: Club } | null {
  const pool = clubPool(includeWomen)
  const used = new Set(avoidRepeats ? usedIds : [])
  const available = pool.filter((club) => !used.has(club.id))
  if (available.length < 2) return null
  const picked = shuffle(available, rng)
  const home = picked[0]
  const away = picked[1]
  if (!home || !away) return null
  return { home, away }
}

export function clubById(id: string | null) {
  if (!id) return null
  return clubs.find((club) => club.id === id) ?? null
}

function clubIds(tournament: Tournament) {
  const ids: string[] = []
  for (const match of tournament.matches) {
    if (match.clubA) ids.push(match.clubA)
    if (match.clubB) ids.push(match.clubB)
  }
  return ids
}

export function releaseDroppedClubs(
  used: string[],
  before: Tournament,
  after: Tournament,
  pinned: string[],
) {
  const still = new Set<string>([...clubIds(after), ...pinned])
  const dropped = new Set(clubIds(before).filter((id) => !still.has(id)))
  return used.filter((id) => !dropped.has(id))
}
