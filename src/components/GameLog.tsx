import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Phase } from '../types';

interface GameLogProps {
  logs: string[];
  turnPlayerId: string;
  phase: Phase;
}

export const GameLog: React.FC<GameLogProps> = ({ logs, turnPlayerId, phase }) => {
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [logs]);

  return (
    <View className="w-40 bg-black/60 border-r border-red-900/30 flex-col z-20 h-full">
      {/* ヘッダー */}
      <View className="p-2 bg-red-950/20 border-b border-red-900/30 flex-row justify-between items-center">
        <Text className="text-red-500 text-xs">Round Log</Text>
      </View>

      {/* ログ本文エリア */}
      <ScrollView
        ref={scrollRef}
        className="flex-1 p-2"
        contentContainerClassName="gap-2"
      >
        {logs.map((msg, i) => (
          <View key={i} className="border-b border-white/5 pb-1">
            <Text className={`text-[10px] ${i === logs.length - 1 ? 'text-white' : 'text-gray-400'}`}>
              {msg}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* ステータス表示エリア */}
      <View className="p-3 border-t border-red-900/30 bg-black/40">
        <Text className="text-[10px] text-gray-500 uppercase mb-0.5">Turn</Text>
        <Text className={`text-xs font-bold ${turnPlayerId === 'p1' ? 'text-red-400' : 'text-blue-400'}`}>
          {turnPlayerId === 'p1' ? 'YOUR TURN' : 'CPU TURN'}
        </Text>
        <Text className="mt-1 text-[10px] text-gray-500 uppercase mb-0.5">Phase</Text>
        <Text className="text-xs font-bold text-white">{phase}</Text>
      </View>
    </View>
  );
};
