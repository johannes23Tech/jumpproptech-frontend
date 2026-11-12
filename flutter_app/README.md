# Jump PropTech Payments (Flutter)

This standalone Flutter Android app is a landlord-focused companion for reviewing rent records and recording payments already received. It uses the existing Jump PropTech API and stores the access token with Android secure storage.

## Run

```powershell
cd flutter_app
flutter pub get
flutter run -d android
```

For browser-based flow checks, run `flutter run -d chrome`.

## Current scope

- Landlord, agent, and superadmin sign-in using the existing API.
- Rent-record list with status, tenant, unit, period, and amount.
- In-app confirmation to record a received payment by EFT, cash, SnapScan, or another method.
- Refresh, sign-out, session expiry handling, and payment feedback.

This is a separate mobile client, not a migration of the existing React web application. It records payments that have already been received; it does not collect money or verify bank/gateway transactions. The current backend exposes only manual payment recording for this workflow. Online checkout requires backend payment initiation, provider verification, and webhook support before it can safely be added.

Multi-factor authentication is not yet available in this app; accounts requiring MFA should use the web app.
