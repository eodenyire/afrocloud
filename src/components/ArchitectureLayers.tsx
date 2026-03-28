import { motion } from "framer-motion";
import { Globe, Database, Cpu, Shield, Zap } from "lucide-react";

const layers = [
  {
    icon: Globe,
    number: "01",
    title: "Edge Layer",
    subtitle: "Africa-First Compute",
    description: "Micro data centers across Nairobi, Lagos, Johannesburg. K3s + WASM runtime for offline-capable, sovereign compute.",
    tags: ["K3s", "WASM", "Offline-First"],
  },
  {
    icon: Zap,
    number: "02",
    title: "Ingestion & Streaming",
    subtitle: "Real-Time Data Flow",
    description: "Connectors for Postgres, MySQL, APIs. Kafka-based streaming with CDC. Works through internet drops with local queues.",
    tags: ["Kafka", "CDC", "Retry Logic"],
  },
  {
    icon: Database,
    number: "03",
    title: "Storage Layer",
    subtitle: "Lakehouse Architecture",
    description: "S3-compatible object storage with Parquet columnar format. Multi-country partitioning, data lineage, versioned datasets.",
    tags: ["Parquet", "MinIO", "Lineage"],
  },
  {
    icon: Cpu,
    number: "04",
    title: "Processing & Orchestration",
    subtitle: "DAG-Based Pipelines",
    description: "Batch + streaming compute with built-in data quality. Handles delayed, missing, and corrupt data — built for African realities.",
    tags: ["DAG", "Batch", "Quality"],
  },
  {
    icon: Shield,
    number: "05",
    title: "Risk & Intelligence",
    subtitle: "Your Unfair Advantage",
    description: "AML engine, alternative credit scoring via mobile money & telco data, real-time fraud detection with graph-based AI models.",
    tags: ["AML", "Credit", "Fraud AI"],
  },
];

export const ArchitectureLayers = () => {
  return (
    <section className="py-32 relative">
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="container relative z-10 mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <span className="text-sm font-heading text-primary tracking-widest uppercase">Architecture</span>
          <h2 className="text-4xl md:text-5xl font-heading font-bold mt-4 text-foreground">
            Five Layers of Power
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            A production-grade distributed system designed from the ground up for African infrastructure realities.
          </p>
        </motion.div>

        <div className="space-y-4">
          {layers.map((layer, i) => (
            <motion.div
              key={layer.number}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group relative rounded-xl border border-border hover:border-glow p-6 md:p-8 surface-elevated transition-all duration-300"
            >
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex items-center gap-5 md:w-72 shrink-0">
                  <span className="text-sm font-heading text-primary/50 font-mono">{layer.number}</span>
                  <div className="w-12 h-12 rounded-lg border border-glow flex items-center justify-center group-hover:glow-amber transition-shadow">
                    <layer.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-foreground">{layer.title}</h3>
                    <p className="text-xs text-muted-foreground">{layer.subtitle}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">{layer.description}</p>
                <div className="flex gap-2 shrink-0">
                  {layer.tags.map((tag) => (
                    <span key={tag} className="px-3 py-1 rounded-full text-xs font-heading border border-border text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
