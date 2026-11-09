# Guion de demostración · 3 minutos

**Preparación (antes de la entrevista)**
- `npm run build && npm run preview` (o `npm run dev`) y abrir Chrome a pantalla completa en `http://localhost:4173`.
- Tener abiertos el editor con `src/navigation/focusGrid.ts` y una terminal.
- Opcional: `localStorage.clear()` en consola para partir del estado inicial.
- No tocar el mouse durante la demo: todo con teclado.

---

### 0:00 – 0:20 · Contexto
> "StreamTV es un MVP de app OTT para Smart TV en React y TypeScript. Prioricé tres cosas: navegación con control remoto sin perder el foco, reproducción real con Shaka y métricas de QoE honestas. Todo lo que van a ver lo hago solo con el teclado, que simula el D-pad."

### 0:20 – 1:00 · Home y navegación D-pad
- Mostrar el foco inicial en **Reproducir** del hero.
- `↓` a *Continuar viendo* (barras de progreso), `↓` a *Tendencias*, `→ → →`: el rail hace scroll y la tarjeta enfocada queda alineada al área segura.
- `↑` y `↓`: **vuelve a la misma columna** (memoria por fila).
> "La lógica de foco está separada de la UI: `focusGrid.ts` es una función pura probada con Vitest, y los componentes solo reciben `getItemProps`. Uso foco DOM real con roving tabindex, así funciona con lectores de pantalla."

### 1:00 – 1:25 · Detalle y restauración del foco
- `Enter` en una tarjeta → detalle (Reanudar / Desde el inicio / Volver).
- `Esc` → regresa al catálogo **exactamente en la misma tarjeta**.
> "Solo la pantalla superior está montada. Al volver, Home se remonta y recupera su posición desde una memoria de foco por pantalla. Los listeners se eliminan al desmontar, y hay un test que lo verifica."

### 1:25 – 2:15 · Reproductor real + QoE
- Ir a *Cine abierto* → **Sintel** → `Enter` → *Reanudar*.
- Mostrar el spinner de carga y luego la reproducción. `Enter` pausa/reproduce, `→ Enter` adelanta 10 s.
- Pulsar **D**: tiempo de inicio real, rebuffering, frames perdidos, resolución, bitrate, ancho de banda estimado y códecs.
> "Es DASH real con Shaka 5, sin DRM: no lo implementé ni lo simulo. Las métricas que el navegador no expone aparecen como N/A, nunca invento valores. Shaka se carga con import dinámico: Home pesa unos 81 kB gzip y Shaka 290 kB solo al abrir el player."

### 2:15 – 2:40 · Error y retry
- `Esc`, `Esc` → *Laboratorio de streaming* → **Señal de prueba · Error** → reproducir.
- Diálogo con `NETWORK · 1001 BAD_HTTP_STATUS` y **Reintentar** enfocado.
> "Un bug real que encontró el E2E: al reintentar, el `destroy()` asíncrono del engine anterior vaciaba el MediaSource del nuevo. Lo resolví serializando el teardown y dejé un test de regresión."

### 2:40 – 3:00 · Calidad y cierre
- Terminal: `npm run validate` (o mostrar el último resultado) y mencionar `npm run test:e2e`.
> "59 tests unitarios y 5 E2E con Playwright que navegan solo con teclado y reproducen video real. Lo que no afirmo: compatibilidad con Tizen o webOS. Los keyCodes y el empaquetado están documentados como pendientes de validar en hardware, igual que el rendimiento en SoCs de gama baja. Ese sería mi siguiente paso."

---

**Preguntas probables y respuestas cortas**
- *¿Por qué no una librería de spatial navigation?* Para una rejilla de filas, unas 60 líneas puras y probadas son más fáciles de depurar que una librería genérica basada en geometría. Si el layout se volviera libre (grillas irregulares), evaluaría Norigin Spatial Navigation.
- *¿Cómo llevarías esto a Tizen/webOS?* Empaquetar con `config.xml`/`appinfo.json`, registrar las teclas del control, probar MSE y códecs por modelo, perfilar memoria, y si hace falta implementar un `PlaybackEngine` con AVPlay detrás de la misma interfaz.
- *¿DRM?* Shaka soporta EME con Widevine/PlayReady configurando `drm.servers`, pero requiere servidor de licencias y validación en dispositivo. Está fuera de alcance de forma explícita.
