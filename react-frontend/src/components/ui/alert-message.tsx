import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AlertMessageProps {
  type: 'success' | 'error' | 'info';
  message: string;
  className?: string;
}

export function AlertMessage({ type, message, className }: AlertMessageProps) {
  if (!message) return null;

  const config = {
    success: { icon: CheckCircle2, classes: 'bg-green-50/50 text-green-700 border-green-200/50' },
    error: { icon: AlertCircle, classes: 'bg-destructive/10 text-destructive border-destructive/20' },
    info: { icon: Info, classes: 'bg-blue-50/50 text-blue-700 border-blue-200/50' }
  };

  const { icon: Icon, classes } = config[type];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -5, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={cn("flex items-start p-3 rounded-lg border text-sm font-medium shadow-sm w-full", classes, className)}
      >
        <Icon className="w-4 h-4 mr-2.5 mt-0.5 shrink-0" />
        <span className="leading-relaxed">{message}</span>
      </motion.div>
    </AnimatePresence>
  );
}
