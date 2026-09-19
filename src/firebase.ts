import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDocFromServer,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  orderBy
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { MarketItem } from './types';

// 1. Initialize Firebase App and export services
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth();

// 2. Error handling conforming to Firebase skill specs
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// 3. Test Connection to Firestore
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase Firestore connection verified.');
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration: client is offline.');
    } else {
      console.warn('Firestore connection check notice:', error);
    }
  }
}
testConnection();

const ITEMS_COLLECTION = 'items';

// 4. Real-time subscription to items
export function subscribeToItems(
  onUpdate: (items: MarketItem[]) => void,
  onError?: (err: Error) => void
): () => void {
  const itemsRef = collection(db, ITEMS_COLLECTION);
  const q = query(itemsRef, orderBy('updatedAt', 'desc'));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const items: MarketItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          name: data.name || '',
          category: data.category || 'living',
          price: Number(data.price) || 0,
          originalPrice: data.originalPrice ? Number(data.originalPrice) : undefined,
          stock: typeof data.stock === 'number' ? data.stock : 0,
          imageUrl: data.imageUrl || '',
          condition: data.condition || '상',
          usedPeriod: data.usedPeriod || '미기재',
          size: data.size || '미기재',
          components: data.components || '본체',
          description: data.description || '',
          locationTag: data.locationTag || '부스 진열대',
          updatedAt: data.updatedAt || new Date().toISOString().replace('T', ' ').slice(0, 16),
        });
      });
      onUpdate(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, ITEMS_COLLECTION);
      } catch (err) {
        if (onError && err instanceof Error) {
          onError(err);
        }
      }
    }
  );

  return unsubscribe;
}

// 5. Seed initial items if collection is empty
export async function seedInitialItemsIfEmpty(initialItems: MarketItem[]): Promise<boolean> {
  const itemsRef = collection(db, ITEMS_COLLECTION);
  try {
    const snapshot = await getDocs(itemsRef);
    if (snapshot.empty) {
      console.log('Firestore items collection is empty. Seeding initial flea market items...');
      const batch = writeBatch(db);
      for (const item of initialItems) {
        const docRef = doc(db, ITEMS_COLLECTION, item.id);
        batch.set(docRef, {
          id: item.id,
          name: item.name,
          category: item.category,
          price: item.price,
          originalPrice: item.originalPrice || null,
          stock: item.stock,
          imageUrl: item.imageUrl,
          condition: item.condition,
          usedPeriod: item.usedPeriod,
          size: item.size,
          components: item.components,
          description: item.description,
          locationTag: item.locationTag,
          createdAt: new Date().toISOString(),
          updatedAt: item.updatedAt || new Date().toISOString().replace('T', ' ').slice(0, 16),
        });
      }
      await batch.commit();
      console.log('Successfully seeded initial items to Firestore.');
      return true;
    }
    return false;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, ITEMS_COLLECTION);
    return false;
  }
}

// 6. Create a new market item
export async function addMarketItem(newItem: Omit<MarketItem, 'id'> & { id?: string }): Promise<string> {
  const itemId = newItem.id && newItem.id.trim()
    ? newItem.id.trim().replace(/[^a-zA-Z0-9_-]/g, '_')
    : `item-${Date.now()}`;

  const docRef = doc(db, ITEMS_COLLECTION, itemId);
  const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

  const payload: Record<string, unknown> = {
    id: itemId,
    name: newItem.name.trim().slice(0, 100),
    category: newItem.category,
    price: Math.max(0, Math.min(10000000, Number(newItem.price) || 0)),
    stock: Math.max(0, Math.min(1000, Number(newItem.stock) || 0)),
    imageUrl: (newItem.imageUrl || '').slice(0, 1000),
    condition: (newItem.condition || '상').slice(0, 200),
    usedPeriod: (newItem.usedPeriod || '미기재').slice(0, 100),
    size: (newItem.size || '미기재').slice(0, 100),
    components: (newItem.components || '본체').slice(0, 200),
    description: (newItem.description || '').slice(0, 1000),
    locationTag: (newItem.locationTag || '현장 수령 구역').slice(0, 100),
    createdAt: new Date().toISOString().slice(0, 50),
    updatedAt: nowStr.slice(0, 50),
  };

  if (newItem.originalPrice && newItem.originalPrice > 0) {
    payload.originalPrice = Math.min(10000000, Number(newItem.originalPrice));
  }

  try {
    await setDoc(docRef, payload);
    return itemId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${ITEMS_COLLECTION}/${itemId}`);
    return itemId;
  }
}

// 7. Update an existing market item
export async function updateMarketItem(
  id: string,
  updates: Partial<MarketItem>
): Promise<void> {
  const docRef = doc(db, ITEMS_COLLECTION, id);
  const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

  const payload: Record<string, unknown> = {
    updatedAt: nowStr.slice(0, 50),
  };

  if (updates.name !== undefined) payload.name = updates.name.trim().slice(0, 100);
  if (updates.category !== undefined) payload.category = updates.category;
  if (updates.price !== undefined) payload.price = Math.max(0, Math.min(10000000, Number(updates.price)));
  if (updates.originalPrice !== undefined) payload.originalPrice = Math.min(10000000, Number(updates.originalPrice));
  if (updates.stock !== undefined) payload.stock = Math.max(0, Math.min(1000, Number(updates.stock)));
  if (updates.imageUrl !== undefined) payload.imageUrl = updates.imageUrl.slice(0, 1000);
  if (updates.condition !== undefined) payload.condition = updates.condition.slice(0, 200);
  if (updates.usedPeriod !== undefined) payload.usedPeriod = updates.usedPeriod.slice(0, 100);
  if (updates.size !== undefined) payload.size = updates.size.slice(0, 100);
  if (updates.components !== undefined) payload.components = updates.components.slice(0, 200);
  if (updates.description !== undefined) payload.description = updates.description.slice(0, 1000);
  if (updates.locationTag !== undefined) payload.locationTag = updates.locationTag.slice(0, 100);

  try {
    await updateDoc(docRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${ITEMS_COLLECTION}/${id}`);
  }
}

// 8. Batch save multiple items stock & data
export async function batchSaveItems(items: MarketItem[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

    for (const item of items) {
      const docRef = doc(db, ITEMS_COLLECTION, item.id);
      const payload: Record<string, unknown> = {
        name: item.name.slice(0, 100),
        category: item.category,
        price: Math.max(0, Math.min(10000000, Number(item.price))),
        stock: Math.max(0, Math.min(1000, Number(item.stock))),
        imageUrl: item.imageUrl.slice(0, 1000),
        condition: item.condition.slice(0, 200),
        usedPeriod: (item.usedPeriod || '미기재').slice(0, 100),
        size: (item.size || '미기재').slice(0, 100),
        components: (item.components || '본체').slice(0, 200),
        description: (item.description || '').slice(0, 1000),
        locationTag: (item.locationTag || '현장 수령 구역').slice(0, 100),
        updatedAt: nowStr.slice(0, 50),
      };
      if (item.originalPrice && item.originalPrice > 0) {
        payload.originalPrice = Math.min(10000000, Number(item.originalPrice));
      }
      batch.set(docRef, payload, { merge: true });
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, ITEMS_COLLECTION);
  }
}

// 9. Delete a market item
export async function deleteMarketItem(id: string): Promise<void> {
  const docRef = doc(db, ITEMS_COLLECTION, id);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${ITEMS_COLLECTION}/${id}`);
  }
}

// 10. Reset to default initial items in Firestore
export async function resetFirestoreToDefault(defaultItems: MarketItem[]): Promise<void> {
  try {
    const snapshot = await getDocs(collection(db, ITEMS_COLLECTION));
    const batch = writeBatch(db);
    snapshot.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    for (const item of defaultItems) {
      const docRef = doc(db, ITEMS_COLLECTION, item.id);
      batch.set(docRef, {
        id: item.id,
        name: item.name,
        category: item.category,
        price: item.price,
        originalPrice: item.originalPrice || null,
        stock: item.stock,
        imageUrl: item.imageUrl,
        condition: item.condition,
        usedPeriod: item.usedPeriod,
        size: item.size,
        components: item.components,
        description: item.description,
        locationTag: item.locationTag,
        createdAt: new Date().toISOString().slice(0, 50),
        updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      });
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, ITEMS_COLLECTION);
  }
}
