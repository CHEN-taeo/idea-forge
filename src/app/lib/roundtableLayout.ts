/** 圆桌座位坐标（百分比，相对容器） */
export interface SeatPosition {
  left: string;
  top: string;
}

/** 用户固定坐席 — 正下方 */
export function userSeat(): SeatPosition {
  return { left: '50%', top: '87%' };
}

/**
 * 嘉宾坐席 — 沿上弧均匀分布，人数不同则弧宽与半径自适应。
 * 1 人：正上方；2 人：左上前 + 右上前；3 人：左 / 正上 / 右。
 */
export function guestSeats(count: number): SeatPosition[] {
  const cx = 50;
  const cy = 50;

  const layouts: Record<number, { rx: number; ry: number; angles: number[] }> = {
    1: { rx: 0, ry: 36, angles: [90] },
    2: { rx: 34, ry: 30, angles: [128, 52] },
    3: { rx: 38, ry: 28, angles: [148, 90, 32] },
  };

  const cfg = layouts[count] ?? layouts[3];
  return cfg.angles.map(angle => {
    const rad = (angle * Math.PI) / 180;
    const x = cx + cfg.rx * Math.cos(rad);
    const y = cy - cfg.ry * Math.sin(rad);
    return { left: `${x}%`, top: `${y}%` };
  });
}

/** 桌面椭圆尺寸 — 随人数微调 */
export function tableEllipse(count: number) {
  if (count === 1) return { w: '58%', top: '48%' };
  if (count === 2) return { w: '68%', top: '50%' };
  return { w: '72%', top: '52%' };
}
