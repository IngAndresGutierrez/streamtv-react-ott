import type { StreamSource } from '../types/catalog';

/**
 * Public, DRM-free test streams. All were verified to respond with HTTP 200,
 * `Access-Control-Allow-Origin: *` and no `ContentProtection` elements.
 *
 * Only Blender Foundation open movies (CC BY 3.0) are used as content.
 *
 * Note: Playwright's bundled Chromium has no H.264/AAC decoders. The Shaka demo
 * assets (Sintel, Dark Truths) also ship VP9/Opus renditions, so E2E uses them.
 */
export const STREAMS = {
  sintelDash: {
    url: 'https://storage.googleapis.com/shaka-demo-assets/sintel/dash.mpd',
    format: 'dash',
    provider: 'Shaka Player demo assets (Google)',
  },
  darkTruthsDash: {
    url: 'https://storage.googleapis.com/shaka-demo-assets/bbb-dark-truths/dash.mpd',
    format: 'dash',
    provider: 'Shaka Player demo assets (Google)',
  },
  bbbDash: {
    url: 'https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd',
    format: 'dash',
    provider: 'Akamai DASH test vectors',
  },
  bbbHls: {
    url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    format: 'hls',
    provider: 'Mux test streams',
  },
  tearsDash: {
    url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.mpd',
    format: 'dash',
    provider: 'Unified Streaming demo',
  },
  tearsHls: {
    url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
    format: 'hls',
    provider: 'Unified Streaming demo',
  },
  /** Intentionally missing manifest (HTTP 404) to demonstrate error + retry. */
  brokenDash: {
    url: 'https://storage.googleapis.com/shaka-demo-assets/streamtv-missing/dash.mpd',
    format: 'dash',
    provider: 'Manifiesto inexistente (prueba de errores)',
  },
} satisfies Record<string, StreamSource>;
