import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
}

interface ParticleAnimationProps {
  className?: string;
  particleCount?: number;
  particleColors?: string[];
  particleSize?: [number, number]; // [min, max]
  particleSpeed?: [number, number]; // [min, max]
  connectionDistance?: number;
  connectionOpacity?: number;
}

export const ParticleAnimation = ({
  className = "",
  particleCount = 50,
  particleColors = ["#3b82f6", "#6366f1", "#8b5cf6"],
  particleSize = [1, 3],
  particleSpeed = [0.1, 0.3],
  connectionDistance = 150,
  connectionOpacity = 0.15,
}: ParticleAnimationProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number>(0);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Set canvas size
    const setCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    
    setCanvasSize();
    window.addEventListener("resize", setCanvasSize);
    
    // Create particles
    const createParticles = () => {
      const particles: Particle[] = [];
      
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * (particleSize[1] - particleSize[0]) + particleSize[0],
          speedX: (Math.random() - 0.5) * (particleSpeed[1] - particleSpeed[0]) + particleSpeed[0],
          speedY: (Math.random() - 0.5) * (particleSpeed[1] - particleSpeed[0]) + particleSpeed[0],
          color: particleColors[Math.floor(Math.random() * particleColors.length)],
        });
      }
      
      particlesRef.current = particles;
    };
    
    createParticles();
    
    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw particles
      particlesRef.current.forEach((particle, i) => {
        // Update position
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        
        // Bounce off edges
        if (particle.x < 0 || particle.x > canvas.width) {
          particle.speedX *= -1;
        }
        
        if (particle.y < 0 || particle.y > canvas.height) {
          particle.speedY *= -1;
        }
        
        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();
        
        // Draw connections
        for (let j = i + 1; j < particlesRef.current.length; j++) {
          const otherParticle = particlesRef.current[j];
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < connectionDistance) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.strokeStyle = `rgba(100, 116, 139, ${connectionOpacity * (1 - distance / connectionDistance)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      });
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      window.removeEventListener("resize", setCanvasSize);
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [particleCount, particleColors, particleSize, particleSpeed, connectionDistance, connectionOpacity]);
  
  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full ${className}`}
    />
  );
};

export default ParticleAnimation; 