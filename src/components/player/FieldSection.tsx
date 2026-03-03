import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { PlayerState, Phase, Card as CardType } from '../../types';
import { Card } from '../Card';
import { Zone } from '../Zone';
import { PlayEffect } from '../PlayEffect';

interface FieldSectionProps {
  player: PlayerState;
  isOpponent: boolean;
  phase: Phase;
  setViewingCard: (card: CardType) => void;
  isMarketOpen?: boolean;
}

export const FieldSection: React.FC<FieldSectionProps> = ({ player, isOpponent, phase, setViewingCard }) => {
  // フィールドのカードを行ごとに分割（6枚区切り）
  const fieldRows: CardType[][] = [];
  for (let i = 0; i < player.field.length; i += 6) {
    fieldRows.push(player.field.slice(i, i + 6));
  }
  if (fieldRows.length === 0) fieldRows.push([]);

  return (
    <View className="flex-1 flex-col p-1 gap-1 h-full relative">
      <View className={`flex-1 flex-col relative ${isOpponent ? '' : ''}`}>
        <Zone
          title={isOpponent ? "相手の場" : "自分の場"}
          className="flex-1 bg-black/20 border-red-500/20 overflow-hidden relative"
          contentClassName="w-full h-full relative"
        >
          {/* Life & ATK overlay */}
          <View className="absolute top-1 right-1 z-20">
            <View className="bg-black/60 border border-red-500/20 rounded p-1.5 gap-1">
              <View className="flex-row items-center justify-end gap-2">
                <Text className="text-[10px] text-red-500 font-bold">LIFE</Text>
                <Text className="text-lg font-bold text-red-100">{player.life}</Text>
              </View>
              <View className="w-full h-px bg-white/10" />
              <View className="flex-row items-center justify-end gap-2">
                <Text className="text-[10px] text-yellow-500 font-bold">ATK</Text>
                <Text className="text-lg font-bold text-yellow-100">{player.attackTotal}</Text>
              </View>
            </View>
          </View>

          {/* Field cards */}
          <View className="items-center w-full h-full pt-6">
            {fieldRows.map((rowCards, rowIndex) => (
              <View
                key={rowIndex}
                className="flex-row justify-center"
                style={{ zIndex: rowIndex, marginBottom: rowIndex < fieldRows.length - 1 ? -70 : 0 }}
              >
                {rowCards.map((c, colIndex) => (
                  <Pressable
                    key={c.id}
                    onPress={() => setViewingCard(c)}
                    style={{ zIndex: colIndex, marginLeft: colIndex > 0 ? -24 : 0 }}
                  >
                    <Card card={c} size="md" />
                    {phase === Phase.Main && (
                      <View className="absolute inset-0 items-center justify-center">
                        <PlayEffect type={c.type} />
                      </View>
                    )}
                  </Pressable>
                ))}
              </View>
            ))}
          </View>
        </Zone>
      </View>
    </View>
  );
};
