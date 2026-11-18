# Little Mouse

A 3D mouse-chasing game for cats, with an Expo iPad app and a phone/laptop companion for live control and wireless iteration.

The game and phone/laptop companion are in [little-mouse](./little-mouse/README.md).

```sh
cd little-mouse
npm install
npm run build
npm run dev
```

Open http://localhost:8787 for the game or http://localhost:8787/companion for the controller. Use the computer's LAN IP from an iPad on the same network.

## iPad app

The Expo app is in [ipad](./ipad/README.md). Run `cd ipad && npm install && npm run local`, then scan the QR code with Expo Go on your iPad. The app and game update independently over the air.

## Research and review

- [Research findings](./RESEARCH-NEXT.md)
- [iPad performance review](./IPAD-PERFORMANCE.md)
- [iPad integration review](./IPAD-REVIEW.md)

The game’s hosted deployment uses the Sites configuration in `little-mouse/.openai/hosting.json`. This GitHub repository contains both applications; pushing here does not automatically deploy the hosted game or publish an Expo update. See each app’s README for its release workflow.
