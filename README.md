# Podrick’s Violin

A 3D mouse-chasing game for cats, with an Expo iPad app and local owner controls with wireless asset iteration.

The game and local controls are in [little-mouse](./little-mouse/README.md).

```sh
cd little-mouse
npm install
npm run build
npm run dev
```

Open http://localhost:8787 for the game. Use the computer's LAN IP from an iPad on the same network.

## iPad app

The Expo app is in [ipad](./ipad/README.md). For the installed development app, run `cd ipad && npm install && npm run local` and open Little Mouse on the iPad. A connected device can be installed with `npm run ios -- --device` using Apple signing. Expo Go is an optional development route. Game files update over the local network independently of the native shell.

## Research and review

- [Requirements and living policies](./docs/README.md)
- [Mouse behavior research](./docs/mouse-behavior-research.md)
- [Earlier research review (historical)](./RESEARCH-NEXT.md)
- [Earlier iPad performance review](./IPAD-PERFORMANCE.md)
- [Earlier iPad integration review](./IPAD-REVIEW.md)

The game’s hosted deployment uses the Sites configuration in `little-mouse/.openai/hosting.json`. This GitHub repository contains both applications; pushing here does not automatically deploy the hosted game or publish an Expo update. See each app’s README for its release workflow.
