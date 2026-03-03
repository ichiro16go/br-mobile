import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Modal } from 'react-native';
import Slider from '@react-native-community/slider';
import { Card as CardType, RegaliaCard, PlayerState, RegaliaStats } from '../types';
import { Card } from './Card';
import { CRAFT_RECIPES } from '../constants/index';

// -------------------------------------------------------
// 共通モーダルラッパー
// -------------------------------------------------------
const ModalOverlay: React.FC<{ onClose?: () => void; children: React.ReactNode }> = ({ onClose, children }) => (
  <Modal transparent animationType="fade">
    <Pressable className="flex-1 bg-black/80 items-center justify-center p-3" onPress={onClose}>
      {/* <Pressable onPress={() => {}} className="max-w-2xl w-full max-h-[90%]"> */}
        {children}
      {/* </Pressable> */}
    </Pressable>
  </Modal>
);

// -------------------------------------------------------
// カード詳細表示モーダル (CardDetailModal)
// -------------------------------------------------------
export const CardDetailModal: React.FC<{ card: CardType; onClose: () => void }> = ({ card, onClose }) => (
  <ModalOverlay onClose={onClose}>
    <ScrollView
      className="bg-gray-900 border-2 border-gray-600 rounded-lg p-4"
      contentContainerClassName="items-center"
    >
      <Pressable className="absolute top-2 right-2 z-10" onPress={onClose}>
        <Text className="text-gray-500 text-lg">✕</Text>
      </Pressable>
      <Text className="text-lg text-gray-200 mb-4 border-b border-gray-700 pb-2 w-full text-center">
        {card.name}
      </Text>
      <View className="mb-4">
        <Card card={card} size="lg" />
      </View>
      <View className="bg-black/40 p-3 rounded border border-gray-800 w-full mb-4">
        <View className="flex-row justify-between mb-2 border-b border-gray-800 pb-1">
          <Text className="text-[10px] text-gray-500 uppercase font-bold">Type: {card.type}</Text>
          <Text className="text-[10px] text-gray-500 uppercase font-bold">Cost: {card.cost} / Atk: {card.attack}</Text>
        </View>
        <Text className="text-xs text-gray-300 leading-relaxed">{card.description}</Text>
      </View>
    </ScrollView>
  </ModalOverlay>
);

// -------------------------------------------------------
// 神器詳細モーダル (RegaliaModal)
// -------------------------------------------------------
interface RegaliaModalProps {
  regalia: RegaliaCard;
  player: PlayerState;
  isCurrentUser: boolean;
  onClose: () => void;
  onSelfHarm: () => void;
  onActivateBloodRecall: () => void;
}

const StatsBlock = ({ title, stats, active }: { title: string; stats: RegaliaStats; active: boolean }) => (
  <View className={`p-2 rounded border ${active ? 'bg-red-900/30 border-red-500' : 'bg-black/40 border-gray-700 opacity-60'}`}>
    <Text className={`text-xs font-bold uppercase mb-1 ${active ? 'text-red-400' : 'text-gray-500'}`}>{title}</Text>
    <View className="flex-row gap-2 justify-center mb-1">
      <View className="items-center">
        <Text className="text-[8px] text-gray-500">手札</Text>
        <Text className={`text-sm font-bold ${active ? 'text-blue-300' : 'text-gray-400'}`}>{stats.handSize}</Text>
      </View>
      <View className="items-center">
        <Text className="text-[8px] text-gray-500">自傷</Text>
        <Text className={`text-sm font-bold ${active ? 'text-red-300' : 'text-gray-400'}`}>{stats.selfHarmCost}</Text>
      </View>
      <View className="items-center">
        <Text className="text-[8px] text-gray-500">行動</Text>
        <Text className={`text-sm font-bold ${active ? 'text-purple-300' : 'text-gray-400'}`}>{stats.bloodPact}</Text>
      </View>
    </View>
    <Text className={`text-[10px] leading-tight ${active ? 'text-gray-200' : 'text-gray-500'}`}>{stats.selfHarmEffectDesc}</Text>
  </View>
);

export const RegaliaModal: React.FC<RegaliaModalProps> = ({ regalia, player, isCurrentUser, onClose, onSelfHarm, onActivateBloodRecall }) => {
  const isAwakened = player.isRegaliaAwakened;
  const recall = player.bloodRecall;
  const currentStats = isAwakened ? regalia.awakened : regalia.base;
  const canRecall = recall && player.bloodCircuit.length >= recall.cost;

  return (
    <ModalOverlay onClose={onClose}>
      <Pressable onPress={() => {}} className="max-w-2xl w-full">
        <ScrollView className="bg-gray-900 border-2 border-red-800 rounded-lg p-4 max-h-[90vh]">
          <Pressable className="absolute top-2 right-2 z-10" onPress={onClose}>
            <Text className="text-gray-500 text-lg">✕</Text>
          </Pressable>
          <View className="flex-row justify-between items-end border-b border-red-900 pb-2 mb-1">
            <Text className="text-lg text-red-500">{regalia.name}</Text>
            <Text className="text-xs text-gray-500">Year: {regalia.year}</Text>
          </View>
          <Text className="text-gray-400 italic mb-4 text-xs">{regalia.description}</Text>

          <View className="flex-row gap-2 mb-4">
            <View className="flex-1">
              <StatsBlock title="通常 (Normal)" stats={regalia.base} active={!isAwakened} />
            </View>
            <View className="flex-1">
              <StatsBlock title="覚醒 (Awakened)" stats={regalia.awakened} active={isAwakened} />
            </View>
          </View>

          <View className="flex-row justify-end gap-2 items-center border-t border-gray-800 pt-3">
            {!isAwakened && <Text className="text-xs text-red-500 flex-1 font-bold">Life 10以下で覚醒</Text>}
            {isAwakened && <Text className="text-xs text-red-500 flex-1 font-bold">覚醒済み</Text>}
            <Pressable className="px-3 py-2 rounded border border-gray-600" onPress={onClose}>
              <Text className="text-gray-300 text-xs">閉じる</Text>
            </Pressable>
            {isCurrentUser && !player.regalia?.isTapped && (
              <Pressable
                className={`px-4 py-2 rounded font-bold ${`player.lifeCards.length` >= `currentStats.selfHarmCost` ? 'bg-red-700' : 'bg-gray-700'}`}
                onPress={onSelfHarm}
                disabled={player.lifeCards.length < currentStats.selfHarmCost}
              >
                <Text className={`text-xs ${`player.lifeCards.length` >= `currentStats.selfHarmCost` ? 'text-white' : 'text-gray-400'}`}>
                  自傷して効果発動
                </Text>
              </Pressable>
            )}
          </View>

          {/* Blood Recall Section */}
          {isCurrentUser && recall && (
            <View className="mt-4 border-t border-gray-700 pt-4 bg-black/20 p-3 rounded mb-4">
              <View className="flex-row justify-between items-center mb-2">
                <View className="flex-row items-center gap-2">
                  <Text className="text-sm text-red-400 font-bold">Blood Recall</Text>
                  <View className="bg-red-950 px-2 py-0.5 rounded border border-red-900">
                    <Text className="text-xs text-red-300">{recall.name}</Text>
                  </View>
                </View>
                <Text className={`text-xs font-bold ${canRecall ? 'text-green-400' : 'text-red-500'}`}>
                  {player.bloodCircuit.length} / {recall.cost}
                </Text>
              </View>
              <Text className="text-xs text-gray-300 mb-3">{recall.description}</Text>
              <Pressable
                onPress={() => { onActivateBloodRecall(); onClose(); }}
                disabled={!canRecall}
                className={`w-full py-3 rounded items-center ${canRecall ? 'bg-red-800' : 'bg-gray-800'}`}
              >
                <Text className={`font-bold uppercase tracking-widest ${canRecall ? 'text-white' : 'text-gray-500'}`}>
                  {canRecall ? 'Activate Blood Recall' : 'Not Enough Circuit'}
                </Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </Pressable>
    </ModalOverlay>
  );
};

// -------------------------------------------------------
// クラフト（強化）モーダル (CraftModal)
// -------------------------------------------------------
interface CraftModalProps {
  player: PlayerState;
  onClose: () => void;
  onCraft: (recipeId: string, paymentCardIds: string[]) => void;
}

export const CraftModal: React.FC<CraftModalProps> = ({ player, onClose, onCraft }) => {
  const sortedRecipes = [...CRAFT_RECIPES].sort((a, b) => {
    const aMatch = a.inputMatcher(player.hand) !== null;
    const bMatch = b.inputMatcher(player.hand) !== null;
    if (aMatch && !bMatch) return -1;
    if (!aMatch && bMatch) return 1;
    return 0;
  });

  return (
    <ModalOverlay onClose={onClose}>
      <ScrollView className="bg-gray-900 border-2 border-purple-800 rounded-lg p-4">
        <Pressable className="absolute top-2 right-2 z-10" onPress={onClose}>
          <Text className="text-gray-500 text-lg">✕</Text>
        </Pressable>
        <View className="flex-row justify-between items-center border-b border-purple-900 pb-2 mb-4">
          <Text className="text-lg text-purple-400">アーツ強化 (Craft)</Text>
          <View className="flex-row items-center gap-1">
            <Text className="text-xs text-gray-500">Act:</Text>
            <Text className={`text-lg font-bold ${player.remainingActions > 0 ? 'text-white' : 'text-red-500'}`}>{player.remainingActions}</Text>
          </View>
        </View>

        <View className="gap-3">
          {sortedRecipes.map(recipe => {
            const matchIds = recipe.inputMatcher(player.hand);
            const hasAction = player.remainingActions > 0;
            const canCraft = matchIds !== null && hasAction;
            const resultPreview = recipe.createResult();
            const isSpecial = recipe.id === 'craft-sakura';

            return (
              <View key={recipe.id} className={`p-3 rounded border flex-row gap-3 items-center ${canCraft ? (isSpecial ? 'bg-pink-900/20 border-pink-500' : 'bg-purple-900/20 border-purple-500') : 'bg-gray-800/50 border-gray-700 opacity-60'}`}>
                <View className="flex-1">
                  <View className="flex-row items-center gap-2 mb-1">
                    <Text className={`font-bold text-sm ${isSpecial ? 'text-pink-300' : 'text-gray-200'}`}>{recipe.name}</Text>
                    {canCraft && (
                      <View className="bg-green-600 px-2 py-0.5 rounded">
                        <Text className="text-white text-[9px] font-bold">可能</Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-xs text-gray-400 mb-1">{recipe.description}</Text>
                  <Text className={`text-[10px] ${isSpecial ? 'text-pink-400' : 'text-purple-300'}`}>
                    生成: {resultPreview.name} {resultPreview.level > 0 && `(Lv.${resultPreview.level})`}
                  </Text>
                </View>
                <Pressable
                  onPress={() => { if (canCraft && matchIds) { onCraft(recipe.id, matchIds); onClose(); } }}
                  disabled={!canCraft}
                  className={`px-4 py-2 rounded ${canCraft ? (isSpecial ? 'bg-pink-600' : 'bg-purple-600') : 'bg-gray-700'}`}
                >
                  <Text className={`font-bold text-sm ${canCraft ? 'text-white' : 'text-gray-500'}`}>強化</Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </ModalOverlay>
  );
};

// -------------------------------------------------------
// カード一覧表示モーダル (CardListModal)
// -------------------------------------------------------
interface CardListModalProps {
  title: string;
  cards: CardType[];
  colorTheme?: 'gray' | 'purple';
  onClose: () => void;
}

export const CardListModal: React.FC<CardListModalProps> = ({ title, cards, colorTheme = 'gray', onClose }) => {
  const themeClasses = colorTheme === 'purple'
    ? { border: 'border-purple-700', text: 'text-purple-400' }
    : { border: 'border-gray-700', text: 'text-gray-400' };

  return (
    <ModalOverlay onClose={onClose}>
      <ScrollView className={`bg-gray-900 border-2 ${themeClasses.border} rounded-lg p-4`}>
        <Pressable className="absolute top-2 right-2 z-10" onPress={onClose}>
          <Text className="text-gray-500 text-lg">✕</Text>
        </Pressable>
        <View className={`flex-row justify-between items-center border-b ${themeClasses.border} pb-2 mb-4`}>
          <Text className={`text-lg ${themeClasses.text}`}>{title}</Text>
          <Text className="text-xs text-gray-500">枚数: {cards.length}</Text>
        </View>
        {cards.length === 0 ? (
          <Text className="text-center text-gray-600 py-8">カードがありません。</Text>
        ) : (
          <View className="flex-row flex-wrap gap-2 justify-center">
            {cards.map((c, i) => (
              <Card key={i} card={c} size="sm" />
            ))}
          </View>
        )}
      </ScrollView>
    </ModalOverlay>
  );
};

// -------------------------------------------------------
// デッキ内容確認モーダル (DeckListModal)
// -------------------------------------------------------
interface DeckListModalProps {
  title: string;
  cards: CardType[];
  onClose: () => void;
}

export const DeckListModal: React.FC<DeckListModalProps> = ({ title, cards, onClose }) => {
  const displayCards = [...cards].sort((a, b) => {
    if (a.type !== b.type) return a.type.localeCompare(b.type);
    return a.name.localeCompare(b.name);
  });

  return (
    <ModalOverlay onClose={onClose}>
      <ScrollView className="bg-gray-900 border-2 border-red-800 rounded-lg p-4">
        <Pressable className="absolute top-2 right-2 z-10" onPress={onClose}>
          <Text className="text-gray-500 text-lg">✕</Text>
        </Pressable>
        <View className="flex-row justify-between items-center border-b border-red-800 pb-2 mb-2">
          <Text className="text-lg text-red-400">{title}</Text>
          <Text className="text-xs text-red-300">枚数: {cards.length}</Text>
        </View>
        <Text className="text-[10px] text-gray-500 mb-4">カード順は隠されています（種類/名前順で表示）。</Text>
        {displayCards.length === 0 ? (
          <Text className="text-center text-gray-600 py-8">デッキにカードがありません。</Text>
        ) : (
          <View className="flex-row flex-wrap gap-2 justify-center">
            {displayCards.map((c, i) => (
              <Card key={i} card={c} size="sm" />
            ))}
          </View>
        )}
      </ScrollView>
    </ModalOverlay>
  );
};

// -------------------------------------------------------
// 汎用選択モーダル群
// -------------------------------------------------------
interface ChoiceModalProps {
  title: string;
  description: string;
  onResolve: (payload: any) => void;
}

// 1. 単一カード選択モーダル
export const CardSelectionModal: React.FC<ChoiceModalProps & { cards: CardType[]; filter?: (c: CardType) => boolean }> = ({ title, description, cards, onResolve, filter }) => {
  const displayCards = cards.map((c, i) => ({ card: c, originalIndex: i }));
  const filteredCards = filter ? displayCards.filter(({ card }) => filter(card)) : displayCards;

  return (
    <ModalOverlay>
      <ScrollView className="bg-gray-900 border-2 border-yellow-600 rounded-lg p-4" contentContainerClassName="items-center">
        <Text className="text-xl text-yellow-500 mb-2">{title}</Text>
        <Text className="text-sm text-gray-400 mb-4">{description}</Text>
        {filteredCards.length === 0 ? (
          <Text className="text-gray-500 mb-6">選択できるカードがありません。</Text>
        ) : (
          <View className="flex-row flex-wrap justify-center gap-3 mb-4">
            {filteredCards.map(({ card, originalIndex }) => (
              <View key={originalIndex} className="items-center gap-2">
                <Card card={card} size="md" />
                <Pressable onPress={() => onResolve({ selectedIndex: originalIndex })} className="bg-yellow-700 px-4 py-1 rounded">
                  <Text className="text-white font-bold text-xs">選択</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
        <Pressable onPress={() => onResolve({ selectedIndex: -1 })} className="mt-4 px-6 py-2 border border-gray-600 rounded">
          <Text className="text-gray-400 text-sm">キャンセル / スキップ</Text>
        </Pressable>
      </ScrollView>
    </ModalOverlay>
  );
};

// 2. 単純な二択モーダル
export const SimpleChoiceModal: React.FC<ChoiceModalProps & { options: { label: string; value: string }[] }> = ({ title, description, options, onResolve }) => (
  <ModalOverlay>
    <ScrollView
      className="bg-gray-900 border-2 border-blue-600 rounded-lg p-6"
      contentContainerClassName="items-center"
    >
      <Text className="text-xl text-blue-400 mb-4">{title}</Text>
      <Text className="text-sm text-gray-300 mb-6">{description}</Text>
      <View className="flex-row gap-4">
        {options.map(opt => (
          <Pressable key={opt.value} onPress={() => onResolve({ choice: opt.value })} className="bg-blue-800 border border-blue-500 px-6 py-3 rounded-lg flex-1">
            <Text className="text-white font-bold text-center">{opt.label}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  </ModalOverlay>
);

// 3. 手札複数選択モーダル
interface HandSelectionModalProps extends ChoiceModalProps {
  hand: CardType[];
  minSelect?: number;
  maxSelect?: number;
  filter?: (c: CardType) => boolean;
}

export const HandSelectionModal: React.FC<HandSelectionModalProps> = ({
  title, description, hand, onResolve, minSelect = 0, maxSelect = 99, filter
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selectableCards = filter ? hand.filter(filter) : hand;
  const unselectableCards = filter ? hand.filter(c => !filter(c)) : [];

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    } else if (selectedIds.length < maxSelect) {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const isValid = selectedIds.length >= minSelect && selectedIds.length <= maxSelect;

  return (
    <ModalOverlay>
      <ScrollView className="bg-gray-900 border-2 border-blue-600 rounded-lg p-4" contentContainerClassName="items-center">
        <Text className="text-xl text-blue-400 mb-2">{title}</Text>
        <Text className="text-xs text-gray-300 mb-1">{description}</Text>
        <Text className="text-xs text-blue-300 mb-4">
          選択中: {selectedIds.length}{maxSelect < 99 && ` / ${maxSelect}`}{minSelect > 0 && ` (最低: ${minSelect})`}
        </Text>

        <View className="flex-row flex-wrap justify-center gap-2 mb-6">
          {selectableCards.map(c => {
            const isSelected = selectedIds.includes(c.id);
            return (
              <Pressable key={c.id} onPress={() => toggleSelect(c.id)} className="relative">
                <View className={isSelected ? 'opacity-100' : 'opacity-80'}>
                  <Card card={c} size="sm" />
                </View>
                {isSelected && (
                  <View className="absolute -top-1 -right-1 bg-blue-600 w-5 h-5 rounded-full items-center justify-center border border-white">
                    <Text className="text-white text-[10px] font-bold">✓</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
          {unselectableCards.map(c => (
            <View key={c.id} className="opacity-30">
              <Card card={c} size="sm" />
            </View>
          ))}
        </View>

        <View className="flex-row gap-3">
          <Pressable
            onPress={() => onResolve({ selectedIds })}
            disabled={!isValid}
            className={`px-6 py-2 rounded ${isValid ? 'bg-blue-700' : 'bg-gray-700'}`}
          >
            <Text className={`font-bold ${isValid ? 'text-white' : 'text-gray-500'}`}>決定 ({selectedIds.length})</Text>
          </Pressable>
          <Pressable onPress={() => onResolve({ selectedIds: [] })} className="px-6 py-2 rounded border border-gray-600">
            <Text className="text-gray-400 text-sm">キャンセル</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ModalOverlay>
  );
};

// 4. 血廻カード選択モーダル
export const CircuitSelectionModal: React.FC<ChoiceModalProps & { circuit: CardType[] }> = ({ title, description, circuit, onResolve }) => (
  <ModalOverlay>
    <ScrollView className="bg-gray-900 border-2 border-purple-600 rounded-lg p-4" contentContainerClassName="items-center">
      <Text className="text-xl text-purple-400 mb-2">{title}</Text>
      <Text className="text-sm text-gray-300 mb-6">{description}</Text>
      {circuit.length === 0 ? (
        <Text className="text-gray-500 mb-6">血廻にカードがありません。</Text>
      ) : (
        <View className="flex-row flex-wrap justify-center gap-3 mb-6">
          {circuit.map((c, i) => (
            <View key={c.id} className="items-center gap-2">
              <Card card={c} size="sm" />
              <Pressable onPress={() => onResolve({ selectedIndex: i })} className="bg-purple-700 px-4 py-1 rounded">
                <Text className="text-white font-bold text-xs">選択</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}
      <Pressable onPress={() => onResolve({ selectedIndex: -1 })} className="bg-gray-700 px-6 py-2 rounded">
        <Text className="text-gray-300 text-sm">閉じる / スキップ</Text>
      </Pressable>
    </ScrollView>
  </ModalOverlay>
);

// 5. デッキ操作モーダル
export const BlueSphereDeckControlModal: React.FC<ChoiceModalProps & { cards: CardType[] }> = ({
  title, description, cards, onResolve
}) => {
  const [circuitIndices, setCircuitIndices] = useState<number[]>([]);
  const [deckIndices, setDeckIndices] = useState<number[]>(cards.map((_, i) => i));

  const toggleDestination = (index: number) => {
    if (circuitIndices.includes(index)) {
      setCircuitIndices(circuitIndices.filter(i => i !== index));
      setDeckIndices([...deckIndices, index]);
    } else {
      setDeckIndices(deckIndices.filter(i => i !== index));
      setCircuitIndices([...circuitIndices, index]);
    }
  };

  return (
    <ModalOverlay>
      <ScrollView className="bg-gray-900 border-2 border-blue-600 rounded-lg p-4" contentContainerClassName="items-center">
        <Text className="text-xl text-blue-400 mb-2">{title}</Text>
        <Text className="text-sm text-gray-300 mb-4">{description}</Text>

        <View className="flex-row gap-4 mb-6 w-full">
          <View className="flex-1 border border-purple-500/50 bg-purple-900/20 p-3 rounded min-h-[150px]">
            <Text className="text-purple-300 font-bold mb-3 text-sm text-center border-b border-purple-500/30 pb-2">血廻へ送る</Text>
            <View className="gap-2 items-center">
              {circuitIndices.map(i => (
                <Pressable key={i} onPress={() => toggleDestination(i)}>
                  <Card card={cards[i]} size="sm" />
                </Pressable>
              ))}
              {circuitIndices.length === 0 && <Text className="text-xs text-gray-500 mt-4">タップで移動</Text>}
            </View>
          </View>

          <View className="flex-1 border border-blue-500/50 bg-blue-900/20 p-3 rounded min-h-[150px]">
            <Text className="text-blue-300 font-bold mb-3 text-sm text-center border-b border-blue-500/30 pb-2">デッキの上に戻す</Text>
            <View className="gap-2 items-center">
              <Text className="text-[10px] text-gray-400">上 (次に引く)</Text>
              {deckIndices.map(cardIndex => (
                <Pressable key={cardIndex} onPress={() => toggleDestination(cardIndex)}>
                  <Card card={cards[cardIndex]} size="sm" />
                </Pressable>
              ))}
              <Text className="text-[10px] text-gray-400">下 (後で引く)</Text>
            </View>
          </View>
        </View>

        <Pressable onPress={() => onResolve({ toCircuitIndices: circuitIndices, orderIndices: deckIndices })} className="bg-blue-700 px-8 py-3 rounded">
          <Text className="text-white font-bold text-lg">決定</Text>
        </Pressable>
      </ScrollView>
    </ModalOverlay>
  );
};

// 6. デッキ操作モーダル (機翼の藍)
export const IndigoDeckStrategyModal: React.FC<ChoiceModalProps & { cards: CardType[] }> = ({ title, description, cards, onResolve }) => {
  const [actions, setActions] = useState<Record<number, 'upgrade' | 'discard' | 'deck'>>(
    Object.fromEntries(cards.map((_, i) => [i, 'deck']))
  );
  const [deckOrder, setDeckOrder] = useState<number[]>(cards.map((_, i) => i));

  const handleActionChange = (index: number, action: 'upgrade' | 'discard' | 'deck') => {
    setActions(prev => ({ ...prev, [index]: action }));
    if (action === 'deck') {
      if (!deckOrder.includes(index)) setDeckOrder([...deckOrder, index]);
    } else {
      setDeckOrder(deckOrder.filter(i => i !== index));
    }
  };

  return (
    <ModalOverlay>
      <ScrollView className="bg-gray-900 border-2 border-indigo-600 rounded-lg p-4" contentContainerClassName="items-center">
        <Text className="text-xl text-indigo-400 mb-2">{title}</Text>
        <Text className="text-sm text-gray-300 mb-4">{description}</Text>

        <View className="flex-row gap-4 mb-6">
          {cards.map((card, i) => {
            const isArt = card.type === 'SLASH' || card.type === 'BLOOD';
            const currentAction = actions[i];
            return (
              <View key={i} className="items-center gap-2 p-2 border border-gray-700 rounded bg-black/20">
                <Card card={card} size="sm" />
                <View className="gap-1 w-full">
                  {isArt && (
                    <Pressable onPress={() => handleActionChange(i, 'upgrade')} className={`px-2 py-1 rounded border ${currentAction === 'upgrade' ? 'bg-indigo-600 border-indigo-400' : 'bg-gray-800 border-gray-600'}`}>
                      <Text className={`text-[10px] text-center ${currentAction === 'upgrade' ? 'text-white' : 'text-gray-400'}`}>強化して捨てる</Text>
                    </Pressable>
                  )}
                  <Pressable onPress={() => handleActionChange(i, 'discard')} className={`px-2 py-1 rounded border ${currentAction === 'discard' ? 'bg-red-900/50 border-red-500' : 'bg-gray-800 border-gray-600'}`}>
                    <Text className={`text-[10px] text-center ${currentAction === 'discard' ? 'text-red-200' : 'text-gray-400'}`}>捨てる</Text>
                  </Pressable>
                  <Pressable onPress={() => handleActionChange(i, 'deck')} className={`px-2 py-1 rounded border ${currentAction === 'deck' ? 'bg-blue-900/50 border-blue-500' : 'bg-gray-800 border-gray-600'}`}>
                    <Text className={`text-[10px] text-center ${currentAction === 'deck' ? 'text-blue-200' : 'text-gray-400'}`}>山札に戻す</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>

        <Pressable onPress={() => onResolve({ actions, deckOrder })} className="bg-indigo-700 px-8 py-3 rounded">
          <Text className="text-white font-bold text-lg">戦略決定</Text>
        </Pressable>
      </ScrollView>
    </ModalOverlay>
  );
};

// 7. コスト支払いモーダル (葬送の黒)
interface BurialPaymentModalProps extends ChoiceModalProps {
  costType: 'fixed' | 'variable';
  costAmount: number;
  poolSize: number;
}

export const BurialPaymentModal: React.FC<BurialPaymentModalProps> = ({ title, description, costType, costAmount, poolSize, onResolve }) => {
  const [variableCost, setVariableCost] = useState(0);
  const maxVariable = Math.min(10, poolSize);
  const canPayFixed = costType === 'fixed' && poolSize >= costAmount;

  return (
    <ModalOverlay>
      <View className="bg-gray-900 border-2 border-stone-500 rounded-lg p-6 items-center">
        <Text className="text-xl text-stone-300 mb-4">{title}</Text>
        <Text className="text-sm text-gray-300 mb-2">{description}</Text>
        <Text className="text-sm text-red-400 font-bold mb-4">現在のブラッドプール: {poolSize}</Text>

        {costType === 'fixed' ? (
          <View className="items-center gap-4">
            <Text className="text-lg">
              コスト: <Text className="text-red-500 font-bold">{costAmount} 血</Text>
            </Text>
            <View className="flex-row gap-4 mt-4">
              <Pressable
                onPress={() => onResolve({ paid: true, amount: costAmount })}
                disabled={!canPayFixed}
                className={`px-6 py-3 rounded ${canPayFixed ? 'bg-red-800' : 'bg-gray-700'}`}
              >
                <Text className={`font-bold ${canPayFixed ? 'text-white' : 'text-gray-500'}`}>支払い & 発動</Text>
              </Pressable>
              <Pressable onPress={() => onResolve({ paid: false, amount: 0 })} className="px-6 py-3 rounded border border-gray-600">
                <Text className="text-gray-300">キャンセル</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View className="items-center gap-4 w-full">
            <Text className="text-lg">
              <Text className="text-red-500 font-bold">{variableCost}</Text> 血を支払う (最大: {maxVariable})
            </Text>
            <Slider
              style={{ width: '100%', height: 40 }}
              minimumValue={0}
              maximumValue={maxVariable}
              step={1}
              value={variableCost}
              onValueChange={setVariableCost}
              minimumTrackTintColor="#dc2626"
              maximumTrackTintColor="#374151"
              thumbTintColor="#dc2626"
            />
            <View className="flex-row gap-4 mt-4">
              <Pressable
                onPress={() => onResolve({ paid: true, amount: variableCost })}
                disabled={variableCost === 0}
                className={`px-6 py-3 rounded ${variableCost > 0 ? 'bg-stone-700' : 'bg-gray-700'}`}
              >
                <Text className={`font-bold ${variableCost > 0 ? 'text-white' : 'text-gray-500'}`}>{variableCost} 支払い</Text>
              </Pressable>
              <Pressable onPress={() => onResolve({ paid: false, amount: 0 })} className="px-6 py-3 rounded border border-gray-600">
                <Text className="text-gray-300">キャンセル</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </ModalOverlay>
  );
};

// 8. フィールドカード選択モーダル
interface FieldSelectionModalProps extends ChoiceModalProps {
  field: CardType[];
  minSelect?: number;
  maxSelect?: number;
  filter?: (c: CardType) => boolean;
}

export const FieldSelectionModal: React.FC<FieldSelectionModalProps> = ({
  title, description, field, onResolve, minSelect = 0, maxSelect = 99, filter
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selectableCards = filter ? field.filter(filter) : field;
  const unselectableCards = filter ? field.filter(c => !filter(c)) : [];

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    } else if (selectedIds.length < maxSelect) {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const isValid = selectedIds.length >= minSelect && selectedIds.length <= maxSelect;

  return (
    <ModalOverlay>
      <ScrollView className="bg-gray-900 border-2 border-pink-500 rounded-lg p-4" contentContainerClassName="items-center">
        <Text className="text-xl text-pink-400 mb-2">{title}</Text>
        <Text className="text-sm text-gray-300 mb-1">{description}</Text>
        <Text className="text-xs text-pink-300 mb-4">
          選択中: {selectedIds.length}{maxSelect < 99 && ` / ${maxSelect}`}
        </Text>

        <View className="flex-row flex-wrap justify-center gap-2 mb-6">
          {selectableCards.map(c => {
            const isSelected = selectedIds.includes(c.id);
            return (
              <Pressable key={c.id} onPress={() => toggleSelect(c.id)} className="relative">
                <View className={isSelected ? 'opacity-100' : 'opacity-80'}>
                  <Card card={c} size="sm" />
                </View>
                {isSelected && (
                  <View className="absolute -top-1 -right-1 bg-pink-600 w-5 h-5 rounded-full items-center justify-center border border-white">
                    <Text className="text-white text-[10px] font-bold">✓</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
          {unselectableCards.map(c => (
            <View key={c.id} className="opacity-30">
              <Card card={c} size="sm" />
            </View>
          ))}
        </View>

        <View className="flex-row gap-3">
          <Pressable
            onPress={() => onResolve({ selectedIds })}
            disabled={!isValid}
            className={`px-6 py-2 rounded ${isValid ? 'bg-pink-700' : 'bg-gray-700'}`}
          >
            <Text className={`font-bold ${isValid ? 'text-white' : 'text-gray-500'}`}>強化を実行 ({selectedIds.length})</Text>
          </Pressable>
          <Pressable onPress={() => onResolve({ selectedIds: [] })} className="px-6 py-2 rounded border border-gray-600">
            <Text className="text-gray-400 text-sm">キャンセル</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ModalOverlay>
  );
};
