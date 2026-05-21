"use client";

import { motion, AnimatePresence, type Variants } from "framer-motion";
import { type ReactNode } from "react";

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -12 },
  visible: { opacity: 1, y: 0 },
};

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0 },
};

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 16 },
  visible: { opacity: 1, x: 0 },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
    },
  },
};

export const cardHover = {
  rest: { scale: 1 },
  hover: {
    scale: 1.01,
    transition: { type: "spring" as const, stiffness: 400, damping: 17 },
  },
};

export const tapEffect = {
  scale: 0.97,
  transition: { duration: 0.1 },
};

interface AnimatedContainerProps {
  children: ReactNode;
  variants?: Variants;
  className?: string;
  delay?: number;
  duration?: number;
}

export function AnimatedContainer({
  children,
  variants = fadeInUp,
  className = "",
  delay = 0,
  duration = 0.4,
}: AnimatedContainerProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={variants}
      transition={{ duration, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
}

export function StaggerContainer({ children, className = "" }: StaggerContainerProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
}

export function StaggerItem({ children, className = "" }: StaggerItemProps) {
  return (
    <motion.div variants={staggerItem} className={className}>
      {children}
    </motion.div>
  );
}

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function AnimatedCard({ children, className = "", delay = 0 }: AnimatedCardProps) {
  return (
    <motion.div
      initial="rest"
      whileHover="hover"
      whileTap={tapEffect}
      variants={cardHover}
      className={className}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

interface PresenceAnimationProps {
  children: ReactNode;
  className?: string;
  isVisible: boolean;
}

export function PresenceAnimation({ children, className = "", isVisible }: PresenceAnimationProps) {
  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function AnimatedNumber({ value, className = "" }: { value: number; className?: string }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={className}
    >
      {value.toLocaleString("fr-FR")}
    </motion.span>
  );
}

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className = "" }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
