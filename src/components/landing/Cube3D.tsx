import { motion } from "framer-motion";
import FloatingModel from "./FloatingModel";

interface Cube3DProps {
  className?: string;
  size?: number;
  color?: string;
}

export const Cube3D = ({
  className = "",
  size = 100,
  color = "primary",
}: Cube3DProps) => {
  const faces = [
    { transform: `translateZ(${size / 2}px)`, label: "AI" },
    { transform: `rotateY(180deg) translateZ(${size / 2}px)`, label: "Data" },
    { transform: `rotateY(90deg) translateZ(${size / 2}px)`, label: "Research" },
    { transform: `rotateY(-90deg) translateZ(${size / 2}px)`, label: "Insights" },
    { transform: `rotateX(90deg) translateZ(${size / 2}px)`, label: "Teams" },
    { transform: `rotateX(-90deg) translateZ(${size / 2}px)`, label: "Projects" },
  ];

  return (
    <div className={`${className}`}>
      <FloatingModel className="w-full h-full" rotationFactor={20} floatFactor={10}>
        <div
          className="relative preserve-3d"
          style={{
            width: size,
            height: size,
          }}
        >
          {faces.map((face, index) => (
            <motion.div
              key={index}
              className={`absolute inset-0 bg-${color}/10 backdrop-blur-sm border border-${color}/30 flex items-center justify-center rounded-lg`}
              style={{
                width: size,
                height: size,
                transform: face.transform,
                backfaceVisibility: "hidden",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <span className={`text-${color} font-bold text-lg`}>{face.label}</span>
            </motion.div>
          ))}
        </div>
      </FloatingModel>
    </div>
  );
};

export default Cube3D; 