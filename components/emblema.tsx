import Svg, { Path } from 'react-native-svg';

/**
 * La firma di LifeCouple: due cuori intrecciati — "due meta' che diventano una".
 * Line-art sottile, colore terracotta (--primary), coerente col diario.
 * Statico: bello di suo, senza bisogno di animazione.
 */
export function Emblema({ size = 96, color = '#e4259e' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      {/* cuore sinistro */}
      <Path
        d="M42 78C30 68 16 58 16 42c0-9 7-16 16-16 6 0 10 3 13 8"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M45 34c3-5 7-8 13-8 9 0 16 7 16 16 0 16-14 26-26 36"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.55}
      />
      {/* punto d'incontro */}
      <Path d="M44 42l6 6 6-6" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
