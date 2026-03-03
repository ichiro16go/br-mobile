import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { PlayerState } from '../../types';
import { CRAFT_RECIPES } from '../../constants/index';

interface ResourceSectionProps {
  player: PlayerState;
  isCurrentUser: boolean;
  isOpponent: boolean;
  onCraftClick: () => void;
  onCircuitClick: () => void;
  onDeckClick: () => void;
  onDiscardClick: () => void;
}

export const ResourceSection: React.FC<ResourceSectionProps> = ({
  player,
  isCurrentUser,
  isOpponent,
  onCraftClick,
  onCircuitClick,
  onDeckClick,
  onDiscardClick
}) => {
  const canCraft = CRAFT_RECIPES.some(r => r.inputMatcher(player.hand) !== null) && player.remainingActions > 0;

  return (
    <View className="w-16 flex-col gap-1 py-1 items-center bg-black/40 border-r border-red-900/30 z-20">
      {isCurrentUser && (
        <Pressable
          onPress={onCraftClick}
          disabled={player.remainingActions <= 0}
          className={`
            items-center justify-center w-10 h-10 rounded-full border mb-1 mt-1 relative
            ${player.remainingActions > 0
              ? 'bg-purple-900 border-purple-500'
              : 'bg-gray-900 border-gray-700'}
          `}
        >
          <Text className={`text-base ${player.remainingActions > 0 ? 'text-white' : 'text-gray-600'}`}>✦</Text>
          <Text className={`text-[7px] font-bold ${player.remainingActions > 0 ? 'text-white' : 'text-gray-600'}`}>CRAFT</Text>
          {canCraft && (
            <View className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full" />
          )}
        </Pressable>
      )}

      <ScrollView className="flex-1 w-full px-0.5" contentContainerClassName="gap-1">
        <View className="items-center bg-purple-900/10 rounded pb-0.5">
          <Text className="text-[8px] text-purple-400 font-bold">ACT</Text>
          <Text className={`text-sm font-bold ${player.remainingActions > 0 ? 'text-white' : 'text-gray-600'}`}>
            {player.remainingActions}
          </Text>
        </View>

        <View className="items-center bg-red-900/10 rounded pb-0.5">
          <Text className="text-[8px] text-red-400 font-bold">BLOOD</Text>
          <Text className={`text-sm font-bold ${player.bloodPool.length > 0 ? 'text-red-200' : 'text-gray-600'}`}>
            {player.bloodPool.length}
          </Text>
        </View>

        <Pressable onPress={onCircuitClick} className="items-center rounded pb-0.5">
          <Text className="text-[8px] text-purple-400 font-bold underline">CIRC</Text>
          <Text className={`text-sm font-bold ${player.bloodCircuit.length > 0 ? 'text-purple-200' : 'text-gray-600'}`}>
            {player.bloodCircuit.length}
          </Text>
        </Pressable>

        <Pressable onPress={() => !isOpponent && onDeckClick()} className="items-center rounded pb-0.5">
          <Text className="text-[8px] text-blue-400 font-bold underline">DECK</Text>
          <Text className="text-sm font-bold text-gray-300">
            {player.deck.length}
          </Text>
        </Pressable>

        <Pressable onPress={onDiscardClick} className="items-center rounded pb-0.5">
          <Text className="text-[8px] text-gray-400 font-bold underline">TRASH</Text>
          <Text className="text-sm font-bold text-gray-400">
            {player.discard.length}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
};
