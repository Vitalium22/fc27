export type Player = {
  id: string
  name: string
}

export type MatchSide = "a" | "b"

export type BracketLane = "upper" | "lower" | "final"

export type Match = {
  id: string
  round: number
  index: number
  aId: string | null
  bId: string | null
  winnerId: string | null
  clubA: string | null
  clubB: string | null
  nextId: string | null
  nextSide: MatchSide | null
  bracket?: BracketLane
  dropId?: string | null
  dropSide?: MatchSide | null
}

export const MIN_PLAYERS = 2
export const MAX_PLAYERS = 64

export type Tournament = {
  size: number
  players: Player[]
  matches: Match[]
  createdAt: number
  format?: "single" | "double"
}

export function isDouble(tournament: Tournament) {
  return tournament.format === "double"
}

function laneOf(match: Match): BracketLane {
  return match.bracket ?? "upper"
}

export function drawSize(playerCount: number) {
  let size = 1
  while (size < playerCount) size *= 2
  return size
}

export function byeCount(playerCount: number) {
  return drawSize(playerCount) - playerCount
}

export function playersLabel(count: number) {
  const mod10 = count % 10
  const mod100 = count % 100
  const word =
    mod10 === 1 && mod100 !== 11
      ? "участник"
      : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
        ? "участника"
        : "участников"
  return `${count} ${word}`
}

let seq = 0

function uid(prefix: string) {
  seq += 1
  return `${prefix}-${seq.toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export function shuffle<T>(items: T[], rng: () => number = Math.random): T[] {
  const next = [...items]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1))
    const swap = next[i]
    next[i] = next[j]
    next[j] = swap
  }
  return next
}

function blankMatch(bracket: BracketLane, round: number, index: number): Match {
  return {
    id: uid(`${bracket}${round}`),
    bracket,
    round,
    index,
    aId: null,
    bId: null,
    winnerId: null,
    clubA: null,
    clubB: null,
    nextId: null,
    nextSide: null,
    dropId: null,
    dropSide: null,
  }
}

function linkHalves(current: Match[], next: Match[]) {
  current.forEach((match, index) => {
    const parent = next[Math.floor(index / 2)]
    match.nextId = parent.id
    match.nextSide = index % 2 === 0 ? "a" : "b"
  })
}

export function createTournament(
  names: string[],
  size: number,
  options?: { shufflePlayers?: boolean; rng?: () => number },
): Tournament {
  const clean = names.map((name) => name.trim()).filter(Boolean)
  if (size < MIN_PLAYERS || size > MAX_PLAYERS || clean.length !== size) {
    throw new Error(`Нужно от ${MIN_PLAYERS} до ${MAX_PLAYERS} участников`)
  }

  const rng = options?.rng ?? Math.random
  const shouldShuffle = options?.shufflePlayers ?? true
  const players = (shouldShuffle ? shuffle(clean, rng) : clean).map((name) => ({
    id: uid("p"),
    name,
  }))

  const matches = buildDraw(players)

  return {
    size,
    players,
    matches,
    createdAt: Date.now(),
    format: "double",
  }
}

function seedSlots(bracketSize: number) {
  let seeds = [1]
  while (seeds.length < bracketSize) {
    const next: number[] = []
    const sum = seeds.length * 2 + 1
    for (const seed of seeds) next.push(seed, sum - seed)
    seeds = next
  }
  return seeds
}

function buildDraw(players: Player[]): Match[] {
  const bracket = drawSize(players.length)
  const upperRounds = Math.round(Math.log2(bracket))
  const upper = Array.from({ length: upperRounds }, (_, round) => {
    const count = bracket / 2 ** (round + 1)
    return Array.from({ length: count }, (_, index) => blankMatch("upper", round, index))
  })

  for (let round = 0; round < upper.length - 1; round += 1) {
    linkHalves(upper[round], upper[round + 1])
  }

  const lowerRounds = Math.max(0, 2 * (upperRounds - 1))
  const lower = Array.from({ length: lowerRounds }, (_, round) => {
    const count = bracket / 2 ** (Math.floor(round / 2) + 2)
    return Array.from({ length: count }, (_, index) => blankMatch("lower", round, index))
  })

  if (lower[0]) {
    upper[0].forEach((match, index) => {
      const target = lower[0][Math.floor(index / 2)]
      match.dropId = target.id
      match.dropSide = index % 2 === 0 ? "a" : "b"
    })
  }

  for (let round = 0; round < lower.length - 1; round += 1) {
    if (round % 2 === 0) {
      lower[round].forEach((match, index) => {
        match.nextId = lower[round + 1][index].id
        match.nextSide = "a"
      })
    } else {
      linkHalves(lower[round], lower[round + 1])
    }
  }

  for (let round = 1; round < upper.length; round += 1) {
    const targets = lower[2 * round - 1]
    if (!targets) continue
    upper[round].forEach((match, index) => {
      const target = targets[index]
      if (!target) return
      match.dropId = target.id
      match.dropSide = "b"
    })
  }

  const grand = blankMatch("final", 0, 0)
  const reset = blankMatch("final", 1, 0)
  const upperFinal = upper[upper.length - 1][0]
  upperFinal.nextId = grand.id
  upperFinal.nextSide = "a"
  if (lower.length === 0) {
    upperFinal.dropId = grand.id
    upperFinal.dropSide = "b"
  } else {
    const lowerFinal = lower[lower.length - 1][0]
    upperFinal.dropId = lowerFinal.id
    upperFinal.dropSide = "b"
    lowerFinal.nextId = grand.id
    lowerFinal.nextSide = "b"
  }

  seedSlots(bracket).forEach((seed, slot) => {
    const player = players[seed - 1]
    if (!player) return
    const match = upper[0][Math.floor(slot / 2)]
    if (slot % 2 === 0) match.aId = player.id
    else match.bId = player.id
  })

  const matches = [...upper.flat(), ...lower.flat(), grand, reset]
  const byId = new Map(matches.map((match) => [match.id, match]))
  propagate(byId)
  return matches
}

function cloneMatches(matches: Match[]) {
  return matches.map((match) => ({ ...match }))
}

function sideKey(side: MatchSide): "aId" | "bId" {
  return side === "a" ? "aId" : "bId"
}

function clubKey(side: MatchSide): "clubA" | "clubB" {
  return side === "a" ? "clubA" : "clubB"
}

function placePlayer(
  matches: Map<string, Match>,
  targetId: string | null | undefined,
  side: MatchSide | null | undefined,
  playerId: string | null,
) {
  if (!targetId || !side || !playerId) return
  const next = matches.get(targetId)
  if (!next) return
  next[sideKey(side)] = playerId
}

function sourcesOf(matches: Match[], matchId: string, side: MatchSide) {
  return matches.filter(
    (item) =>
      (item.nextId === matchId && item.nextSide === side) ||
      (item.dropId === matchId && item.dropSide === side),
  )
}

function sends(
  matches: Match[],
  source: Match,
  role: "winner" | "loser",
  seen: Set<string>,
): boolean {
  const key = `${source.id}:${role}`
  if (seen.has(key)) return false
  seen.add(key)
  if (source.winnerId) return false
  if (source.aId && source.bId) return true

  const aComing = sideComing(matches, source, "a", seen)
  const bComing = sideComing(matches, source, "b", seen)
  if (source.aId || source.bId) return (source.aId ? bComing : aComing) || role === "winner"
  if (aComing && bComing) return true
  if (aComing || bComing) return role === "winner"
  return false
}

function sideComing(matches: Match[], match: Match, side: MatchSide, seen: Set<string>) {
  if (side === "a" ? match.aId : match.bId) return true
  return sourcesOf(matches, match.id, side).some((source) => {
    const role = source.dropId === match.id && source.dropSide === side ? "loser" : "winner"
    return sends(matches, source, role, seen)
  })
}

function slotPending(matches: Match[], match: Match, side: MatchSide) {
  if (side === "a" ? match.aId : match.bId) return false
  const sources = sourcesOf(matches, match.id, side)
  if (sources.length === 0) return false
  return sources.some((source) => {
    const role = source.dropId === match.id && source.dropSide === side ? "loser" : "winner"
    return sends(matches, source, role, new Set())
  })
}

function propagate(matches: Map<string, Match>) {
  const list = [...matches.values()]
  let changed = true
  let guard = list.length + 2
  while (changed && guard > 0) {
    changed = false
    guard -= 1
    for (const match of list) {
      if (match.winnerId || (match.aId && match.bId) || (!match.aId && !match.bId)) continue
      const emptySide: MatchSide = match.aId ? "b" : "a"
      if (slotPending(list, match, emptySide)) continue
      const alone = match.aId ?? match.bId
      if (!alone) continue
      match.winnerId = alone
      placePlayer(matches, match.nextId, match.nextSide, alone)
      changed = true
    }
  }
}

function resetMatch(matches: Map<string, Match>) {
  return [...matches.values()].find((match) => match.bracket === "final" && match.round === 1) ?? null
}

function clearReset(matches: Map<string, Match>) {
  const reset = resetMatch(matches)
  if (!reset) return
  if (reset.winnerId) retract(matches, reset)
  reset.aId = null
  reset.bId = null
  reset.clubA = null
  reset.clubB = null
  reset.winnerId = null
}

function removeFrom(
  matches: Map<string, Match>,
  targetId: string | null | undefined,
  side: MatchSide | null | undefined,
  playerId: string,
) {
  if (!targetId || !side) return
  const next = matches.get(targetId)
  if (!next) return
  const key = sideKey(side)
  if (next[key] !== playerId) return
  if (next.winnerId === playerId) retract(matches, next)
  next[key] = null
  next[clubKey(side)] = null
}

function retract(matches: Map<string, Match>, match: Match) {
  const winnerId = match.winnerId
  const loserId =
    winnerId && winnerId === match.aId ? match.bId : winnerId === match.bId ? match.aId : null
  match.winnerId = null
  if (winnerId) {
    removeFrom(matches, match.nextId, match.nextSide, winnerId)
    if (loserId) removeFrom(matches, match.dropId, match.dropSide, loserId)
  }
  if (match.bracket === "final" && match.round === 0) clearReset(matches)
}

function applyGrandFinal(matches: Map<string, Match>, match: Match) {
  if (match.bracket !== "final" || match.round !== 0 || !match.winnerId) return
  const reset = resetMatch(matches)
  if (!reset) return
  if (match.winnerId === match.aId) {
    clearReset(matches)
    return
  }
  reset.aId = match.aId
  reset.bId = match.bId
}

export function setWinner(tournament: Tournament, matchId: string, winnerId: string): Tournament {
  const matches = cloneMatches(tournament.matches)
  const byId = new Map(matches.map((match) => [match.id, match]))
  const match = byId.get(matchId)
  if (!match) return tournament
  if (winnerId !== match.aId && winnerId !== match.bId) return tournament
  if (!match.aId || !match.bId) return tournament
  if (match.winnerId === winnerId) return tournament

  if (match.winnerId) retract(byId, match)
  match.winnerId = winnerId
  placePlayer(byId, match.nextId, match.nextSide, winnerId)
  const loserId = winnerId === match.aId ? match.bId : match.aId
  if (loserId) placePlayer(byId, match.dropId, match.dropSide, loserId)
  applyGrandFinal(byId, match)
  propagate(byId)

  return { ...tournament, matches }
}

export function clearWinner(tournament: Tournament, matchId: string): Tournament {
  const matches = cloneMatches(tournament.matches)
  const byId = new Map(matches.map((match) => [match.id, match]))
  const match = byId.get(matchId)
  if (!match?.winnerId) return tournament
  retract(byId, match)
  propagate(byId)
  return { ...tournament, matches }
}

export function setMatchClubs(
  tournament: Tournament,
  matchId: string,
  clubA: string | null,
  clubB: string | null,
): Tournament {
  return {
    ...tournament,
    matches: tournament.matches.map((match) =>
      match.id === matchId ? { ...match, clubA, clubB } : match,
    ),
  }
}

export function renamePlayer(tournament: Tournament, playerId: string, name: string): Tournament {
  const trimmed = name.trim()
  if (!trimmed) return tournament
  return {
    ...tournament,
    players: tournament.players.map((player) =>
      player.id === playerId ? { ...player, name: trimmed } : player,
    ),
  }
}

export function isBye(match: Match) {
  return laneOf(match) === "upper" && match.round === 0 && Boolean(match.aId) !== Boolean(match.bId)
}

export function isWalkover(match: Match) {
  return Boolean(match.winnerId) && Boolean(match.aId) !== Boolean(match.bId)
}

export function isLegacyDraw(tournament: Tournament) {
  if (isDouble(tournament)) return false
  return matchesInRound(tournament, 0).length !== drawSize(tournament.size) / 2
}

export function roundTitle(tournament: Tournament, match: Match) {
  if (!isDouble(tournament)) {
    const round = match.round
    if (isLegacyDraw(tournament) && tournament.size === 24) {
      const first = matchesInRound(tournament, 0).length
      if (first === 12) {
        return ["Первый круг", "Отбор в 1/4", "1/4 финала", "1/2 финала", "Финал"][round] ?? "Раунд"
      }
      return ["Стыковой раунд", "1/8 финала", "1/4 финала", "1/2 финала", "Финал"][round] ?? "Раунд"
    }
    const count = matchesInRound(tournament, round).length
    if (count <= 1) return "Финал"
    if (count === 2) return "1/2 финала"
    return `1/${count} финала`
  }

  const lane = laneOf(match)
  if (lane === "final") return match.round === 0 ? "Гранд-финал" : "Вторая встреча"
  const same = tournament.matches.filter((item) => laneOf(item) === lane)
  const last = same.reduce((max, item) => Math.max(max, item.round), 0)
  if (lane === "lower") return match.round === last ? "Финал нижней" : `Нижняя ${match.round + 1}`
  if (match.round === last) return same.length === 1 ? "Первый матч" : "Финал верхней"
  const count = same.filter((item) => item.round === match.round).length
  if (count === 2) return "1/2 финала"
  return `1/${count} финала`
}

export type BracketLaneView = {
  id: BracketLane | "main"
  title: string
  rounds: Match[][]
}

export function lanesOf(tournament: Tournament): BracketLaneView[] {
  if (!isDouble(tournament)) {
    return [{ id: "main", title: "", rounds: roundsOf(tournament) }]
  }

  const titles: Record<BracketLane, string> = {
    upper: "Верхняя сетка",
    lower: "Нижняя сетка",
    final: "Финал",
  }

  return (["upper", "lower", "final"] as const).flatMap((lane) => {
    const matches = tournament.matches.filter((match) => {
      if (laneOf(match) !== lane) return false
      if (lane === "final" && match.round === 1) return Boolean(match.aId || match.bId || match.winnerId)
      if (match.aId || match.bId || match.winnerId) return true
      return slotPending(tournament.matches, match, "a") || slotPending(tournament.matches, match, "b")
    })
    if (matches.length === 0) return []
    const last = matches.reduce((max, match) => Math.max(max, match.round), 0)
    const rounds = Array.from({ length: last + 1 }, (_, round) =>
      matches.filter((match) => match.round === round).sort((a, b) => a.index - b.index),
    ).filter((round) => round.length > 0)
    return [{ id: lane, title: titles[lane], rounds }]
  })
}

export function matchesInRound(tournament: Tournament, round: number) {
  return tournament.matches
    .filter((match) => match.round === round)
    .sort((a, b) => a.index - b.index)
}

export function roundsOf(tournament: Tournament) {
  const last = tournament.matches.reduce((max, match) => Math.max(max, match.round), 0)
  return Array.from({ length: last + 1 }, (_, round) => matchesInRound(tournament, round))
}

export function isReady(match: Match) {
  return Boolean(match.aId && match.bId && !match.winnerId)
}

export function readyMatches(tournament: Tournament) {
  return tournament.matches.filter(isReady).sort((a, b) => a.round - b.round || a.index - b.index)
}

function playerById(tournament: Tournament, playerId: string | null | undefined) {
  if (!playerId) return null
  return tournament.players.find((player) => player.id === playerId) ?? null
}

export function championOf(tournament: Tournament): Player | null {
  if (isDouble(tournament)) {
    const reset = tournament.matches.find((match) => match.bracket === "final" && match.round === 1)
    if (reset?.winnerId) return playerById(tournament, reset.winnerId)
    const grand = tournament.matches.find((match) => match.bracket === "final" && match.round === 0)
    if (grand?.winnerId && grand.winnerId === grand.aId) return playerById(tournament, grand.winnerId)
    return null
  }
  const last = tournament.matches.reduce((max, match) => Math.max(max, match.round), 0)
  const final = tournament.matches.find((match) => match.round === last)
  if (!final?.winnerId) return null
  return playerById(tournament, final.winnerId)
}

export function playerName(tournament: Tournament, playerId: string | null) {
  if (!playerId) return null
  return tournament.players.find((player) => player.id === playerId)?.name ?? "Игрок"
}

export type PlayerState = "active" | "lower" | "out" | "champion"

export function lossCount(tournament: Tournament, playerId: string) {
  return tournament.matches.filter(
    (match) =>
      match.winnerId &&
      match.aId &&
      match.bId &&
      match.winnerId !== playerId &&
      (match.aId === playerId || match.bId === playerId),
  ).length
}

export function playerState(tournament: Tournament, playerId: string): PlayerState {
  const champion = championOf(tournament)
  if (champion?.id === playerId) return "champion"
  const losses = lossCount(tournament, playerId)
  if (isDouble(tournament)) {
    if (losses >= 2) return "out"
    if (losses === 1) return "lower"
    return "active"
  }
  return losses > 0 ? "out" : "active"
}

export function matchCount(size: number) {
  return size - 1
}

export function playedCount(tournament: Tournament) {
  return tournament.matches.filter((match) => match.winnerId && match.aId && match.bId).length
}

export function waitingLabel(tournament: Tournament, match: Match, side: MatchSide) {
  const winnerFeeder = tournament.matches.find(
    (item) => item.nextId === match.id && item.nextSide === side,
  )
  if (winnerFeeder) return `победитель · ${roundTitle(tournament, winnerFeeder)}`
  const loserFeeder = tournament.matches.find(
    (item) => item.dropId === match.id && item.dropSide === side,
  )
  if (loserFeeder) return `проигравший · ${roundTitle(tournament, loserFeeder)}`
  if (laneOf(match) === "upper" && match.round === 0) return "нет соперника"
  return "ожидается"
}

export function passNote(tournament: Tournament, match: Match, side: MatchSide) {
  const seated = side === "a" ? match.aId : match.bId
  if (seated && isWalkover(match)) return "без соперника"
  const feeder = tournament.matches.find(
    (item) => item.nextId === match.id && item.nextSide === side,
  )
  if (feeder && !isDouble(tournament) && match.round - feeder.round > 1) return "сразу в 1/4"
  if (!feeder && isLegacyDraw(tournament) && tournament.size === 24 && match.round === 1 && side === "a") {
    return "без стыка"
  }
  return null
}
