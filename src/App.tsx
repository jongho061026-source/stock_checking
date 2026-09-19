import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MarketItem, ItemCategory } from './types';
import { getStoredItems, saveStoredItems, clearStoredItems, getLastUpdatedDate } from './utils/storage';
import {
  subscribeToItems,
  batchSaveItems,
  deleteMarketItem,
  clearAllItemsFromFirestore,
} from './firebase';
import { Header } from './components/Header';
import { CategoryFilter } from './components/CategoryFilter';
import { ItemCard } from './components/ItemCard';
import { ItemDetailModal } from './components/ItemDetailModal';
import { AdminInventoryView } from './components/AdminInventoryView';
import { AdminAuthModal } from './components/AdminAuthModal';
import { FooterInfo } from './components/FooterInfo';
import { Sparkles, RefreshCw, CheckCircle2, Database, PackageSearch, ShieldCheck } from 'lucide-react';

export default function App() {
  const [items, setItems] = useState<MarketItem[]>(() => getStoredItems());
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory>('all');
  const [selectedItem, setSelectedItem] = useState<MarketItem | null>(null);
  const [isAdminView, setIsAdminView] = useState<boolean>(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('dorm_market_admin_auth') === 'true';
    } catch {
      return false;
    }
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [refreshNotification, setRefreshNotification] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(() => getLastUpdatedDate());

  // Attach real-time subscription directly to Firestore backend
  useEffect(() => {
    let isMounted = true;

    // Real-time listener: strictly follows Firestore items (source of truth)
    const unsubscribe = subscribeToItems(
      (cloudItems) => {
        if (!isMounted) return;
        const validItems = cloudItems || [];
        setItems(validItems);
        saveStoredItems(validItems);
        setLastUpdated(new Date());
        setIsFirebaseConnected(true);
      },
      (err) => {
        console.warn('Firestore subscription fallback:', err);
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Update selectedItem if it was updated in items list while modal is open
  useEffect(() => {
    if (selectedItem) {
      const fresh = items.find((i) => i.id === selectedItem.id);
      if (fresh) {
        setSelectedItem(fresh);
      }
    }
  }, [items, selectedItem?.id]);

  // Real-time refresh handler (실시간 새로고침 기능)
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    // Simulating instant network check with smooth tactile feedback
    setTimeout(() => {
      const freshItems = getStoredItems();
      setItems(freshItems);
      const now = new Date();
      setLastUpdated(now);
      setIsRefreshing(false);
      setRefreshNotification('최신 재고 정보를 실시간으로 갱신했습니다.');
      setTimeout(() => {
        setRefreshNotification(null);
      }, 2500);
    }, 450);
  }, []);

  // Category filtering
  const filteredItems = useMemo(() => {
    if (selectedCategory === 'all') {
      return items;
    }
    return items.filter((item) => item.category === selectedCategory);
  }, [items, selectedCategory]);

  // Statistics calculation for counts and notice badges
  const { categoryCounts, totalAvailable, totalSoldOut } = useMemo(() => {
    const counts: Record<string, { total: number; available: number }> = {
      all: { total: items.length, available: items.filter((i) => i.stock > 0).length },
    };

    const allCategoryKeys: ItemCategory[] = [
      'books',
      'bathroom',
      'living',
      'kitchen',
      'stationery',
      'food',
      'etc',
      'appliances',
      'furniture',
    ];

    allCategoryKeys.forEach((catKey) => {
      counts[catKey] = {
        total: items.filter((i) => i.category === catKey).length,
        available: items.filter((i) => i.category === catKey && i.stock > 0).length,
      };
    });

    const availableCount = items.filter((i) => i.stock > 0).length;
    const soldOutCount = items.length - availableCount;

    return {
      categoryCounts: counts,
      totalAvailable: availableCount,
      totalSoldOut: soldOutCount,
    };
  }, [items]);

  // Admin save handler - writes to Firebase Firestore and local storage
  const handleSaveAdminItems = async (updatedItems: MarketItem[]): Promise<boolean> => {
    try {
      await batchSaveItems(updatedItems);
      saveStoredItems(updatedItems);
      setItems(updatedItems);
      setLastUpdated(new Date());
      return true;
    } catch (err) {
      console.error('Failed to save to Firebase:', err);
      saveStoredItems(updatedItems);
      setItems(updatedItems);
      return false;
    }
  };

  // Admin reset handler - clears all items in Firestore backend
  const handleResetAdminItems = async () => {
    try {
      await clearAllItemsFromFirestore();
      clearStoredItems();
      setItems([]);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to clear Firestore:', err);
    }
  };

  // Admin delete item handler - deletes from Firestore
  const handleDeleteAdminItem = async (id: string) => {
    try {
      await deleteMarketItem(id);
      const filtered = items.filter((i) => i.id !== id);
      setItems(filtered);
      saveStoredItems(filtered);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  // Admin view toggle with authentication check
  const handleToggleAdminView = () => {
    if (isAdminView) {
      // Currently in admin view -> return to public student view
      setIsAdminView(false);
    } else {
      // Trying to enter admin view -> check if already verified in this session
      if (isAdminAuthenticated) {
        setIsAdminView(true);
      } else {
        setIsAuthModalOpen(true);
      }
    }
  };

  // Admin auth success handler
  const handleAuthSuccess = () => {
    setIsAdminAuthenticated(true);
    try {
      sessionStorage.setItem('dorm_market_admin_auth', 'true');
    } catch (e) {
      console.error(e);
    }
    setIsAuthModalOpen(false);
    setIsAdminView(true);
    setRefreshNotification('운영자 인증 성공: 실시간 재고 관리 모드로 전환되었습니다.');
    setTimeout(() => setRefreshNotification(null), 3000);
  };

  // Admin logout handler
  const handleLogoutAdmin = () => {
    setIsAdminAuthenticated(false);
    try {
      sessionStorage.removeItem('dorm_market_admin_auth');
    } catch (e) {
      console.error(e);
    }
    setIsAdminView(false);
    setRefreshNotification('운영자 권한이 안전하게 로그아웃되었습니다.');
    setTimeout(() => setRefreshNotification(null), 2500);
  };

  // Time format
  const formattedLastUpdated = useMemo(() => {
    const hours = String(lastUpdated.getHours()).padStart(2, '0');
    const minutes = String(lastUpdated.getMinutes()).padStart(2, '0');
    const seconds = String(lastUpdated.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }, [lastUpdated]);

  return (
    <div className="min-h-screen bg-[#F4F8F3] text-[#1E2B1D] flex flex-col selection:bg-[#3E9628] selection:text-white">
      {/* 화면 상단 헤더 */}
      <Header
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        lastUpdatedTime={formattedLastUpdated}
        isAdminView={isAdminView}
        isAdminAuthenticated={isAdminAuthenticated}
        onToggleAdminView={handleToggleAdminView}
        onLogoutAdmin={handleLogoutAdmin}
      />

      {/* 실시간 갱신 알림 팝업 */}
      {refreshNotification && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 bg-[#1E2B1D] text-white text-xs sm:text-sm font-medium px-4 py-2 rounded-full shadow-xl flex items-center gap-2 border border-[#3E9628]/40 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-[#48A834]" />
          <span>{refreshNotification}</span>
        </div>
      )}

      {/* 메인 컨텐츠 영역 */}
      <main className="flex-1">
        {isAdminView ? (
          /* 화면 3: 운영자 전용 재고 관리 화면 */
          <AdminInventoryView
            items={items}
            onSaveItems={handleSaveAdminItems}
            onResetItems={handleResetAdminItems}
            onDeleteItem={handleDeleteAdminItem}
            onBackToUserView={() => setIsAdminView(false)}
            onLogoutAdmin={handleLogoutAdmin}
          />
        ) : (
          /* 화면 1: 메인 재고 목록 화면 */
          <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6">
            {/* 상단 실시간 재고 요약 상태 바 (순수 재고 조회 전용) */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5 bg-white border border-[#3E9628]/20 rounded-2xl px-4 py-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3E9628] animate-pulse" />
                <span className="font-bold text-sm text-[#1E2B1D]">실시간 잔여 재고 현황</span>
                {isFirebaseConnected ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#2D801E] bg-[#EAF5E7] px-2 py-0.5 rounded-md border border-[#3E9628]/20">
                    <RefreshCw className="w-3 h-3 text-[#3E9628]" />
                    <span>실시간 연동</span>
                  </span>
                ) : (
                  <span className="text-xs text-[#556853] hidden sm:inline">• 100% 현장 즉시 반영</span>
                )}
              </div>
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <span className="px-2.5 py-1 rounded-lg bg-[#EAF5E7] text-[#2D801E] border border-[#3E9628]/25">
                    판매중 {totalAvailable}종
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-stone-100 text-stone-600 border border-stone-200">
                    품절 {totalSoldOut}종
                  </span>
                </div>
                {isAdminAuthenticated && (
                  <button
                    type="button"
                    id="admin-quick-inventory-btn"
                    onClick={() => setIsAdminView(true)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#3E9628] hover:bg-[#3E9628]/90 text-white shadow-xs transition-transform active:scale-95 cursor-pointer"
                    title="관리자 재고 관리 모드로 이동"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>재고·상품 관리</span>
                  </button>
                )}
              </div>
            </div>

            {/* 카테고리 선택 영역 */}
            <div className="flex items-center justify-between gap-3 mb-2">
              <h2 className="text-sm font-bold text-[#1E2B1D] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#3E9628]" />
                <span>품목 카테고리</span>
              </h2>
              <span className="text-xs text-[#556853]">
                총 <strong className="text-[#1E2B1D]">{filteredItems.length}</strong>개 품목 표시 중
              </span>
            </div>
            <CategoryFilter
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              categoryCounts={categoryCounts}
            />

            {/* 물품 목록 영역 (그리드) */}
            <section id="market-items-grid" aria-label="기숙사 중고 물품 목록">
              {items.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 sm:p-12 text-center border border-[#3E9628]/20 shadow-xs my-2">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-[#EAF5E7] flex items-center justify-center text-[#3E9628]">
                    <PackageSearch className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-[#1E2B1D] mb-1">현재 등록된 물품이 없습니다</h3>
                  <p className="text-xs sm:text-sm text-[#556853] max-w-md mx-auto mb-4 leading-relaxed">
                    플리마켓에 등록된 물품이 없습니다.<br />
                    현장 관리자가 물품을 등록하면 실시간으로 잔여 수량과 상세 정보가 표시됩니다.
                  </p>
                  <button
                    type="button"
                    id="empty-state-admin-btn"
                    onClick={handleToggleAdminView}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#1E2B1D] bg-[#EAF5E7] hover:bg-[#3E9628]/20 border border-[#3E9628]/30 rounded-xl transition-transform active:scale-95 cursor-pointer shadow-xs"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-[#3E9628]" />
                    <span>{isAdminAuthenticated ? '관리자 모드에서 상품 등록하기' : '관리자 로그인 (상품 등록)'}</span>
                  </button>
                </div>
              ) : filteredItems.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-4">
                  {filteredItems.map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      onSelect={(clickedItem) => setSelectedItem(clickedItem)}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-12 text-center border border-[#3E9628]/15 text-[#556853] shadow-xs">
                  <p className="text-sm font-medium">선택하신 카테고리에 등록된 물품이 없습니다.</p>
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className="mt-3 px-4 py-1.5 text-xs font-semibold bg-[#1E2B1D] hover:bg-[#1E2B1D]/90 text-[#EAF5E7] rounded-lg transition-colors cursor-pointer shadow-xs"
                  >
                    전체 품목 보기
                  </button>
                </div>
              )}
            </section>

            {/* 화면 하단 영역: 이용 주의사항 & 현장 운영자 모드 */}
            <FooterInfo onOpenAdmin={handleToggleAdminView} />
          </div>
        )}
      </main>

      {/* 화면 2: 물품 상세 정보 모달 */}
      <ItemDetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />

      {/* 운영자 전용 인증 모달 */}
      <AdminAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
