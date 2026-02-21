'use client'
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Toaster as SonnerToaster,
  toast as sonnerToast,
} from 'sonner';
import {
  CheckCircle,
  AlertCircle,
  Info,
  AlertTriangle,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Variant = 'default' | 'success' | 'error' | 'warning';
type Position =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

interface ActionButton {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'ghost';
}

interface ToasterProps {
  title?: string;
  message: string;
  variant?: Variant;
  duration?: number;
  position?: Position;
  actions?: ActionButton;
  onDismiss?: () => void;
  highlightTitle?: boolean;
}

export interface ToasterRef {
  show: (props: ToasterProps) => void;
}

const variantStyles: Record<Variant, string> = {
  default: 'bg-card border-border text-foreground',
  success: 'bg-card border-green-600/50',
  error: 'bg-card border-destructive/50',
  warning: 'bg-card border-amber-600/50',
};

const titleColor: Record<Variant, string> = {
  default: 'text-foreground',
  success: 'text-green-600 dark:text-green-400',
  error: 'text-destructive',
  warning: 'text-amber-600 dark:text-amber-400',
};

const iconColor: Record<Variant, string> = {
  default: 'text-muted-foreground',
  success: 'text-green-600 dark:text-green-400',
  error: 'text-destructive',
  warning: 'text-amber-600 dark:text-amber-400',
};

const variantIcons: Record<Variant, React.ComponentType<{ className?: string }>> = {
  default: Info,
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
};

const toastAnimation = {
  initial: { opacity: 0, y: 50, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 50, scale: 0.95 },
};

const Toaster = forwardRef<ToasterRef, { defaultPosition?: Position }>(
  ({ defaultPosition = 'bottom-right' }, ref) => {
    const toastReference = useRef<ReturnType<typeof sonnerToast.custom> | null>(null);

    useImperativeHandle(ref, () => ({
      show({
        title,
        message,
        variant = 'default',
        duration = 4000,
        position = defaultPosition,
        actions,
        onDismiss,
        highlightTitle,
      }) {
        const Icon = variantIcons[variant];
        toastReference.current = sonnerToast.custom(
          (toastId) => (
            <motion.div
              variants={toastAnimation}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className={cn(
                'flex items-center justify-between w-full max-w-xs p-3 rounded-xl border shadow-md',
                variantStyles[variant]
              )}
            >
              <div className="flex items-start gap-2">
                <Icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', iconColor[variant])} />
                <div className="space-y-0.5">
                  {title && (
                    <h3
                      className={cn(
                        'text-xs font-medium leading-none',
                        titleColor[variant],
                        highlightTitle && titleColor['success'] // override for meeting case
                      )}
                    >
                      {title}
                    </h3>
                  )}
                  <p className="text-xs text-muted-foreground">{message}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {actions?.label && (
                  <Button
                    variant={actions.variant || 'outline'}
                    size="sm"
                    onClick={() => {
                      actions.onClick();
                      sonnerToast.dismiss(toastId);
                    }}
                    className={cn(
                      'cursor-pointer',
                      variant === 'success'
                        ? 'text-green-600 border-green-600 hover:bg-green-600/10 dark:hover:bg-green-400/20'
                        : variant === 'error'
                        ? 'text-destructive border-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20'
                        : variant === 'warning'
                        ? 'text-amber-600 border-amber-600 hover:bg-amber-600/10 dark:hover:bg-amber-400/20'
                        : 'text-foreground border-border hover:bg-muted/50'
                    )}
                  >
                    {actions.label}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    sonnerToast.dismiss(toastId);
                    onDismiss?.();
                  }}
                  className="h-6 w-6 p-0 hover:bg-muted/50"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </motion.div>
          ),
          {
            duration,
            position,
          }
        );
      },
    }));

    return (
      <SonnerToaster
        position={defaultPosition}
        expand={false}
        richColors={false}
        closeButton={false}
        toastOptions={{
          unstyled: true,
          classNames: {
            toast: 'bg-transparent border-0 shadow-none p-0',
          },
        }}
      />
    );
  }
);

Toaster.displayName = 'Toaster';

export { Toaster };
export type { ToasterProps };

// Utility function for easy toast usage
export const showToast = {
  success: (message: string, title?: string, actions?: ActionButton) => {
    sonnerToast.custom(
      (toastId) => {
        const Icon = CheckCircle;
        return (
          <motion.div
            variants={toastAnimation}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={cn(
              'flex items-center justify-between w-full max-w-xs p-3 rounded-xl border shadow-md',
              'bg-card border-green-600/50'
            )}
          >
            <div className="flex items-start gap-2">
              <Icon className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-600 dark:text-green-400" />
              <div className="space-y-0.5">
                {title && (
                  <h3 className="text-xs font-medium leading-none text-green-600 dark:text-green-400">
                    {title}
                  </h3>
                )}
                <p className="text-xs text-muted-foreground">{message}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {actions?.label && (
                <Button
                  variant={actions.variant || 'outline'}
                  size="sm"
                  onClick={() => {
                    actions.onClick();
                    sonnerToast.dismiss(toastId);
                  }}
                  className="cursor-pointer text-green-600 border-green-600 hover:bg-green-600/10 dark:hover:bg-green-400/20"
                >
                  {actions.label}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => sonnerToast.dismiss(toastId)}
                className="h-6 w-6 p-0 hover:bg-muted/50"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </motion.div>
        );
      },
      { 
        duration: 4000,
        position: 'bottom-right'
      }
    );
  },
  error: (message: string, title?: string, actions?: ActionButton) => {
    sonnerToast.custom(
      (toastId) => {
        const Icon = AlertCircle;
        return (
          <motion.div
            variants={toastAnimation}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={cn(
              'flex items-center justify-between w-full max-w-xs p-3 rounded-xl border shadow-md',
              'bg-card border-destructive/50'
            )}
          >
            <div className="flex items-start gap-2">
              <Icon className="h-4 w-4 mt-0.5 flex-shrink-0 text-destructive" />
              <div className="space-y-0.5">
                {title && (
                  <h3 className="text-xs font-medium leading-none text-destructive">
                    {title}
                  </h3>
                )}
                <p className="text-xs text-muted-foreground">{message}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {actions?.label && (
                <Button
                  variant={actions.variant || 'outline'}
                  size="sm"
                  onClick={() => {
                    actions.onClick();
                    sonnerToast.dismiss(toastId);
                  }}
                  className="cursor-pointer text-destructive border-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20"
                >
                  {actions.label}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => sonnerToast.dismiss(toastId)}
                className="h-6 w-6 p-0 hover:bg-muted/50"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </motion.div>
        );
      },
      { 
        duration: 5000,
        position: 'bottom-right'
      }
    );
  },
  warning: (message: string, title?: string, actions?: ActionButton) => {
    sonnerToast.custom(
      (toastId) => {
        const Icon = AlertTriangle;
        return (
          <motion.div
            variants={toastAnimation}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={cn(
              'flex items-center justify-between w-full max-w-xs p-3 rounded-xl border shadow-md',
              'bg-card border-amber-600/50'
            )}
          >
            <div className="flex items-start gap-2">
              <Icon className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="space-y-0.5">
                {title && (
                  <h3 className="text-xs font-medium leading-none text-amber-600 dark:text-amber-400">
                    {title}
                  </h3>
                )}
                <p className="text-xs text-muted-foreground">{message}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {actions?.label && (
                <Button
                  variant={actions.variant || 'outline'}
                  size="sm"
                  onClick={() => {
                    actions.onClick();
                    sonnerToast.dismiss(toastId);
                  }}
                  className="cursor-pointer text-amber-600 border-amber-600 hover:bg-amber-600/10 dark:hover:bg-amber-400/20"
                >
                  {actions.label}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => sonnerToast.dismiss(toastId)}
                className="h-6 w-6 p-0 hover:bg-muted/50"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </motion.div>
        );
      },
      { 
        duration: 4000,
        position: 'bottom-right'
      }
    );
  },
};