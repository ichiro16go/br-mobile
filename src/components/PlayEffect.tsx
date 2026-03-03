import React from 'react';
import { View } from 'react-native';
import { CardType } from '../types';

interface PlayEffectProps {
  type: CardType;
}

export const PlayEffect: React.FC<PlayEffectProps> = ({ type }) => {
  // Slash Effect: A flash of white light
  if (type === CardType.Slash) {
    return (
      <View className="absolute inset-0 items-center justify-center overflow-hidden rounded z-10">
        <View className="w-full h-[2px] bg-white opacity-90 rotate-45" />
      </View>
    );
  }

  // Blood Effect: A red pulse
  if (type === CardType.Blood) {
    return (
      <View className="absolute inset-0 rounded overflow-hidden z-10">
        <View className="absolute inset-0 bg-red-600/30" />
      </View>
    );
  }

  // Default Effect: Subtle highlight
  return (
    <View className="absolute inset-0 rounded bg-white/10 z-10" />
  );
};
