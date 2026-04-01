'use client';

import { useEffect } from 'react';
import {
  applyStorefrontThemeToDocument,
  mergeStorefrontTheme,
  type StorefrontThemeTokens,
} from '@/lib/storefront-theme';

type Props = {
  themeJson: unknown;
};

export function StorefrontThemeInjector({ themeJson }: Props) {
  useEffect(() => {
    const tokens: StorefrontThemeTokens = mergeStorefrontTheme(themeJson);
    applyStorefrontThemeToDocument(tokens);
  }, [themeJson]);

  return null;
}
