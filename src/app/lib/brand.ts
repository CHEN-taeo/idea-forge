/** Brand & copy — override via Vite env (VITE_BRAND_*) */

export const brand = {
  productName: import.meta.env.VITE_BRAND_PRODUCT || '构想熔炉',
  hostName: import.meta.env.VITE_BRAND_HOST_NAME || '陈老师',
  slogan: import.meta.env.VITE_BRAND_SLOGAN || '让每次讨论，都有人领走一件事。',
  subtitle: import.meta.env.VITE_BRAND_SUBTITLE || '讨论不散场，离场有交代。',
  soloName: import.meta.env.VITE_BRAND_SOLO || '独思',
  roomName: import.meta.env.VITE_BRAND_ROOM || '围炉',
} as const;

export function reportFooter(date = new Date().toISOString().split('T')[0]) {
  return `\n---\n\n*${brand.hostName} · ${brand.productName} · ${brand.slogan}*\n*生成于 ${date}*`;
}

export function coachLabel(mode: 'ai' | 'template' | string) {
  return mode === 'ai' ? `${brand.hostName}的 AI 教练` : `${brand.hostName}的离线提示`;
}
