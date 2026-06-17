import React from 'react';
import { getScoreGradient } from '../lib/utils';

interface ScoreRingProps {
  score: number;
  size?: number;
  animated?: boolean;
}

export const ScoreRing: React.FC<ScoreRingProps> = ({ score, size = 180, animated = true }) => {
  const normalizedScore = Math.min(100, Math.max(0, score));
  const circumference = 2 * Math.PI * 70;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;
  const color = getScoreGradient(normalizedScore);

  const getSize = () => {
    if (size <= 120) return { radius: 50, strokeWidth: 6 };
    if (size <= 150) return { radius: 60, strokeWidth: 7 };
    return { radius: 70, strokeWidth: 8 };
  };

  const { radius, strokeWidth } = getSize();
  const actualCircumference = 2 * Math.PI * radius;
  const actualOffset = actualCircumference - (normalizedScore / 100) * actualCircumference;

  return (
    <div className="score-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          className="bg-ring"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(0, 245, 255, 0.1)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          className="progress-ring"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={actualCircumference}
          strokeDashoffset={animated ? actualOffset : actualCircumference}
          style={{
            transition: animated ? 'stroke-dashoffset 1.5s ease' : 'none',
            filter: `drop-shadow(0 0 10px ${color})`,
          }}
        />
      </svg>
      <div className="score-text">
        <div
          className="text-4xl font-bold"
          style={{ color, textShadow: `0 0 20px ${color}` }}
        >
          {Math.round(normalizedScore)}
        </div>
        <div className="text-xs text-gray-400 mt-1">TRUST SCORE</div>
      </div>
    </div>
  );
};
