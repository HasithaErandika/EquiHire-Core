import * as React from "react"
import { cn } from "@/lib/utils"
import { AlertTriangle } from "lucide-react"

interface AlertDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
}

interface AlertDialogContentProps {
    children: React.ReactNode;
    className?: string;
}

interface AlertDialogHeaderProps {
    children: React.ReactNode;
    className?: string;
}

interface AlertDialogFooterProps {
    children: React.ReactNode;
    className?: string;
}

interface AlertDialogTitleProps {
    children: React.ReactNode;
    className?: string;
}

interface AlertDialogDescriptionProps {
    children: React.ReactNode;
    className?: string;
}

const AlertDialog = ({ open, onOpenChange, children }: AlertDialogProps) => {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={() => onOpenChange(false)}
            />
            {/* Content wrapper */}
            <div className="relative z-50 animate-in fade-in zoom-in-95 duration-200">
                {children}
            </div>
        </div>
    );
};

const AlertDialogContent = ({ children, className }: AlertDialogContentProps) => (
    <div className={cn(
        "bg-background rounded-xl shadow-xl border w-full max-w-md mx-4 overflow-hidden",
        className
    )}>
        {children}
    </div>
);

const AlertDialogHeader = ({ children, className }: AlertDialogHeaderProps) => (
    <div className={cn("px-6 pt-6 pb-2", className)}>
        {children}
    </div>
);

const AlertDialogFooter = ({ children, className }: AlertDialogFooterProps) => (
    <div className={cn("px-6 pb-6 pt-4 flex justify-end gap-3", className)}>
        {children}
    </div>
);

const AlertDialogTitle = ({ children, className }: AlertDialogTitleProps) => (
    <h3 className={cn("text-lg font-semibold text-gray-900", className)}>
        {children}
    </h3>
);

const AlertDialogDescription = ({ children, className }: AlertDialogDescriptionProps) => (
    <p className={cn("text-sm text-gray-500 mt-2 leading-relaxed", className)}>
        {children}
    </p>
);

interface AlertDialogActionProps {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: "default" | "destructive";
    disabled?: boolean;
    className?: string;
}

const AlertDialogAction = ({ children, onClick, variant = "default", disabled, className }: AlertDialogActionProps) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={cn(
            "inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
                variant === "destructive"
                    ? "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm"
                    : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
            className
        )}
    >
        {children}
    </button>
);

const AlertDialogCancel = ({ children, onClick, className }: { children: React.ReactNode; onClick?: () => void; className?: string }) => (
    <button
        onClick={onClick}
        className={cn(
            "inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300",
            className
        )}
    >
        {children}
    </button>
);

// Pre-built confirmation dialogs
interface ConfirmDeleteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    title?: string;
    description?: string;
    isLoading?: boolean;
}

const ConfirmDeleteDialog = ({ open, onOpenChange, onConfirm, title = "Delete Entry", description, isLoading }: ConfirmDeleteDialogProps) => (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-destructive" />
                    </div>
                    <div>
                        <AlertDialogTitle>{title}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {description || "Are you sure you want to delete this entry?"}
                            <span className="block mt-2 text-destructive font-medium text-xs">This action cannot be undone.</span>
                        </AlertDialogDescription>
                    </div>
                </div>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => onOpenChange(false)}>Cancel</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={onConfirm} disabled={isLoading}>
                    {isLoading ? "Deleting..." : "Delete"}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
);

interface ConfirmUpdateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    title?: string;
    description?: string;
    isLoading?: boolean;
}

const ConfirmUpdateDialog = ({ open, onOpenChange, onConfirm, title = "Update Entry", description, isLoading }: ConfirmUpdateDialogProps) => (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <AlertDialogTitle>{title}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {description || "Are you sure you want to update this entry?"}
                        </AlertDialogDescription>
                    </div>
                </div>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => onOpenChange(false)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onConfirm} disabled={isLoading}>
                    {isLoading ? "Updating..." : "Confirm"}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
);

export {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogAction,
    AlertDialogCancel,
    ConfirmDeleteDialog,
    ConfirmUpdateDialog,
};
