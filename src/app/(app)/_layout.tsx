import { Redirect, Stack, useRouter } from 'expo-router'; // Redirección declarativa, Stack protegido y router
import { useEffect, useState } from 'react'; // Estados y ciclo de vida al montar el grupo protegido
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'; // UI básica de carga y botones
import { safeGoBack } from '@/utils/navigation'; // Retroceso seguro para todas las sub-pantallas
import { useThemeMode } from '@/utils/preferencesStorage'; // Sincroniza encabezados con tema oscuro en vivo
import { getToken } from '@/utils/tokenStorage'; // Comprueba token activo antes de mostrar cualquier pantalla privada

export default function AppLayout() { // Layout guardia que protege todo el grupo (app)/
  const [checking, setChecking] = useState(true); // Indica si sigue verificando token en dispositivo
  const [isLoggedIn, setIsLoggedIn] = useState(true); // Se ajusta según resultado real de getToken()
  const isDark = useThemeMode(); // Estado booleano reactivo de Modo Oscuro
  const router = useRouter(); // Instancia router para botón volver

  useEffect(() => { // Verifica autenticación al entrar al grupo privado
    (async () => { // IIFE asíncrona para leer token
      const token = await getToken(); // Consulta token guardado
      setIsLoggedIn(!!token); // True si existe token, false si no hay sesión
      setChecking(false); // Finaliza verificación
    })(); // Ejecuta inmediatamente
  }, []); // Se ejecuta al montar AppLayout

  if (checking) { // Mientras revisa si el usuario tiene sesión
    return ( // Muestra spinner centrado con el color del tema actual
      <View style={[styles.centered, isDark && styles.centeredDark]}>{/* Fondo claro u oscuro */}
        <ActivityIndicator // Indicador giratorio
          size="large" // Tamaño grande
          color={isDark ? '#E74C3C' : '#C0392B'} // Rojo terracota según tema
        />{/* Cierra etiqueta autocontenida de componente */}
      </View> // Fin centrado
    ); // Fin return spinner
  } // Fin checking

  if (!isLoggedIn) { // Si alguien entró directo a /home o /settings sin sesión
    return <Redirect href="/(auth)/login" />; // Lo expulsa automáticamente a Login
  } // Fin protección de ruta

  const renderBackButton = (fallbackRoute: string) => ( // Helper reutilizable para botón "← Volver" seguro en todas las pantallas hijas
    <Pressable // Botón izquierdo en la barra de navegación
      onPress={() => safeGoBack(router, fallbackRoute)} // Usa router.back() si hay historial o replace('/home') si no
      style={styles.backButton} // Margen táctil cómodo
    >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
      <Text style={styles.backButtonText}>← Volver</Text>{/* Etiqueta visible blanca */}
    </Pressable> // Fin Pressable volver
  ); // Fin renderBackButton

  return ( // Renderiza pila de pantallas protegidas
    <Stack // Navegador interno de la aplicación autenticada
      screenOptions={{ // Opciones visuales compartidas por las 5 pantallas
        orientation: 'default', // Rotación portrait/landscape permitida
        headerStyle: { // Barra superior adaptada al tema claro/oscuro en vivo
          backgroundColor: isDark ? '#1F1615' : '#753333', // Vino o café oscuro
        }, // Fin headerStyle
        headerTintColor: '#FFFFFF', // Texto e íconos blancos
        headerTitleStyle: { fontWeight: 'bold' }, // Títulos en negrita
        contentStyle: { // Color de fondo base de las pantallas internas
          backgroundColor: isDark ? '#181312' : '#FAF7F5', // Café oscuro o crema
        }, // Fin contentStyle
      }} // Fin screenOptions
    >{/* Cierra etiqueta de apertura y comienza contenido hijo */}
      <Stack.Screen // Pantalla principal Catálogo
        name="home" // Archivo home.tsx
        options={{ // Opciones encabezado Home
          title: 'Catálogo de Recetas', // Título visible arriba
          headerBackVisible: false, // Home es la raíz privada: no lleva botón volver
          headerLeft: () => null, // Oculta botón izquierdo
        }} // Fin options home
      />{/* Cierra etiqueta autocontenida de componente */}
      <Stack.Screen // Pantalla de Detalle de Receta
        name="details" // Archivo details.tsx
        options={{ // Opciones encabezado Detalle
          title: 'Detalle de Receta', // Título superior
          headerBackVisible: false, // Reemplaza flecha nativa para evitar GO_BACK warning
          headerLeft: () => renderBackButton('/home'), // Botón volver seguro hacia Home si no había historial
        }} // Fin options details
      />{/* Cierra etiqueta autocontenida de componente */}
      <Stack.Screen // Pantalla de Crear / Editar Receta
        name="form" // Archivo form.tsx
        options={{ // Opciones encabezado Formulario
          title: 'Formulario de Receta', // Título superior
          headerBackVisible: false, // Reemplaza flecha nativa
          headerLeft: () => renderBackButton('/home'), // Botón volver seguro
        }} // Fin options form
      />{/* Cierra etiqueta autocontenida de componente */}
      <Stack.Screen // Pantalla de Mis Favoritos
        name="favorites" // Archivo favorites.tsx
        options={{ // Opciones encabezado Favoritos
          title: 'Mis Favoritos', // Título superior
          headerBackVisible: false, // Reemplaza flecha nativa
          headerLeft: () => renderBackButton('/home'), // Botón volver seguro
        }} // Fin options favorites
      />{/* Cierra etiqueta autocontenida de componente */}
      <Stack.Screen // Pantalla de Configuración y Cuenta
        name="settings" // Archivo settings.tsx
        options={{ // Opciones encabezado Configuración
          title: 'Configuración', // Título superior
          headerBackVisible: false, // Reemplaza flecha nativa
          headerLeft: () => renderBackButton('/home'), // Botón volver seguro
        }} // Fin options settings
      />{/* Cierra etiqueta autocontenida de componente */}
    </Stack> // Fin Stack AppLayout
  ); // Fin return JSX
} // Fin AppLayout

const styles = StyleSheet.create({ // Estilos del spinner y botón volver de AppLayout
  centered: { // Contenedor spinner claro
    flex: 1, // Altura completa
    justifyContent: 'center', // Centra verticalmente
    alignItems: 'center', // Centra horizontalmente
    backgroundColor: '#FAF7F5', // Crema claro
  }, // Fin centered
  centeredDark: { // Contenedor spinner oscuro
    backgroundColor: '#181312', // Café oscuro
  }, // Fin centeredDark
  backButton: { // Botón volver en header
    paddingHorizontal: 10, // Aire horizontal
    paddingVertical: 6, // Aire vertical
    marginRight: 8, // Margen antes del título
    borderRadius: 6, // Esquinas suaves
  }, // Fin backButton
  backButtonText: { // Texto del botón volver
    color: '#FFFFFF', // Blanco legible
    fontSize: 15, // Tamaño cómodo
    fontWeight: '700', // Negrita
  }, // Fin backButtonText
}); // Fin StyleSheet AppLayout
