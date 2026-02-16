
import React from 'react';
import { CurrencyType } from './types';

export const CURRENCIES = Object.values(CurrencyType);

export const CURRENCY_SYMBOLS: Record<CurrencyType, string> = {
  [CurrencyType.USD]: '$',
  [CurrencyType.EUR]: '€',
  [CurrencyType.GBP]: '£',
  [CurrencyType.AED]: 'د.إ',
  [CurrencyType.SAR]: 'ر.س',
  [CurrencyType.EGP]: 'ج.م',
  [CurrencyType.TRY]: '₺',
};

export const INITIAL_SUPPLIERS = ['شركة المجد للصرافة', 'بنك الرياض', 'الأنصاري للصرافة', 'المتحدة للتحويلات'];
