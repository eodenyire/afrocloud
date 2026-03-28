import { motion } from "framer-motion";
import { Server, Database, Radio, RefreshCw, Shield, Wifi, WifiOff, Zap } from "lucide-react";

const components = [
  {
    icon: Zap,
    title: "Edge Runtime",
    tech: "K3s + WASM",
    details: [
      "K3s orchestrates services locally on minimal hardware",
      "WASM runtime for ultra-light, portable workloads",
      "Run fraud models, pipelines, and APIs — all offline",
    ],
  },
  {
    icon: Database,
    title: "Local Data Layer",
    tech: "Postgres · MinIO · Redis",
    details: [
      "Postgres for metadata, configs, and transactional data",
      "MinIO S3-compatible object storage for raw files",
      "Redis for sub-millisecond caching and session state",
    ],
  },
  {
    icon: Radio,
    title: "Streaming Layer",
    tech: "Redpanda / Kafka",
    details: [
      "Local Kafka instance per node — no internet dependency",
      "Retry queues with exponential backoff",
      "Store-and-forward when connectivity drops",
    ],
  },
  {
    icon: RefreshCw,
    title: "Sync Engine",
    tech: "Your Secret Weapon",
    details: [
      "Event sourcing + vector clocks for conflict resolution",
      "Three modes: real-time, batch sync, local-only",
      "Delta sync — only changes move across the wire",
    ],
  },
];

const syncModes = [
  { mode: "Online", behavior: "Real-time streaming", icon: Wifi, active: true },
  { mode: "Intermittent", behavior: "Batch sync on reconnect", icon: Wifi, active: false },
  { mode: "Offline", behavior: "Full local-only operations", icon: WifiOff, active: false },
];

const scenarioSteps = [
  { step: "01", text: "Transaction happens at rural bank branch", highlight: false },
  { step: "02", text: "Edge node processes it locally — instant", highlight: true },
  { step: "03", text: "Fraud model scores the transaction in <10ms", highlight: true },
  { step: "04", text: "Decision returned to teller immediately", highlight: false },
  { step: "05", text: "Sync queued for when connectivity returns", highlight: false },
  { step: "06", text: "Data flows: Node → Nairobi Hub → Global", highlight: false },
];

export const EdgeDeepDive = () => {
  return (
    <section className="py-32 relative" id="edge-deep-dive">
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="container relative z-10 mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <span className="text-sm font-heading text-primary tracking-widest uppercase">Deep Dive</span>
          <h2 className="text-4xl md:text-5xl font-heading font-bold mt-4 text-foreground">
            Edge Node <span className="text-gradient-gold">Internals</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl leading-relaxed">
            Each edge node is a self-contained mini cloud — capable of running compute, storing data, 
            processing streams, and syncing when connectivity allows. This is where you beat everyone.
          </p>
        </motion.div>

        {/* Core Components Grid */}
        <div className="grid md:grid-cols-2 gap-5 mb-24">
          {components.map((comp, i) => (
            <motion.div
              key={comp.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-xl border border-border hover:border-glow p-8 surface-elevated transition-all duration-300 group"
            >
              <div className="flex items-start gap-4 mb-5">
                <div className="w-11 h-11 rounded-lg border border-glow flex items-center justify-center shrink-0 group-hover:glow-amber transition-shadow">
                  <comp.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-foreground text-lg">{comp.title}</h3>
                  <p className="text-xs text-primary/70 font-mono mt-0.5">{comp.tech}</p>
                </div>
              </div>
              <ul className="space-y-3">
                {comp.details.map((detail, j) => (
                  <li key={j} className="flex items-start gap-3 text-sm text-muted-foreground leading-relaxed">
                    <span className="w-1 h-1 rounded-full bg-primary/50 mt-2 shrink-0" />
                    {detail}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Sync Modes + Security */}
        <div className="grid lg:grid-cols-2 gap-8 mb-24">
          {/* Sync Modes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-xl border border-border p-8 surface-elevated"
          >
            <h3 className="font-heading font-semibold text-foreground text-xl mb-2">Sync Modes</h3>
            <p className="text-sm text-muted-foreground mb-8">The network is unreliable by default. The system adapts.</p>
            <div className="space-y-4">
              {syncModes.map((sm) => (
                <div
                  key={sm.mode}
                  className={`flex items-center gap-4 p-4 rounded-lg border ${
                    sm.active ? "border-primary/30 glow-amber" : "border-border"
                  } surface-glass`}
                >
                  <sm.icon className={`w-5 h-5 ${sm.active ? "text-primary" : "text-muted-foreground/50"}`} />
                  <div className="flex-1">
                    <span className="text-sm font-heading text-foreground">{sm.mode}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">{sm.behavior}</p>
                  </div>
                  {sm.active && (
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Security */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-border p-8 surface-elevated"
          >
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-5 h-5 text-primary" />
              <h3 className="font-heading font-semibold text-foreground text-xl">Security Model</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-8">Non-negotiable. Every node is a fortress.</p>
            <div className="space-y-5">
              {[
                { label: "Local Authentication", desc: "Offline login with cached credentials & token rotation" },
                { label: "AES-256 Encrypted Storage", desc: "All data at rest is encrypted — no exceptions" },
                { label: "TLS Secure Sync", desc: "All data in transit uses mutual TLS authentication" },
                { label: "Role-Based Access Control", desc: "Granular permissions per node, per service, per user" },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <div>
                    <span className="text-sm font-heading text-foreground">{item.label}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Sync Hierarchy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-24"
        >
          <h3 className="font-heading font-semibold text-foreground text-2xl mb-8 text-center">Sync Hierarchy</h3>
          <div className="flex flex-col items-center gap-3 max-w-md mx-auto">
            {[
              { label: "Local Node", sub: "Branch server / edge device", active: true },
              { label: "Country Cluster", sub: "National aggregation", active: false },
              { label: "Regional Hub", sub: "Nairobi · Lagos · Johannesburg", active: false },
              { label: "Global Control Plane", sub: "Central orchestration", active: false },
            ].map((level, i) => (
              <div key={level.label} className="w-full">
                <div className={`rounded-lg border p-5 text-center ${
                  level.active ? "border-primary/30 glow-amber surface-elevated" : "border-border surface-elevated"
                }`}>
                  <span className={`text-sm font-heading ${level.active ? "text-primary" : "text-foreground"}`}>
                    {level.label}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">{level.sub}</p>
                </div>
                {i < 3 && (
                  <div className="flex justify-center py-2">
                    <div className="w-px h-6 bg-primary/20" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Real Scenario */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-border surface-elevated p-8 md:p-12"
        >
          <div className="flex items-center gap-3 mb-2">
            <Server className="w-5 h-5 text-primary" />
            <h3 className="font-heading font-semibold text-foreground text-xl">Real Scenario</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-10">
            Bank transaction in rural Kenya — the system never stops.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scenarioSteps.map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className={`p-5 rounded-lg border ${
                  s.highlight ? "border-primary/30 glow-amber" : "border-border"
                } surface-glass`}
              >
                <span className="text-xs font-mono text-primary/50">{s.step}</span>
                <p className="text-sm text-foreground mt-2 leading-relaxed">{s.text}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
