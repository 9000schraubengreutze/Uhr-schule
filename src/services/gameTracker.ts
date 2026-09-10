import { collection, addDoc, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { GameStartRecord } from '../games/types';

const GUEST_ID_KEY = 'webclock_player_guest_id';
const PLAYER_NICK_KEY = 'webclock_player_nickname';
const LOCAL_HISTORY_KEY = 'webclock_game_starts_history';

/**
 * Returns a persistent anonymous guest ID for the client browser
 */
export function getGuestId(): string {
  if (typeof window === 'undefined') return 'guest_default';
  let id = localStorage.getItem(GUEST_ID_KEY);
  if (!id) {
    const randomHex = Math.random().toString(36).substring(2, 8);
    id = `guest_${randomHex}`;
    try {
      localStorage.setItem(GUEST_ID_KEY, id);
    } catch {
      // Ignore storage errors
    }
  }
  return id;
}

/**
 * Returns the customized player nickname, if any
 */
export function getPlayerNickname(): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(PLAYER_NICK_KEY) || '';
  } catch {
    return '';
  }
}

/**
 * Sets the player nickname for guests
 */
export function setPlayerNickname(name: string): void {
  if (typeof window === 'undefined') return;
  try {
    if (name.trim()) {
      localStorage.setItem(PLAYER_NICK_KEY, name.trim());
    } else {
      localStorage.removeItem(PLAYER_NICK_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

/**
 * Detects whether the client is on desktop, mobile, or tablet
 */
function detectDevice(): string {
  if (typeof window === 'undefined') return 'Desktop';
  const ua = navigator.userAgent;
  if (/iPad|Tablet|Android(?!.*Mobile)/i.test(ua)) {
    return 'Tablet';
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle/i.test(ua)) {
    return 'Mobil';
  }
  return 'Desktop';
}

/**
 * Retrieves local fallback game start history
 */
export function getLocalGameStarts(): GameStartRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Saves a game start record to local storage buffer
 */
function saveToLocalHistory(record: GameStartRecord) {
  if (typeof window === 'undefined') return;
  try {
    const list = getLocalGameStarts();
    const updated = [record, ...list.filter((r) => r.id !== record.id)].slice(0, 40);
    localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage errors
  }
}

export interface PlayerIdentityInput {
  uid?: string | null;
  email?: string | null;
  displayName?: string | null;
}

/**
 * Records every time a game is started by tracking the user / player details.
 */
export async function recordGameStart(
  gameId: string,
  gameTitle: string,
  user?: PlayerIdentityInput | null,
  customNickname?: string
): Promise<GameStartRecord> {
  const isGuest = !user?.uid;
  const guestId = getGuestId();
  const userId = user?.uid || guestId;

  const storedNick = customNickname?.trim() || getPlayerNickname();
  const userName =
    user?.displayName ||
    (user?.email ? user.email.split('@')[0] : null) ||
    storedNick ||
    `Gast (${guestId.slice(-4)})`;

  const startedAt = new Date().toISOString();
  const device = detectDevice();

  const record: GameStartRecord = {
    id: `local_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    gameId,
    gameTitle,
    userId,
    userName,
    userEmail: user?.email || null,
    isGuest,
    startedAt,
    device,
  };

  // Save to local buffer immediately
  saveToLocalHistory(record);

  // Dispatch browser event for immediate reactive feedback
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('webclock_game_started', {
        detail: record,
      })
    );
  }

  // Persist to Firestore
  try {
    const docRef = await addDoc(collection(db, 'gameEvents'), {
      gameId: record.gameId,
      gameTitle: record.gameTitle,
      userId: record.userId,
      userName: record.userName,
      userEmail: record.userEmail,
      isGuest: record.isGuest,
      startedAt: record.startedAt,
      device: record.device,
    });
    record.id = docRef.id;
  } catch (err) {
    console.warn('Could not record game start to Firestore, kept in local audit log:', err);
  }

  return record;
}

/**
 * Subscribes to live game start events from Firestore with fallback to local history
 */
export function subscribeRecentGameEvents(
  callback: (events: GameStartRecord[]) => void
): () => void {
  // Start with local history immediately
  const initialLocal = getLocalGameStarts();
  callback(initialLocal);

  try {
    const q = query(collection(db, 'gameEvents'), orderBy('startedAt', 'desc'), limit(25));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const events: GameStartRecord[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            gameId: data.gameId || 'game',
            gameTitle: data.gameTitle || 'Spiel',
            userId: data.userId || 'unknown',
            userName: data.userName || 'Gast',
            userEmail: data.userEmail || null,
            isGuest: Boolean(data.isGuest),
            startedAt: data.startedAt || new Date().toISOString(),
            device: data.device || 'Desktop',
          };
        });

        // Merge with local events if any are pending
        const localList = getLocalGameStarts();
        const firestoreIds = new Set(events.map((e) => e.id));
        const missingLocal = localList.filter((l) => !firestoreIds.has(l.id));
        const merged = [...missingLocal, ...events].slice(0, 30);

        callback(merged);
      },
      (error) => {
        console.warn('Firestore live gameEvents subscription error, using local logs:', error);
        callback(getLocalGameStarts());
      }
    );

    return unsubscribe;
  } catch (error) {
    console.warn('Failed to attach Firestore onSnapshot for game events:', error);
    callback(getLocalGameStarts());
    return () => {};
  }
}
