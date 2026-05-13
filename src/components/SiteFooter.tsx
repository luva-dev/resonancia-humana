import equilibriaLogo from "@/assets/equilibria-logo.png";

export const SiteFooter = () => {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-2 px-4 py-8 text-center sm:flex-row sm:gap-3 sm:px-6 lg:px-8">
        <span className="text-xs text-muted-foreground sm:text-sm">
          Esta landing page fue creada por
        </span>
        <a
          href="https://equilibria.lat/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Equilibria — equilibria.lat"
          className="inline-flex items-center opacity-80 transition-opacity hover:opacity-100"
        >
          <img
            src={equilibriaLogo}
            alt="Equilibria"
            className="h-7 w-auto sm:h-8"
            loading="lazy"
          />
        </a>
      </div>
    </footer>
  );
};

export default SiteFooter;
