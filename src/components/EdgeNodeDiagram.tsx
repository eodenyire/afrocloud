import { motion } from "framer-motion";

const layers = [
  {
    label: "API Gateway",
    sublabel: "Local-first routing",
    color: "border-primary/40",
  },
  {
    label: "Compute Layer",
    sublabel: "K3s · WASM Runtime",
    color: "border-primary/30",
  },
  {
    label: "Data Layer",
    sublabel: "Postgres · MinIO · Redis",
    color: "border-primary/25",
  },
  {
    label: "Streaming Layer",
    sublabel: "Kafka · Retry Queue",
    color: "border-primary/20",
  },
  {
    label: "Sync Agent",
    sublabel: "↔ Global Cloud",
    color: "border-primary/15",
  },
];

export const EdgeNodeDiagram = () => {
  return (
    <section className="py-32 relative">
      <div className="container relative z-10 mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-sm font-heading text-primary tracking-widest uppercase">Edge Node</span>
            <h2 className="text-4xl md:text-5xl font-heading font-bold mt-4 text-foreground">
              Self-Contained<br />
              <span className="text-gradient-gold">Mini Cloud</span>
            </h2>
            <p className="text-muted-foreground mt-6 max-w-md leading-relaxed">
              Each edge node is a fully autonomous unit — capable of running compute, storing data, 
              processing streams, and syncing when connectivity allows. Data never has to leave the country.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-4">
              {[
                { stat: "< 10ms", label: "Local Latency" },
                { stat: "100%", label: "Offline Uptime" },
                { stat: "AES-256", label: "Encrypted Storage" },
                { stat: "3 Modes", label: "Sync Strategy" },
              ].map((item) => (
                <div key={item.label} className="p-4 rounded-lg border border-border surface-elevated">
                  <div className="text-2xl font-heading font-bold text-primary">{item.stat}</div>
                  <div className="text-xs text-muted-foreground mt-1">{item.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="rounded-2xl border border-border surface-elevated p-8 space-y-3">
              <div className="text-xs font-heading text-muted-foreground mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
                EDGE NODE — COUNTRY LOCAL
              </div>
              {layers.map((layer, i) => (
                <motion.div
                  key={layer.label}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className={`rounded-lg border ${layer.color} p-4 surface-glass`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-heading text-foreground">{layer.label}</span>
                    <span className="text-xs text-muted-foreground font-body">{layer.sublabel}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
