export interface NavigationCapableRouter { // Contrato mínimo que debe cumplir el router de Expo Router
  canGoBack: () => boolean; // Indica si existe al menos una pantalla previa en el historial
  back: () => void; // Retrocede una pantalla en la pila de navegación
  replace: (href: any) => void; // Sustituye la pantalla actual por una ruta de respaldo
} // Fin de interfaz NavigationCapableRouter

export function safeGoBack( // Retrocede de forma segura evitando errores GO_BACK si la pila está vacía
  router: NavigationCapableRouter, // Instancia del router obtenida con useRouter()
  fallbackRoute: string = '/home' // Ruta segura por defecto si no hubiera historial previo
): void { // No retorna valor
  try { // Protege la consulta ante casos borde en estado de navegación Web
    if (typeof router.canGoBack === 'function' && router.canGoBack()) { // Verifica primero si realmente existe pantalla atrás
      router.back(); // Navega hacia atrás normalmente en la pila
      return; // Sale sin ejecutar el fallback
    } // Fin de verificación de historial
  } catch (err) { // Si canGoBack lanzara error inesperado
    console.warn('[navigation.ts] Error verificando canGoBack, usando fallback:', err); // Registra advertencia en consola de desarrollo
  } // Fin del bloque try/catch
  router.replace(fallbackRoute); // Si no había pantalla previa (ej. tras recargar F5), redirige limpio al fallback
} // Fin de safeGoBack
