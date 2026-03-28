import { motion } from "framer-motion";

const nodes = [
  { id: "nairobi", label: "Nairobi", x: 65, y: 30, delay: 0 },
  { id: "lagos", label: "Lagos", x: 20, y: 45, delay: 0.2 },
  { id: "joburg", label: "Johannesburg", x: 55, y: 75, delay: 0.4 },
  { id: "rural", label: "Edge Node", x: 80, y: 55, delay: 0.6 },
  { id: "global", label: "Global", x: 42, y: 12, delay: 0.8 },
];

const connections = [
  ["nairobi", "lagos"],
  ["nairobi", "joburg"],
  ["nairobi", "rural"],
  ["lagos", "global"],
  ["nairobi", "global"],
  ["joburg", "rural"],
];

export const EdgeNodeVisualization = () => {
  const getNode = (id: string) => nodes.find((n) => n.id === id)!;

  return (
    <div className="relative w-full aspect-square max-w-lg mx-auto">
      {/* SVG connections */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
        {connections.map(([from, to], i) => {
          const a = getNode(from);
          const b = getNode(to);
          return (
            <motion.line
              key={i}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="hsl(43 96% 56% / 0.15)"
              strokeWidth="0.3"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, delay: 0.5 + i * 0.15 }}
            />
          );
        })}

        {/* Animated data packets */}
        {connections.slice(0, 3).map(([from, to], i) => {
          const a = getNode(from);
          const b = getNode(to);
          return (
            <motion.circle
              key={`packet-${i}`}
              r="0.8"
              fill="hsl(43 96% 56%)"
              initial={{ cx: a.x, cy: a.y, opacity: 0 }}
              animate={{
                cx: [a.x, b.x, a.x],
                cy: [a.y, b.y, a.y],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 4,
                delay: 1 + i * 1.2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          );
        })}
      </svg>

      {/* Nodes */}
      {nodes.map((node) => (
        <motion.div
          key={node.id}
          className="absolute flex flex-col items-center"
          style={{ left: `${node.x}%`, top: `${node.y}%`, transform: "translate(-50%, -50%)" }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.8 + node.delay }}
        >
          <div className={`w-4 h-4 rounded-full border-2 ${
            node.id === "global" 
              ? "border-muted-foreground bg-muted" 
              : "border-primary bg-primary/20"
          } animate-pulse-glow`} />
          <span className="mt-2 text-xs font-heading text-muted-foreground whitespace-nowrap">
            {node.label}
          </span>
        </motion.div>
      ))}
    </div>
  );
};
