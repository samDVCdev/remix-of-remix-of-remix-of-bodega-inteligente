import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logoKiosko from "@/assets/logo-kiosko.png";

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<"logo" | "exit">("logo");

  useEffect(() => {
    const timer1 = setTimeout(() => setPhase("exit"), 1800);
    const timer2 = setTimeout(() => onComplete(), 2400);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {phase !== "exit" ? null : null}
      <motion.div
        className="fixed inset-0 z-[200] flex items-center justify-center bg-background"
        initial={{ opacity: 1 }}
        animate={phase === "exit" ? { opacity: 0, scale: 1.1 } : { opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      >
        <motion.div
          className="flex flex-col items-center gap-6"
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        >
          <motion.img
            src={logoKiosko}
            alt="Kiosko"
            className="w-28 h-28 sm:w-36 sm:h-36 object-contain drop-shadow-lg"
            initial={{ rotate: -10 }}
            animate={{ rotate: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          />
          <motion.h1
            className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            Kiosko
          </motion.h1>
          <motion.div
            className="h-1 rounded-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: 80 }}
            transition={{ duration: 1, delay: 0.7, ease: "easeInOut" }}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
