import React from 'react';
import { TouchableOpacity, Text, TouchableOpacityProps } from 'react-native';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ButtonProps extends TouchableOpacityProps {
  children: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  textClassName?: string;
}

export const Button = React.forwardRef<React.ElementRef<typeof TouchableOpacity>, ButtonProps>(
  ({ className, textClassName, variant = 'default', size = 'default', children, ...props }, ref) => {
    
    const variants = {
      default: 'bg-slate-900',
      destructive: 'bg-red-500',
      outline: 'border border-slate-200 bg-white',
      secondary: 'bg-slate-100',
      ghost: 'bg-transparent',
      link: 'bg-transparent',
    };

    const textVariants = {
      default: 'text-white',
      destructive: 'text-white',
      outline: 'text-slate-900',
      secondary: 'text-slate-900',
      ghost: 'text-slate-900',
      link: 'text-slate-900 underline',
    };

    const sizes = {
      default: 'h-10 px-4 py-2',
      sm: 'h-9 px-3',
      lg: 'h-11 px-8',
      icon: 'h-10 w-10',
    };

    return (
      <TouchableOpacity
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md flex-row',
          variants[variant],
          sizes[size],
          props.disabled && 'opacity-50',
          className
        )}
        {...props}
      >
        <Text className={cn('font-medium text-sm', textVariants[variant], textClassName)}>
          {children}
        </Text>
      </TouchableOpacity>
    );
  }
);
Button.displayName = 'Button';
