import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { PlayerState, Phase } from '../../types';
import { Card } from '../Card';
import { Zone } from '../Zone';

interface IdentitySectionProps {
  player: PlayerState;
  isCurrentUser: boolean;
  isOpponent: boolean;
  phase: Phase;
  onRegaliaClick: () => void;
  onActivateBloodRecall: () => void;
}

export const IdentitySection: React.FC<IdentitySectionProps> = ({
  player,
  isCurrentUser,
  isOpponent,
  phase,
  onRegaliaClick,
  onActivateBloodRecall
}) => {
  const canActivateRecall = isCurrentUser &&
    player.bloodRecall &&
    player.bloodCircuit.length >= player.bloodRecall.cost &&
    phase === Phase.Main;

  return (
    <View className="w-24 flex-col gap-1 p-1 z-10 justify-center bg-black/20 border-r border-red-900/30">
      <Zone
        title="神器"
        className="bg-transparent border-0 h-full"
        contentClassName="items-center justify-center h-full"
      >
        {player.regalia && (
          <View className={`relative ${player.regalia.isTapped ? 'opacity-75' : ''}`}>
            <Card
              card={player.regalia}
              size="md"
              onPress={onRegaliaClick}
              isAwakened={player.isRegaliaAwakened}
            />

            {isCurrentUser && !player.regalia.isTapped && (
              <Pressable onPress={onRegaliaClick}>
                <Text className="text-[10px] text-red-400 text-center mt-1">
                  詳細 / Action
                </Text>
              </Pressable>
            )}

            {/* ブラッドリコール発動可能通知 */}
            {canActivateRecall && !player.regalia.isTapped && (
              <View className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border border-white z-20 items-center justify-center">
                <Text className="text-[8px] font-bold text-black">!</Text>
              </View>
            )}
          </View>
        )}
      </Zone>
    </View>
  );
};
