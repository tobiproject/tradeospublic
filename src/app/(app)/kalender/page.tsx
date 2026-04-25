export default function KalenderPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Wirtschaftskalender</h1>
        <p className="text-muted-foreground text-sm">Forex Factory – live Nachrichten & Events</p>
      </div>

      <div className="rounded-lg border border-border/60 overflow-hidden bg-card">
        <iframe
          src="https://www.forexfactory.com/calendar"
          title="Forex Factory Wirtschaftskalender"
          className="w-full"
          style={{ height: 'calc(100vh - 160px)', minHeight: 600, border: 'none' }}
          loading="lazy"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>
    </div>
  )
}
