import React from 'react';
import { View, Text } from 'react-native';

interface ZoneProps {
  title: string;
  count?: number;
  className?: string;
  contentClassName?: string;
  children?: React.ReactNode;
}

export const Zone: React.FC<ZoneProps> = ({
  title,
  count,
  className = '',
  contentClassName = 'flex-row flex-wrap gap-1 items-center justify-center',
  children
}) => {
  return (
    <View className={`border border-red-900/30 rounded p-2 bg-black/20 flex-col ${className}`}>
      <View className="flex-row justify-between mb-1">
        <Text className="text-red-500/50 text-[10px] uppercase">{title}</Text>
        {count !== undefined && <Text className="text-red-500/50 text-[10px]">{count}</Text>}
      </View>
      <View className={`flex-1 ${contentClassName}`}>
        {children}
      </View>
    </View>
  );
};
