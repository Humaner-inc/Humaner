export function HeroBackground(): React.JSX.Element {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      <div
        className="hero-bg-layer absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/burgundy.png)' }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-[58%] bg-gradient-to-t from-foreground from-[18%] via-foreground/90 via-[52%] to-transparent" />
    </div>
  );
}
