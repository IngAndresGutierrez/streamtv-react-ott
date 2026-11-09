# Registro del uso de Claude Code

Proyecto construido con **Claude Code** en una sesión guiada por un prompt de requisitos (stack, fases y criterios de éxito definidos por el desarrollador). Este registro separa lo que propuso la IA de lo que se validó con evidencia.

## Cómo se trabajó

| Fase | Qué hizo la IA | Validación |
| --- | --- | --- |
| 1. Scaffold | `create-vite` (React + TS), instalación de Shaka, Vitest, RTL y Playwright; estructura `components/pages/hooks/navigation/player/data/types`. | `tsc -b` limpio. |
| — Streams | Propuso streams públicos y los **verificó con `curl`**: HTTP 200, cabecera CORS, ausencia de `ContentProtection` (DRM), duración y códecs. | Detectó que el Chromium de Playwright no decodifica H.264 → E2E con Sintel (VP9). |
| 2. Home + D-pad | Lógica pura `focusGrid`, mapeo de teclas, `useRemoteKeys`, `useGridNavigation` con foco DOM real, memoria de foco por pantalla. | Lint (`exhaustive-deps`, `rules-of-hooks`, a11y) y prueba manual en navegador con screenshots. |
| 3. Player | Adaptador `PlaybackEngine` sobre Shaka con import dinámico, `usePlayer` (loading/buffering/error/retry/cleanup), autoplay con fallback a muted. | Reproducción real verificada en Chromium (VP9) y Google Chrome (H.264). |
| 4. QoE | `QoeTracker` puro con reloj inyectable, panel D con N/A explícito. | Valores reales observados en el panel (tiempo de inicio, frames, bitrate). |
| 5. Tests + docs | 59 tests Vitest, 5 E2E Playwright, README, guion. | `npm run validate` y `test:e2e` en verde; E2E repetido 3 veces (15/15) para descartar flakiness. |

## Decisiones asistidas por IA (y por qué se aceptaron)

- **Foco DOM real con roving tabindex** en lugar de foco virtual: mejor accesibilidad sin perder testabilidad.
- **Pila de pantallas sin router**: menos dependencias; el desmontaje libera el reproductor.
- **Interfaz `PlaybackEngine`**: permite probar errores sin red y preparar un futuro backend AVPlay.
- **Lienzo fijo 1920×1080 escalado**: refleja cómo se maquetan las apps de TV.
- **Arte SVG generado por script** en lugar de imágenes de terceros: sin riesgo de licencias.

## Correcciones detectadas durante la sesión

1. **Contenido con copyright**: el asset "Angel One" de la demo de Shaka resultó ser un clip de una serie comercial al revisar el screenshot. Se retiró y se usaron solo películas abiertas de Blender (CC BY 3.0).
2. **Bug de retry** (encontrado por el E2E): tras un error, al reintentar el player quedaba en "loading". Se reprodujo con un script (`video.src` vacío) y se formuló una hipótesis: el `destroy()` asíncrono del engine anterior desconectaba el MediaSource del nuevo. La corrección serializa el teardown y tiene test de regresión.
3. **Lint**: `setState` dentro de un efecto se reemplazó por el patrón de ajuste durante el render (`resetKey`); roles ARIA se cambiaron por elementos semánticos (`ul/li`, `progress`).
4. **UX**: las leyendas de teclas hacían scroll con el contenido y el rail ignoraba el área segura; se corrigió tras revisar los screenshots.

## Validaciones humanas pendientes / recomendadas

- [ ] Revisar el código completo antes de presentarlo como propio y poder explicar cada decisión.
- [ ] Ejecutar la demo en la máquina de la entrevista (red, resolución, Chrome actualizado).
- [ ] Revisar textos y tono del guion.
- [ ] Probar en una TV real o en un emulador (Tizen Studio / webOS SDK) antes de afirmar compatibilidad.
- [ ] Confirmar que los streams públicos siguen disponibles el día de la demo (`curl -I`).
