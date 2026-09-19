import React, { useState, useRef } from 'react';
import { MarketItem, MarketCategory, ORDERED_CATEGORIES } from '../types';
import { addMarketItem } from '../firebase';
import { X, PlusCircle, Image as ImageIcon, Sparkles, AlertCircle, Check, Upload, Camera } from 'lucide-react';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemAdded?: (item: MarketItem) => void;
}

// 참고용 샘플 사진 목록 (선택 시 사진만 적용되며, 관리자가 입력한 물품명은 유지됨)
const SAMPLE_PHOTOS = [
  {
    label: '책/교재',
    url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    category: 'books' as const,
  },
  {
    label: '욕실용품',
    url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80',
    category: 'bathroom' as const,
  },
  {
    label: '생활용품',
    url: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=800&q=80',
    category: 'living' as const,
  },
  {
    label: '주방용품',
    url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80',
    category: 'kitchen' as const,
  },
  {
    label: '문구류',
    url: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=800&q=80',
    category: 'stationery' as const,
  },
  {
    label: '음식/간식',
    url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
    category: 'food' as const,
  },
  {
    label: '기타 물품',
    url: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80',
    category: 'etc' as const,
  },
];

// 클라이언트 사이드 이미지 압축 (Firestore 용량 최적화)
const compressImageFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 720;
        let { width, height } = img;
        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.onerror = reject;
      img.src = event.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  onClose,
  onItemAdded,
}) => {
  // 1. 관리자가 직접 입력하는 물품명 (어떤 물건인지)
  const [name, setName] = useState('');
  const [category, setCategory] = useState<MarketCategory>('living');
  const [price, setPrice] = useState<string>('5000');
  const [originalPrice, setOriginalPrice] = useState<string>('');
  const [stock, setStock] = useState<string>('1');

  // 사진 등록 상태 (파일 업로드 또는 직접 URL)
  const [imageUrl, setImageUrl] = useState(SAMPLE_PHOTOS[0].url);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 세부 정보
  const [condition, setCondition] = useState('상 (외관 깨끗함, 정상 작동)');
  const [usedPeriod, setUsedPeriod] = useState('1개 학기');
  const [size, setSize] = useState('일반 규격');
  const [description, setDescription] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // 사진 파일 업로드 처리
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMsg('이미지 파일(JPG, PNG 등)만 선택할 수 있습니다.');
      return;
    }

    try {
      setIsUploadingPhoto(true);
      setErrorMsg(null);
      const compressedDataUrl = await compressImageFile(file);
      setImageUrl(compressedDataUrl);
      setIsUploadingPhoto(false);
    } catch (err) {
      console.error('Failed to compress image:', err);
      setErrorMsg('사진을 불러오는 중 오류가 발생했습니다.');
      setIsUploadingPhoto(false);
    }
  };

  // 참고용 샘플 사진 선택 (물품명은 절대 바꾸지 않고 사진만 변경)
  const selectSamplePhoto = (sample: typeof SAMPLE_PHOTOS[0]) => {
    setImageUrl(sample.url);
    // 물품명(name)은 관리자가 직접 입력한 값을 절대 덮어쓰지 않고 유지합니다.
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('어떤 물건인지 물품명을 입력해 주세요.');
      return;
    }
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      setErrorMsg('올바른 판매 가격을 입력해 주세요.');
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
        imageUrl: imageUrl.trim() || SAMPLE_PHOTOS[0].url,
        condition: condition.trim() || '상 (외관 깨끗함, 정상 작동)',
        usedPeriod: usedPeriod.trim() || '미기재',
        size: size.trim() || '일반 규격',
        description: description.trim() || '기숙사 플리마켓 등록 물품입니다.',
        updatedAt: nowFormatted,
      };

      await addMarketItem(newItemData);

      setSuccessMsg(`'${newItemData.name}' 상품이 성공적으로 등록되었습니다!`);
      if (onItemAdded) {
        onItemAdded(newItemData);
      }

      setTimeout(() => {
        setIsSubmitting(false);
        setSuccessMsg(null);
        onClose();
        // 폼 초기화
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
            <div>
              <h2 className="font-bold text-[#1E2B1D] text-base">플리마켓 상품 등록 (관리자 전용)</h2>
              <p className="text-[11px] text-[#556853]">등록 즉시 실시간 데이터베이스에 반영되어 사용자 화면에 노출됩니다.</p>
            </div>
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

          {/* 1. 어떤 물건인지 직접 입력하는 핵심 섹션 */}
          <div className="p-3.5 rounded-xl bg-[#F4F8F3] border border-[#3E9628]/25 space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[#1E2B1D] flex items-center gap-1.5">
                  <span>어떤 물건인가요? (물품명 직접 입력)</span>
                  <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-[#3E9628] font-semibold">관리자 직접 입력</span>
              </div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 각도조절 독서대, 샤오미 스탠드, 3단 수납함 등"
                className="w-full px-3.5 py-2.5 bg-white border border-[#3E9628]/35 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3E9628] text-[#1E2B1D] font-medium text-sm shadow-xs"
                autoFocus
              />
              <p className="text-[11px] text-[#556853] mt-1">
                ※ 관리자가 판매할 물품의 품목/이름을 직접 자유롭게 입력하세요.
              </p>
            </div>

            {/* 카테고리 탭 선택 (7가지 카테고리) */}
            <div>
              <label className="block text-xs font-bold text-[#1E2B1D] mb-1.5">
                물품 카테고리 <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ORDERED_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                      category === cat.id
                        ? 'bg-[#3E9628] text-white border-[#3E9628] shadow-xs'
                        : 'bg-white text-[#556853] border-[#3E9628]/25 hover:bg-[#EAF5E7]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 2. 판매 가격 & 정가 & 재고 수량 */}
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

          {/* 3. 대표 사진 등록 (파일 업로드 / URL 입력 / 샘플 사진) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1E2B1D] flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-[#3E9628]" />
                <span>대표 사진 등록</span>
                <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-[#556853]">사진 촬영/업로드 또는 URL 입력</span>
            </div>

            {/* 사진 미리보기 & 업로드/URL 바 */}
            <div className="flex gap-2.5 items-center">
              <div className="w-14 h-14 rounded-xl overflow-hidden border border-[#3E9628]/30 shrink-0 bg-stone-100 flex items-center justify-center relative shadow-xs">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="물품 사진 미리보기"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <Camera className="w-6 h-6 text-stone-400" />
                )}
                {isUploadingPhoto && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-[10px] font-bold">
                    처리중
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-1.5">
                <div className="flex gap-1.5">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="사진 URL 직접 입력 (https://...)"
                    className="flex-1 px-3 py-2 bg-[#F4F8F3] border border-[#3E9628]/25 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3E9628] text-[#1E2B1D] text-xs"
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-2 bg-[#EAF5E7] hover:bg-[#3E9628]/20 border border-[#3E9628]/35 text-[#2D801E] rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>사진 업로드</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 참고용 샘플 사진 선택 */}
            <div className="pt-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-[#556853] font-medium">참고용 샘플 사진:</span>
                <span className="text-[10px] text-[#3E9628] font-medium">※ 선택 시 사진만 변경되며, 입력한 물품명은 유지됩니다</span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {SAMPLE_PHOTOS.map((sample) => (
                  <button
                    type="button"
                    key={sample.label}
                    onClick={() => selectSamplePhoto(sample)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors border cursor-pointer ${
                      imageUrl === sample.url
                        ? 'bg-[#3E9628] text-white border-[#3E9628] font-bold'
                        : 'bg-white text-[#556853] border-[#3E9628]/20 hover:bg-[#EAF5E7]'
                    }`}
                  >
                    {sample.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. 물품 상태 및 크기 (진열 위치 & 구성품은 제외) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#1E2B1D] mb-1">
                물품 상태 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                placeholder="상 (눈에 띄는 흠집 없음)"
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

          {/* 5. 상세 설명 */}
          <div>
            <label className="block text-xs font-bold text-[#1E2B1D] mb-1">상세 설명</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="기숙사에서 사용하기에 적합한 장점 및 제품 상태를 자유롭게 적어주세요."
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
              <span>{isSubmitting ? '등록 중...' : '상품 등록 완료'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
