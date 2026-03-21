import { motion } from 'framer-motion';
import { EquiHireLogo } from '@/components/ui/Icons';
import { cn } from '@/lib/utils';

interface LoadingScreenProps {
  message?: string;
  className?: string;
  fullScreen?: boolean;
}

export function LoadingScreen({ message = 'Loading...', className, fullScreen = true }: LoadingScreenProps) {
  return (
    <div className={cn(
        "flex flex-col items-center justify-center bg-background",
        fullScreen ? "fixed inset-0 z-[100]" : "w-full py-24",
        className
    )}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
            duration: 1, 
            repeat: Infinity, 
            repeatType: "reverse",
            ease: "easeInOut" 
        }}
        className="mb-8"
      >
          <EquiHireLogo className="h-20 w-auto" />
      </motion.div>
      <motion.div
          initial={{ width: 0 }}
          animate={{ width: 200 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="h-1 bg-primary rounded-full overflow-hidden"
      >
          <div className="w-full h-full bg-primary/20 animate-pulse" />
      </motion.div>
      <span className="mt-4 text-sm font-medium tracking-widest text-muted-foreground uppercase">
          {message}
      </span>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl -z-10 pointer-events-none" aria-hidden />
    </div>
  );
}
