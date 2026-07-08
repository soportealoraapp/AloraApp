'use client';

import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';

interface PageTransitionProps {
  children: React.ReactNode;
}

/**
 * PageTransition provides a consistent entry/exit animation for all pages.
 * It uses the pathname as a key to trigger animations on route changes.
 */
export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 30,
      }}
      className="flex-1 w-full flex flex-col"
    >
      {children}
    </motion.div>
  );
}
