import { Alert, Platform } from 'react-native';

export function showAlert(title: string, message: string): void {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

export function confirmAction(
  title: string,
  message: string,
  onConfirm: () => void
): void {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    if (window.confirm(message)) {
      onConfirm();
    }
    return;
  }

  Alert.alert(title, message, [
    { text: 'Cancelar', style: 'cancel' },
    {
      text: 'Eliminar',
      style: 'destructive',
      onPress: onConfirm,
    },
  ]);
}
