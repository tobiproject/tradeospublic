export default function KalenderPage() {
  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 40px)' }}>
      {/* Header */}
      <div className="flex items-end justify-between pb-4 shrink-0">
        <div>
          <div className="eyebrow mb-0.5">Makroökonomie</div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--fg-1)' }}
          >
            Wirtschaftskalender
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--fg-3)' }}>
            High-Impact Events · Zentralbanken · Makrodaten
          </p>
        </div>
        <a
          href="https://de.investing.com/economic-calendar/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs"
          style={{ color: 'var(--fg-4)' }}
        >
          investing.com ↗
        </a>
      </div>

      {/* Calendar iframe — fills remaining height */}
      <div
        className="flex-1 rounded-lg overflow-hidden"
        style={{ border: '1px solid var(--border-raw)', minHeight: 500 }}
      >
        <iframe
          src="https://sslecal2.investing.com?columns=exc_flags,exc_currency,exc_importance,exc_actual,exc_forecast,exc_previous&category=_employment,_economicActivity,_inflation,_credit,_centralBanks,_confidenceIndex,_balance,_Bonds&importance=3&features=datepicker,timezone,timeselector,filters&countries=5&calType=week&timeZone=16&lang=8"
          title="Wirtschaftskalender – Investing.com"
          width="100%"
          height="100%"
          style={{ border: 'none', display: 'block' }}
          loading="lazy"
          allowTransparency={true}
        />
      </div>
    </div>
  )
}
