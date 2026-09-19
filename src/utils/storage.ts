import { MarketItem } from '../types';

const STORAGE_KEY = 'dorm_market_inventory_v2';
const LAST_UPDATED_KEY = 'dorm_market_last_updated_v2';
const ADMIN_PASSWORD_KEY = 'dorm_market_admin_password_v2';
const DEFAULT_ADMIN_PASSWORD = '260918';

export function getAdminPassword(): string {
  try {
    const saved = localStorage.getItem(ADMIN_PASSWORD_KEY);
    return saved || DEFAULT_ADMIN_PASSWORD;
  } catch {
    return DEFAULT_ADMIN_PASSWORD;
  }
}

export function saveAdminPassword(newPassword: string): boolean {
  try {
    if (!newPassword || newPassword.trim().length < 4) {
      return false;
    }
    localStorage.setItem(ADMIN_PASSWORD_KEY, newPassword.trim());
    return true;
  } catch (err) {
    console.error('Failed to save admin password:', err);
    return false;
  }
}

export function verifyAdminPassword(attempt: string): boolean {
  const current = getAdminPassword();
  return attempt.trim() === current;
}

export function getStoredItems(): MarketItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Filter out any legacy dummy mock items
      return parsed.filter(
        (item) =>
          item &&
          typeof item.id === 'string' &&
          !item.id.startsWith('item-0') &&
          !['item-10', 'item-11', 'item-12'].includes(item.id)
      );
    }
    return [];
  } catch (err) {
    console.error('Failed to load stored inventory:', err);
    return [];
  }
}

export function saveStoredItems(items: MarketItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    localStorage.setItem(LAST_UPDATED_KEY, new Date().toISOString());
    window.dispatchEvent(new Event('dorm_market_storage_changed'));
  } catch (err) {
    console.error('Failed to save inventory:', err);
  }
}

export function clearStoredItems(): MarketItem[] {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    localStorage.setItem(LAST_UPDATED_KEY, new Date().toISOString());
    window.dispatchEvent(new Event('dorm_market_storage_changed'));
    return [];
  } catch (err) {
    console.error('Failed to clear inventory:', err);
    return [];
  }
}

export function resetToInitialItems(): MarketItem[] {
  return clearStoredItems();
}

export function getLastUpdatedDate(): Date {
  try {
    const raw = localStorage.getItem(LAST_UPDATED_KEY);
    return raw ? new Date(raw) : new Date();
  } catch {
    return new Date();
  }
}
