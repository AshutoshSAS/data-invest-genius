import { useState, useRef, ReactNode } from "react";
import { motion } from "framer-motion";

interface ThreeDCardProps {
  children: ReactNode;
  className?: string;
  glareIntensity?: number;
  rotationIntensity?: number;
}

export const ThreeDCard = ({
  children,
  className = "",
  glareIntensity = 0.2,
  rotationIntensity = 10,
}: ThreeDCardProps) => {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePosition, setGlarePosition] = useState({ x: 0, y: 0 });
  
  const cardRef = useRef<HTMLDivElement>(null);
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    
    // Calculate mouse position relative to card center
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    
    // Calculate rotation (inverted for natural feel)
    const rotateYValue = (mouseX / (rect.width / 2)) * rotationIntensity * -1;
    const rotateXValue = (mouseY / (rect.height / 2)) * rotationIntensity;
    
    // Calculate glare position
    const glareX = (e.clientX - rect.left) / rect.width * 100;
    const glareY = (e.clientY - rect.top) / rect.height * 100;
    
    setRotateX(rotateXValue);
    setRotateY(rotateYValue);
    setGlarePosition({ x: glareX, y: glareY });
  };
  
  const handleMouseLeave = () => {
    // Reset to default position
    setRotateX(0);
    setRotateY(0);
  };
  
  return (
    <motion.div
      ref={cardRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        transformStyle: "preserve-3d",
      }}
      animate={{
        rotateX: rotateX,
        rotateY: rotateY,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        mass: 0.5,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Glare effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(255,255,255,${glareIntensity}), transparent 50%)`,
          zIndex: 2,
        }}
      />
      
      {/* Content */}
      <div className="relative z-1">
        {children}
      </div>
    </motion.div>
  );
};

export default ThreeDCard; 