'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface GlassProps extends React.HTMLAttributes<HTMLDivElement> {
    blur?: 'sm' | 'md' | 'lg' | 'xl';
    dark?: boolean;
}

export const GlassPanel = React.forwardRef<HTMLDivElement, GlassProps>(
    ({ className, blur = 'xl', dark = true, ...props }, ref) => {
        const blurClass = {
            sm: 'backdrop-blur-sm',
            md: 'backdrop-blur-md',
            lg: 'backdrop-blur-lg',
            xl: 'backdrop-blur-[20px]',
        }[blur];

        return (
            <div
                ref={ref}
                className={cn(
                    'border border-white/10 shadow-glass transition-all duration-300',
                    blurClass,
                    dark ? 'bg-black/40' : 'bg-white/10',
                    className
                )}
                {...props}
            />
        );
    }
);
GlassPanel.displayName = 'GlassPanel';

export const GlassCard = React.forwardRef<HTMLDivElement, GlassProps>(
    ({ className, blur = 'lg', dark = true, ...props }, ref) => {
        return (
            <GlassPanel
                ref={ref}
                blur={blur}
                dark={dark}
                className={cn('rounded-2xl hover:translate-y-[-2px] hover:shadow-glass-glow', className)}
                {...props}
            />
        );
    }
);
GlassCard.displayName = 'GlassCard';

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'accent' | 'ghost';
}

export const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
    ({ className, variant = 'primary', ...props }, ref) => {
        const variantClasses = {
            primary: 'bg-primary-gradient text-white shadow-lg shadow-purple-500/20',
            secondary: 'bg-secondary-gradient text-white shadow-lg shadow-pink-500/20',
            accent: 'bg-accent-gradient text-white shadow-lg shadow-blue-500/20',
            ghost: 'bg-white/5 hover:bg-white/10 text-white border border-white/10',
        }[variant];

        return (
            <button
                ref={ref}
                className={cn(
                    'px-6 py-2.5 rounded-xl font-semibold backdrop-blur-md transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
                    variantClasses,
                    className
                )}
                {...props}
            />
        );
    }
);
GlassButton.displayName = 'GlassButton';

export const GlassInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
    ({ className, ...props }, ref) => {
        return (
            <input
                ref={ref}
                className={cn(
                    'bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500/30 backdrop-blur-md transition-all',
                    className
                )}
                {...props}
            />
        );
    }
);
GlassInput.displayName = 'GlassInput';
