import React, { useState } from 'react';
import { MarketItem } from '../types';
import { addMarketItem } from '../firebase';
import { X, PlusCircle, Image as ImageIcon, Sparkles, AlertCircle, Check } from 'lucide-react';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemAdded?: (item: MarketItem) => void;
}

const PRESET_IMAGES = [
  {
    name: '책상 스탠드',
    url: 'https://images.unsplash.com/photo-1534353436294-0dbd4bdac845?auto=format&fit=crop&w=800&q=80',
    category: 'appliances' as const,
  },
  {
    name: '빨래건조대',
    url: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?auto=format&fit=crop&w=800&q=80',
    category: 'living' as const,
  },
  {
    name: '헤어드라이어',
    url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
    category: 'appliances' as const,
  },
  {
    name: '서랍장/수납함',
    url: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80',
    category: 'furniture' as const,
  },
  {
    name: '침대 협탁/책상',
    url: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800&q=80',
    category: 'furniture' as const,
  },
  {
    name: '전기포트',
    url: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=800&q=80',
    category: 'appliances' as const,
  },
  {
    name: '탁상용 선풍기',
    url: 'https://images.unsplash.com/photo-1618941716939-553df3c6c278?auto=format&fit=crop&w=800&q=80',
    category: 'appliances' as const,
  },
  {
    name: '생활/수납 바구니',
    url: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80',
    category: 'living' as const,
  },
];

export const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  onClose,
  onItemAdded,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'living' | 'appliances' | 'furniture'>('living');
  const [price, setPrice] = useState<string>('5000');
  const [originalPrice, setOriginalPrice] = useState<string>('');
  const [stock, setStock] = useState<string>('1');
  const [imageUrl, setImageUrl] = useState(PRESET_IMAGES[0].url);
  const [condition, setCondition] = useState('상 (외관 깨끗함, 정상 작동)');
  const [usedPeriod, setUsedPeriod] = useState('1개 학기');
  const [size, setSize] = useState('일반 규격');
  const [components, setComponents] = useState('본체');
  const [locationTag, setLocationTag] = useState('생활 A-01 구역');
  const [description, setDescription] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('물품명을 입력해 주세요.');
      return;
    }
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      setErrorMsg('올바른 가격을 입력해 주세요.');
      return;
    }
    const numStock = Number(stock);
    if (isNaN(numStock) || numStock < 0) {
      setErrorMsg('올바른 재고 수량을 입력해 주세요.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const generatedId = `item-${Date.now()}`;
      const nowFormatted = new Date().toISOString().replace('T', ' ').slice(0, 16);

      const newItemData: MarketItem = {
        id: generatedId,
        name: name.trim(),
        category,
        price: numPrice,
        originalPrice: originalPrice ? Number(originalPrice) : undefined,
        stock: Math.floor(numStock),
        imageUrl: imageUrl.trim() || PRESET_IMAGES[0].url,
        condition: condition.trim(),
        usedPeriod: usedPeriod.trim() || '미기재',
        size: size.trim() || '미기재',
        components: components.trim() || '본체',
        description: description.trim() || '기숙사 플리마켓 등록 물품입니다.',
        locationTag: locationTag.trim() || '현장 수령 구역',
        updatedAt: nowFormatted,
      };

      await addMarketItem(newItemData);

      setSuccessMsg('Firebase 데이터베이스에 실제 상품이 등록되었습니다!');
      if (onItemAdded) {
        onItemAdded(newItemData);
      }

      setTimeout(() => {
        setIsSubmitting(false);
        setSuccessMsg(null);
        onClose();
        // Reset form
        setName('');
        setPrice('5000');
        setOriginalPrice('');
        setStock('1');
        setDescription('');
      }, 1000);
    } catch (err) {
      console.error('Failed to add product to Firebase:', err);
      setErrorMsg('상품 등록 중 오류가 발생했습니다. 다시 시도해 주세요.');
      setIsSubmitting(false);
    }
  };

  const selectPreset = (preset: typeof PRESET_IMAGES[0]) => {
    setImageUrl(preset.url);
    setCategory(preset.category);
    if (!name) {
      setName(preset.name);
    }
    if (preset.category === 'living') setLocationTag('생활 A 구역');
    else if (preset.category === 'appliances') setLocationTag('가전 B 구역');
    else setLocationTag('가구 C 구역');
  };

  return (
    <div
      id="add-item-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#1E2B1D]/65 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="add-item-modal-content"
        className="relative w-full max-w-xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-[#3E9628]/25 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#3E9628]/15 bg-[#EAF5E7]/60">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-[#3E9628]" />
            <h2 className="font-bold text-[#1E2B1D] text-base">플리마켓 실제 상품 등록 (Firebase 연동)</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#556853] hover:text-[#1E2B1D] hover:bg-[#EAF5E7] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 폼 바디 */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 물품명 & 카테고리 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#1E2B1D] mb-1">
                물품명 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: LED 각도조절 책상 스탠드"
                className="w-full px-3 py-2 bg-[#F4F8F3] border border-[#3E9628]/25 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3E9628] text-[#1E2B1D]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1E2B1D] mb-1">
                카테고리 <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 bg-[#F4F8F3] border border-[#3E9628]/25 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3E9628] text-[#1E2B1D]"
              >
                <option value="living">생활용품</option>
                <option value="appliances">가전</option>
                <option value="furniture">가구/수납</option>
              </select>
            </div>
          </div>

          {/* 판매 가격 & 정가 & 재고 수량 */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#1E2B1D] mb-1">
                판매 가격(원) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={0}
                max={10000000}
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="5000"
                className="w-full px-3 py-2 bg-[#F4F8F3] border border-[#3E9628]/25 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3E9628] text-[#1E2B1D]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1E2B1D] mb-1">
                정가/구입가(선택)
              </label>
              <input
                type="number"
                min={0}
                max={10000000}
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                placeholder="25000"
                className="w-full px-3 py-2 bg-[#F4F8F3] border border-[#3E9628]/25 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3E9628] text-[#1E2B1D]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1E2B1D] mb-1">
                잔여 재고(개) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={0}
                max={1000}
                required
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="1"
                className="w-full px-3 py-2 bg-[#F4F8F3] border border-[#3E9628]/25 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3E9628] text-[#1E2B1D]"
              />
            </div>
          </div>

          {/* 사진 URL 및 빠른 프리셋 추천 */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-[#1E2B1D]">
                대표 사진 URL <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-[#556853]">아래 추천 프리셋을 클릭하면 자동 입력됩니다</span>
            </div>
            <div className="flex gap-2 mb-2">
              <input
                type="url"
                required
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="flex-1 px-3 py-2 bg-[#F4F8F3] border border-[#3E9628]/25 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3E9628] text-[#1E2B1D] text-xs"
              />
              <div className="w-10 h-10 rounded-lg overflow-hidden border border-[#3E9628]/30 shrink-0 bg-stone-100">
                <img
                  src={imageUrl}
                  alt="미리보기"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            </div>

            {/* 프리셋 버튼 목록 */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {PRESET_IMAGES.map((preset) => (
                <button
                  type="button"
                  key={preset.name}
                  onClick={() => selectPreset(preset)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors border cursor-pointer ${
                    imageUrl === preset.url
                      ? 'bg-[#3E9628] text-white border-[#3E9628]'
                      : 'bg-white text-[#556853] border-[#3E9628]/20 hover:bg-[#EAF5E7]'
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* 상태 & 사용 기간 & 규격 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#1E2B1D] mb-1">
                물품 상태 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                placeholder="상 (미세 생활감만 있음)"
                className="w-full px-3 py-2 bg-[#F4F8F3] border border-[#3E9628]/25 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3E9628] text-[#1E2B1D]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1E2B1D] mb-1">사용 기간</label>
              <input
                type="text"
                value={usedPeriod}
                onChange={(e) => setUsedPeriod(e.target.value)}
                placeholder="1개 학기 (약 4개월)"
                className="w-full px-3 py-2 bg-[#F4F8F3] border border-[#3E9628]/25 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3E9628] text-[#1E2B1D]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1E2B1D] mb-1">진열 위치 태그</label>
              <input
                type="text"
                value={locationTag}
                onChange={(e) => setLocationTag(e.target.value)}
                placeholder="생활 A-02 구역"
                className="w-full px-3 py-2 bg-[#F4F8F3] border border-[#3E9628]/25 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3E9628] text-[#1E2B1D]"
              />
            </div>
          </div>

          {/* 구성품 & 규격 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#1E2B1D] mb-1">포함 구성품</label>
              <input
                type="text"
                value={components}
                onChange={(e) => setComponents(e.target.value)}
                placeholder="본체 + 전원 어댑터"
                className="w-full px-3 py-2 bg-[#F4F8F3] border border-[#3E9628]/25 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3E9628] text-[#1E2B1D]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1E2B1D] mb-1">크기 및 규격</label>
              <input
                type="text"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="약 30 x 40cm"
                className="w-full px-3 py-2 bg-[#F4F8F3] border border-[#3E9628]/25 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3E9628] text-[#1E2B1D]"
              />
            </div>
          </div>

          {/* 상세 설명 */}
          <div>
            <label className="block text-xs font-bold text-[#1E2B1D] mb-1">상세 설명</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="기숙사에서 사용하기에 적합한 장점 및 제품 상태를 자세히 적어주세요."
              className="w-full px-3 py-2 bg-[#F4F8F3] border border-[#3E9628]/25 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3E9628] text-[#1E2B1D]"
            />
          </div>

          {/* 하단 액션 버튼 */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#3E9628]/15">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-[#556853] hover:bg-[#EAF5E7] rounded-xl cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs sm:text-sm font-bold bg-[#3E9628] hover:bg-[#3E9628]/90 text-white rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? 'Firebase 등록 중...' : '상품 등록 완료'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
