import { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface FloatingModelProps {
  className?: string;
  children?: React.ReactNode;
  rotationFactor?: number;
  floatFactor?: number;
}

export const FloatingModel = ({
  className = "",
  children,
  rotationFactor = 15,
  floatFactor = 20,
}: FloatingModelProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Smooth spring physics for mouse movement
  const springConfig = { damping: 20, stiffness: 150 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);
  
  // Transform mouse position to rotation values
  const rotateY = useTransform(smoothMouseX, [-0.5, 0.5], [rotationFactor, -rotationFactor]);
  const rotateX = useTransform(smoothMouseY, [-0.5, 0.5], [-rotationFactor, rotationFactor]);
  
  // Floating animation values
  const floatY = useMotionValue(0);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    const { width, height } = containerRef.current.getBoundingClientRect();
    setSize({ width, height });
    
    const handleMouseMove = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      // Calculate mouse position as values from -0.5 to 0.5
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      
      mouseX.set(x);
      mouseY.set(y);
    };
    
    window.addEventListener("mousemove", handleMouseMove);
    
    // Floating animation
    const floatAnimation = () => {
      const y = Math.sin(Date.now() / 1000) * floatFactor;
      floatY.set(y);
      requestAnimationFrame(floatAnimation);
    };
    
    const animationId = requestAnimationFrame(floatAnimation);
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationId);
    };
  }, [mouseX, mouseY, floatY, floatFactor]);
  
  return (
    <div 
      ref={containerRef} 
      className={`relative perspective-1000 ${className}`}
    >
      <motion.div
        style={{
          rotateY,
          rotateX,
          y: floatY,
          transformStyle: "preserve-3d",
        }}
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </div>
  );
};

export default FloatingModel; 