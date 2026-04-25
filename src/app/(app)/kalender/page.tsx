export default function KalenderPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Wirtschaftskalender</h1>
        <p className="text-muted-foreground text-sm">
          Investing.com – Makroökonomische Events &amp; Nachrichten
        </p>
      </div>

      <div className="rounded-lg border border-border/60 overflow-hidden bg-card">
        <iframe
          src="https://sslecal2.investing.com?columns=exc_flags,exc_currency,exc_importance,exc_actual,exc_forecast,exc_previous&category=_employment,_economicActivity,_inflation,_credit,_centralBanks,_confidenceIndex,_balance,_Bonds&importance=3&features=datepicker,timezone,timeselector,filters&countries=5&calType=day&timeZone=16&lang=8"
          title="Wirtschaftskalender – Investing.com"
          width="100%"
          style={{ height: 'calc(100vh - 160px)', minHeight: 620, border: 'none', display: 'block' }}
          loading="lazy"
          allowTransparency={true}
        />
      </div>

      <p className="text-xs text-muted-foreground text-right">
        Der Wirtschaftskalender wird Ihnen von{' '}
        <a
          href="https://de.investing.com/"
          rel="nofollow noopener noreferrer"
          target="_blank"
          className="underline underline-offset-2 hover:text-foreground transition-colors font-semibold"
        >
          Investing.com Deutschland
        </a>
        , dem führenden Finanzportal, zur Verfügung gestellt.
      </p>
    </div>
  )
}
