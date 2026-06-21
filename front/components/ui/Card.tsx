import React from 'react';
import { View, Text, ViewProps } from 'react-native';
import { cn } from './Button';

export const Card = React.forwardRef<View, ViewProps>(({ className, ...props }, ref) => (
  <View
    ref={ref}
    className={cn("rounded-xl border border-slate-200 bg-white shadow-sm", className)}
    {...props}
  />
));
Card.displayName = "Card";

export const CardHeader = React.forwardRef<View, ViewProps>(({ className, ...props }, ref) => (
  <View ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
));
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<React.ElementRef<typeof Text>, React.ComponentProps<typeof Text>>(
  ({ className, ...props }, ref) => (
    <Text
      ref={ref}
      className={cn("font-semibold leading-none tracking-tight text-lg text-slate-900", className)}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle";

export const CardDescription = React.forwardRef<React.ElementRef<typeof Text>, React.ComponentProps<typeof Text>>(
  ({ className, ...props }, ref) => (
    <Text
      ref={ref}
      className={cn("text-sm text-slate-500", className)}
      {...props}
    />
  )
);
CardDescription.displayName = "CardDescription";

export const CardContent = React.forwardRef<View, ViewProps>(({ className, ...props }, ref) => (
  <View ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

export const CardFooter = React.forwardRef<View, ViewProps>(({ className, ...props }, ref) => (
  <View ref={ref} className={cn("flex flex-row items-center p-6 pt-0", className)} {...props} />
));
CardFooter.displayName = "CardFooter";
