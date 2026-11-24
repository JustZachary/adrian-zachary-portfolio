/* Pixel icons, drawn as tiny SVG grids so they stay crisp at any size. */
import type { IconName } from "../data/projects";

const INK = "#2B1D16";
const PAPER = "#FBF1DA";

const ICONS: Record<IconName, React.ReactNode> = {
  text: <><rect x="1" y="0" width="8" height="11" fill={PAPER} /><rect x="7" y="0" width="2" height="2" fill="#D3BF98" /><rect x="2" y="3" width="5" height="1" fill={INK} /><rect x="2" y="5" width="6" height="1" fill={INK} /><rect x="2" y="7" width="4" height="1" fill={INK} /></>,
  folder: <><rect x="0" y="2" width="4" height="2" fill="#F2B84A" /><rect x="0" y="3" width="11" height="7" fill="#F5C95A" /><rect x="0" y="9" width="11" height="1" fill="#C48A2A" /></>,
  game: <><rect x="1" y="1" width="9" height="7" fill={INK} /><rect x="2" y="2" width="7" height="5" fill="#2D5BFF" /><rect x="4" y="3" width="1" height="3" fill="#FFF8EC" /><rect x="5" y="4" width="1" height="1" fill="#FFF8EC" /><rect x="3" y="8" width="5" height="2" fill={INK} /></>,
  pdf: <><rect x="1" y="0" width="8" height="11" fill={PAPER} /><rect x="2" y="2" width="6" height="2" fill="#FF5A36" /><rect x="2" y="6" width="6" height="1" fill={INK} /><rect x="2" y="8" width="4" height="1" fill={INK} /></>,
  mail: <><rect x="0" y="2" width="11" height="7" fill={PAPER} /><rect x="0" y="2" width="11" height="1" fill={INK} /><rect x="1" y="3" width="2" height="1" fill={INK} /><rect x="3" y="4" width="2" height="1" fill={INK} /><rect x="5" y="5" width="1" height="1" fill={INK} /><rect x="6" y="4" width="2" height="1" fill={INK} /><rect x="8" y="3" width="2" height="1" fill={INK} /></>,
  tower: <><rect x="5" y="0" width="1" height="11" fill={INK} /><rect x="3" y="2" width="5" height="3" fill={PAPER} /><rect x="4" y="3" width="3" height="1" fill={INK} /><rect x="2" y="9" width="7" height="2" fill={INK} /></>,
  chat: <><rect x="1" y="1" width="9" height="6" fill={PAPER} /><rect x="2" y="7" width="2" height="2" fill={PAPER} /><rect x="2" y="3" width="2" height="1" fill={INK} /><rect x="5" y="3" width="3" height="1" fill={INK} /><rect x="2" y="5" width="5" height="1" fill={INK} /></>,
  door: <><rect x="2" y="1" width="7" height="10" fill="#A99BE0" /><rect x="3" y="3" width="5" height="8" fill={INK} /><rect x="6" y="7" width="1" height="1" fill="#FFC93C" /></>,
  post: <><rect x="1" y="2" width="9" height="7" fill={INK} /><rect x="2" y="3" width="7" height="5" fill={PAPER} /><rect x="5" y="4" width="1" height="3" fill="#FF5A36" /><rect x="6" y="5" width="1" height="1" fill="#FF5A36" /></>,
  phone: <><rect x="3" y="0" width="5" height="11" fill={INK} /><rect x="4" y="1" width="3" height="8" fill={PAPER} /><rect x="5" y="4" width="1" height="2" fill="#5C9A3E" /></>,
  resume: <><rect x="1" y="1" width="9" height="9" fill="#FFFFFF" /><rect x="2" y="2" width="3" height="3" fill="#B8557A" /><rect x="6" y="2" width="3" height="1" fill={INK} /><rect x="6" y="4" width="2" height="1" fill={INK} /><rect x="2" y="7" width="7" height="1" fill={INK} /></>,
  trash: <><rect x="2" y="2" width="7" height="9" fill="#9AA0A6" /><rect x="1" y="1" width="9" height="2" fill="#6F7680" /><rect x="4" y="4" width="1" height="6" fill="#6F7680" /><rect x="6" y="4" width="1" height="6" fill="#6F7680" /></>,
};

export function PixelIcon({ name, size = 44 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 11 11" aria-hidden="true" shapeRendering="crispEdges">
      {ICONS[name]}
    </svg>
  );
}
