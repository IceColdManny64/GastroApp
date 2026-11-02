export interface NavigationCapableRouter {
  canGoBack: () => boolean;
  back: () => void;
  replace: (href: any) => void;
}

export function safeGoBack(
  router: NavigationCapableRouter,
  fallbackRoute: string = '/home'
): void {
  try {
    if (typeof router.canGoBack === 'function' && router.canGoBack()) {
      router.back();
      return;
    }
  } catch (err) {
    console.warn('[navigation.ts] Error verificando canGoBack, usando fallback:', err);
  }
  router.replace(fallbackRoute);
}
