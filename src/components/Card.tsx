import React from 'react';
import { View, Text, Pressable, ViewStyle } from 'react-native';
import { Card as CardType, RegaliaCard, CardType as CType } from '../types';
import { getCardStyles } from '../utils/cardStyles';

interface CardProps {
  card: CardType;
  onPress?: () => void;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isFaceDown?: boolean;
  isAwakened?: boolean;
  className?: string;
  style?: ViewStyle;
}

const sizeClasses: Record<string, string> = {
  xs: 'w-10 h-14',
  sm: 'w-16 h-24',
  md: 'w-20 h-32',
  lg: 'w-24 h-36',
};

const textSizeClasses: Record<string, string> = {
  xs: 'text-[6px]',
  sm: 'text-[8px]',
  md: 'text-[10px]',
  lg: 'text-xs',
};

export const Card: React.FC<CardProps> = ({ card, onPress, size = 'md', isFaceDown = false, isAwakened = false, className = '', style }) => {
  // 裏向き表示
  if (isFaceDown) {
    return (
      <View
        className={`${sizeClasses[size]} bg-red-900 border border-red-950 rounded items-center justify-center ${className}`}
        style={style}
      >
        <View className="w-4 h-4 rounded-full border border-red-800 bg-red-950" />
      </View>
    );
  }

  // 神器(Regalia)の表示
  if (card.type === CType.Regalia) {
    const regalia = card as RegaliaCard;
    const stats = isAwakened ? regalia.awakened : regalia.base;

    return (
      <Pressable
        onPress={onPress}
        className={`
          ${sizeClasses[size]}
          relative bg-gray-900 border-2 ${isAwakened ? 'border-red-500' : 'border-red-800'}
          rounded flex-col overflow-hidden
          ${card.isTapped ? 'opacity-50' : ''}
          ${className}
        `}
        style={style}
      >
        {/* カード名 */}
        <View className={`bg-red-950 p-0.5 border-b border-red-900`}>
          <Text className={`${isAwakened ? 'text-red-300' : 'text-red-100'} font-bold text-center ${textSizeClasses[size]}`} numberOfLines={1}>
            {card.name}
          </Text>
        </View>

        {/* メインエリア */}
        <View className="flex-1 relative items-center justify-center bg-gray-800">
          <Text className={`text-red-900/20 text-2xl absolute ${isAwakened ? 'text-red-600/20' : ''}`}>
            JINKI
          </Text>

          {/* Year */}
          <View className="absolute top-0.5 left-0.5 items-center">
            <Text className="text-[5px] text-gray-500">Year</Text>
            <Text className="text-[8px] text-gray-300 font-bold">{regalia.year}</Text>
          </View>

          {/* Dmg */}
          <View className="absolute top-0.5 right-0.5 items-center">
            <Text className="text-[5px] text-red-500">Dmg</Text>
            <View className="w-4 h-4 rounded-full border border-red-900/50 bg-black/40 items-center justify-center">
              <Text className="text-[7px] font-bold text-red-400">{stats.selfHarmCost}</Text>
            </View>
          </View>

          {/* Hand */}
          <View className="absolute bottom-0.5 left-0.5 items-center">
            <View className="w-4 h-4 rounded-full border border-blue-900/50 bg-black/40 items-center justify-center">
              <Text className="text-[7px] font-bold text-blue-300">{stats.handSize}</Text>
            </View>
            <Text className="text-[5px] text-blue-500">Hand</Text>
          </View>

          {/* Act */}
          <View className="absolute bottom-0.5 right-0.5 items-center">
            <View className="w-4 h-4 rounded-full border border-purple-900/50 bg-black/40 items-center justify-center">
              <Text className="text-[7px] font-bold text-purple-300">{stats.bloodPact}</Text>
            </View>
            <Text className="text-[5px] text-purple-500">Act</Text>
          </View>
        </View>

        {/* タイプ表示 */}
        <View className={`bg-gray-900 p-0.5 border-t border-red-900/30`}>
          <Text className={`${isAwakened ? 'text-red-500 font-bold' : 'text-red-700'} text-[6px] text-center uppercase tracking-wider`}>
            {isAwakened ? 'AWAKENED' : card.type}
          </Text>
        </View>
      </Pressable>
    );
  }

  // 通常カードの表示
  const styles = getCardStyles(card);

  return (
    <Pressable
      onPress={onPress}
      className={`
        ${sizeClasses[size]}
        relative ${styles.outer} border-2 rounded
        flex-col overflow-hidden
        ${card.isTapped ? 'opacity-50' : ''}
        ${className}
      `}
      style={style}
    >
      <View className={`${styles.header} p-0.5`}>
        <Text className={`font-bold text-center ${textSizeClasses[size]}`} numberOfLines={1}>
          {card.name}
        </Text>
      </View>
      <View className={`flex-1 p-0.5 items-center justify-center ${styles.inner} relative`}>
        <View className={`absolute top-0.5 right-0.5 rounded-full w-4 h-4 items-center justify-center border ${styles.badgeAtk}`}>
          <Text className={`font-bold text-[7px] ${styles.badgeAtk}`}>{card.attack}</Text>
        </View>
        {card.cost > 0 && (
          <View className={`absolute top-0.5 left-0.5 rounded-full w-4 h-4 items-center justify-center border ${styles.badgeCost}`}>
            <Text className={`font-bold text-[7px] ${styles.badgeCost}`}>{card.cost}</Text>
          </View>
        )}
        {size !== 'xs' && (
          <View className="items-center justify-center px-0.5 flex-1">
            <Text className={`text-center ${textSizeClasses[size]} leading-tight ${styles.text}`}>
              {card.description}
            </Text>
          </View>
        )}
      </View>
      <View className={`${styles.typeTag} p-0.5`}>
        <Text className={`${styles.typeTag} text-[6px] text-center uppercase tracking-wider`}>
          {card.type}
        </Text>
      </View>
    </Pressable>
  );
};
