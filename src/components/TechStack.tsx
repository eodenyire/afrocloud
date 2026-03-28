import { motion } from "framer-motion";

const stack = [
  { layer: "Orchestration", tech: "K3s", desc: "Lightweight Kubernetes for edge" },
  { layer: "Storage", tech: "MinIO", desc: "S3-compatible object storage" },
  { layer: "Database", tech: "PostgreSQL", desc: "Metadata, configs, transactions" },
  { layer: "Streaming", tech: "Redpanda", desc: "Kafka-compatible, lower footprint" },
  { layer: "Cache", tech: "Redis", desc: "Sub-ms reads, session state" },
  { layer: "APIs", tech: "FastAPI / Go", desc: "High-performance endpoints" },
  { layer: "Sync", tech: "Custom (Go)", desc: "Event sourcing + vector clocks" },
];

export const TechStack = () => {
  return (
    <section className="py-32 relative">
      <div className="container relative z-10 mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-heading text-primary tracking-widest uppercase">Tech Stack</span>
          <h2 className="text-4xl md:text-5xl font-heading font-bold mt-4 text-foreground">
            MVP <span className="text-gradient-gold">Stack</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-lg mx-auto">
            Production-grade from day one. Every choice optimized for low-resource, high-reliability environments.
          </p>
        </motion.div>

        <div className="max-w-2xl mx-auto rounded-2xl border border-border surface-elevated overflow-hidden">
          <div className="grid grid-cols-3 px-6 py-3 border-b border-border text-xs font-heading text-muted-foreground uppercase tracking-wider">
            <span>Layer</span>
            <span>Technology</span>
            <span>Purpose</span>
          </div>
          {stack.map((row, i) => (
            <motion.div
              key={row.layer}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="grid grid-cols-3 px-6 py-4 border-b border-border last:border-b-0 hover:surface-glass transition-colors"
            >
              <span className="text-sm text-muted-foreground">{row.layer}</span>
              <span className="text-sm font-heading text-primary">{row.tech}</span>
              <span className="text-sm text-muted-foreground">{row.desc}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
