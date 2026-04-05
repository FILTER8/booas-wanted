const font = { fontFamily: "var(--font-departure-mono)" };

const linkClass =
  "text-[13px] text-muted-foreground hover:text-foreground transition-colors";

export function Footer() {
  return (
    <footer className="bg-background">
      <div className="page-shell">
        <div className="ui-rule flex flex-col gap-4 py-3 sm:flex-row sm:items-center sm:justify-between md:py-4">
          <p className="text-[12px] tracking-[-0.015em] text-muted-foreground" style={font}>
            BOOAS WANTED a project by 0xfilter8
          </p>

          <div className="flex flex-wrap items-center gap-5 md:gap-6">
            <a
              href="https://x.com/0xfilter8"
              target="_blank"
              rel="noreferrer"
              className={linkClass}
              style={font}
            >
              X
            </a>
            <a
              href="https://github.com/FILTER8"
              target="_blank"
              rel="noreferrer"
              className={linkClass}
              style={font}
            >
              GitHub
            </a>
            <a
              href="https://www.khora.fun/booa"
              target="_blank"
              rel="noreferrer"
              className={linkClass}
              style={font}
            >
              BOOAS
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}