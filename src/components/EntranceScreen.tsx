import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';

interface EntranceScreenProps {
  onStartSolo: () => void;
  onStartVersus: () => void;
  onStartTutorial: () => void;
}

export const EntranceScreen: React.FC<EntranceScreenProps> = ({ onStartSolo, onStartVersus, onStartTutorial }) => {
  const [showRules, setShowRules] = useState(false);

  return (
    <View className="flex-1 bg-[#0a0505] items-center justify-center p-4">

      <View className="z-10 items-center w-full max-w-lg">
        {/* タイトルロゴ */}
        <View className="mb-12 items-center">
          <Text className="text-5xl font-bold text-red-600 tracking-wider mb-2">
            BLOOD RECALL
          </Text>
          <Text className="text-gray-400 tracking-[4px] text-xs uppercase">
            The Deck-Building Game
          </Text>
        </View>

        {/* メニューボタン */}
        <View className="gap-4 w-full max-w-md">
          <Pressable
            onPress={onStartTutorial}
            className="bg-green-950 border-2 border-green-800 p-5 rounded-lg"
          >
            <Text className="text-xl font-bold text-green-100 text-center">
              TUTORIAL
            </Text>
            <Text className="text-xs text-green-400 text-center mt-1">Learn Rules</Text>
          </Pressable>

          <Pressable
            onPress={onStartSolo}
            className="bg-red-950 border-2 border-red-800 p-5 rounded-lg"
          >
            <Text className="text-xl font-bold text-red-100 text-center">
              SOLO MODE
            </Text>
            <Text className="text-xs text-red-400 text-center mt-1">vs CPU</Text>
          </Pressable>

          <View className="h-px w-full bg-red-900/50 my-2" />

          <Pressable onPress={() => setShowRules(true)}>
            <Text className="text-gray-400 text-center underline">
              RULE BOOK / 遊び方
            </Text>
          </Pressable>
        </View>
      </View>

      {/* ルールブックモーダル */}
      {showRules && (
        <View className="absolute inset-0 bg-black/90 z-50 items-center justify-center p-4">
          <View className="bg-[#151010] border-2 border-red-900/50 rounded-lg w-full h-full max-w-4xl flex-col">
            {/* ヘッダー */}
            <View className="p-4 border-b border-red-900/30 flex-row justify-between items-center bg-black/20">
              <Text className="text-2xl text-red-500">How to Play</Text>
              <Pressable onPress={() => setShowRules(false)}>
                <Text className="text-gray-500 text-2xl">✕</Text>
              </Pressable>
            </View>

            {/* コンテンツ */}
            <ScrollView className="flex-1 p-4" contentContainerClassName="gap-6">
              <View>
                <Text className="text-lg font-bold text-red-400 mb-2">1. ゲームの目的</Text>
                <Text className="text-gray-300 text-sm leading-relaxed">
                  『Blood Recall』はデッキ構築を行い、血戦での勝利を目指すカードゲームです。{'\n'}
                  お互いのプレイヤーは20のライフを持ってゲームを開始します。
                </Text>
                <View className="bg-red-900/10 border border-red-900/30 p-3 rounded mt-2">
                  <Text className="text-red-300 font-bold text-center">勝利条件：相手のライフを0にする</Text>
                  <Text className="text-gray-500 text-xs text-center mt-1">敗北条件：自分のライフが0になる</Text>
                </View>
              </View>

              <View>
                <Text className="text-lg font-bold text-red-400 mb-2">2. ターンの流れ</Text>
                <Text className="text-gray-300 text-sm mb-3">ゲームは以下の3つのフェイズを繰り返して進行します。</Text>

                <View className="bg-black/30 p-3 rounded border border-gray-800 mb-2">
                  <Text className="font-bold text-white mb-1">① メインフェイズ (Action)</Text>
                  <Text className="text-xs text-gray-400">カードのプレイ、購入、強化を行うフェイズです。</Text>
                </View>

                <View className="bg-black/30 p-3 rounded border border-gray-800 mb-2">
                  <Text className="font-bold text-red-300 mb-1">② 血戦フェイズ (Blood Battle)</Text>
                  <Text className="text-xs text-gray-400">お互いの総攻撃力(ATK)を比較し、差分のダメージを敗者に与えます。</Text>
                </View>

                <View className="bg-black/30 p-3 rounded border border-gray-800">
                  <Text className="font-bold text-blue-300 mb-1">③ クリンナップフェイズ (Cleanup)</Text>
                  <Text className="text-xs text-gray-400">場のカードと手札を捨て札にし、デッキからカードを引きます。</Text>
                </View>
              </View>

              <View>
                <Text className="text-lg font-bold text-red-400 mb-2">3. 重要なシステム</Text>
                <View className="bg-purple-900/10 p-3 rounded border border-purple-900/30 mb-2">
                  <Text className="font-bold text-purple-300 mb-1">人器覚醒 (Awakening)</Text>
                  <Text className="text-xs text-gray-400">ライフが10以下で神器が覚醒し、能力強化・必殺技が使用可能に。</Text>
                </View>
                <View className="bg-red-900/10 p-3 rounded border border-red-900/30">
                  <Text className="font-bold text-red-300 mb-1">ブラッドリコール (Ultimate)</Text>
                  <Text className="text-xs text-gray-400">各キャラクター固有の必殺技。覚醒+血廻コストで発動可能。</Text>
                </View>
              </View>
            </ScrollView>

            {/* フッター */}
            <View className="p-4 border-t border-red-900/30 bg-black/40 items-center">
              <Pressable onPress={() => setShowRules(false)} className="bg-red-800 px-8 py-2 rounded">
                <Text className="text-white font-bold">CLOSE</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};
