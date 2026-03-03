import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Card as CardType } from '../types';
import { Card } from './Card';

interface MarketProps {
  recallPiles: CardType[][];
  onRecall: (pileIndex: number) => void;
  canRecall: boolean;
  playerPoolCount: number;
}

export const Market: React.FC<MarketProps> = ({ recallPiles, onRecall, canRecall, playerPoolCount }) => {
  return (
    <ScrollView className="flex-1 bg-black/50 p-2" contentContainerClassName="items-center gap-4 pb-4">
      <Text className="text-red-400 text-xs text-center border-b border-red-900/30 pb-2 w-full">
        Covenant Area
      </Text>
      {recallPiles.map((pile, index) => {
        if (pile.length === 0) {
          return (
            <View key={index} className="w-20 h-32 border border-dashed border-gray-700 rounded items-center justify-center">
              <Text className="text-gray-600 text-[10px]">Empty</Text>
            </View>
          );
        }

        const card = pile[pile.length - 1];
        const affordable = playerPoolCount >= card.cost;
        const remaining = pile.length;

        return (
          <View key={index} className="items-center">
            <View className="relative">
              {remaining > 1 && (
                <View className="absolute top-1 left-1 w-full h-full bg-gray-800 rounded border border-gray-700 z-0" />
              )}
              {remaining > 2 && (
                <View className="absolute top-2 left-2 w-full h-full bg-gray-800 rounded border border-gray-700 z-0" />
              )}
              <View className="relative z-10">
                <Card card={card} size="md" />
                {canRecall && (
                  <Pressable
                    onPress={() => affordable && onRecall(index)}
                    className="absolute inset-0 bg-black/80 items-center justify-center rounded"
                  >
                    <Text className="text-red-400 font-bold text-[10px] mb-1">Cost: {card.cost}</Text>
                    {affordable ? (
                      <View className="bg-red-600 px-3 py-1 rounded">
                        <Text className="text-white text-[10px] font-bold uppercase">Recall</Text>
                      </View>
                    ) : (
                      <Text className="text-gray-500 text-[10px]">Not enough blood</Text>
                    )}
                  </Pressable>
                )}
              </View>
            </View>
            <View className="mt-1 bg-black/40 px-2 rounded-full border border-gray-800">
              <Text className="text-[10px] text-gray-500">Remaining: {remaining}</Text>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
};
