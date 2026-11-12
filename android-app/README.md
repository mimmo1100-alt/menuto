# Menuto Ordini (Android)

The restaurant's order-taking app. It shows the Menuto orders screen and adds what a browser can't do:

- a background service that checks for new orders every few seconds, also with the screen off, rings with the alarm volume and shows a full-screen alert;
- printing on a paired Bluetooth thermal printer (Epson TM and ESC/POS compatibles), automatically for every accepted order (manual or auto-accepted) and on demand;
- reconnecting by itself after network or printer drops.

The web page talks to the app through `window.MenutoNative` (see `MainActivity.Bridge`), which only answers pages from the configured Menuto server.

Builds run on GitHub Actions (`.github/workflows/android.yml`); each build is published as a release with the `.apk` to install on the phone.
