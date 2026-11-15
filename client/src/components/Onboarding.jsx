function Zigzag({ className }) {
  return (
    <svg viewBox="0 0 120 84" fill="none" stroke="currentColor" strokeWidth="5" strokeLinejoin="miter" className={className} aria-hidden>
      {[12, 32, 52, 72].map((y) => (
        <path key={y} d={`M0 ${y} L15 ${y - 10} L30 ${y} L45 ${y - 10} L60 ${y} L75 ${y - 10} L90 ${y} L105 ${y - 10} L120 ${y}`} />
      ))}
    </svg>
  );
}

/** First-run screen from the Figma "Onboarding" frame. */
export default function Onboarding({ onStart }) {
  return (
    <div className="flex min-h-dvh flex-col bg-white lg:flex-row">
      <div className="relative min-h-[60dvh] flex-1 overflow-hidden bg-primary lg:min-h-dvh">
        <Zigzag className="absolute -left-2 top-[16%] w-32 text-white/20" />
        <Zigzag className="absolute -right-2 bottom-[8%] w-32 text-white/20" />
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full border-[12px] border-white/15" aria-hidden />
      </div>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pb-8 pt-8 lg:justify-center lg:px-12">
        <h1 className="text-2xl font-semibold text-ink">Manage What To Do</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          The best way to manage what you have to do, don’t forget your plans
        </p>
        <button
          type="button"
          onClick={onStart}
          className="mt-auto h-12 w-full rounded bg-primary text-sm font-medium text-white hover:bg-primary/90 lg:mt-12"
        >
          Get Started
        </button>
      </div>
    </div>
  );
}
