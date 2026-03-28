import { motion } from "framer-motion";
import { EdgeNodeVisualization } from "./EdgeNodeVisualization";

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 bg-grid opacity-60" />
      
      {/* Radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-[120px]" />

      <div className="container relative z-10 mx-auto px-6 pt-32 pb-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-glow surface-glass mb-8">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
              <span className="text-sm text-muted-foreground font-body">Africa's Distributed Cloud</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-heading font-bold leading-[1.05] tracking-tight mb-6">
              <span className="text-foreground">The Cloud</span>
              <br />
              <span className="text-gradient-gold">Africa Deserves</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-lg mb-10 leading-relaxed">
              Edge-first. Offline-ready. Data sovereign. Wekeza is a distributed cloud platform 
              built for African realities — low bandwidth, intermittent connectivity, and the need for speed.
            </p>

            <div className="flex flex-wrap gap-4">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-3.5 rounded-lg bg-primary text-primary-foreground font-heading font-semibold text-sm tracking-wide"
              >
                Get Early Access
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-3.5 rounded-lg border border-glow text-foreground font-heading font-medium text-sm tracking-wide hover:surface-glass transition-colors"
              >
                View Architecture
              </motion.button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="hidden lg:block"
          >
            <EdgeNodeVisualization />
          </motion.div>
        </div>
      </div>
    </section>
  );
};
