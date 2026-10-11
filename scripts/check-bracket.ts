import {
  championOf,
  clearWinner,
  createTournament,
  lossCount,
  playedCount,
  setWinner,
} from "../src/lib/tournament.ts"

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message)
}

function playAll(size: number, pick: "a" | "b" = "a") {
  const names = Array.from({ length: size }, (_, index) => `Игрок ${index + 1}`)
  let cup = createTournament(names, size, { shufflePlayers: false, rng: () => 0 })
  const guard = size * 3
  let steps = 0
  while (steps < guard) {
    const ready = cup.matches.filter((match) => match.aId && match.bId && !match.winnerId)
    if (ready.length === 0) break
    for (const match of ready) {
      const winnerId = pick === "a" ? match.aId : match.bId
      assert(winnerId, "пустой победитель")
      cup = setWinner(cup, match.id, winnerId)
    }
    steps += 1
  }
  const champion = championOf(cup)
  assert(champion, `нет чемпиона при ${size}`)
  for (const player of cup.players) {
    if (player.id === champion.id) continue
    assert(lossCount(cup, player.id) >= 2, `${player.name} вылетел с ${lossCount(cup, player.id)} поражениями`)
  }
  return cup
}

const cup32 = playAll(32)
assert(new Set(cup32.players.map((player) => player.id)).size === 32, "дубли игроков")
const firstRound = cup32.matches.filter((match) => match.bracket === "upper" && match.round === 0)
assert(firstRound.length === 16, "1/16")
const seated = firstRound.flatMap((match) => [match.aId, match.bId])
assert(new Set(seated).size === 32, "не все сели в 1/16")

const fresh24 = createTournament(
  Array.from({ length: 24 }, (_, index) => `Игрок ${index + 1}`),
  24,
  { shufflePlayers: false },
)
const opening24 = fresh24.matches.filter((match) => match.bracket === "upper" && match.round === 0)
assert(opening24.length === 16, "1/16 на 24 человек — это сетка на 32")
const byes = opening24.filter((match) => Boolean(match.aId) !== Boolean(match.bId))
const real = opening24.filter((match) => match.aId && match.bId)
assert(byes.length === 8 && real.length === 8, "8 матчей и 8 проходов без соперника")
assert(byes.every((match) => match.winnerId), "проход без соперника уже в следующем раунде")
const seated24 = opening24.flatMap((match) => [match.aId, match.bId]).filter(Boolean)
assert(new Set(seated24).size === 24, "не все участники в сетке")
const round16 = fresh24.matches.filter((match) => match.bracket === "upper" && match.round === 1)
assert(round16.length === 8, "1/8")
assert(
  round16.filter((match) => match.aId || match.bId).length === 8,
  "восемь прошедших без соперника стоят в 1/8",
)
playAll(24)

const seeded = createTournament(
  Array.from({ length: 32 }, (_, index) => `S${index + 1}`),
  32,
  { shufflePlayers: false },
)
const top = seeded.matches.find((match) => match.bracket === "upper" && match.round === 0 && match.aId === seeded.players[0]?.id)
assert(top?.bId === seeded.players[31]?.id, "первый играет с последним")

let mutable = createTournament(
  Array.from({ length: 32 }, (_, index) => `P${index + 1}`),
  32,
  { shufflePlayers: false },
)
const opening = mutable.matches.find((match) => match.bracket === "upper" && match.round === 0 && match.index === 0)
assert(opening?.aId && opening.bId, "первый матч")
mutable = setWinner(mutable, opening.id, opening.aId)
const next = mutable.matches.find((match) => match.id === opening.nextId)
assert(next && (next.aId === opening.aId || next.bId === opening.aId), "победитель не прошёл")
mutable = setWinner(mutable, opening.id, opening.bId)
const nextAfter = mutable.matches.find((match) => match.id === opening.nextId)
assert(nextAfter?.aId === opening.bId || nextAfter?.bId === opening.bId, "смена победителя")
assert(nextAfter?.aId !== opening.aId && nextAfter?.bId !== opening.aId, "старый победитель остался")

const played = playAll(32)
const early = played.matches.find((match) => match.bracket === "upper" && match.round === 0 && match.index === 0)
assert(early?.aId && early.bId && early.winnerId, "ранний матч")
const other = early.winnerId === early.aId ? early.bId : early.aId
const rewound = setWinner(played, early.id, other)
const downstream = rewound.matches.filter(
  (match) =>
    match.bracket === "upper" &&
    match.round > 0 &&
    match.winnerId &&
    (match.aId === early.winnerId || match.bId === early.winnerId),
)
assert(downstream.length === 0, "ветка старого победителя не сбросилась")
const cleared = clearWinner(rewound, early.id)
const advanced = cleared.matches.find((match) => match.id === early.nextId)
assert(advanced && advanced.aId !== other && advanced.bId !== other, "сброс не убрал игрока")

const five = createTournament(["А", "Б", "В", "Г", "Д"], 5, { shufflePlayers: false })
const fiveOpen = five.matches.filter((match) => match.bracket === "upper" && match.round === 0)
assert(fiveOpen.length === 4, "пятеро играют в сетке на 8")
assert(fiveOpen.filter((match) => match.aId && match.bId).length === 1, "один реальный матч")
playAll(5)

const eight = playAll(8)
assert(playedCount(eight) === 14, `на 8 человек без поражений нижней сыграно ${playedCount(eight)}, а не 14`)

let pair = createTournament(["А", "Б"], 2, { shufflePlayers: false })
const opener = pair.matches.find((match) => match.bracket === "upper")
assert(opener?.aId && opener.bId, "двое играют первый матч")
pair = setWinner(pair, opener.id, opener.aId)
const grand = pair.matches.find((match) => match.bracket === "final" && match.round === 0)
assert(grand?.aId === opener.aId && grand.bId === opener.bId, "проигравший получает ответный матч")
assert(championOf(pair) === null, "после первого матча чемпиона ещё нет")
pair = setWinner(pair, grand.id, grand.bId)
const reset = pair.matches.find((match) => match.bracket === "final" && match.round === 1)
assert(reset?.aId && reset.bId, "если нижний выиграл финал, нужна вторая встреча")
assert(championOf(pair) === null, "счёт поражений сравнялся")
pair = setWinner(pair, reset.id, reset.bId)
assert(championOf(pair)?.id === opener.bId, "проигравший первый матч может стать чемпионом")

let dropped = createTournament(
  Array.from({ length: 8 }, (_, index) => `D${index + 1}`),
  8,
  { shufflePlayers: false },
)
const live = dropped.matches.find((match) => match.bracket === "upper" && match.round === 0 && match.aId && match.bId)
assert(live?.aId && live.bId && live.dropId, "поражение ведёт вниз")
dropped = setWinner(dropped, live.id, live.aId)
const lower = dropped.matches.find((match) => match.id === live.dropId)
assert(lower && (lower.aId === live.bId || lower.bId === live.bId), "проигравший не попал в нижнюю сетку")
assert(lossCount(dropped, live.bId) === 1, "одно поражение ещё не выбивает")
dropped = clearWinner(dropped, live.id)
const lowerAfter = dropped.matches.find((match) => match.id === live.dropId)
assert(lowerAfter && lowerAfter.aId !== live.bId && lowerAfter.bId !== live.bId, "отмена не убрала игрока снизу")

console.log("bracket ok")
