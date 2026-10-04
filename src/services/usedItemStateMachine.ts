import {
  doc,
  collection,
  runTransaction,
  serverTimestamp,
  getDoc,
  Timestamp,
} from 'firebase/firestore';
import { db, auth } from '../firebase';

export type ItemStatus = 'SELLING' | 'RESERVED' | 'SOLD';

export interface ItemDocument {
  id: string;
  status: ItemStatus;
  sellerId: string;
  buyerId?: string | null;
  reservedAt?: Timestamp | null;
  soldAt?: Timestamp | null;
  createdAt: Timestamp;
  [key: string]: any;
}

export interface ItemLogDocument {
  id?: string;
  itemId: string;
  fromStatus: ItemStatus;
  toStatus: ItemStatus;
  actorId: string;
  timestamp: any;
}

const TIMEOUT_24_HOURS_MS = 24 * 60 * 60 * 1000;

/**
 * 1. SELLING → RESERVED
 * 구매자가 예약을 요청하고 buyerId와 reservedAt을 기록합니다.
 */
export async function reserveItem(itemId: string, buyerId?: string): Promise<void> {
  const currentUserId = buyerId || auth.currentUser?.uid;
  if (!currentUserId) {
    throw new Error('구매자 인증 정보(buyerId)가 필요합니다.');
  }

  const itemRef = doc(db, 'items', itemId);
  const logRef = doc(collection(db, 'itemLogs'));

  await runTransaction(db, async (transaction) => {
    const itemSnap = await transaction.get(itemRef);
    if (!itemSnap.exists()) {
      throw new Error(`상품(ID: ${itemId})이 존재하지 않습니다.`);
    }

    const itemData = itemSnap.data() as ItemDocument;

    // SOLD는 최종 상태이므로 변경 불가
    if (itemData.status === 'SOLD') {
      throw new Error('이미 판매 완료(SOLD)된 상품은 상태를 변경할 수 없습니다.');
    }

    // 판매자 본인 예약 방지
    if (itemData.sellerId === currentUserId) {
      throw new Error('판매자는 본인의 상품을 예약할 수 없습니다.');
    }

    // 현재 상태 검증
    if (itemData.status !== 'SELLING') {
      throw new Error(`현재 상태(${itemData.status})에서는 예약(RESERVED)으로 전환할 수 없습니다.`);
    }

    // items 문서 업데이트
    transaction.update(itemRef, {
      status: 'RESERVED',
      buyerId: currentUserId,
      reservedAt: serverTimestamp(),
    });

    // itemLogs 기록
    transaction.set(logRef, {
      itemId,
      fromStatus: 'SELLING',
      toStatus: 'RESERVED',
      actorId: currentUserId,
      timestamp: serverTimestamp(),
    });
  });
}

/**
 * 2. RESERVED → SOLD
 * 판매자만 최종 판매 확정 가능하며, soldAt을 기록합니다.
 */
export async function confirmSold(itemId: string, sellerId?: string): Promise<void> {
  const currentUserId = sellerId || auth.currentUser?.uid;
  if (!currentUserId) {
    throw new Error('판매자 인증 정보(sellerId)가 필요합니다.');
  }

  const itemRef = doc(db, 'items', itemId);
  const logRef = doc(collection(db, 'itemLogs'));

  await runTransaction(db, async (transaction) => {
    const itemSnap = await transaction.get(itemRef);
    if (!itemSnap.exists()) {
      throw new Error(`상품(ID: ${itemId})이 존재하지 않습니다.`);
    }

    const itemData = itemSnap.data() as ItemDocument;

    if (itemData.status === 'SOLD') {
      throw new Error('이미 판매 완료(SOLD)된 상품입니다.');
    }

    // 판매자 권한 검증
    if (itemData.sellerId !== currentUserId) {
      throw new Error('판매자만 판매를 확정할 수 있습니다.');
    }

    // 예약 상태 확인
    if (itemData.status !== 'RESERVED') {
      throw new Error(`예약 중(RESERVED)인 상품만 판매 완료(SOLD) 처리할 수 있습니다. (현재: ${itemData.status})`);
    }

    // items 문서 업데이트
    transaction.update(itemRef, {
      status: 'SOLD',
      soldAt: serverTimestamp(),
    });

    // itemLogs 기록
    transaction.set(logRef, {
      itemId,
      fromStatus: 'RESERVED',
      toStatus: 'SOLD',
      actorId: currentUserId,
      timestamp: serverTimestamp(),
    });
  });
}

/**
 * 3. RESERVED → SELLING (취소)
 * 예약된 상품에 대해 구매자 또는 판매자가 예약을 취소합니다.
 */
export async function cancelReservation(itemId: string, actorId?: string): Promise<void> {
  const currentUserId = actorId || auth.currentUser?.uid;
  if (!currentUserId) {
    throw new Error('취소 요청자의 인증 정보(actorId)가 필요합니다.');
  }

  const itemRef = doc(db, 'items', itemId);
  const logRef = doc(collection(db, 'itemLogs'));

  await runTransaction(db, async (transaction) => {
    const itemSnap = await transaction.get(itemRef);
    if (!itemSnap.exists()) {
      throw new Error(`상품(ID: ${itemId})이 존재하지 않습니다.`);
    }

    const itemData = itemSnap.data() as ItemDocument;

    if (itemData.status === 'SOLD') {
      throw new Error('이미 판매 완료(SOLD)된 상품은 취소할 수 없습니다.');
    }

    if (itemData.status !== 'RESERVED') {
      throw new Error(`예약(RESERVED) 상태에서만 예약을 취소할 수 있습니다. (현재: ${itemData.status})`);
    }

    // 구매자 또는 판매자만 취소 가능
    const isSeller = itemData.sellerId === currentUserId;
    const isBuyer = itemData.buyerId === currentUserId;
    if (!isSeller && !isBuyer) {
      throw new Error('예약 취소 권한이 없습니다. (구매자 또는 판매자만 가능)');
    }

    // items 문서 원복 (buyerId, reservedAt 초기화)
    transaction.update(itemRef, {
      status: 'SELLING',
      buyerId: null,
      reservedAt: null,
    });

    // itemLogs 기록
    transaction.set(logRef, {
      itemId,
      fromStatus: 'RESERVED',
      toStatus: 'SELLING',
      actorId: currentUserId,
      timestamp: serverTimestamp(),
    });
  });
}

/**
 * 4. RESERVED → SELLING (Lazy Timeout)
 * 상품 조회 시점에 reservedAt 기준 24시간이 경과했으면 트랜잭션으로 자동 복구합니다.
 * 상품 데이터를 반환하며, 24시간 경과 시 SELLING으로 상태를 자동 전환한 후 반환합니다.
 */
export async function getItemWithLazyTimeout(
  itemId: string,
  actorId?: string
): Promise<ItemDocument | null> {
  const itemRef = doc(db, 'items', itemId);
  const snap = await getDoc(itemRef);

  if (!snap.exists()) {
    return null;
  }

  const itemData = snap.data() as ItemDocument;

  // RESERVED 상태이고 reservedAt이 설정되어 있는지 확인
  if (itemData.status === 'RESERVED' && itemData.reservedAt) {
    const reservedTimeMs = itemData.reservedAt.toMillis();
    const nowMs = Date.now();

    // 24시간 경과 여부 확인
    if (nowMs - reservedTimeMs >= TIMEOUT_24_HOURS_MS) {
      const currentActorId = actorId || auth.currentUser?.uid || 'TIMEOUT';
      const logRef = doc(collection(db, 'itemLogs'));

      try {
        await runTransaction(db, async (transaction) => {
          const freshSnap = await transaction.get(itemRef);
          if (!freshSnap.exists()) return;

          const freshData = freshSnap.data() as ItemDocument;

          // 동시성 검증: 여전히 RESERVED이고 24시간 지난 상태인지 재확인
          if (
            freshData.status === 'RESERVED' &&
            freshData.reservedAt &&
            Date.now() - freshData.reservedAt.toMillis() >= TIMEOUT_24_HOURS_MS
          ) {
            transaction.update(itemRef, {
              status: 'SELLING',
              buyerId: null,
              reservedAt: null,
            });

            transaction.set(logRef, {
              itemId,
              fromStatus: 'RESERVED',
              toStatus: 'SELLING',
              actorId: currentActorId,
              timestamp: serverTimestamp(),
            });
          }
        });

        // 상태가 되돌려진 최신 객체 반환
        return {
          ...itemData,
          status: 'SELLING',
          buyerId: null,
          reservedAt: null,
        };
      } catch (err) {
        console.warn('Lazy Timeout transaction failed (possibly concurrent resolution):', err);
        // 동시성 충돌로 실패한 경우 최신 문서 재조회
        const latestSnap = await getDoc(itemRef);
        return latestSnap.exists() ? (latestSnap.data() as ItemDocument) : null;
      }
    }
  }

  return { ...itemData, id: snap.id };
}
