import { Redirect } from 'expo-router'; // Componente declarativo para redirigir sin errores de historial
import { useEffect, useState } from 'react'; // Hooks React para estado de revisión de sesión
import { ActivityIndicator, StyleSheet, View } from 'react-native'; // Spinner de carga y contenedor centrado
import { useThemeMode } from '@/utils/preferencesStorage'; // Tema claro/oscuro reactivo durante el spinner
import { getToken } from '@/utils/tokenStorage'; // Lee el token persistido del dispositivo

export default function Index() { // Guardia inicial (Gatekeeper) en la ruta raíz "/"
  const [checking, setChecking] = useState(true); // Indica si todavía se está consultando token en disco
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Indica si se encontró sesión activa válida
  const isDark = useThemeMode(); // Lee tema actual para mostrar spinner en el fondo correcto

  useEffect(() => { // Ejecuta revisión de sesión una sola vez al abrir la aplicación
    (async () => { // IIFE asíncrona para poder usar await dentro de useEffect
      const token = await getToken(); // Consulta localStorage (Web) o SecureStore (móvil)
      setIsLoggedIn(!!token); // Convierte presencia de texto token en booleano estricto true/false
      setChecking(false); // Apaga pantalla de carga para habilitar la redirección
    })(); // Invoca inmediatamente la función asíncrona
  }, []); // Solo al montar Index

  if (checking) { // Mientras termina de leer el almacenamiento del teléfono
    return ( // Muestra indicador de carga centrado
      <View style={[styles.centered, isDark && styles.centeredDark]}>{/* Fondo claro u oscuro centrado */}
        <ActivityIndicator // Rueda giratoria nativa de carga
          size="large" // Tamaño grande visible
          color={isDark ? '#E74C3C' : '#C0392B'} // Terracota adaptado al tema
        />{/* Cierra etiqueta autocontenida de componente */}
      </View> // Fin contenedor spinner
    ); // Fin return cargando
  } // Fin condicional checking

  return isLoggedIn ? ( // Ya revisado: decide declarativamente a qué grupo entrar
    <Redirect href="/(app)/home" /> // Si había token salta directo al catálogo sin pedir login
  ) : ( // Si no había token guardado
    <Redirect href="/(auth)/login" /> // Manda al formulario de inicio de sesión
  ); // Fin retorno Redirect
} // Fin Index Gatekeeper

const styles = StyleSheet.create({ // Estilos del guardia inicial
  centered: { // Contenedor pantalla completa centrado en modo claro
    flex: 1, // Ocupa 100% de la altura
    justifyContent: 'center', // Centra verticalmente
    alignItems: 'center', // Centra horizontalmente
    backgroundColor: '#FAF7F5', // Crema claro de marca
  }, // Fin centered
  centeredDark: { // Fondo del spinner en Modo Oscuro
    backgroundColor: '#181312', // Café oscuro profundo
  }, // Fin centeredDark
}); // Fin StyleSheet Index
