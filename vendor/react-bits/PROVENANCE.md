# NyxID CTA highlight source

Adapted from the local NyxID `frontend/src/features/website-a/visuals/react-bits/SpecularButton.tsx` implementation inspected on 2026-10-27.

Source SHA-256: `06bd5049598a1020555fa330ee8b3eb4e1a043da39a4a79705b13fda84832785`.

The upstream project is [React Bits](https://github.com/DavidHDev/react-bits/tree/496968c4117e21278f13917201b7d615bc5e7450), `src/ts-default/Components/SpecularButton/`. The source shaders and rounded-border math are retained; React lifecycle was replaced with a native DOM activity gate. The single existing ChronoAI card CTA is decorated with blue/white colors, native link semantics, reduced-motion/offscreen/background cleanup, static failure fallback and keyboard focus support. No React or animation framework is loaded.

The full MIT + Commons Clause terms are preserved in [LICENSE.md](LICENSE.md) and embedded in the JavaScript source. This integration is part of the ChronoAI site prototype, not a component package.
