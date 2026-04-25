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
        {/* Official investing.com embed widget (sslecal2 subdomain allows framing) */}
        <iframe
          src="https://sslecal2.investing.com/?ecoDayBackground=%230a0a0a&ecoDayFontColor=%23ffffff&ecoLast24HourFontColor=%23a1a1aa&columns=exc_flags,exc_currency,exc_importance,exc_actual,exc_forecast,exc_previous&features=datepicker,timezone,filters&countries=25,32,6,37,72,22,17,39,14,10,35,43,56,36,110,11,26,12,4,5&calType=week&timeZone=17&lang=3"
          title="Wirtschaftskalender – Investing.com"
          width="100%"
          style={{ height: 'calc(100vh - 160px)', minHeight: 620, border: 'none', display: 'block' }}
          loading="lazy"
          allowTransparency={true}
        />
      </div>

      <p className="text-xs text-muted-foreground text-right">
        Powered by{' '}
        <a
          href="https://de.investing.com"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-foreground transition-colors"
        >
          Investing.com
        </a>
      </p>
    </div>
  )
}
