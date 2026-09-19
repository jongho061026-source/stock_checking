import { MarketItem } from '../types';
import { INITIAL_MARKET_ITEMS } from '../data/initialData';

const STORAGE_KEY = 'dorm_market_inventory_v1';
const LAST_UPDATED_KEY = 'dorm_market_last_updated_v1';
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MARKET_ITEMS));
      localStorage.setItem(LAST_UPDATED_KEY, new Date().toISOString());
      return INITIAL_MARKET_ITEMS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_MARKET_ITEMS;
  } catch (err) {
    console.error('Failed to load stored inventory:', err);
    return INITIAL_MARKET_ITEMS;
  }
}

export function saveStoredItems(items: MarketItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    localStorage.setItem(LAST_UPDATED_KEY, new Date().toISOString());
    // Dispatch a custom event so other components or tabs update immediately
    window.dispatchEvent(new Event('dorm_market_storage_changed'));
  } catch (err) {
    console.error('Failed to save inventory:', err);
  }
}

export function resetToInitialItems(): MarketItem[] {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MARKET_ITEMS));
    localStorage.setItem(LAST_UPDATED_KEY, new Date().toISOString());
    window.dispatchEvent(new Event('dorm_market_storage_changed'));
    return INITIAL_MARKET_ITEMS;
  } catch (err) {
    console.error('Failed to reset inventory:', err);
    return INITIAL_MARKET_ITEMS;
  }
}

export function getLastUpdatedDate(): Date {
  try {
    const raw = localStorage.getItem(LAST_UPDATED_KEY);
    return raw ? new Date(raw) : new Date();
  } catch {
    return new Date();
  }
}
