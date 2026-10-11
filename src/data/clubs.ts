export type Club = {
  id: string
  name: string
  league: string
  women: boolean
}

/** Клубы EA FC 27 с рейтингом ровно 4.5★. */
export const clubs: Club[] = [
  { id: "benfica", name: "SL Benfica", league: "Португалия", women: false },
  { id: "athletic-club", name: "Athletic Club", league: "Ла Лига", women: false },
  { id: "brentford", name: "Brentford", league: "АПЛ", women: false },
  { id: "como", name: "Como 1907", league: "Серия A", women: false },
  { id: "fenerbahce", name: "Fenerbahçe", league: "Суперлига", women: false },
  { id: "milano-fc", name: "Milano FC", league: "Серия A", women: false },
  { id: "nottingham-forest", name: "Nottingham Forest", league: "АПЛ", women: false },
  { id: "deportivo", name: "RC Deportivo", league: "Ла Лига", women: false },
  { id: "real-betis", name: "Real Betis", league: "Ла Лига", women: false },
  { id: "villarreal", name: "Villarreal CF", league: "Ла Лига", women: false },
  { id: "al-nassr", name: "Al Nassr", league: "Саудовская Про-лига", women: false },
  { id: "aston-villa", name: "Aston Villa", league: "АПЛ", women: false },
  { id: "bergamo-calcio", name: "Bergamo Calcio", league: "Серия A", women: false },
  { id: "bournemouth", name: "Bournemouth", league: "АПЛ", women: false },
  { id: "celta", name: "Celta", league: "Ла Лига", women: false },
  { id: "crystal-palace", name: "Crystal Palace", league: "АПЛ", women: false },
  { id: "fc-porto", name: "FC Porto", league: "Португалия", women: false },
  { id: "juventus", name: "Juventus", league: "Серия A", women: false },
  { id: "mainz", name: "Mainz 05", league: "Бундеслига", women: false },
  { id: "psv", name: "PSV", league: "Эредивизи", women: false },
  { id: "real-sociedad", name: "Real Sociedad", league: "Ла Лига", women: false },
  { id: "sporting-cp", name: "Sporting CP", league: "Португалия", women: false },
  { id: "rennes", name: "Stade Rennais", league: "Лига 1", women: false },
  { id: "stuttgart", name: "VfB Stuttgart", league: "Бундеслига", women: false },
  { id: "al-hilal", name: "Al Hilal", league: "Саудовская Про-лига", women: false },
  { id: "brighton", name: "Brighton & Hove Albion", league: "АПЛ", women: false },
  { id: "everton", name: "Everton", league: "АПЛ", women: false },
  { id: "lille", name: "LOSC", league: "Лига 1", women: false },
  { id: "leeds", name: "Leeds United", league: "АПЛ", women: false },
  { id: "rb-leipzig", name: "RB Leipzig", league: "Бундеслига", women: false },
  { id: "espanyol", name: "RCD Espanyol", league: "Ла Лига", women: false },
  { id: "rayo-vallecano", name: "Rayo Vallecano", league: "Ла Лига", women: false },
  { id: "freiburg", name: "SC Freiburg", league: "Бундеслига", women: false },
  { id: "lazio", name: "Lazio", league: "Серия A", women: false },
  { id: "sunderland", name: "Sunderland", league: "АПЛ", women: false },
  { id: "hoffenheim", name: "TSG Hoffenheim", league: "Бундеслига", women: false },
  { id: "trabzonspor", name: "Trabzonspor", league: "Суперлига", women: false },
  { id: "west-ham", name: "West Ham", league: "АПЛ", women: false },
  { id: "olympiacos", name: "Olympiacos", league: "Греция", women: false },
  { id: "aek", name: "AEK", league: "Греция", women: false },
  { id: "panathinaikos", name: "Panathinaikos", league: "Греция", women: false },
  { id: "paok", name: "PAOK", league: "Греция", women: false },
  { id: "w-atletico-madrid", name: "Atlético Madrid", league: "Лига F", women: true },
  { id: "w-gotham", name: "Gotham FC", league: "NWSL", women: true },
  { id: "w-orlando-pride", name: "Orlando Pride", league: "NWSL", women: true },
  { id: "w-washington-spirit", name: "Washington Spirit", league: "NWSL", women: true },
  { id: "w-paris-fc", name: "Paris FC", league: "Франция", women: true },
  { id: "w-juventus", name: "Juventus", league: "Италия", women: true },
  { id: "w-roma", name: "Roma", league: "Италия", women: true },
]

export const mensClubs = clubs.filter((club) => !club.women)
