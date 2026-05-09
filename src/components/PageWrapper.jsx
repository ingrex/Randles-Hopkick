// src/components/PageWrapper.jsx
import { motion } from "framer-motion";

const variants = {
  initial: { opacity: 0, y: 22 },
  enter: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    y: -22,
    transition: { duration: 0.35, ease: "easeIn" },
  },
};

export function PageWrapper({ children }) {
  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="enter"
      exit="exit"
    >
      {children}
    </motion.div>
  );
}
export default PageWrapper;