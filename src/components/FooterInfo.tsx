import React from 'react';
import { AlertTriangle, HeartHandshake } from 'lucide-react';

interface FooterInfoProps {
  onOpenAdmin: () => void;
}

export const FooterInfo: React.FC<FooterInfoProps> = ({ onOpenAdmin }) => {
  return (
    <footer id="dorm-market-footer" className="mt-12 pt-8 pb-12 border-t border-[#3E9628]/15">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 실시간 재고 조회 이용 시 안내사항 */}
        <div className="bg-white rounded-2xl border border-[#3E9628]/20 p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-[#3E9628]" />
            <h3 className="text-sm sm:text-base font-bold text-[#1E2B1D]">
              실시간 재고 조회 이용 시 안내사항
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-[#556853]">
            <div className="flex items-start gap-2 bg-[#EAF5E7]/60 p-3 rounded-xl border border-[#3E9628]/15">
              <span className="font-bold text-[#3E9628] shrink-0">01</span>
              <div>
                <strong className="text-[#1E2B1D] block mb-0.5 font-bold">선착순 재고 확인 후 예약 원칙</strong>
                <span>
                  웹에서 실시간 재고 수량을 먼저 확인하신 후, 선착순으로 예약이 진행됩니다.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-[#EAF5E7]/60 p-3 rounded-xl border border-[#3E9628]/15">
              <span className="font-bold text-[#3E9628] shrink-0">02</span>
              <div>
                <strong className="text-[#1E2B1D] block mb-0.5 font-bold">물품 상태 1:1 채팅 확인</strong>
                <span>
                  자세한 물품 상태 및 문의는 반드시 <strong className="text-[#2D801E] bg-white px-1 py-0.5 rounded border border-[#3E9628]/30 font-bold">"연근마켓" 앱</strong> 내 1:1 채팅을 통해 확인해 주세요.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-[#EAF5E7]/60 p-3 rounded-xl border border-[#3E9628]/15">
              <span className="font-bold text-[#3E9628] shrink-0">03</span>
              <div>
                <strong className="text-[#1E2B1D] block mb-0.5 font-bold">교환 및 환불 불가</strong>
                <span>
                  플리마켓 중고 물품 특성상 거래 완료 후 단순 변심으로 인한 교환 및 환불은 불가하오니 신중한 결정을 부탁드립니다.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-[#EAF5E7]/60 p-3 rounded-xl border border-[#3E9628]/15">
              <span className="font-bold text-[#3E9628] shrink-0">04</span>
              <div>
                <strong className="text-[#1E2B1D] block mb-0.5 font-bold">결제 및 거래 방식 안내</strong>
                <span>
                  "연근마켓" 앱 1:1 채팅 후 직접 만나서 물품 상태를 최종 확인하고, 물품과 돈을 직접 교환(현금 또는 계좌이체)하는 형식으로 진행됩니다.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 카피라이트 & 현장 관리자 모드 링크 */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#556853] pt-2 px-1">
          <div className="flex items-center gap-1.5">
            <HeartHandshake className="w-4 h-4 text-[#3E9628]" />
            <span>기숙사 플리마켓 실시간 재고 연동 시스템</span>
          </div>

          <button
            id="footer-admin-link"
            onClick={onOpenAdmin}
            className="text-[#556853] hover:text-[#1E2B1D] font-medium underline transition-colors cursor-pointer text-[11px] inline-flex items-center gap-1"
          >
            <span>[🔒 현장 운영자 전용 재고 수정 관리]</span>
          </button>
        </div>
      </div>
    </footer>
  );
};
