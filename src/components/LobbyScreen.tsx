import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { createRoom, joinRoom, listenForGuest } from '../services/multiplayer';
import { RECALL_SETS } from '../constants/index';

interface LobbyScreenProps {
  onBack: () => void;
  onMatchMade: (roomId: string, isHost: boolean, marketSetIndices: number[]) => void;
}

type LobbyMode = 'menu' | 'create' | 'join' | 'waiting';

export const LobbyScreen: React.FC<LobbyScreenProps> = ({ onBack, onMatchMade }) => {
  const [mode, setMode] = useState<LobbyMode>('menu');
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const unsubRef = useRef<(() => void) | null>(null);

  // クリーンアップ: 購読解除
  useEffect(() => {
    return () => {
      if (unsubRef.current) unsubRef.current();
    };
  }, []);

  const validatePasscode = (code: string) => code.length >= 2 && code.length <= 10;

  const handleCreateRoom = async () => {
    if (!validatePasscode(passcode)) {
      setError('パスコードは2〜10文字で入力してください');
      return;
    }
    setError('');
    setIsConnecting(true);

    // マーケットセットをランダム選択
    const shuffled = [...Array(RECALL_SETS.length).keys()].sort(() => Math.random() - 0.5);
    const indices = shuffled.slice(0, 5);
    try {
      await createRoom(passcode, indices);
      setIsConnecting(false);
      setMode('waiting');

      // ゲストが参加するのを待つ
      const unsub = listenForGuest(passcode, () => {
        if (unsubRef.current) unsubRef.current();
        unsubRef.current = null;
        onMatchMade(passcode, true, indices);
      });
      unsubRef.current = unsub;
    } catch (e: any) {
      setIsConnecting(false);
      setError(e.message || 'ルームの作成に失敗しました');
    }
  };

  const handleJoinRoom = async () => {
    if (!validatePasscode(passcode)) {
      setError('パスコードは2〜10文字で入力してください');
      return;
    }
    setError('');
    setIsConnecting(true);

    try {
      const indices = await joinRoom(passcode);
      setIsConnecting(false);
      onMatchMade(passcode, false, indices);
    } catch (e: any) {
      setIsConnecting(false);
      setError(e.message || 'ルームへの参加に失敗しました');
    }
  };

  const handleCancelWait = () => {
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }
    setMode('menu');
    setPasscode('');
    setError('');
  };

  return (
    <View className="flex-1 bg-[#0f0808] items-center justify-center p-4">
      <View className="max-w-md w-full z-10">
        {/* Header */}
        <View className="items-center mb-10">
          <Text className="text-3xl font-bold text-gray-200 tracking-widest mb-2">LOBBY</Text>
          <View className="h-px w-24 bg-red-800" />
        </View>

        {/* Menu Mode */}
        {mode === 'menu' && (
          <View className="gap-4">
            <Pressable
              onPress={() => { setMode('create'); setPasscode(''); setError(''); }}
              className="p-6 border border-gray-700 bg-gray-900/80 rounded-lg"
            >
              <Text className="text-xl font-bold text-red-100 mb-1">CREATE ROOM</Text>
              <Text className="text-xs text-gray-400">合言葉を決めて、対戦相手を待ちます。</Text>
            </Pressable>

            <Pressable
              onPress={() => { setMode('join'); setPasscode(''); setError(''); }}
              className="p-6 border border-gray-700 bg-gray-900/80 rounded-lg"
            >
              <Text className="text-xl font-bold text-blue-100 mb-1">JOIN ROOM</Text>
              <Text className="text-xs text-gray-400">合言葉を入力して、ルームに参加します。</Text>
            </Pressable>

            <Pressable onPress={onBack} className="mt-8">
              <Text className="text-gray-500 text-sm text-center">← Back to Title</Text>
            </Pressable>
          </View>
        )}

        {/* Create / Join Input Mode */}
        {(mode === 'create' || mode === 'join') && (
          <View className="bg-gray-900/90 border border-gray-700 p-6 rounded-lg">
            <Text className="text-xl font-bold text-center mb-6 text-white">
              {mode === 'create' ? 'ROOM SETTINGS' : 'ENTER PASSCODE'}
            </Text>

            <View className="mb-4">
              <Text className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Passcode (Room ID)</Text>
              <TextInput
                value={passcode}
                onChangeText={(t) => { setPasscode(t.toUpperCase()); setError(''); }}
                placeholder="SECRET123"
                placeholderTextColor="#6b7280"
                className="w-full bg-black/50 border border-gray-600 rounded p-3 text-center text-xl text-white tracking-widest"
                maxLength={10}
                autoCapitalize="characters"
              />
              <Text className="text-[10px] text-gray-500 mt-2 text-center">2〜10文字の英数字を入力してください</Text>
            </View>

            {error !== '' && (
              <View className="bg-red-950/30 p-2 rounded border border-red-900/50 mb-4">
                <Text className="text-red-500 text-xs text-center">{error}</Text>
              </View>
            )}

            <View className="flex-row gap-3">
              <Pressable onPress={() => setMode('menu')} className="flex-1 py-3 border border-gray-600 rounded items-center">
                <Text className="text-gray-400">Back</Text>
              </Pressable>
              <Pressable
                onPress={mode === 'create' ? handleCreateRoom : handleJoinRoom}
                disabled={isConnecting}
                className={`flex-1 py-3 rounded items-center ${mode === 'create' ? 'bg-red-800' : 'bg-blue-800'} ${isConnecting ? 'opacity-50' : ''}`}
              >
                <Text className="text-white font-bold">
                  {isConnecting ? '接続中...' : (mode === 'create' ? 'CREATE' : 'JOIN')}
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Waiting Mode */}
        {mode === 'waiting' && (
          <View className="items-center">
            <Text className="text-2xl font-bold text-gray-200 mb-2">Waiting for Challenger...</Text>
            <View className="bg-black/40 border border-gray-700 rounded px-6 py-3 mb-8">
              <Text className="text-xs text-gray-500 text-center mb-1">PASSCODE</Text>
              <Text className="text-2xl tracking-widest text-red-400 font-bold text-center">{passcode}</Text>
            </View>
            <Text className="text-gray-500 text-xs mb-6">このパスコードを対戦相手に伝えてください</Text>
            <Pressable onPress={handleCancelWait}>
              <Text className="text-gray-500 text-sm underline">Cancel Room</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
};
