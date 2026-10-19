# 05 — Sistema de Diseño UI/UX ("GastroLab Culinary Design")

## 1. Filosofía Visual y Estructura de Estilos

El diseño de **GastroLab** debe ser moderno, cálido, gastronómico, intuitivo y sumamente fácil de leer, construyendo todos los estilos mediante `StyleSheet.create({...})` al final de cada archivo de componente o pantalla.

---

## 2. Paleta de Colores ("Terracotta & Fresh Herbs")

### Modo Claro (Predeterminado)
- **Primary (Terracota Culinario):** `#C0392B` (Botones principales, chips seleccionados, acentos de marca).
- **Primary Dark (Vino / Espresso):** `#753333` (Encabezados de tarjetas destacadas, bordes activos).
- **Secondary (Verde Albahaca):** `#27AE60` (Indicadores de éxito, dificultad `"Muy facil"` / `"Facil"`, porcentaje de aprobación).
- **Accent (Ámbar / Azafrán):** `#F39C12` (Dificultad `"Medio"`, insignias de tiempo de preparación).
- **Background Principal:** `#F5F5F5` / `#FAF7F5` (Fondo general suave que hace resaltar las tarjetas blancas).
- **Surface / Card Background:** `#FFFFFF` (Fondo limpio para tarjetas, formularios y contenedores).
- **Text Primary:** `#2C1E1B` / `#333333` (Títulos y etiquetas principales con alto contraste).
- **Text Secondary:** `#555555` / `#666666` (Descripciones y textos secundarios).
- **Border / Input Background:** Borde `#CCCCCC` con fondo `#FAFAFA` para campos `TextInput`.
- **Danger / Delete:** `#C0392B` / `#D9534F` (Botón de eliminar, cerrar sesión y textos de error).

### Modo Oscuro (Configurable en `/settings`)
- **Background Principal:** `#181312`
- **Surface / Card Background:** `#241D1B`
- **Text Primary:** `#F7F2F0`
- **Text Secondary:** `#B8A9A4`
- **Primary Accent:** `#E74C3C`
- **Border:** `#382E2B`

---

## 3. Estándares de Componentes y Estilos (`StyleSheet.create`)

### 3.1 Tarjeta de Receta (`src/components/ui/card.tsx`)
La tarjeta debe presentar una jerarquía visual clara y atractiva:
- **Imagen Superior (`height: 200`, `width: '100%'`, `resizeMode: 'cover'`):**
  - En la esquina superior izquierda: Insignia (badge) con la **Categoría** (`category`).
  - En la esquina superior derecha: Botón circular para marcar/desmarcar **Favorito** (`♥`).
- **Cuerpo de la Tarjeta (`padding: 16`):**
  - **Título:** `fontSize: 18`, `fontWeight: 'bold'`, `marginBottom: 6`.
  - **Descripción:** `fontSize: 14`, `lineHeight: 20`, `color: '#555'`, `numberOfLines={2}`.
  - **Fila de Metadatos (Pills en `flexDirection: 'row'`, `gap: 8`, `marginTop: 12`):**
    - Píldora de Tiempo: `⏱️ ${prepareTime}`
    - Píldora de Dificultad con color semántico:
      - `"Muy facil"` / `"Facil"`: Fondo `#E8F8F0`, Texto `#1E8449`
      - `"Medio"`: Fondo `#FEF5E7`, Texto `#B9770E`
      - `"Dificil"`: Fondo `#FDEDEC`, Texto `#C0392B`
    - Píldora de Aprobación: `👍 ${likeRate}%`
- **Efecto al Presionar (`cardPressed`):**
  ```typescript
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  }
  ```

### 3.2 Sombras Multiplataforma Sin Warnings en Web
En React Native Web (Expo SDK 57), las propiedades `shadow*` directas muestran advertencia de deprecación en consola (`"shadow*" style props are deprecated. Use "boxShadow"`). Para lograr sombras limpias sin warnings en consola, definir las sombras de las tarjetas con `Platform.select`:

```typescript
...Platform.select({
  web: {
    boxShadow: '0px 3px 8px rgba(79, 44, 33, 0.12)',
  },
  default: {
    shadowColor: '#4f2c21',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
}),
```

### 3.3 Formularios y Botones (`form.tsx`, `index.tsx`, `register.tsx`, `settings.tsx`)
Mantener una línea de diseño uniforme en todos los formularios:
- **Labels:** `fontSize: 14`, `fontWeight: '600'`, `marginBottom: 6`, `marginTop: 12`, `color: '#333'`.
- **Inputs (`TextInput`):** `borderWidth: 1`, `borderColor: '#ccc'`, `borderRadius: 8`, `padding: 12`, `fontSize: 16`, `backgroundColor: '#fafafa'`.
- **Selector de Imagen (`imagePicker`):** `borderWidth: 2`, `borderColor: '#ccc'`, `borderStyle: 'dashed'`, `borderRadius: 8`, `height: 200`, `justifyContent: 'center'`, `alignItems: 'center'`, `overflow: 'hidden'`, `backgroundColor: '#fafafa'`.
- **Botones de Acción:** `paddingVertical: 14`, `borderRadius: 8`, `alignItems: 'center'`, con estado deshabilitado `buttonDisabled: { opacity: 0.6 }` y texto `buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 }`.
