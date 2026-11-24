import { Alert, Platform } from 'react-native'; // Importa sistema nativo de alertas y detector de plataforma

export function showAlert(title: string, message: string): void { // Muestra un aviso compatible con Web, iOS y Android
  if (Platform.OS === 'web' && typeof window !== 'undefined') { // En Web Alert.alert no muestra nada, así que detectamos navegador
    window.alert(`${title}\n\n${message}`); // Lanza el cuadro nativo del navegador con título y mensaje
    return; // Termina la ejecución en Web
  } // Fin de verificación Web
  Alert.alert(title, message); // En Android o iOS muestra el diálogo nativo de sistema
} // Fin de showAlert

export function confirmAction( // Muestra un diálogo de confirmación antes de ejecutar una acción destructiva
  title: string, // Título del cuadro de confirmación en móvil
  message: string, // Pregunta de confirmación para el usuario
  onConfirm: () => void // Función callback que corre solo si el usuario acepta
): void { // No retorna valor; ejecuta callback al confirmar
  if (Platform.OS === 'web' && typeof window !== 'undefined') { // Si corre en navegador web con window disponible
    if (window.confirm(message)) { // Abre diálogo Aceptar/Cancelar del navegador y revisa si aceptó
      onConfirm(); // Ejecuta la acción confirmada (por ejemplo borrar receta)
    } // Fin del condicional de confirmación Web
    return; // Termina sin llegar al Alert nativo
  } // Fin de rama Web

  Alert.alert(title, message, [ // En móvil dibuja alerta con botones personalizados
    { text: 'Cancelar', style: 'cancel' }, // Botón que cierra el diálogo sin hacer nada
    { // Botón de confirmación destructiva
      text: 'Eliminar', // Etiqueta roja de confirmación
      style: 'destructive', // Estilo rojo de peligro en iOS
      onPress: onConfirm, // Ejecuta el callback al presionar Eliminar
    }, // Fin del botón confirmar
  ]); // Fin de configuración de Alert
} // Fin de confirmAction
