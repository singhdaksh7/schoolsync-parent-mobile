# SchoolSync Mobile — Environment Configuration

The app reads exactly one config value at runtime: `EXPO_PUBLIC_API_URL`
(`lib/api-client.ts`). It is a public build-time value — anything under
`EXPO_PUBLIC_*` is inlined into the JS bundle and readable by anyone with the
APK, so **never** put a secret behind that prefix. Backend secrets
(`DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, JWT/Redis/S3/email keys, worker
secrets) live only in the `schoolsync` backend's own environment and must
never appear in this mobile project.

## How the value is resolved

- **Local development** (`expo start`): read from `.env.local` (gitignored,
  never committed). Point it at a backend reachable from your device —
  `localhost`/`127.0.0.1` only works in a simulator or with the dev client
  tunnelled to the same machine; a physical device on the same Wi-Fi needs
  your machine's LAN IP (`192.168.x.x`), and a device off that network needs a
  public HTTPS URL.
- **EAS Build** (`development` / `preview` / `production` profiles): `eas.json`
  sets `build.<profile>.env.EXPO_PUBLIC_API_URL` explicitly. This is required
  because EAS Build's project archive respects `.gitignore`/`.easignore`, so a
  gitignored `.env.local` is **not** uploaded with the build — without the
  `eas.json` override, a cloud-built APK would ship with no API URL configured
  at all (`API_CONFIG_ERROR`).

## Current values

| Profile | `EXPO_PUBLIC_API_URL` | Notes |
|---|---|---|
| development | `https://school-sync-five.vercel.app` | EAS-managed dev-client build default; override locally via `.env.local` when pairing with a local backend + Metro |
| preview | `https://school-sync-five.vercel.app` | Stable branch alias for the `internship-team/school-sync` Vercel project's `main` production deployment. Verified reachable (see Wave 4 API health check). |
| production | `https://school-sync-five.vercel.app` | Placeholder — same URL as preview today. Before a real production release, decide whether the mobile production profile should point at this alias or a dedicated production domain, and update `eas.json` accordingly. |

`https://school-sync-five.vercel.app` is a Vercel deployment alias, not a
deployment-specific hash URL — it always resolves to the current `main`
production deployment of the `internship-team/school-sync` project, so it
does not need to be updated on every backend deploy.

**Never** use `localhost` or `127.0.0.1` in `preview` or `production` — a
physical Android device resolves those to itself, not to your development
machine.

## Changing the environment

Edit the relevant profile's `env` block in `eas.json`, then rebuild with
`eas build --platform android --profile <profile>`. There is no `runtimeVersion`
policy configured beyond Expo's default (tied to the SDK version); EAS Update
/ OTA is not currently configured for this project.
