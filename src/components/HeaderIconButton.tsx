import type { ReactNode } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';


type Props = {
  onPress: () => void;
  children: ReactNode;
  accessibilityLabel?: string;
  disabled?: boolean;
};

export function HeaderIconButton({ onPress, children, accessibilityLabel, disabled }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      activeOpacity={0.55}
      style={styles.hit}
      hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
    >
      {children}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  hit: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 4,
    backgroundColor: 'transparent',
  },
});
