import React, { useEffect } from 'react';
import { MarketItem } from '../types';
import { X, CheckCircle2, AlertTriangle, Package, Calendar, Layers, Ruler, Sparkles, Ban } from 'lucide-react';

interface ItemDetailModalProps {
  item: MarketItem | null;
  onClose: () => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (item) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [item, onClose]);

  if (!item) return null;

  const isSoldOut = item.stock <= 0;

  return (
    <div
      id="item-detail-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#1E2B1D]/65 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="item-detail-modal-content"
        className="relative w-full max-w-xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-[#3E9628]/20 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 헤더 & 닫기(X) 버튼 */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#3E9628]/15 bg-[#EAF5E7]/50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-[#1E2B1D] text-[#EAF5E7]">
              물품 상세 정보
            </span>
            <span className="text-xs text-[#556853] font-mono">#{item.id}</span>
          </div>

          <button
            id="close-detail-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#556853] hover:text-[#1E2B1D] hover:bg-[#EAF5E7] transition-colors cursor-pointer"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 모달 스크롤 바디 */}
        <div className="overflow-y-auto p-5 space-y-5">
          {/* 큰 실물 사진 */}
          <div className="relative aspect-16/10 w-full rounded-xl overflow-hidden bg-[#EAF5E7]/50 border border-[#3E9628]/15">
            <img
              src={item.imageUrl}
              alt={item.name}
              referrerPolicy="no-referrer"
              className={`w-full h-full object-cover ${
                isSoldOut ? 'grayscale contrast-75' : ''
              }`}
            />
            {isSoldOut ? (
              <div className="absolute top-3 right-3 bg-[#1E2B1D] text-white font-bold text-xs px-3 py-1 rounded-md shadow-md flex items-center gap-1 border border-white/20">
                <Ban className="w-3.5 h-3.5" />
                현재 품절
              </div>
            ) : (
              <div className="absolute top-3 right-3 bg-[#2D801E] text-white font-bold text-xs px-3 py-1 rounded-md shadow-md">
                잔여 {item.stock}개
              </div>
            )}
          </div>

          {/* 물품 이름과 가격 & 잔여 수량 배너 */}
          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-[#1E2B1D] leading-tight">
                  {item.name}
                </h2>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-extrabold text-[#1E2B1D]">
                    {item.price.toLocaleString()}
                    <span className="text-base font-normal text-[#556853]">원</span>
                  </span>
                  {item.originalPrice && item.originalPrice > item.price && (
                    <span className="text-sm text-[#556853]/50 line-through">
                      정가 약 {item.originalPrice.toLocaleString()}원
                    </span>
                  )}
                </div>
              </div>

              {/* 현재 남아있는 정확한 개수 안내 */}
              <div className="text-right shrink-0">
                <span className="text-xs text-[#556853] block mb-0.5">실시간 재고</span>
                {isSoldOut ? (
                  <span className="inline-block font-bold text-sm text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
                    0개 (품절)
                  </span>
                ) : (
                  <span className="inline-block font-bold text-sm text-[#2D801E] bg-[#EAF5E7] px-2.5 py-1 rounded-md border border-[#3E9628]/30">
                    현재 {item.stock}개 남음
                  </span>
                )}
              </div>
            </div>

            {/* 품절 상태 경고 알림 */}
            {isSoldOut && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <div>
                  <p className="font-semibold">이 물품은 현재 전량 소진되었습니다.</p>
                  <p className="text-rose-700 mt-0.5">
                    퇴소생 기증 중고 물품 특성상 즉시 추가 입고 여부가 불확실하므로, 다른 카테고리 물품을 확인해 주세요.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 물품 상태 설명 글 (사용 기간, 흠집 여부, 구성품, 크기 등) */}
          <div className="bg-[#EAF5E7]/40 rounded-xl p-4 border border-[#3E9628]/15 space-y-3">
            <h3 className="text-xs font-bold text-[#1E2B1D] uppercase tracking-wide flex items-center gap-1.5">
              <Package className="w-4 h-4 text-[#3E9628]" />
              물품 세부 상태 및 정보
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-[#3E9628]/15">
                <Calendar className="w-4 h-4 text-[#3E9628] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[#556853] block text-[11px]">사용 기간</span>
                  <span className="font-medium text-[#1E2B1D]">{item.usedPeriod}</span>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-[#3E9628]/15">
                <CheckCircle2 className="w-4 h-4 text-[#3E9628] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[#556853] block text-[11px]">외관 및 작동 상태</span>
                  <span className="font-medium text-[#1E2B1D]">{item.condition}</span>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-[#3E9628]/15">
                <Ruler className="w-4 h-4 text-[#3E9628] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[#556853] block text-[11px]">크기 / 규격</span>
                  <span className="font-medium text-[#1E2B1D]">{item.size}</span>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-[#3E9628]/15">
                <Layers className="w-4 h-4 text-[#3E9628] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[#556853] block text-[11px]">포함 구성품</span>
                  <span className="font-medium text-[#1E2B1D]">{item.components}</span>
                </div>
              </div>
            </div>

            {/* 세부 설명 본문 */}
            <div className="pt-2 border-t border-[#3E9628]/15 text-xs sm:text-sm text-[#1E2B1D] leading-relaxed">
              <p className="font-bold text-[#1E2B1D] mb-1">상세 설명</p>
              <p className="whitespace-pre-line text-[#556853]">{item.description}</p>
            </div>
          </div>

          {/* 실시간 재고 확인 안내 문구 */}
          <div className="bg-[#EAF5E7]/70 border border-[#3E9628]/25 rounded-xl p-4 text-xs space-y-2 text-[#1E2B1D]">
            <h3 className="font-bold text-[#1E2B1D] flex items-center gap-1.5 text-xs sm:text-sm">
              <Sparkles className="w-4 h-4 text-[#3E9628]" />
              실시간 재고 조회 안내
            </h3>
            <ul className="space-y-1.5 text-[#1E2B1D]/90 pl-1">
              <li className="flex items-start gap-1.5">
                <span className="text-[#3E9628] font-bold">•</span>
                <span>
                  <strong>물품 보관 구역:</strong>{' '}
                  <span className="font-bold text-[#1E2B1D] bg-white border border-[#3E9628]/30 px-1.5 py-0.5 rounded">
                    {item.locationTag}
                  </span>
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-[#3E9628] font-bold">•</span>
                <span>
                  선착순 재고 확인 후, 물품 문의 및 예약은 <strong>"연근마켓" 앱 1:1 채팅</strong>을 통해 진행해 주세요.
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-[#3E9628] font-bold">•</span>
                <span>
                  채팅 후 직접 만나 물품 상태를 최종 확인하고 물품과 돈을 교환합니다. (교환 및 환불 불가)
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-[#3E9628] font-bold">•</span>
                <span>
                  실시간 재고가 0개로 차감되면 즉시 품절로 자동 전환됩니다.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* 모달 하단 버튼 바 */}
        <div className="p-4 border-t border-[#3E9628]/15 bg-[#EAF5E7]/30 flex items-center justify-end">
          <button
            id="modal-close-bottom-btn"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-sm bg-[#1E2B1D] hover:bg-[#1E2B1D]/90 text-white transition-colors cursor-pointer shadow-xs"
          >
            목록으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
};
