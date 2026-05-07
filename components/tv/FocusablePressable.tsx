import React, { useState, useEffect } from 'react';
import { Pressable, PressableProps, View, Text } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Helper for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface FocusablePressableProps extends Omit<PressableProps, 'children'> {
  children: React.ReactNode | ((state: { isFocused: boolean; pressed: boolean; isPressed: boolean }) => React.ReactNode);
  className?: string;
  focusedClassName?: string;
  activeScale?: number;
  // TV Remote navigation helpers
  nextFocusUp?: number;
  nextFocusDown?: number;
  nextFocusLeft?: number;
  nextFocusRight?: number;
  hasTVPreferredFocus?: boolean;
  nativeID?: string;
}

export function FocusablePressable({
  children,
  className,
  focusedClassName,
  activeScale = 1.05,
  style,
  nextFocusUp,
  nextFocusDown,
  nextFocusLeft,
  nextFocusRight,
  hasTVPreferredFocus,
  nativeID,
  ...props
}: FocusablePressableProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const scale = useSharedValue(1);

  useEffect(() => {
    let targetScale = 1;
    if (isPressed) {
      targetScale = 0.95; // Slight shrink on press
    } else if (isFocused) {
      targetScale = activeScale;
    }

    scale.value = withSpring(targetScale, {
      damping: 15,
      stiffness: 100,
    });
  }, [isFocused, isPressed, activeScale]);

  // IMPORTANT: Keep animated style minimal — only transform.
  // Do NOT merge NativeWind className styles here (causes isAnimated infinite recursion).
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <Animated.View style={[animatedStyle, isFocused ? { zIndex: 10 } : { zIndex: 1 }]}>
      <Pressable
        nativeID={nativeID}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        onPressIn={(e) => {
          setIsPressed(true);
          props.onPressIn?.(e);
        }}
        onPressOut={(e) => {
          setIsPressed(false);
          props.onPressOut?.(e);
        }}
        className={cn(
          className,
          isFocused && focusedClassName
        )}
        style={style}
        // TV remote navigation props
        {...(nextFocusUp !== undefined && { nextFocusUp })}
        {...(nextFocusDown !== undefined && { nextFocusDown })}
        {...(nextFocusLeft !== undefined && { nextFocusLeft })}
        {...(nextFocusRight !== undefined && { nextFocusRight })}
        {...(hasTVPreferredFocus !== undefined && { hasTVPreferredFocus })}
        {...props}
      >
        {(state) => (
          typeof children === 'function' 
            ? children({ ...state, isFocused, isPressed }) 
            : children
        )}
      </Pressable>
    </Animated.View>
  );
}
