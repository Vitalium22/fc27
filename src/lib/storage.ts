import { MAX_PLAYERS, MIN_PLAYERS, type Tournament } from "./tournament"

const KEY = "fc27-tournament-v1"

export type ClubPair = {
  homeId: string
  awayId: string
  at: number
}

export type AppData = {
  tournament: Tournament | null
  draftSize: number
  draftNames: string[]
  draftShuffle: boolean
  includeWomen: boolean
  avoidRepeats: boolean
  usedClubIds: string[]
  currentPair: { homeId: string; awayId: string } | null
  pairHistory: ClubPair[]
}

export const emptyData: AppData = {
  tournament: null,
  draftSize: 8,
  draftNames: Array.from({ length: 8 }, () => ""),
  draftShuffle: true,
  includeWomen: false,
  avoidRepeats: true,
  usedClubIds: [],
  currentPair: null,
  pairHistory: [],
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function readTournament(value: unknown): Tournament | null {
  if (!isRecord(value)) return null
  if (typeof value.size !== "number" || !Number.isInteger(value.size) || value.size < MIN_PLAYERS) {
    return null
  }
  if (!Array.isArray(value.players) || !Array.isArray(value.matches)) return null
  return value as Tournament
}

function clampCount(value: unknown) {
  const count = typeof value === "number" ? value : 8
  if (!Number.isInteger(count)) return 8
  return Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, count))
}

function readNames(value: unknown, count: number) {
  const lines = Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : typeof value === "string"
      ? value.split(/\r?\n/)
      : []
  return Array.from({ length: count }, (_, index) => lines[index]?.trim() ?? "")
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptyData
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed)) return emptyData
    return {
      ...emptyData,
      ...parsed,
      tournament: readTournament(parsed.tournament),
      draftSize: clampCount(parsed.draftSize),
      draftNames: readNames(parsed.draftNames, clampCount(parsed.draftSize)),
      draftShuffle: parsed.draftShuffle !== false,
      includeWomen: parsed.includeWomen === true,
      avoidRepeats: parsed.avoidRepeats !== false,
      usedClubIds: Array.isArray(parsed.usedClubIds)
        ? parsed.usedClubIds.filter((id) => typeof id === "string")
        : [],
      pairHistory: Array.isArray(parsed.pairHistory) ? (parsed.pairHistory as ClubPair[]) : [],
    }
  } catch {
    return emptyData
  }
}

export function saveData(data: AppData) {
  localStorage.setItem(KEY, JSON.stringify(data))
}
