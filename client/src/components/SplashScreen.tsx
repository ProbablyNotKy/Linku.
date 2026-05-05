import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => setExiting(true), 1800);
    return () => clearTimeout(exitTimer);
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ backgroundColor: "#0B0F19" }}
      animate={exiting ? { opacity: 0, y: -32 } : { opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
      onAnimationComplete={() => {
        if (exiting) onComplete();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.88 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <h1
          className="text-7xl md:text-8xl font-black tracking-tight text-white select-none"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Linku<span style={{ color: "#3b82f6" }}>.</span>
        </h1>
      </motion.div>
    </motion.div>
  );
}
