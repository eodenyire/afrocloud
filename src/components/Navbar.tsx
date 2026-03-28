import { motion } from "framer-motion";

export const Navbar = () => {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 surface-glass border-b border-border"
    >
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-heading font-bold text-sm">W</span>
          </div>
          <span className="font-heading font-semibold text-foreground tracking-tight">Wekeza</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground font-body">
          <a href="#architecture" className="hover:text-foreground transition-colors">Architecture</a>
          <a href="#edge" className="hover:text-foreground transition-colors">Edge Nodes</a>
          <a href="#api" className="hover:text-foreground transition-colors">APIs</a>
          <a href="#roadmap" className="hover:text-foreground transition-colors">Roadmap</a>
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          className="px-5 py-2 rounded-lg bg-primary text-primary-foreground font-heading font-medium text-sm"
        >
          Join Waitlist
        </motion.button>
      </div>
    </motion.nav>
  );
};
