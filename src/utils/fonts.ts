import { Platform } from 'react-native';

/**
 * Get the correct font family name for the current platform
 * Android requires lowercase font names, iOS can use the exact name
 */
export const getFontFamily = (fontName: string): string => {
  if (Platform.OS === 'android') {
    // Android typically requires lowercase font names
    return fontName.toLowerCase();
  }
  // iOS uses the exact font name (PostScript name)
  return fontName;
};

// Font family constants
export const Fonts = {
  ColabMed: getFontFamily('ColabMed'),
  ColabReg: getFontFamily('ColabReg'),
  ColabBol: getFontFamily('ColabBol'),
  ColabLig: getFontFamily('ColabLig'),
  ColabThi: getFontFamily('ColabThi'),
};

