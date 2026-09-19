import React from 'react';

interface MascotIconProps {
  className?: string;
  size?: number | string;
  title?: string;
}

/**
 * 기숙사 중고나눔 마스코트 캐릭터 아이콘
 * 상단 연두색 무한순환(∞) 심볼과 따뜻한 비스킷형 원형 캐릭터
 */
export const MascotIcon: React.FC<MascotIconProps> = ({
  className = 'w-10 h-10',
  size,
  title = '기숙사 플리마켓 마스코트',
}) => {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      aria-label={title}
      role="img"
    >
      <title>{title}</title>

      {/* 상단 무한(∞) 순환 연두색 심볼 */}
      <g id="mascot-infinity-symbol">
        {/* 부드러운 핸드드로잉 느낌의 무한대 심볼 */}
        <path
          d="M 82 28 C 68 15, 54 28, 68 40 C 82 52, 118 16, 132 28 C 146 40, 132 52, 118 40 C 104 28, 96 40, 82 28 Z"
          fill="none"
          stroke="#749666"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* 메인 원형 바디 */}
      <g id="mascot-body">
        {/* 쿠키/멜론/연근 원형 몸체 */}
        <circle
          cx="100"
          cy="120"
          r="68"
          fill="#D6C4B2"
          stroke="#93786C"
          strokeWidth="6"
        />

        {/* 테두리 안쪽의 은은한 원형 해치 마크 (눈금 디테일) */}
        <g stroke="#BC9E8F" strokeWidth="2.8" strokeLinecap="round">
          <line x1="100" y1="59" x2="100" y2="67" />
          <line x1="123" y1="62" x2="120" y2="70" />
          <line x1="145" y1="73" x2="139" y2="79" />
          <line x1="160" y1="92" x2="153" y2="96" />
          <line x1="167" y1="115" x2="159" y2="116" />
          <line x1="164" y1="138" x2="157" y2="136" />
          <line x1="151" y1="158" x2="145" y2="152" />
          <line x1="131" y1="174" x2="128" y2="166" />
          <line x1="106" y1="181" x2="105" y2="173" />
          <line x1="82" y1="178" x2="84" y2="170" />
          <line x1="61" y1="165" x2="66" y2="159" />
          <line x1="47" y1="144" x2="54" y2="142" />
          <line x1="42" y1="120" x2="50" y2="121" />
          <line x1="47" y1="96" x2="54" y2="100" />
          <line x1="62" y1="76" x2="68" y2="82" />
          <line x1="81" y1="63" x2="84" y2="71" />
        </g>

        {/* 좌측 눈 (기울어진 타원형) */}
        <ellipse
          cx="82"
          cy="104"
          rx="12"
          ry="21"
          transform="rotate(-26 82 104)"
          fill="#FFFFFF"
          stroke="#93786C"
          strokeWidth="5.5"
        />

        {/* 우측 눈 (대칭으로 기울어진 타원형) */}
        <ellipse
          cx="120"
          cy="104"
          rx="12"
          ry="21"
          transform="rotate(26 120 104)"
          fill="#FFFFFF"
          stroke="#93786C"
          strokeWidth="5.5"
        />

        {/* 하단 입 (놀란 듯 동그란 수직 타원형) */}
        <ellipse
          cx="101"
          cy="143"
          rx="12"
          ry="24"
          fill="#FFFFFF"
          stroke="#93786C"
          strokeWidth="5.5"
        />
      </g>
    </svg>
  );
};
