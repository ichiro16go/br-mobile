import { ref, set, get, onValue, off, update, remove } from 'firebase/database';
import { db } from './firebase';
import { GameState } from '../types';

export interface PlayerSetup {
  regaliaId: string;
  bloodRecallId: string;
}

export interface RoomData {
  createdAt: number;
  marketSetIndices: number[];
  guestJoined: boolean;
  setup: {
    p1: PlayerSetup | null;
    p2: PlayerSetup | null;
  };
  gameState: GameState | null;
}

/**
 * ルームを作成する (ホスト用)
 */
export const createRoom = async (
  roomId: string,
  marketSetIndices: number[]
): Promise<void> => {
  const roomRef = ref(db, `rooms/${roomId}`);
  const snap = await get(roomRef);
  if (snap.exists()) {
    throw new Error('そのパスコードは既に使われています');
  }
  const roomData: Omit<RoomData, 'gameState'> & { gameState: null } = {
    createdAt: Date.now(),
    marketSetIndices,
    guestJoined: false,
    setup: { p1: null, p2: null },
    gameState: null,
  };
  await set(roomRef, roomData);
};

/**
 * ルームに参加する (ゲスト用)
 * @returns 参加成功時に marketSetIndices を返す
 */
export const joinRoom = async (roomId: string): Promise<number[]> => {
  const roomRef = ref(db, `rooms/${roomId}`);
  const snap = await get(roomRef);
  if (!snap.exists()) {
    throw new Error('ルームが見つかりません');
  }
  const data = snap.val() as RoomData;
  if (data.guestJoined) {
    throw new Error('ルームは既に満員です');
  }
  await update(roomRef, { guestJoined: true });
  return data.marketSetIndices;
};

/**
 * ゲストが参加するのを待つ (ホスト用)
 * @returns 購読解除関数
 */
export const listenForGuest = (
  roomId: string,
  onGuest: () => void
): (() => void) => {
  const guestRef = ref(db, `rooms/${roomId}/guestJoined`);
  onValue(guestRef, (snap) => {
    if (snap.val() === true) {
      onGuest();
    }
  });
  return () => off(guestRef);
};

/**
 * 自分の Regalia/BloodRecall 選択を Firebase にアップロード
 */
export const submitSetup = async (
  roomId: string,
  slot: 'p1' | 'p2',
  regaliaId: string,
  bloodRecallId: string
): Promise<void> => {
  await update(ref(db, `rooms/${roomId}/setup`), {
    [slot]: { regaliaId, bloodRecallId },
  });
};

/**
 * 両プレイヤーの選択が揃うのを待つ (ホスト用)
 * @returns 購読解除関数
 */
export const listenForBothSetups = (
  roomId: string,
  onBothReady: (p1Setup: PlayerSetup, p2Setup: PlayerSetup) => void
): (() => void) => {
  const setupRef = ref(db, `rooms/${roomId}/setup`);
  onValue(setupRef, (snap) => {
    const data = snap.val() as { p1: PlayerSetup | null; p2: PlayerSetup | null } | null;
    if (data?.p1 && data?.p2) {
      onBothReady(data.p1, data.p2);
    }
  });
  return () => off(setupRef);
};

/**
 * ゲーム開始後の GameState を Firebase に書き込む
 */
export const writeGameState = async (
  roomId: string,
  state: GameState
): Promise<void> => {
  await set(ref(db, `rooms/${roomId}/gameState`), state);
};

/**
 * Firebase の GameState を購読する
 * @returns 購読解除関数
 */
export const subscribeToGameState = (
  roomId: string,
  onState: (state: GameState) => void
): (() => void) => {
  const stateRef = ref(db, `rooms/${roomId}/gameState`);
  onValue(stateRef, (snap) => {
    const data = snap.val() as GameState | null;
    if (data) {
      onState(data);
    }
  });
  return () => off(stateRef);
};

/**
 * ルームを削除する (ゲーム終了時のクリーンアップ)
 */
export const deleteRoom = async (roomId: string): Promise<void> => {
  await remove(ref(db, `rooms/${roomId}`));
};
