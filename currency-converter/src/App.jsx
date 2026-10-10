import { useEffect, useMemo, useState } from "react";

const API = "https://api.frankfurter.dev/v1";
const POPULAR = ["USD", "EUR", "GBP", "INR", "JPY", "AUD", "CAD", "CHF"];

const read = (key, fallback) => {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
};
const write = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable – ignore */
  }
};

function money(value, code) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${code}`;
  }
}

export default function App() {
  const [currencies, setCurrencies] = useState({});
  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState(() => read("cc:from", "USD"));
  const [to, setTo] = useState(() => read("cc:to", "INR"));
  const [data, setData] = useState(null); // { date, rates }
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [attempt, setAttempt] = useState(0);

  // Currency list (once)
  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`${API}/currencies`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setCurrencies)
      .catch(() => {});
    return () => ctrl.abort();
  }, []);

  // Rates for the base currency
  useEffect(() => {
    const ctrl = new AbortController();
    setStatus("loading");
    fetch(`${API}/latest?base=${from}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((json) => {
        setData({ date: json.date, rates: { ...json.rates, [from]: 1 } });
        setStatus("ready");
      })
      .catch((e) => {
        if (e?.name !== "AbortError") setStatus("error");
      });
    return () => ctrl.abort();
  }, [from, attempt]);

  useEffect(() => write("cc:from", from), [from]);
  useEffect(() => write("cc:to", to), [to]);

  const codes = useMemo(() => {
    const list = Object.keys(currencies);
    return list.length ? list : POPULAR;
  }, [currencies]);

  const value = parseFloat(amount);
  const valid = Number.isFinite(value) && value >= 0;
  const rate = data?.rates?.[to];
  const result = valid && rate ? value * rate : null;

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  const label = (c) => (currencies[c] ? `${c} — ${currencies[c]}` : c);

  return (
    <main className="page">
      <section className="note" aria-labelledby="title">
        <header className="note__head">
          <h1 id="title">Currency converter</h1>
          <p className="note__date">
            {status === "ready" && data
              ? `Rates as of ${data.date}`
              : status === "error"
              ? "Rates unavailable"
              : "Fetching rates…"}
          </p>
        </header>

        <div className="amount">
          <label htmlFor="amount">Amount</label>
          <input
            id="amount"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            aria-invalid={!valid}
          />
          {!valid && <small className="warn">Enter a number of 0 or more.</small>}
        </div>

        <div className="pair">
          <div className="field">
            <label htmlFor="from">From</label>
            <select id="from" value={from} onChange={(e) => setFrom(e.target.value)}>
              {codes.map((c) => (
                <option key={c} value={c}>
                  {label(c)}
                </option>
              ))}
            </select>
          </div>

          <button className="swap" onClick={swap} aria-label="Swap currencies" title="Swap">
            ⇄
          </button>

          <div className="field">
            <label htmlFor="to">To</label>
            <select id="to" value={to} onChange={(e) => setTo(e.target.value)}>
              {codes.map((c) => (
                <option key={c} value={c}>
                  {label(c)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="result" aria-live="polite">
          {status === "error" ? (
            <>
              <p className="warn">Couldn’t load exchange rates. Check your connection.</p>
              <button className="retry" onClick={() => setAttempt((n) => n + 1)}>
                Try again
              </button>
            </>
          ) : result !== null ? (
            <>
              <p className="result__from">
                {money(value, from)} equals
              </p>
              <p className="result__to">{money(result, to)}</p>
              <p className="result__rate">
                1 {from} = {rate.toFixed(4)} {to}
              </p>
            </>
          ) : (
            <p className="result__from">{status === "loading" ? "Loading…" : "—"}</p>
          )}
        </div>

        {status === "ready" && valid && (
          <table className="table">
            <caption>{money(value, from)} in other currencies</caption>
            <tbody>
              {POPULAR.filter((c) => c !== from && data.rates[c]).map((c) => (
                <tr key={c} className={c === to ? "is-active" : ""}>
                  <th scope="row">
                    <button onClick={() => setTo(c)}>{c}</button>
                  </th>
                  <td>{money(value * data.rates[c], c)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <footer className="note__foot">
          Data from the European Central Bank via frankfurter.dev. Reference rates, updated on working days.
        </footer>
      </section>
    </main>
  );
}
