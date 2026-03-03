import "./global.css";
import React, { useReducer, useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { gameReducer } from './src/services/engine';
import { createPlayer, setupTutorialGame } from './src/services/gameLogic';
import { GameState, Phase, CardType, ActionType } from './src/types';
import { REGALIA_LIST, RECALL_SETS, createRecallCard, BLOOD_RECALLS, getRegaliaTheme, RecallColorSet } from './src/constants/index';
import { PlayerArea } from './src/components/PlayerArea';
import { Market } from './src/components/Market';
import {
  CardSelectionModal, SimpleChoiceModal, HandSelectionModal,
  BlueSphereDeckControlModal, CircuitSelectionModal, IndigoDeckStrategyModal,
  BurialPaymentModal, FieldSelectionModal
} from './src/components/GameModals';
import { EntranceScreen } from './src/components/EntranceScreen';
import { LobbyScreen } from './src/components/LobbyScreen';
import { GameLog } from './src/components/GameLog';
import { TurnNotification } from './src/components/TurnNotification';
import { TutorialOverlay } from './src/components/TutorialOverlay';
import { getCardStyles } from './src/utils/cardStyles';
import { Card } from './src/components/Card';
import {
  submitSetup, listenForBothSetups, writeGameState, subscribeToGameState
} from './src/services/multiplayer';

// ─── ソロ対CPU用ゲーム初期化 ───────────────────────────────────────────────
const setupGame = (selectedRegaliaId: string, selectedBloodRecallId: string, selectedSets: RecallColorSet[]): GameState => {
  const p1Regalia = REGALIA_LIST.find(r => r.id === selectedRegaliaId) || REGALIA_LIST[0];
  const otherRegalias = REGALIA_LIST.filter(r => r.id !== selectedRegaliaId);
  const cpuRegalia = otherRegalias[Math.floor(Math.random() * otherRegalias.length)];
  const cpuRecalls = BLOOD_RECALLS.filter(br => br.regaliaId === cpuRegalia.id);
  const cpuBloodRecall = cpuRecalls[Math.floor(Math.random() * cpuRecalls.length)];

  let firstPlayerId = 'p1';
  let startReason = '';

  if (p1Regalia.year < cpuRegalia.year) {
    firstPlayerId = 'p1';
    startReason = `Player's Regalia is older (${p1Regalia.year} < ${cpuRegalia.year}).`;
  } else if (cpuRegalia.year < p1Regalia.year) {
    firstPlayerId = 'cpu';
    startReason = `CPU's Regalia is older (${cpuRegalia.year} < ${p1Regalia.year}).`;
  } else {
    firstPlayerId = Math.random() < 0.5 ? 'p1' : 'cpu';
    startReason = `Regalia years are equal (${p1Regalia.year}). Random choice.`;
  }

  const recallPiles = selectedSets.map(set => {
    const cards = set.cards.map(tmpl => createRecallCard(tmpl));
    return cards.sort(() => Math.random() - 0.5);
  });

  return {
    phase: Phase.Main,
    turnPlayerId: firstPlayerId,
    firstPlayerId: firstPlayerId,
    players: {
      player: createPlayer('p1', 'Player 1', true, p1Regalia, selectedBloodRecallId),
      cpu: createPlayer('cpu', 'CPU', false, cpuRegalia, cpuBloodRecall.id)
    },
    market: {
      recallPiles: recallPiles,
      artsDeckSlash: [],
      artsDeckBlood: []
    },
    log: [
      '--- Game Start ---',
      `Player uses ${p1Regalia.name} (${p1Regalia.year})`,
      `CPU uses ${cpuRegalia.name} (${cpuRegalia.year})`,
      `[System] ${startReason}`,
      `First Turn: ${firstPlayerId === 'p1' ? 'Player' : 'CPU'}`,
      `Market Colors: ${selectedSets.map(s => s.colorName).join(', ')}`
    ],
    cpuFailureCount: 0
  };
};

// ─── オンライン対戦用ゲーム初期化 ──────────────────────────────────────────
const setupOnlineGame = (
  p1RegaliaId: string, p1RecallId: string,
  p2RegaliaId: string, p2RecallId: string,
  selectedSets: RecallColorSet[]
): GameState => {
  const p1Regalia = REGALIA_LIST.find(r => r.id === p1RegaliaId) || REGALIA_LIST[0];
  const p2Regalia = REGALIA_LIST.find(r => r.id === p2RegaliaId) || REGALIA_LIST[0];

  let firstPlayerId = 'p1';
  let startReason = '';
  if (p1Regalia.year < p2Regalia.year) {
    firstPlayerId = 'p1';
    startReason = `P1's Regalia is older (${p1Regalia.year} < ${p2Regalia.year}).`;
  } else if (p2Regalia.year < p1Regalia.year) {
    firstPlayerId = 'cpu';
    startReason = `P2's Regalia is older (${p2Regalia.year} < ${p1Regalia.year}).`;
  } else {
    firstPlayerId = Math.random() < 0.5 ? 'p1' : 'cpu';
    startReason = `Regalia years are equal (${p1Regalia.year}). Random choice.`;
  }

  const recallPiles = selectedSets.map(set => {
    const cards = set.cards.map(tmpl => createRecallCard(tmpl));
    return cards.sort(() => Math.random() - 0.5);
  });

  return {
    phase: Phase.Main,
    turnPlayerId: firstPlayerId,
    firstPlayerId: firstPlayerId,
    players: {
      player: createPlayer('p1', 'Player 1', true, p1Regalia, p1RecallId),
      cpu: createPlayer('cpu', 'Player 2', true, p2Regalia, p2RecallId),
    },
    market: {
      recallPiles: recallPiles,
      artsDeckSlash: [],
      artsDeckBlood: []
    },
    log: [
      '--- Online Game Start ---',
      `P1 uses ${p1Regalia.name} (${p1Regalia.year})`,
      `P2 uses ${p2Regalia.name} (${p2Regalia.year})`,
      `[System] ${startReason}`,
      `First Turn: ${firstPlayerId === 'p1' ? 'Player 1' : 'Player 2'}`,
      `Market Colors: ${selectedSets.map(s => s.colorName).join(', ')}`
    ],
    cpuFailureCount: 0
  };
};

// ─── 画面タイプ ──────────────────────────────────────────────────────────────
type AppView = 'entrance' | 'lobby' | 'regalia_select' | 'blood_recall_select' | 'online_waiting' | 'game' | 'tutorial';

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('entrance');
  const [selectedRegalia, setSelectedRegalia] = useState<string | null>(null);
  const [selectedBloodRecall, setSelectedBloodRecall] = useState<string | null>(null);
  const [activeRecallSets, setActiveRecallSets] = useState<RecallColorSet[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [localPlayerId, setLocalPlayerId] = useState<'p1' | 'cpu'>('p1');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [onlineInitialState, setOnlineInitialState] = useState<GameState | null>(null);
  const [gameKey, setGameKey] = useState(0);
  const unsubRef = useRef<(() => void) | null>(null);
  // handleOnlineSelectionDone から activeRecallSets を参照するために ref で保持
  const activeRecallSetsRef = useRef<RecallColorSet[]>([]);
  activeRecallSetsRef.current = activeRecallSets;

  const handleStartSolo = () => {
    setIsOnline(false);
    const shuffledSets = [...RECALL_SETS].sort(() => Math.random() - 0.5);
    const selected = shuffledSets.slice(0, 5);
    setActiveRecallSets(selected);
    setCurrentView('regalia_select');
  };

  const handleStartTutorial = () => {
    setIsOnline(false);
    setCurrentView('tutorial');
  };

  // LobbyScreen からマッチが成立した時に呼ばれる
  const handleMatchMade = (room: string, host: boolean, marketSetIndices: number[]) => {
    setIsOnline(true);
    setIsHost(host);
    setLocalPlayerId(host ? 'p1' : 'cpu');
    setRoomId(room);
    const sets = marketSetIndices.map(i => RECALL_SETS[i]);
    setActiveRecallSets(sets);
    setCurrentView('regalia_select');
  };

  // 選択完了後: Firebase にアップロードして待機画面へ
  const handleOnlineSelectionDone = async (regaliaId: string, bloodRecallId: string, room: string, host: boolean) => {
    setCurrentView('online_waiting');
    const slot = host ? 'p1' : 'p2';
    try {
      await submitSetup(room, slot, regaliaId, bloodRecallId);
    } catch (e: any) {
      Alert.alert('エラー', e.message || '選択の送信に失敗しました');
      setCurrentView('blood_recall_select');
      return;
    }

    if (host) {
      // ゲストの選択を待ち、揃ったらゲームを開始
      const unsub = listenForBothSetups(room, async (p1Setup, p2Setup) => {
        if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
        const gameState = setupOnlineGame(
          p1Setup.regaliaId, p1Setup.bloodRecallId,
          p2Setup.regaliaId, p2Setup.bloodRecallId,
          activeRecallSetsRef.current
        );
        try {
          await writeGameState(room, gameState);
        } catch {
          Alert.alert('エラー', 'ゲームの開始に失敗しました');
          return;
        }
        setOnlineInitialState(gameState);
        setCurrentView('game');
      });
      unsubRef.current = unsub;
    } else {
      // ゲストはホストがゲーム状態を書き込むのを待つ
      const unsub = subscribeToGameState(room, (gameState) => {
        if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
        setOnlineInitialState(gameState);
        setCurrentView('game');
      });
      unsubRef.current = unsub;
    }
  };

  const handleReturnToTitle = () => {
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
    setCurrentView('entrance');
    setSelectedRegalia(null);
    setSelectedBloodRecall(null);
    setOnlineInitialState(null);
    setIsOnline(false);
    setRoomId(null);
    setGameKey(prev => prev + 1);
  };

  // ─── Entrance ───────────────────────────────────────────────────────────
  if (currentView === 'entrance') {
    return (
      <>
        <StatusBar style="light" hidden />
        <EntranceScreen
          onStartSolo={handleStartSolo}
          onStartVersus={() => setCurrentView('lobby')}
          onStartTutorial={handleStartTutorial}
        />
      </>
    );
  }

  // ─── Lobby ──────────────────────────────────────────────────────────────
  if (currentView === 'lobby') {
    return (
      <>
        <StatusBar style="light" hidden />
        <LobbyScreen
          onBack={() => setCurrentView('entrance')}
          onMatchMade={handleMatchMade}
        />
      </>
    );
  }

  // ─── Tutorial ───────────────────────────────────────────────────────────
  if (currentView === 'tutorial') {
    return (
      <>
        <StatusBar style="light" hidden />
        <GameView key={`tutorial-${gameKey}`} initialState={setupTutorialGame()} isTutorial={true} onReturnToTitle={handleReturnToTitle} />
      </>
    );
  }

  // ─── Online waiting (選択後、相手 or GameState を待機中) ────────────────
  if (currentView === 'online_waiting') {
    return (
      <>
        <StatusBar style="light" hidden />
        <View className="flex-1 bg-[#0f0808] items-center justify-center p-4">
          <Text className="text-2xl font-bold text-gray-200 mb-4">
            {isHost ? '相手の選択を待っています...' : 'ゲームの開始を待っています...'}
          </Text>
          <View className="bg-black/40 border border-gray-700 rounded px-6 py-3 mb-8">
            <Text className="text-xs text-gray-500 text-center mb-1">ROOM</Text>
            <Text className="text-2xl tracking-widest text-red-400 font-bold text-center">{roomId}</Text>
          </View>
          <Pressable onPress={handleReturnToTitle}>
            <Text className="text-gray-500 text-sm underline">キャンセル</Text>
          </Pressable>
        </View>
      </>
    );
  }

  // ─── Regalia Select ─────────────────────────────────────────────────────
  if (currentView === 'regalia_select') {
    return (
      <>
        <StatusBar style="light" hidden />
        <ScrollView className="flex-1 bg-neutral-900 p-4" contentContainerClassName="items-center pb-8">
          <Pressable onPress={() => setCurrentView(isOnline ? 'lobby' : 'entrance')} className="self-start mb-4">
            <Text className="text-gray-500">← Back to Title</Text>
          </Pressable>

          <Text className="text-3xl text-red-600 mb-2">Regalia Selection</Text>
          {isOnline && roomId && (
            <Text className="text-blue-400 font-bold mb-1">ONLINE MATCH - ROOM: {roomId}</Text>
          )}
          <Text className="text-gray-400 mb-6 text-sm">Review the market forecast and choose your weapon.</Text>

          {/* Market Forecast */}
          <View className="w-full bg-black/40 border border-gray-800 rounded-lg p-3 mb-6">
            <Text className="text-center text-gray-300 text-xs tracking-widest border-b border-gray-700 pb-2 mb-3">
              MARKET FORECAST
            </Text>
            <View className="flex-row flex-wrap justify-center gap-2">
              {activeRecallSets.map((set, idx) => {
                const dummyCard = { name: set.cards[0].name, type: CardType.Recall } as any;
                const styles = getCardStyles(dummyCard);
                return (
                  <View key={idx} className={`w-24 h-16 rounded border-2 items-center justify-center overflow-hidden ${styles.outer}`}>
                    <View className={`w-full text-center py-0.5 ${styles.header}`}>
                      <Text className="text-[9px] font-bold text-white text-center">
                        {set.colorName.split(' ')[1] || set.colorName}
                      </Text>
                    </View>
                    <View className={`flex-1 items-center justify-center p-1 bg-white/10 w-full`}>
                      <Text className={`text-[9px] font-bold text-center ${styles.text}`}>{set.cards[0].name}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          <Text className="text-lg mb-3 text-red-400">Choose your Regalia</Text>

          <View className="flex-row flex-wrap justify-center gap-3 w-full">
            {REGALIA_LIST.map(r => {
              const theme = getRegaliaTheme(r.id);
              return (
                <Pressable
                  key={r.id}
                  className={`p-3 rounded border-2 w-60 flex-col ${theme.bg} ${theme.border}`}
                  onPress={() => {
                    setSelectedRegalia(r.id);
                    setCurrentView('blood_recall_select');
                  }}
                >
                  <Text className={`text-lg font-bold mb-1 ${theme.title}`}>{r.name}</Text>
                  <Text className={`text-[10px] mb-2 italic ${theme.subText}`}>{r.description.split('。')[0]}</Text>

                  <View className={`${theme.statsBg} p-2 rounded mb-2 gap-2`}>
                    <View>
                      <Text className={`text-[9px] font-bold border-b border-white/10 mb-1 ${theme.subText}`}>Normal</Text>
                      <View className="flex-row gap-1 justify-center">
                        <View className="bg-black/30 p-1 rounded items-center flex-1">
                          <Text className="text-white font-bold text-xs">{r.base.handSize}</Text>
                          <Text className="text-[8px] text-gray-400">Hand</Text>
                        </View>
                        <View className="bg-black/30 p-1 rounded items-center flex-1">
                          <Text className="text-red-400 font-bold text-xs">{r.base.selfHarmCost}</Text>
                          <Text className="text-[8px] text-gray-400">Dmg</Text>
                        </View>
                        <View className="bg-black/30 p-1 rounded items-center flex-1">
                          <Text className="text-blue-400 font-bold text-xs">{r.base.bloodPact}</Text>
                          <Text className="text-[8px] text-gray-400">Pact</Text>
                        </View>
                      </View>
                    </View>

                    <View>
                      <Text className={`text-[9px] font-bold border-b ${theme.awakenedBorder} mb-1 ${theme.accentText}`}>Awakened</Text>
                      <View className="flex-row gap-1 justify-center">
                        <View className={`bg-black/30 p-1 rounded items-center flex-1 border ${theme.awakenedBorder}`}>
                          <Text className="text-white font-bold text-xs">{r.awakened.handSize}</Text>
                          <Text className="text-[8px] text-gray-400">Hand</Text>
                        </View>
                        <View className={`bg-black/30 p-1 rounded items-center flex-1 border ${theme.awakenedBorder}`}>
                          <Text className="text-red-400 font-bold text-xs">{r.awakened.selfHarmCost}</Text>
                          <Text className="text-[8px] text-gray-400">Dmg</Text>
                        </View>
                        <View className={`bg-black/30 p-1 rounded items-center flex-1 border ${theme.awakenedBorder}`}>
                          <Text className="text-blue-400 font-bold text-xs">{r.awakened.bloodPact}</Text>
                          <Text className="text-[8px] text-gray-400">Pact</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </>
    );
  }

  // ─── Blood Recall Select ─────────────────────────────────────────────────
  if (currentView === 'blood_recall_select' && selectedRegalia) {
    const availableRecalls = BLOOD_RECALLS.filter(br => br.regaliaId === selectedRegalia);
    const regaliaName = REGALIA_LIST.find(r => r.id === selectedRegalia)?.name;
    const theme = getRegaliaTheme(selectedRegalia);

    return (
      <>
        <StatusBar style="light" hidden />
        <View className="flex-1 bg-neutral-900 items-center justify-center p-4">
          <Text className={`text-2xl mb-2 ${theme.title}`}>Select Blood Recall</Text>
          <Text className="text-lg text-gray-400 mb-6">for {regaliaName}</Text>
          <View className="flex-row gap-4 flex-wrap justify-center">
            {availableRecalls.map(br => (
              <Pressable
                key={br.id}
                className={`p-5 rounded border-2 w-72 items-center ${theme.bg} ${theme.border}`}
                onPress={() => {
                  setSelectedBloodRecall(br.id);
                  if (isOnline && roomId) {
                    handleOnlineSelectionDone(selectedRegalia, br.id, roomId, isHost);
                  } else {
                    setCurrentView('game');
                  }
                }}
              >
                <Text className={`text-xl font-bold mb-2 ${theme.title}`}>{br.name}</Text>
                <View className={`w-full h-px my-3 ${theme.descriptionBorder.replace('border-', 'bg-')}`} />
                <Text className={`text-xs mb-4 text-center ${theme.subText}`}>{br.description}</Text>
                <View className="flex-row gap-3">
                  <View className="bg-black/40 px-3 py-1 rounded border border-red-900/50">
                    <Text className="text-red-400 text-xs font-bold">Cost: {br.cost}</Text>
                  </View>
                  <View className="bg-black/40 px-3 py-1 rounded border border-blue-900/50">
                    <Text className="text-blue-400 text-xs font-bold">{br.timing}</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
          <Pressable className="mt-8" onPress={() => { setSelectedRegalia(null); setCurrentView('regalia_select'); }}>
            <Text className="text-gray-500 underline">Back to Regalia Selection</Text>
          </Pressable>
        </View>
      </>
    );
  }

  // ─── Game (Solo) ─────────────────────────────────────────────────────────
  if (currentView === 'game' && !isOnline && selectedRegalia && selectedBloodRecall) {
    return (
      <>
        <StatusBar style="light" hidden />
        <GameView
          key={`${selectedRegalia}-${selectedBloodRecall}-${gameKey}`}
          initialState={setupGame(selectedRegalia, selectedBloodRecall, activeRecallSets)}
          onReturnToTitle={handleReturnToTitle}
        />
      </>
    );
  }

  // ─── Game (Online) ───────────────────────────────────────────────────────
  if (currentView === 'game' && isOnline && onlineInitialState && roomId) {
    return (
      <>
        <StatusBar style="light" hidden />
        <GameView
          key={`online-${gameKey}`}
          initialState={onlineInitialState}
          onReturnToTitle={handleReturnToTitle}
          localPlayerId={localPlayerId}
          isOnlineMode={true}
          roomId={roomId}
        />
      </>
    );
  }

  return null;
}

// ─── GameView ─────────────────────────────────────────────────────────────────
const GameView: React.FC<{
  initialState: GameState;
  isTutorial?: boolean;
  onReturnToTitle: () => void;
  localPlayerId?: 'p1' | 'cpu';
  isOnlineMode?: boolean;
  roomId?: string | null;
}> = ({ initialState, isTutorial = false, onReturnToTitle, localPlayerId = 'p1', isOnlineMode = false, roomId }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [isMarketOpen, setIsMarketOpen] = useState(true);
  const [showTurnNotify, setShowTurnNotify] = useState(false);
  const stateRef = useRef<GameState>(state);
  stateRef.current = state;

  // ターン通知
  useEffect(() => {
    if (state.phase === Phase.Main) {
      setShowTurnNotify(true);
      const timer = setTimeout(() => setShowTurnNotify(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [state.turnPlayerId, state.phase]);

  // CPU_ACTION (ソロ専用)
  useEffect(() => {
    if (isOnlineMode) return;
    if (!isTutorial && state.phase === Phase.Main && state.turnPlayerId === 'cpu') {
      const timer = setTimeout(() => dispatch({ type: 'CPU_ACTION' }), 2500);
      return () => clearTimeout(timer);
    }
    if (isTutorial && state.phase === Phase.Main && state.turnPlayerId === 'cpu') {
      const timer = setTimeout(() => dispatch({ type: 'CPU_ACTION' }), 1000);
      return () => clearTimeout(timer);
    }
  }, [state.phase, state.turnPlayerId, state.log.length, isTutorial, isOnlineMode]);

  // Firebase 購読: 相手のターン中に state を受信
  useEffect(() => {
    if (!isOnlineMode || !roomId) return;
    if (state.phase === Phase.GameOver) return;
    if (state.turnPlayerId === localPlayerId) return;

    const unsub = subscribeToGameState(roomId, (remoteState) => {
      dispatch({ type: 'LOAD_ONLINE_STATE', state: remoteState });
    });
    return unsub;
  }, [state.turnPlayerId, state.phase, isOnlineMode, roomId, localPlayerId]);

  // アクション dispatch + Firebase 書き込み (オンライン時)
  const dispatchWithSync = useCallback((action: ActionType) => {
    const newState = gameReducer(stateRef.current, action);
    dispatch({ type: 'LOAD_ONLINE_STATE', state: newState });
    if (isOnlineMode && roomId) {
      writeGameState(roomId, newState).catch(() => {});
    }
  }, [isOnlineMode, roomId]);

  const isPlayerTurn = state.turnPlayerId === localPlayerId && state.phase === Phase.Main;

  // 自分・相手のプレイヤーデータを解決 (p2はcpuスロットが自分)
  const myKey = localPlayerId === 'p1' ? 'player' : 'cpu';
  const opponentKey = localPlayerId === 'p1' ? 'cpu' : 'player';
  const myPlayer = state.players[myKey];
  const opponentPlayer = state.players[opponentKey];
  const remainingActions = myPlayer.remainingActions;

  const handlePlayCard = (cardId: string) => {
    if (!isPlayerTurn) return;
    dispatchWithSync({ type: 'PLAY_CARD', playerId: localPlayerId, cardId });
  };

  const handleSelfHarm = () => {
    if (!isPlayerTurn) return;
    dispatchWithSync({ type: 'SELF_HARM', playerId: localPlayerId });
  };

  const handlePass = () => {
    if (!isPlayerTurn) return;
    const playableCards = myPlayer.hand.filter(c => c.type !== CardType.Calamity);
    if (playableCards.length > 0) {
      Alert.alert("手札にカードが残っています", "ルール上、手札のカードは全てプレイする必要があります。\n(災厄カードを除く)");
      return;
    }
    dispatchWithSync({ type: 'PASS_TURN', playerId: localPlayerId });
  };

  const handleRecall = (pileIndex: number) => {
    if (!isPlayerTurn) return;
    dispatchWithSync({ type: 'RECALL_CARD', playerId: localPlayerId, pileIndex, paymentCardIds: [] });
  };

  const handleCraft = (recipeId: string, paymentCardIds: string[]) => {
    if (!isPlayerTurn) return;
    dispatchWithSync({ type: 'CRAFT_CARD', playerId: localPlayerId, recipeId, paymentCardIds });
  };

  const handleActivateBloodRecall = () => {
    if (!isPlayerTurn) return;
    dispatchWithSync({ type: 'ACTIVATE_BLOOD_RECALL', playerId: localPlayerId });
  };

  const handleResolvePending = (payload: any) => {
    dispatchWithSync({ type: 'RESOLVE_PENDING_ACTION', payload });
  };

  const handleTutorialNext = () => {
    dispatch({ type: 'TUTORIAL_NEXT_STEP' });
  };

  // pendingResolution は自分のターン中のみ表示
  const showPending = !!state.pendingResolution && state.turnPlayerId === localPlayerId;

  return (
    <View className="flex-1 w-full bg-[#1a0b0b] flex-row">

      {/* チュートリアルオーバーレイ */}
      {isTutorial && state.tutorialStep !== undefined && (
        <TutorialOverlay step={state.tutorialStep} onNext={handleTutorialNext} />
      )}

      {/* ターン開始通知 */}
      <TurnNotification playerId={state.turnPlayerId} isVisible={showTurnNotify} />

      {/* Game Log */}
      <GameLog logs={state.log} turnPlayerId={state.turnPlayerId} phase={state.phase} />

      {/* Main Game Area */}
      <View className="flex-1 flex-col relative">
        {/* 相手エリア (上) */}
        <View className="flex-1 border-b border-red-900/20 relative">
          <PlayerArea
            player={opponentPlayer}
            isCurrentUser={false}
            onPlayCard={() => {}}
            onSelfHarm={() => {}}
            onCraft={() => {}}
            onActivateBloodRecall={() => {}}
            isOpponent={true}
            phase={state.phase}
          />
        </View>

        {/* 自分エリア (下) */}
        <View className="flex-1 relative">
          <PlayerArea
            player={myPlayer}
            isCurrentUser={true}
            onPlayCard={handlePlayCard}
            onSelfHarm={handleSelfHarm}
            onCraft={handleCraft}
            onActivateBloodRecall={handleActivateBloodRecall}
            isOpponent={false}
            phase={state.phase}
          />
        </View>

        {/* END Turn button */}
        <View className="absolute bottom-4 right-4 z-30">
          {state.phase !== Phase.GameOver && (
            <Pressable
              onPress={handlePass}
              disabled={!isPlayerTurn}
              className={`h-14 w-28 rounded-lg items-center justify-center border-2 ${
                isPlayerTurn
                  ? 'bg-red-900 border-red-500'
                  : 'bg-gray-900 border-gray-700'
              }`}
            >
              <Text className={`text-base font-bold ${isPlayerTurn ? 'text-white' : 'text-gray-600'}`}>
                {isPlayerTurn ? 'END' : 'WAIT'}
              </Text>
              <Text className={`text-[10px] ${isPlayerTurn ? 'text-white/70' : 'text-gray-600'}`}>Turn</Text>
            </Pressable>
          )}
        </View>

        {/* Compact log */}
        <View className="absolute top-2 left-2 z-30">
          <View className="bg-black/60 p-1 rounded border border-white/10 max-w-[200px]">
            <Text className="text-[10px] text-white/50" numberOfLines={1}>
              {state.log[state.log.length - 1]}
            </Text>
          </View>
        </View>
      </View>

      {/* Market Panel */}
      {isMarketOpen && (
        <View className="w-28 border-l border-red-900/50 bg-black/90">
          <Market
            recallPiles={state.market.recallPiles}
            onRecall={handleRecall}
            canRecall={isPlayerTurn && remainingActions > 0}
            playerPoolCount={myPlayer.bloodPool.length}
          />
        </View>
      )}

      {/* Market Toggle */}
      <Pressable
        onPress={() => setIsMarketOpen(!isMarketOpen)}
        className="absolute top-20 right-0 w-6 h-16 bg-red-950/90 border-y border-l border-red-900/50 rounded-l items-center justify-center z-50"
        style={isMarketOpen ? { right: 112 } : { right: 0 }}
      >
        <Text className="text-red-200 text-xs">{isMarketOpen ? '>' : '<'}</Text>
      </Pressable>

      {/* Pending Resolution Modals (自分のターン中のみ) */}
      {showPending && (
        <>
          {state.pendingResolution!.type === 'APOITAKARA_SELECTION' && (
            <CardSelectionModal title="Apoitakara's Vision" description="Choose one card to add to your hand." cards={state.pendingResolution!.cards} onResolve={handleResolvePending} />
          )}
          {state.pendingResolution!.type === 'SHIRAGANE_HAND_SELECT' && (
            <HandSelectionModal title="Remembrance (Shiragane)" description={`Select ${state.pendingResolution!.count} Art card(s) to upgrade.`} hand={myPlayer.hand} minSelect={state.pendingResolution!.count} maxSelect={state.pendingResolution!.count} filter={(c) => c.type === CardType.Slash || c.type === CardType.Blood} onResolve={handleResolvePending} />
          )}
          {state.pendingResolution!.type === 'OBOTSU_BASE_CHOICE' && (
            <SimpleChoiceModal title="Obotsukagura's Choice" description="Select which blessing to receive." options={[{ label: 'Obotsu Fragment', value: 'fragment' }, { label: '2 Blood Cards', value: 'blood' }]} onResolve={handleResolvePending} />
          )}
          {state.pendingResolution!.type === 'OBOTSU_AWAKENED_HAND_SELECT' && (
            <HandSelectionModal title="Sacrifice for Knowledge" description="Select up to 2 cards to send to Blood Circuit." hand={myPlayer.hand} onResolve={handleResolvePending} maxSelect={2} />
          )}
          {state.pendingResolution!.type === 'BLUE_SPHERE_UPGRADE' && (
            <CardSelectionModal title="Blue Sphere: Remembrance" description="Choose an Art card to upgrade." cards={myPlayer.hand} filter={(c) => c.type === CardType.Slash || c.type === CardType.Blood} onResolve={(payload) => { const card = myPlayer.hand[payload.selectedIndex]; handleResolvePending({ cardId: card.id }); }} />
          )}
          {state.pendingResolution!.type === 'BLUE_SPHERE_DECK_CONTROL' && (
            <BlueSphereDeckControlModal title="Blue Sphere: Deck Control" description="Send cards to Circuit or return to Deck top." cards={state.pendingResolution!.cards} onResolve={handleResolvePending} />
          )}
          {state.pendingResolution!.type === 'INDIGO_HAND_TO_CIRCUIT' && (
            <HandSelectionModal title="Indigo Wing: Offerings" description="Send cards from hand to Blood Circuit." hand={myPlayer.hand} onResolve={handleResolvePending} />
          )}
          {state.pendingResolution!.type === 'INDIGO_DECK_STRATEGY' && (
            <IndigoDeckStrategyModal title="Indigo Wing: Strategy" description="Top 2 cards of Deck." cards={state.pendingResolution!.cards} onResolve={handleResolvePending} />
          )}
          {state.pendingResolution!.type === 'INDIGO_UPGRADE_BLOOD' && (
            <HandSelectionModal title="Indigo Wing: Blood Upgrade" description="Select 1 Level 1 Blood Art to upgrade." hand={myPlayer.hand} minSelect={1} maxSelect={1} filter={(c) => c.type === CardType.Blood && c.level === 1} onResolve={handleResolvePending} />
          )}
          {state.pendingResolution!.type === 'INDIGO_HAND_TO_CIRCUIT_DRAW' && (
            <HandSelectionModal title="Indigo Wing: Exchange" description="Send up to 2 cards to Circuit. Draw 1 if any sent." hand={myPlayer.hand} maxSelect={2} onResolve={handleResolvePending} />
          )}
          {state.pendingResolution!.type === 'INDIGO_CIRCUIT_TO_HAND' && (
            <CircuitSelectionModal title="Indigo Wing: Retrieval" description="Select 1 card from Circuit to add to hand." circuit={myPlayer.bloodCircuit} onResolve={handleResolvePending} />
          )}
          {state.pendingResolution!.type === 'BURIAL_PAYMENT' && (
            <BurialPaymentModal title="Burial Black: Additional Cost" description="Choose to pay blood." costType={state.pendingResolution!.costType} costAmount={state.pendingResolution!.costAmount} poolSize={myPlayer.bloodPool.length} onResolve={handleResolvePending} />
          )}
          {state.pendingResolution!.type === 'BURIAL_SEARCH_DECK' && (
            <CardSelectionModal title="Burial Black: Search" description="Select a card for deck top." cards={state.pendingResolution!.cards} onResolve={handleResolvePending} />
          )}
          {state.pendingResolution!.type === 'BURIAL_FREE_RECALL' && (
            <CardSelectionModal title="Burial Black: Free Recall" description="Select a Recall card for FREE." cards={state.pendingResolution!.marketCards} onResolve={handleResolvePending} />
          )}
          {state.pendingResolution!.type === 'CHERRY_VICTORY_SELECT' && (
            <FieldSelectionModal title="Cherry: Victory" description="Select up to 2 Slash Arts to enhance." field={myPlayer.field} maxSelect={2} filter={(c) => c.type === CardType.Slash} onResolve={handleResolvePending} />
          )}
        </>
      )}

      {/* Game Over Overlay */}
      {state.phase === Phase.GameOver && (
        <View className="absolute inset-0 bg-black/95 z-[60] items-center justify-center">
          {(() => {
            const myLife = myPlayer.life;
            const oppLife = opponentPlayer.life;
            let title = "";
            let sub = "";
            let colorClass = "";

            if (myLife <= 0 && oppLife <= 0) {
              title = "DRAW";
              sub = "Mutual Destruction";
              colorClass = "text-gray-400";
            } else if (myLife <= 0) {
              title = "YOU LOSE...";
              sub = "Defeat";
              colorClass = "text-blue-300";
            } else {
              title = "YOU WIN!!";
              sub = "Victory";
              colorClass = "text-yellow-500";
            }

            return (
              <>
                <Text className={`text-6xl font-bold tracking-widest ${colorClass} mb-4`}>
                  {title}
                </Text>
                <Text className="text-xl mb-8 text-gray-300 tracking-wider">
                  {sub}
                </Text>
                <Pressable
                  onPress={onReturnToTitle}
                  className={`px-10 py-4 rounded border-2 ${myLife > 0 && oppLife <= 0
                    ? 'bg-yellow-700 border-yellow-500'
                    : 'bg-gray-800 border-gray-600'}`}
                >
                  <Text className="text-white text-lg font-bold uppercase tracking-widest">
                    {isTutorial ? "Finish Tutorial" : "Return to Title"}
                  </Text>
                </Pressable>
              </>
            );
          })()}
        </View>
      )}
    </View>
  );
};
