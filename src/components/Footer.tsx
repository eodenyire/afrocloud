export const Footer = () => {
  return (
    <footer className="border-t border-border py-16">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-heading font-bold text-xs">W</span>
            </div>
            <span className="font-heading font-semibold text-foreground text-sm">Wekeza Platform</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Africa's Distributed Data & Intelligence Cloud
          </p>
          <p className="text-xs text-muted-foreground">
            © 2026 Wekeza. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
