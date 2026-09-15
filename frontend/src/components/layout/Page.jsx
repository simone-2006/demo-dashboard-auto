import { motion } from "motion/react"

export default function Page({ children, ...props }) {
  return (
    <motion.div {...props} className="px-2 md:px-10 lg:px-38" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      {children}
    </motion.div>
  );
}
