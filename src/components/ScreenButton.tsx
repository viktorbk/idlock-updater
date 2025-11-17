import React from 'react';
import { TouchableHighlight, Text, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { Fonts } from '../utils/fonts';
import { lockStyles } from '../css/LockStyles';

type ScreenButtonProps = {
  onPress: () => void;
  label: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  underlayColor?: string;
  className?: string;
};

export default function ScreenButton({
  onPress,
  label,
  style = lockStyles.modelButtonWithMargin,
  textStyle,
  underlayColor = '#e0e0e0',
  className = 'px-6 py-3 items-center justify-center',
}: ScreenButtonProps) {
  return (
    <TouchableHighlight 
      onPress={onPress}
      underlayColor={underlayColor}
      style={style}
      className={className}
    >
      <Text 
        className="text-black text-xl font-bold" 
        style={[{ fontFamily: Fonts.ColabMed }, textStyle]}
      >
        {label}
      </Text>
    </TouchableHighlight>
  );
}

