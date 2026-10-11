import { byeCount, MAX_PLAYERS, MIN_PLAYERS } from "../lib/tournament"

type SetupScreenProps = {
  count: number
  names: string[]
  shuffle: boolean
  onCount: (count: number) => void
  onName: (index: number, value: string) => void
  onShuffle: (value: boolean) => void
  onFill: () => void
  onCreate: () => void
}

export function SetupScreen({
  count,
  names,
  shuffle,
  onCount,
  onName,
  onShuffle,
  onFill,
  onCreate,
}: SetupScreenProps) {
  const filled = names.filter((name) => name.trim()).length
  const ready = names.length === count && filled === count
  const byes = byeCount(count)

  function setCount(next: number) {
    if (!Number.isInteger(next)) return
    onCount(Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, next)))
  }

  return (
    <section className="setup">
      <div className="setup-copy">
        <p className="eyebrow">Новый турнир</p>
        <h2>Собери сетку на один вечер</h2>
        <p>
          Укажи, сколько человек играет, и впиши имя в каждую строку. Победители
          идут по верхней сетке, проигравшие попадают в нижнюю и могут выиграть турнир.
        </p>
      </div>

      <div className="count-field">
        <span>Участников</span>
        <button type="button" className="step" onClick={() => setCount(count - 1)} disabled={count <= MIN_PLAYERS}>
          −
        </button>
        <input
          type="number"
          min={MIN_PLAYERS}
          max={MAX_PLAYERS}
          value={count}
          aria-label="Количество участников"
          onChange={(event) => {
            const next = Number(event.target.value)
            if (event.target.value === "") return
            setCount(next)
          }}
        />
        <button type="button" className="step" onClick={() => setCount(count + 1)} disabled={count >= MAX_PLAYERS}>
          +
        </button>
        <em className={ready ? "count is-ready" : "count"}>
          заполнено {filled} из {count}
        </em>
      </div>
      <p className="hint">
        {byes === 0
          ? "Все сразу играют в первом раунде."
          : `${byes} ${byes % 10 === 1 && byes % 100 !== 11 ? "пройдёт" : "пройдут"} первый раунд без соперника — так сетка остаётся ровной.`}
      </p>

      <ol className="player-form">
        {names.map((name, index) => (
          <li key={index}>
            <label>
              <span>{index + 1}</span>
              <input
                value={name}
                placeholder={`Игрок ${index + 1}`}
                autoComplete="off"
                onChange={(event) => onName(index, event.target.value)}
              />
            </label>
          </li>
        ))}
      </ol>

      <div className="setup-bar">
        <label className="check">
          <input
            type="checkbox"
            checked={shuffle}
            onChange={(event) => onShuffle(event.target.checked)}
          />
          Перемешать перед стартом
        </label>
        <button type="button" className="ghost" onClick={onFill}>
          Заполнить пустые
        </button>
        <button type="button" className="primary" disabled={!ready} onClick={onCreate}>
          {ready ? "Создать сетку" : `Нужно ещё ${count - filled}`}
        </button>
      </div>
    </section>
  )
}
