import React, { useState, useEffect } from 'react';
import { MarketItem, CATEGORY_LABELS } from '../types';
import {
  Save,
  ArrowLeft,
  RotateCcw,
  Ban,
  Plus,
  Minus,
  Check,
  AlertCircle,
  KeyRound,
  LogOut,
  ShieldCheck,
  Eye,
  EyeOff,
  X,
  PlusCircle,
  Trash2,
  CloudCheck,
  Pencil,
  Loader2,
} from 'lucide-react';
import { verifyAdminPassword, saveAdminPassword } from '../utils/storage';
import { AddItemModal } from './AddItemModal';
import { EditItemModal } from './EditItemModal';
import { updateItemStock } from '../firebase';

interface AdminInventoryViewProps {
  items: MarketItem[];
  onSaveItems: (updatedItems: MarketItem[]) => Promise<boolean> | void;
  onResetItems: () => void;
  onDeleteItem?: (id: string) => void;
  onBackToUserView: () => void;
  onLogoutAdmin: () => void;
}

export const AdminInventoryView: React.FC<AdminInventoryViewProps> = ({
  items,
  onSaveItems,
  onResetItems,
  onDeleteItem,
  onBackToUserView,
  onLogoutAdmin,
}) => {
  // Local edit draft state
  const [draftItems, setDraftItems] = useState<MarketItem[]>(() =>
    JSON.parse(JSON.stringify(items))
  );

  // Sync draftItems when items update from Firebase
  useEffect(() => {
    setDraftItems(JSON.parse(JSON.stringify(items)));
  }, [items]);

  const [saveToast, setSaveToast] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>('재고 변경사항이 성공적으로 저장되었습니다.');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const [isSavingAll, setIsSavingAll] = useState(false);
  const [savingRowId, setSavingRowId] = useState<string | null>(null);
  const [savedRowId, setSavedRowId] = useState<string | null>(null);

  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [itemToEdit, setItemToEdit] = useState<MarketItem | null>(null);
  const [adminCategoryFilter, setAdminCategoryFilter] = useState<string>('all');
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);

  // Check if an item in draft has unsaved changes compared to items
  const isItemModified = (item: MarketItem) => {
    const original = items.find((i) => i.id === item.id);
    return original ? original.stock !== item.stock : false;
  };

  const modifiedCount = draftItems.filter(isItemModified).length;

  // Password change modal state
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [currentPwdInput, setCurrentPwdInput] = useState('');
  const [newPwdInput, setNewPwdInput] = useState('');
  const [newPwdConfirmInput, setNewPwdConfirmInput] = useState('');
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [pwdChangeError, setPwdChangeError] = useState<string | null>(null);
  const [pwdChangeSuccess, setPwdChangeSuccess] = useState<string | null>(null);

  const handleOpenPasswordModal = () => {
    setCurrentPwdInput('');
    setNewPwdInput('');
    setNewPwdConfirmInput('');
    setPwdChangeError(null);
    setPwdChangeSuccess(null);
    setIsChangePasswordOpen(true);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyAdminPassword(currentPwdInput)) {
      setPwdChangeError('현재 비밀번호가 일치하지 않습니다.');
      return;
    }
    if (newPwdInput.trim().length < 4) {
      setPwdChangeError('새 비밀번호는 최소 4글자 이상이어야 합니다.');
      return;
    }
    if (newPwdInput !== newPwdConfirmInput) {
      setPwdChangeError('새 비밀번호와 비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    const success = saveAdminPassword(newPwdInput);
    if (success) {
      setPwdChangeError(null);
      setPwdChangeSuccess('비밀번호가 성공적으로 변경되었습니다!');
      setTimeout(() => {
        setIsChangePasswordOpen(false);
        setPwdChangeSuccess(null);
      }, 1500);
    } else {
      setPwdChangeError('비밀번호 저장 중 오류가 발생했습니다.');
    }
  };

  const handleStockChange = (id: string, newStock: number) => {
    const validStock = Math.max(0, Math.floor(newStock));
    setDraftItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, stock: validStock } : item))
    );
  };

  const handleStepStock = (id: string, delta: number) => {
    setDraftItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextVal = Math.max(0, item.stock + delta);
          return { ...item, stock: nextVal };
        }
        return item;
      })
    );
  };

  // Row-level instant save
  const handleSaveSingleItem = async (item: MarketItem) => {
    try {
      setSavingRowId(item.id);
      await updateItemStock(item.id, item.stock);
      await onSaveItems(draftItems);
      setSavedRowId(item.id);
      setToastMessage(`'${item.name}' 재고(${item.stock}개)가 성공적으로 저장되었습니다!`);
      setToastType('success');
      setSaveToast(true);
      setTimeout(() => {
        setSavedRowId((prev) => (prev === item.id ? null : prev));
        setSaveToast(false);
      }, 2500);
    } catch (err) {
      console.error('Failed to save single item:', err);
      setToastMessage('저장 중 오류가 발생했습니다. 다시 시도해 주세요.');
      setToastType('error');
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 3000);
    } finally {
      setSavingRowId(null);
    }
  };

  // Instant sold out: updates local draft and immediately syncs to Firestore
  const handleMarkSoldOut = async (id: string) => {
    const targetItem = draftItems.find((i) => i.id === id);
    const itemName = targetItem?.name || '상품';

    const updated = draftItems.map((item) =>
      item.id === id ? { ...item, stock: 0 } : item
    );
    setDraftItems(updated);

    try {
      setSavingRowId(id);
      await updateItemStock(id, 0);
      await onSaveItems(updated);
      setSavedRowId(id);
      setToastMessage(`'${itemName}' 물품이 품절 처리 및 저장되었습니다.`);
      setToastType('success');
      setSaveToast(true);
      setTimeout(() => {
        setSaveToast(false);
        setSavedRowId(null);
      }, 2500);
    } catch (err) {
      console.error('Failed to mark sold out:', err);
      setToastMessage('품절 저장 중 오류가 발생했습니다.');
      setToastType('error');
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 3000);
    } finally {
      setSavingRowId(null);
    }
  };

  // Batch save all
  const handleSaveAll = async () => {
    try {
      setIsSavingAll(true);
      const res = await onSaveItems(draftItems);
      if (res === false) {
        setToastMessage('클라우드 데이터베이스 저장에 실패했습니다. 다시 시도해 주세요.');
        setToastType('error');
      } else {
        setToastMessage('모든 재고 변경사항이 데이터베이스에 안전하게 저장되었습니다!');
        setToastType('success');
      }
      setSaveToast(true);
      setTimeout(() => {
        setSaveToast(false);
      }, 3000);
    } catch (err) {
      console.error(err);
      setToastMessage('저장 중 예기치 못한 오류가 발생했습니다.');
      setToastType('error');
      setSaveToast(true);
      setTimeout(() => {
        setSaveToast(false);
      }, 3000);
    } finally {
      setIsSavingAll(false);
    }
  };

  const handleReset = () => {
    onResetItems();
    setResetConfirmOpen(false);
    setDraftItems([]);
  };

  const filteredItems = draftItems.filter((item) => {
    if (adminCategoryFilter === 'all') return true;
    if (adminCategoryFilter === 'soldout') return item.stock === 0;
    if (adminCategoryFilter === 'instock') return item.stock > 0;
    return item.category === adminCategoryFilter;
  });

  const totalItemsCount = draftItems.length;
  const soldOutCount = draftItems.filter((i) => i.stock === 0).length;
  const inStockCount = totalItemsCount - soldOutCount;

  return (
    <div id="admin-inventory-management-view" className="max-w-4xl mx-auto px-4 py-6 sm:px-6">
      {/* 관리자 헤더 바 */}
      <div className="bg-[#1E2B1D] text-white rounded-2xl p-5 mb-6 shadow-sm border border-[#3E9628]/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              id="admin-back-btn"
              onClick={onBackToUserView}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#74C962] transition-colors cursor-pointer"
              title="사용자 화면으로 돌아가기"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-[#3E9628] text-white">
                  현장 운영자 전용
                </span>
                <h1 className="text-lg sm:text-xl font-bold">실시간 재고 관리 페이지</h1>
              </div>
              <p className="text-xs text-[#EAF5E7]/75 mt-0.5">
                현장에서 물품이 소진되거나 수량이 바뀔 때 직접 변경 후 저장하세요.
              </p>
            </div>
          </div>

          {/* 저장 및 뒤로가기 / 로그아웃 / 비밀번호 변경 버튼 */}
          <div className="flex items-center flex-wrap gap-2 shrink-0">
            <button
              id="admin-change-pwd-btn"
              onClick={handleOpenPasswordModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-[#EAF5E7] transition-colors cursor-pointer border border-white/15"
              title="운영자 관리 비밀번호 변경"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#74C962]" />
              <span className="hidden sm:inline">비밀번호 변경</span>
            </button>

            <button
              id="admin-logout-btn"
              onClick={onLogoutAdmin}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-400/30 transition-colors cursor-pointer"
              title="운영자 권한 해제 후 사용자 화면으로 이동"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>로그아웃</span>
            </button>

            <button
              id="admin-save-top-btn"
              onClick={handleSaveAll}
              disabled={isSavingAll}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm bg-[#3E9628] hover:bg-[#3E9628]/90 text-white shadow-sm transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isSavingAll ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isSavingAll ? '저장 중...' : '재고 저장'}</span>
              {modifiedCount > 0 && !isSavingAll && (
                <span className="ml-1 px-1.5 py-0.5 bg-amber-400 text-black text-[10px] font-black rounded-full">
                  {modifiedCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* 요약 통계 */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/15 text-center">
          <div className="bg-white/10 rounded-xl p-2.5">
            <span className="text-[11px] text-[#EAF5E7]/70 block">전체 등록 물품</span>
            <span className="text-base font-bold text-white">{totalItemsCount}종</span>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5">
            <span className="text-[11px] text-[#EAF5E7]/70 block">판매 가능 (재고 있음)</span>
            <span className="text-base font-bold text-[#74C962]">{inStockCount}종</span>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5">
            <span className="text-[11px] text-[#EAF5E7]/70 block">품절 물품</span>
            <span className="text-base font-bold text-[#EAF5E7]/90">{soldOutCount}종</span>
          </div>
        </div>
      </div>

      {/* 저장 완료 알림 토스트 */}
      {saveToast && (
        <div
          id="admin-save-success-toast"
          className={`mb-4 p-3.5 rounded-xl border text-white flex items-center justify-between text-xs sm:text-sm shadow-md animate-in fade-in ${
            toastType === 'error'
              ? 'bg-rose-900/90 border-rose-500'
              : 'bg-[#1E2B1D] border-[#3E9628]/50'
          }`}
        >
          <div className="flex items-center gap-2 font-semibold">
            {toastType === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />
            ) : (
              <Check className="w-4 h-4 text-[#74C962] shrink-0" />
            )}
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => onBackToUserView()}
            className="text-xs text-[#74C962] underline font-bold hover:text-white cursor-pointer ml-2"
          >
            사용자 화면 확인
          </button>
        </div>
      )}

      {/* 컨트롤 툴바: 필터 탭 & 초기화 버튼 */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setAdminCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-colors ${
              adminCategoryFilter === 'all'
                ? 'bg-[#1E2B1D] text-white shadow-xs'
                : 'bg-white text-[#1E2B1D] border border-[#3E9628]/20 hover:bg-[#EAF5E7]'
            }`}
          >
            전체 보기 ({draftItems.length})
          </button>
          <button
            onClick={() => setAdminCategoryFilter('instock')}
            className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-colors ${
              adminCategoryFilter === 'instock'
                ? 'bg-[#2D801E] text-white shadow-xs'
                : 'bg-white text-[#2D801E] border border-[#2D801E]/30 hover:bg-[#EAF5E7]'
            }`}
          >
            재고 있음 ({inStockCount})
          </button>
          <button
            onClick={() => setAdminCategoryFilter('soldout')}
            className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-colors ${
              adminCategoryFilter === 'soldout'
                ? 'bg-[#1E2B1D] text-white border border-white/20 shadow-xs'
                : 'bg-white text-[#556853] border border-[#3E9628]/20 hover:bg-[#EAF5E7]'
            }`}
          >
            품절만 ({soldOutCount})
          </button>
        </div>

        {/* 필터 탭 및 액션 버튼들 */}
        <div className="flex items-center gap-2">
          <button
            id="admin-add-item-btn"
            onClick={() => setIsAddItemOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#3E9628] hover:bg-[#3E9628]/90 rounded-lg transition-transform active:scale-95 cursor-pointer shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>새 상품 등록 (품목 추가)</span>
          </button>

          {draftItems.length > 0 && (
            <button
              id="admin-reset-defaults-btn"
              onClick={() => setResetConfirmOpen(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-rose-700 hover:text-rose-800 bg-white border border-rose-200 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shadow-xs"
              title="데이터베이스의 등록 상품 전체 비우기"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>전체 비우기 (DB 초기화)</span>
            </button>
          )}
        </div>
      </div>

      {/* 등록된 전체 물품 목록표 (화면 3 요구사항) */}
      <div className="bg-white rounded-2xl border border-[#3E9628]/20 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table id="admin-inventory-table" className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-[#EAF5E7]/70 text-[#1E2B1D] font-bold border-b border-[#3E9628]/15">
                <th className="py-3 px-4 w-14">사진</th>
                <th className="py-3 px-4">물품 정보</th>
                <th className="py-3 px-3 w-28">판매 가격</th>
                <th className="py-3 px-4 w-44">남은 개수 (수량 수정)</th>
                <th className="py-3 px-3 w-48 text-center">관리 (수정 / 품절 / 삭제)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3E9628]/10">
              {filteredItems.map((item) => {
                const isSoldOut = item.stock <= 0;
                return (
                  <tr
                    key={item.id}
                    id={`admin-row-${item.id}`}
                    className={`hover:bg-[#EAF5E7]/40 transition-colors ${
                      isSoldOut ? 'bg-[#F4F8F3]/60' : ''
                    }`}
                  >
                    {/* 대표 사진 */}
                    <td className="py-3 px-4 align-middle">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#EAF5E7]/50 border border-[#3E9628]/15 shrink-0">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          referrerPolicy="no-referrer"
                          className={`w-full h-full object-cover ${
                            isSoldOut ? 'grayscale contrast-75' : ''
                          }`}
                        />
                      </div>
                    </td>

                    {/* 물품 이름 & 위치 & 상태 */}
                    <td className="py-3 px-4 align-middle">
                      <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#EAF5E7] text-[#2D801E] font-medium border border-[#3E9628]/20">
                          {CATEGORY_LABELS[item.category] || item.category || '기타'}
                        </span>
                        {isSoldOut ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-[#1E2B1D] text-white">
                            품절
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-[#EAF5E7] text-[#2D801E] border border-[#3E9628]/30">
                            판매중
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-[#1E2B1D] leading-snug">
                        {item.name}
                      </div>
                      <div className="text-[#556853] text-[11px] truncate max-w-xs mt-0.5">
                        {item.condition}
                      </div>
                    </td>

                    {/* 판매 가격 */}
                    <td className="py-3 px-3 align-middle font-bold text-[#1E2B1D] whitespace-nowrap">
                      {item.price.toLocaleString()}원
                    </td>

                    {/* 남은 개수 직접 수정 입력창 (화면 3 요구사항) */}
                    <td className="py-3 px-4 align-middle">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          id={`admin-minus-${item.id}`}
                          onClick={() => handleStepStock(item.id, -1)}
                          disabled={item.stock <= 0}
                          className="w-7 h-7 rounded-lg bg-[#EAF5E7] hover:bg-[#3E9628]/20 text-[#1E2B1D] disabled:opacity-40 flex items-center justify-center transition-colors cursor-pointer"
                          title="1개 감소"
                        >
                          <Minus className="w-3 h-3" />
                        </button>

                        <input
                          type="number"
                          id={`admin-stock-input-${item.id}`}
                          min={0}
                          max={999}
                          value={item.stock}
                          onChange={(e) =>
                            handleStockChange(item.id, parseInt(e.target.value, 10) || 0)
                          }
                          className={`w-16 text-center font-bold text-sm py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#3E9628] ${
                            isSoldOut
                              ? 'border-rose-300 bg-rose-50/50 text-rose-700'
                              : 'border-[#3E9628]/25 bg-white text-[#1E2B1D]'
                          }`}
                        />

                        <button
                          type="button"
                          id={`admin-plus-${item.id}`}
                          onClick={() => handleStepStock(item.id, 1)}
                          className="w-7 h-7 rounded-lg bg-[#EAF5E7] hover:bg-[#3E9628]/20 text-[#1E2B1D] flex items-center justify-center transition-colors cursor-pointer"
                          title="1개 증가"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <span className="text-[#556853] text-xs ml-0.5">개</span>
                      </div>
                    </td>

                    {/* 관리 버튼들: 개별 저장, 수정, 품절 처리 & 품목 삭제 */}
                    <td className="py-3 px-3 align-middle text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {/* 개별 행 즉시 저장 버튼 (수량 변경 시 적극 강조) */}
                        <button
                          type="button"
                          id={`admin-row-save-btn-${item.id}`}
                          onClick={() => handleSaveSingleItem(item)}
                          disabled={savingRowId === item.id || isSavingAll}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs ${
                            savedRowId === item.id
                              ? 'bg-emerald-600 text-white border border-emerald-500'
                              : isItemModified(item)
                              ? 'bg-[#3E9628] hover:bg-[#3E9628]/90 text-white ring-2 ring-[#74C962]'
                              : 'bg-white hover:bg-[#EAF5E7] text-[#2D801E] border border-[#3E9628]/30'
                          }`}
                          title={isItemModified(item) ? '변경된 수량 즉시 저장' : '현재 재고 저장'}
                        >
                          {savingRowId === item.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : savedRowId === item.id ? (
                            <Check className="w-3 h-3 text-white" />
                          ) : (
                            <Save className="w-3 h-3" />
                          )}
                          <span>{savedRowId === item.id ? '저장됨' : '저장'}</span>
                        </button>

                        <button
                          type="button"
                          id={`admin-edit-btn-${item.id}`}
                          onClick={() => setItemToEdit(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#EAF5E7] text-[#2D801E] border border-[#3E9628]/30 hover:bg-[#3E9628]/20 transition-all cursor-pointer active:scale-95 shadow-xs"
                          title="물품 정보 수정 (카테고리, 이름, 가격 등)"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>수정</span>
                        </button>

                        <button
                          type="button"
                          id={`admin-soldout-btn-${item.id}`}
                          onClick={() => handleMarkSoldOut(item.id)}
                          disabled={isSoldOut || savingRowId === item.id}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            isSoldOut
                              ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                              : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 active:scale-95'
                          }`}
                          title="즉시 재고 0개 및 품절 처리"
                        >
                          <Ban className="w-3 h-3" />
                          <span>{isSoldOut ? '품절됨' : '품절'}</span>
                        </button>

                        <button
                          type="button"
                          id={`admin-delete-btn-${item.id}`}
                          onClick={() => setItemToDelete(item.id)}
                          className="p-1.5 rounded-lg text-[#556853] hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                          title="상품 삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredItems.length === 0 && (
          <div className="py-12 text-center text-[#556853]">
            {draftItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2">
                <p className="font-bold text-sm text-[#1E2B1D]">현재 등록된 상품이 없습니다.</p>
                <p className="text-xs text-[#556853]">
                  상단의 [+ 새 상품 등록] 버튼을 눌러 첫 번째 물품을 데이터베이스에 등록해 보세요.
                </p>
              </div>
            ) : (
              '해당 조건의 물품이 없습니다.'
            )}
          </div>
        )}

        {/* 테이블 하단 고정 액션 바 */}
        <div className="p-4 bg-[#EAF5E7]/50 border-t border-[#3E9628]/15 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-[#556853]">
            * 변경한 재고 수량은 <span className="font-bold text-[#1E2B1D]">[저장]</span> 버튼을
            눌러야 사용자 화면에 즉시 적용됩니다.
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              id="admin-cancel-btn"
              onClick={onBackToUserView}
              className="flex-1 sm:flex-initial px-4 py-2 text-xs font-bold text-[#1E2B1D] bg-white border border-[#3E9628]/25 hover:bg-[#EAF5E7] rounded-xl transition-colors cursor-pointer"
            >
              닫기 (사용자 화면)
            </button>
            <button
              id="admin-save-bottom-btn"
              onClick={handleSaveAll}
              disabled={isSavingAll}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-5 py-2 text-xs sm:text-sm font-bold bg-[#3E9628] hover:bg-[#3E9628]/90 text-white rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isSavingAll ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isSavingAll ? '저장 중...' : '변경사항 전체 저장'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 전체 비우기 확인 모달 */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E2B1D]/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-rose-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-rose-50 text-rose-600 shrink-0 border border-rose-200">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-[#1E2B1D] text-sm">전체 상품을 비우시겠습니까?</h3>
                <p className="text-xs text-[#556853] mt-1">
                  데이터베이스에 등록된 모든 상품이 삭제되며 복구할 수 없습니다. 실제 업로드된 상품만 남기거나 완전히 초기화할 때 사용하세요.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#3E9628]/15">
              <button
                onClick={() => setResetConfirmOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold text-[#556853] hover:bg-[#EAF5E7] rounded-lg cursor-pointer"
              >
                취소
              </button>
              <button
                id="confirm-reset-btn"
                onClick={handleReset}
                className="px-3.5 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg cursor-pointer shadow-xs"
              >
                전체 삭제 실행
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 운영자 비밀번호 변경 모달 */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E2B1D]/65 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#3E9628]/25 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#3E9628]/15 bg-[#EAF5E7]/50">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#3E9628]" />
                <h3 className="font-bold text-sm text-[#1E2B1D]">운영자 비밀번호 변경</h3>
              </div>
              <button
                onClick={() => setIsChangePasswordOpen(false)}
                className="p-1 rounded-lg text-[#556853] hover:text-[#1E2B1D] hover:bg-[#EAF5E7] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="p-5 space-y-4">
              <p className="text-xs text-[#556853]">
                운영자만 재고를 관리할 수 있도록 비밀번호를 안전하게 변경하세요.
              </p>

              <div>
                <label className="block text-xs font-bold text-[#1E2B1D] mb-1">
                  현재 비밀번호
                </label>
                <input
                  type="password"
                  value={currentPwdInput}
                  onChange={(e) => setCurrentPwdInput(e.target.value)}
                  placeholder="현재 설정된 비밀번호"
                  className="w-full px-3 py-2 text-xs bg-[#F4F8F3] border border-[#3E9628]/25 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3E9628] text-[#1E2B1D]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E2B1D] mb-1">
                  새 비밀번호 (4글자 이상)
                </label>
                <div className="relative">
                  <input
                    type={showNewPwd ? 'text' : 'password'}
                    value={newPwdInput}
                    onChange={(e) => setNewPwdInput(e.target.value)}
                    placeholder="새로운 비밀번호 입력"
                    className="w-full px-3 pr-10 py-2 text-xs bg-[#F4F8F3] border border-[#3E9628]/25 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3E9628] text-[#1E2B1D]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPwd((p) => !p)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#556853] hover:text-[#1E2B1D] cursor-pointer"
                  >
                    {showNewPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E2B1D] mb-1">
                  새 비밀번호 확인
                </label>
                <input
                  type={showNewPwd ? 'text' : 'password'}
                  value={newPwdConfirmInput}
                  onChange={(e) => setNewPwdConfirmInput(e.target.value)}
                  placeholder="새로운 비밀번호 다시 입력"
                  className="w-full px-3 py-2 text-xs bg-[#F4F8F3] border border-[#3E9628]/25 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3E9628] text-[#1E2B1D]"
                />
              </div>

              {pwdChangeError && (
                <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                  {pwdChangeError}
                </div>
              )}

              {pwdChangeSuccess && (
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-bold flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  <span>{pwdChangeSuccess}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#3E9628]/15">
                <button
                  type="button"
                  onClick={() => setIsChangePasswordOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-[#556853] hover:bg-[#EAF5E7] rounded-xl cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-[#3E9628] hover:bg-[#3E9628]/90 text-white rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer"
                >
                  비밀번호 저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 개별 물품 삭제 확인 모달 */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E2B1D]/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-rose-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-rose-50 text-rose-600 shrink-0 border border-rose-200">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-[#1E2B1D] text-sm">해당 상품을 삭제하시겠습니까?</h3>
                <p className="text-xs text-[#556853] mt-1">
                  데이터베이스에서 해당 물품이 완전히 삭제되며 복구할 수 없습니다.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#3E9628]/15">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-3 py-1.5 text-xs font-semibold text-[#556853] hover:bg-[#EAF5E7] rounded-lg cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                id="confirm-delete-item-btn"
                onClick={() => {
                  if (itemToDelete) {
                    if (onDeleteItem) {
                      onDeleteItem(itemToDelete);
                    }
                    setDraftItems((prev) => prev.filter((i) => i.id !== itemToDelete));
                    setItemToDelete(null);
                  }
                }}
                className="px-3.5 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg cursor-pointer shadow-xs"
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 새 상품 등록 모달 */}
      <AddItemModal
        isOpen={isAddItemOpen}
        onClose={() => setIsAddItemOpen(false)}
        onItemAdded={(newItem) => {
          setDraftItems((prev) => [newItem, ...prev]);
        }}
      />

      {/* 물품 정보 수정 모달 (카테고리, 물품명, 가격, 사진 등) */}
      <EditItemModal
        isOpen={!!itemToEdit}
        item={itemToEdit}
        onClose={() => setItemToEdit(null)}
        onItemUpdated={(updated) => {
          setDraftItems((prev) =>
            prev.map((it) => (it.id === updated.id ? updated : it))
          );
        }}
      />
    </div>
  );
};
