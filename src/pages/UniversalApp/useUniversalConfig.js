import { useLocation } from 'react-router-dom';

export function useUniversalConfig() {
  const { pathname } = useLocation();
  // basePath is the first segment, e.g. '/universal-app' or '/universal-app-2' or '/universal-app-foo'
  const basePath = `/${pathname.split('/').filter(Boolean)[0] || ''}`;

  // Derive suffix from basePath
  // '/universal-app'           -> ''
  // '/universal-app-2'         -> '_2'
  // '/universal-app-sales'     -> '_sales'
  let suffix = '';
  if (basePath.startsWith('/universal-app-')) {
    const tail = basePath.slice('/universal-app-'.length);
    // Only add suffix if tail exists
    if (tail) suffix = `_${tail}`;
  }

  return {
    basePath,                                 // '/universal-app' | '/universal-app-2' | ...
    suffix,                                   // '' | '_2' | '_sales'
    descriptionTag: `UNIVERSAL_APP${suffix}`,
    backgroundSettingType: `UNIVERSAL_BACKGROUND${suffix}`,
  };
}


