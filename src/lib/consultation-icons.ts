export const CONSULTATION_ICON_OPTIONS = [
  { key: 'sparkles', label: '사주' },
  { key: 'users', label: '궁합' },
  { key: 'heart', label: '연애' },
  { key: 'landmark', label: '재물' },
  { key: 'briefcase', label: '직업' },
  { key: 'leaf', label: '고민' },
  { key: 'compass', label: '방향' },
  { key: 'calendar', label: '운세' },
] as const;

export type ConsultationIconKey = typeof CONSULTATION_ICON_OPTIONS[number]['key'];

export function normalizeConsultationIconKey(value: unknown): ConsultationIconKey {
  return CONSULTATION_ICON_OPTIONS.some((option) => option.key === value)
    ? value as ConsultationIconKey
    : 'sparkles';
}
