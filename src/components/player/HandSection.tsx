import React from 'react';
import { View } from 'react-native';
import { PlayerState } from '../../types';
import { Card } from '../Card';

interface HandSectionProps {
  player: PlayerState;
  isOpponent: boolean;
  onPlayCard: (cardId: string) => void;
}

export const HandSection: React.FC<HandSectionProps> = ({ player, isOpponent, onPlayCard }) => {
  if (isOpponent) {
    return (
      <View className="h-8 flex-row justify-center items-center gap-0.5 px-1">
        {player.hand.map((_, i) => (
          <View key={i} className="w-5 h-7 bg-red-900 border border-red-800 rounded" />
        ))}
      </View>
    );
  }

  return (
    <View className="h-24 bg-black/60 border-t border-red-500/30 flex-row items-center justify-center gap-2 px-2">
      {player.hand.map((c) => (
        <Card
          key={c.id}
          card={c}
          size="md"
          onPress={() => onPlayCard(c.id)}
        />
      ))}
    </View>
  );
};
