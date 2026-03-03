import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { PlayerState, RegaliaCard, Phase, Card as CardType } from '../types';
import { RegaliaModal, CraftModal, CardListModal, DeckListModal, CardDetailModal } from './GameModals';
import { IdentitySection } from './player/IdentitySection';
import { ResourceSection } from './player/ResourceSection';
import { FieldSection } from './player/FieldSection';
import { HandSection } from './player/HandSection';

interface PlayerAreaProps {
  player: PlayerState;
  isCurrentUser: boolean;
  onPlayCard: (cardId: string) => void;
  onSelfHarm: () => void;
  onCraft: (recipeId: string, paymentCardIds: string[]) => void;
  onActivateBloodRecall: () => void;
  isOpponent?: boolean;
  phase: Phase;
  isMarketOpen?: boolean;
}

export const PlayerArea: React.FC<PlayerAreaProps> = ({
  player,
  isCurrentUser,
  onPlayCard,
  onSelfHarm,
  onCraft,
  onActivateBloodRecall,
  isOpponent = false,
  phase,
  isMarketOpen = false
}) => {
  const [selectedRegalia, setSelectedRegalia] = useState<RegaliaCard | null>(null);
  const [showCraftModal, setShowCraftModal] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [showCircuitModal, setShowCircuitModal] = useState(false);
  const [showDeckModal, setShowDeckModal] = useState(false);
  const [viewingCard, setViewingCard] = useState<CardType | null>(null);

  const handleRegaliaClick = () => {
    if (player.regalia) {
      setSelectedRegalia(player.regalia);
    }
  };

  const handleConfirmSelfHarm = () => {
    onSelfHarm();
    setSelectedRegalia(null);
  };

  return (
    <View className={`relative w-full h-full ${isOpponent ? 'flex-col-reverse' : 'flex-col'}`}>
      <View className="flex-1 flex-row w-full bg-black/10 min-h-0">
        <IdentitySection
          player={player}
          isCurrentUser={isCurrentUser}
          isOpponent={isOpponent}
          phase={phase}
          onRegaliaClick={handleRegaliaClick}
          onActivateBloodRecall={onActivateBloodRecall}
        />

        <ResourceSection
          player={player}
          isCurrentUser={isCurrentUser}
          isOpponent={isOpponent}
          onCraftClick={() => setShowCraftModal(true)}
          onCircuitClick={() => setShowCircuitModal(true)}
          onDeckClick={() => setShowDeckModal(true)}
          onDiscardClick={() => setShowDiscardModal(true)}
        />
        <View className="flex-1 flex-col">

          <FieldSection
            player={player}
            isOpponent={isOpponent}
            phase={phase}
            setViewingCard={setViewingCard}
            isMarketOpen={isMarketOpen}
          />
          <HandSection
            player={player}
            isOpponent={isOpponent}
            onPlayCard={onPlayCard}
          />
        </View>
      </View>


      {/* プレイヤー名表示 */}
      <View className={`absolute right-4 ${isOpponent ? 'top-2' : 'bottom-2'} z-0`} pointerEvents="none">
        <Text className="text-4xl font-bold text-white/5">
          {isOpponent ? 'OPPONENT' : 'PLAYER'}
        </Text>
      </View>

      {/* --- Modals --- */}
      {selectedRegalia && (
        <RegaliaModal
          regalia={selectedRegalia}
          player={player}
          isCurrentUser={isCurrentUser}
          onClose={() => setSelectedRegalia(null)}
          onSelfHarm={handleConfirmSelfHarm}
          onActivateBloodRecall={onActivateBloodRecall}
        />
      )}

      {showCraftModal && (
        <CraftModal
          player={player}
          onClose={() => setShowCraftModal(false)}
          onCraft={onCraft}
        />
      )}

      {showDiscardModal && (
        <CardListModal
          title="捨て札"
          cards={player.discard}
          colorTheme="gray"
          onClose={() => setShowDiscardModal(false)}
        />
      )}

      {showCircuitModal && (
        <CardListModal
          title="血廻 (Blood Circuit)"
          cards={player.bloodCircuit}
          colorTheme="purple"
          onClose={() => setShowCircuitModal(false)}
        />
      )}

      {showDeckModal && !isOpponent && (
        <DeckListModal
          title="山札 (残り)"
          cards={player.deck}
          onClose={() => setShowDeckModal(false)}
        />
      )}

      {viewingCard && (
        <CardDetailModal
          card={viewingCard}
          onClose={() => setViewingCard(null)}
        />
      )}
    </View>
  );
};
