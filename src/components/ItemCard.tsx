import React from 'react';
import { MarketItem, CATEGORY_LABELS } from '../types';
import { Tag, ChevronRight, Ban } from 'lucide-react';

interface ItemCardProps {
  item: MarketItem;
  onSelect: (item: MarketItem) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, onSelect }) => {
  const isSoldOut = item.stock <= 0;
  const isUrgent = item.stock > 0 && item.stock <= 2;

  const categoryName = CATEGORY_LABELS[item.category] || item.category || '기타';

  return (
    <article
      id={`item-card-${item.id}`}
      onClick={() => onSelect(item)}
      className={`group relative bg-white rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col cursor-pointer ${
        isSoldOut
          ? 'border-[#3E9628]/15 bg-[#F4F8F3]/50 opacity-80'
          : 'border-[#3E9628]/20 hover:border-[#3E9628] hover:shadow-md active:scale-[0.99]'
      }`}
    >
      {/* 물품 대표 사진 */}
      <div className="relative aspect-4/3 w-full overflow-hidden bg-[#EAF5E7]/60">
        <img
          src={item.imageUrl}
          alt={item.name}
          loading="lazy"
          referrerPolicy="no-referrer"
          className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-103 ${
            isSoldOut ? 'grayscale contrast-75 brightness-95' : ''
          }`}
          onError={(e) => {
            // 이미지 로드 실패 시 깔끔한 플레이스홀더 처리
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80';
          }}
        />

        {/* 상단 카테고리 뱃지 */}
        <div className="absolute top-2.5 left-2.5">
          <span className="px-2 py-1 rounded-md text-[11px] font-semibold bg-[#1E2B1D]/80 text-white backdrop-blur-xs">
            {categoryName}
          </span>
        </div>

        {/* 남은 수량 표시 / 눈에 띄는 품절 글씨 (핵심 요구사항) */}
        <div className="absolute top-2.5 right-2.5">
          {isSoldOut ? (
            <span
              id={`item-badge-soldout-${item.id}`}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-[#1E2B1D] text-white border border-white/20 shadow-xs"
            >
              <Ban className="w-3 h-3" />
              품절
            </span>
          ) : isUrgent ? (
            <span
              id={`item-badge-urgent-${item.id}`}
              className="px-2.5 py-1 rounded-md text-xs font-bold bg-[#FFF7ED] text-[#C2410C] border border-[#F97316]/40 shadow-xs animate-pulse"
            >
              {item.stock}개 남음 (마감임박)
            </span>
          ) : (
            <span
              id={`item-badge-stock-${item.id}`}
              className="px-2.5 py-1 rounded-md text-xs font-bold bg-[#2D801E] text-white shadow-xs"
            >
              {item.stock}개 남음
            </span>
          )}
        </div>

        {/* 품절 시 오버레이 배너 */}
        {isSoldOut && (
          <div className="absolute inset-0 bg-[#1E2B1D]/45 flex items-center justify-center backdrop-blur-[1px]">
            <div className="bg-[#1E2B1D]/95 text-white px-4 py-1.5 rounded-lg text-sm font-bold tracking-wider shadow-md border border-white/20">
              SOLD OUT
            </div>
          </div>
        )}
      </div>

      {/* 물품 정보 영역 */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* 카테고리 태그 */}
          <div className="flex items-center gap-1 text-[11px] text-[#556853] mb-1">
            <Tag className="w-3 h-3 text-[#3E9628] shrink-0" />
            <span className="font-medium text-[#2D801E]">{categoryName}</span>
          </div>

          {/* 물품 이름 */}
          <h3 className="font-bold text-[#1E2B1D] text-base leading-snug group-hover:text-[#3E9628] transition-colors line-clamp-1">
            {item.name}
          </h3>

          {/* 간략 상태 */}
          <p className="text-xs text-[#556853] mt-1 line-clamp-1">
            상태: {item.condition}
          </p>
        </div>

        {/* 하단 가격 & 상세 보기 화살표 */}
        <div className="mt-3 pt-3 border-t border-[#3E9628]/15 flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-extrabold text-[#1E2B1D]">
              {item.price.toLocaleString()}
              <span className="text-sm font-normal text-[#556853]">원</span>
            </span>
            {item.originalPrice && item.originalPrice > item.price && (
              <span className="text-xs text-[#556853]/50 line-through">
                {item.originalPrice.toLocaleString()}원
              </span>
            )}
          </div>

          <div className="text-xs font-bold text-[#3E9628] group-hover:text-[#1E2B1D] group-hover:translate-x-0.5 transition-all flex items-center">
            <span>상세보기</span>
            <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
          </div>
        </div>
      </div>
    </article>
  );
};
