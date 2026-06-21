import React from 'react';
import { TextInput, TextInputProps, View, Text } from 'react-native';
import { cn } from './Button';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export const Input = React.forwardRef<React.ElementRef<typeof TextInput>, InputProps>(
  ({ className, label, error, containerClassName, ...props }, ref) => {
    return (
      <View className={cn("w-full mb-4", containerClassName)}>
        {label && (
          <Text className="text-sm font-medium leading-none text-slate-700 mb-2">
            {label}
          </Text>
        )}
        <TextInput
          ref={ref}
          className={cn(
            "flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900",
            props.editable === false && "opacity-50 bg-slate-50",
            error && "border-red-500",
            className
          )}
          placeholderTextColor="#94a3b8"
          {...props}
        />
        {error && (
          <Text className="text-sm font-medium text-red-500 mt-1">
            {error}
          </Text>
        )}
      </View>
    );
  }
);
Input.displayName = 'Input';
