import { motion } from "framer-motion";

interface AnimatedBackgroundProps {
  className?: string;
}

export const AnimatedBackground = ({ className = "" }: AnimatedBackgroundProps) => {
  const particles = Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 10 + 5,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 5,
  }));

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
      
      {/* Floating particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-primary/10"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
          }}
          animate={{
            y: [0, -20, 0, 20, 0],
            x: [0, 15, 0, -15, 0],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            repeatType: "loop",
            ease: "easeInOut",
          }}
        />
      ))}
      
      {/* Gradient circles */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2">
        {Array.from({ length: 3 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gradient-to-r from-primary/10 to-blue-500/10"
            style={{
              width: `${300 + i * 100}px`,
              height: `${300 + i * 100}px`,
              left: `-${(300 + i * 100) / 2}px`,
              top: `-${(300 + i * 100) / 2}px`,
            }}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              repeatType: "loop",
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
      
      {/* Gradient circles (bottom right) */}
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2">
        {Array.from({ length: 3 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10"
            style={{
              width: `${250 + i * 80}px`,
              height: `${250 + i * 80}px`,
              right: `-${(250 + i * 80) / 2}px`,
              bottom: `-${(250 + i * 80) / 2}px`,
            }}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.1, 0.15, 0.1],
            }}
            transition={{
              duration: 10 + i * 2,
              repeat: Infinity,
              repeatType: "loop",
              ease: "easeInOut",
              delay: i * 2,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default AnimatedBackground; 