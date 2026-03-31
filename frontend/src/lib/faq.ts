export const FAQ_ICON_KEYS = [
  'clock',
  'document',
  'receipt',
  'envelope',
  'chat-alert',
] as const;

export type FaqIconKey = (typeof FAQ_ICON_KEYS)[number];

export type FaqItemPublic = {
  id: number;
  question: string;
  answer: string;
  sortOrder: number;
};

export type FaqCategoryPublic = {
  id: number;
  title: string;
  slug: string;
  iconKey: FaqIconKey;
  sortOrder: number;
  items: FaqItemPublic[];
};

export type FaqCategoryAdmin = {
  id: number;
  title: string;
  slug: string;
  iconKey: FaqIconKey;
  sortOrder: number;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
};

export type FaqItemAdmin = {
  id: number;
  categoryId: number;
  question: string;
  answer: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export const FAQ_ICON_LABELS: Record<FaqIconKey, string> = {
  clock: 'Clock',
  document: 'Document',
  receipt: 'Receipt',
  envelope: 'Envelope',
  'chat-alert': 'Chat / alert',
};
