import { ReactNode } from "react";
import { motion } from "framer-motion";
import ThreeDCard from "./ThreeDCard";

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  delay?: number;
}

export const FeatureCard = ({
  icon,
  title,
  description,
  delay = 0,
}: FeatureCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
    >
      <ThreeDCard className="bg-card rounded-xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow h-full">
        <div className="text-4xl mb-4">{icon}</div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </ThreeDCard>
    </motion.div>
  );
};

export default FeatureCard; 