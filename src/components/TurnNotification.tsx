import React from 'react';
import { View, Text } from 'react-native';

interface TurnNotificationProps {
  playerId: string;
  isVisible: boolean;
}

export const TurnNotification: React.FC<TurnNotificationProps> = ({ playerId, isVisible }) => {
  if (!isVisible) return null;

  const isPlayer = playerId === 'p1';
  const text = isPlayer ? "YOUR TURN" : "OPPONENT TURN";
  const subText = isPlayer ? "ACTION PHASE" : "PLEASE WAIT";

  const mainColor = isPlayer ? "text-red-500" : "text-blue-500";
  const barColor = isPlayer
    ? "bg-red-900/80"
    : "bg-blue-900/80";

  return (
    <View className="absolute inset-0 items-center justify-center z-[70]" pointerEvents="none">
      <View className={`w-full ${barColor} py-8 items-center justify-center`}>
        <Text className={`text-5xl font-bold tracking-widest ${mainColor}`}>
          {text}
        </Text>
        <Text className="text-white/80 text-sm tracking-[4px] mt-2 uppercase">
          {subText}
        </Text>
      </View>
    </View>
  );
};
