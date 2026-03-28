import { motion } from "framer-motion";

const phases = [
  {
    phase: "Phase 1",
    period: "0 – 6 months",
    title: "MVP & Open Source",
    items: ["Ingestion Engine", "Kafka Streaming", "S3 + Parquet Storage", "Orchestration UI", "Basic Risk API"],
    status: "active",
  },
  {
    phase: "Phase 2",
    period: "6 – 12 months",
    title: "Edge & Analytics",
    items: ["Edge node deployment", "Real-time analytics", "First bank clients", "Enhanced fraud models"],
    status: "upcoming",
  },
  {
    phase: "Phase 3",
    period: "12 – 24 months",
    title: "Full Platform",
    items: ["Full distributed cloud", "Advanced AI risk models", "Enterprise clients", "Multi-region sync"],
    status: "future",
  },
];

export const Roadmap = () => {
  return (
    <section className="py-32 relative">
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="container relative z-10 mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <span className="text-sm font-heading text-primary tracking-widest uppercase">Roadmap</span>
          <h2 className="text-4xl md:text-5xl font-heading font-bold mt-4 text-foreground">
            Execution Plan
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {phases.map((phase, i) => (
            <motion.div
              key={phase.phase}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className={`rounded-xl border p-8 ${
                phase.status === "active"
                  ? "border-primary/30 glow-amber surface-elevated"
                  : "border-border surface-elevated"
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                <span className={`text-xs font-heading tracking-widest uppercase ${
                  phase.status === "active" ? "text-primary" : "text-muted-foreground"
                }`}>
                  {phase.phase}
                </span>
                {phase.status === "active" && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-heading bg-primary/10 text-primary border border-primary/20">
                    NOW
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mb-2">{phase.period}</p>
              <h3 className="text-xl font-heading font-semibold text-foreground mb-6">{phase.title}</h3>
              <ul className="space-y-3">
                {phase.items.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      phase.status === "active" ? "bg-primary" : "bg-muted-foreground/30"
                    }`} />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
