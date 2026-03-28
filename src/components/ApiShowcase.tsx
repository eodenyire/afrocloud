import { motion } from "framer-motion";

const apis = [
  { method: "POST", path: "/v1/ingest", desc: "Push data from any source" },
  { method: "GET", path: "/v1/query", desc: "Query your lakehouse" },
  { method: "POST", path: "/v1/risk/score", desc: "Real-time fraud scoring" },
  { method: "GET", path: "/v1/identity/graph", desc: "Identity resolution" },
];

export const ApiShowcase = () => {
  return (
    <section className="py-32 relative">
      <div className="container relative z-10 mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-heading text-primary tracking-widest uppercase">API Layer</span>
          <h2 className="text-4xl md:text-5xl font-heading font-bold mt-4 text-foreground">
            Your <span className="text-gradient-gold">Stripe Moment</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
            Everything exposed via clean, developer-first APIs. Integrate in minutes.
          </p>
        </motion.div>

        <div className="max-w-2xl mx-auto rounded-2xl border border-border surface-elevated overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-destructive/60" />
            <span className="w-3 h-3 rounded-full bg-primary/40" />
            <span className="w-3 h-3 rounded-full bg-muted-foreground/20" />
            <span className="ml-4 text-xs text-muted-foreground font-mono">api.wekeza.cloud</span>
          </div>
          <div className="p-6 space-y-1 font-mono text-sm">
            {apis.map((api, i) => (
              <motion.div
                key={api.path}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-4 py-3 px-4 rounded-lg hover:surface-glass transition-colors group"
              >
                <span className={`text-xs font-bold w-12 ${
                  api.method === "POST" ? "text-primary" : "text-muted-foreground"
                }`}>
                  {api.method}
                </span>
                <span className="text-foreground">{api.path}</span>
                <span className="text-muted-foreground text-xs ml-auto hidden sm:block">{api.desc}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
