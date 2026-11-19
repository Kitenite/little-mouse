// Owner-started pilot comparisons. Alternatives are hypotheses, not optimized presets.
const trial = (id, label, description, patch, requiresAudio = false) => ({
  id, label, description, variants: [{ id: 'A', patch: {} }, { id: 'B', patch }],
  requiresAudio, requiresNewCast: true,
});
export const sensoryTrials = [
  trial('texture-contrast', 'Texture contrast', 'Current floor texture versus reduced texture contrast.', { backgroundContrast: .35 }),
  trial('coat-brightness', 'Coat brightness', 'Current coat brightness versus a lighter coat.', { coatBrightness: 1.25 }),
  trial('sound-presence', 'Sound presence', 'Current recorded sound setting versus silence.', { sound: false }, true),
  trial('sound-frequency', 'Sound activity', 'Current cue frequency versus sparse recorded cues.', { soundFrequency: .5 }, true),
  trial('sound-volume', 'Quieter sound', 'Current gain versus half of the current gain; resolved before assignment.', { soundVolume: .35 }, true),
  trial('sound-variety', 'Sound variety / novelty', 'Current recorded cue variety versus a focused repertoire; not a direct novelty measure.', { soundVariety: 'focused' }, true),
  trial('background-surface', 'Background surface', 'Current surface versus linen; this is a bundled surface comparison.', { background: 'linen' }),
  trial('background-scale', 'Background texture scale', 'Current texture scale versus a larger texture pattern.', { backgroundScale: 1.5 }),
  trial('coat-palette', 'Coat palette / novelty', 'Current palette versus playful coats; novelty and color are not isolated.', { coatPalette: 'playful' }),
  trial('coat-saturation', 'Coat saturation', 'Current coat color strength versus muted color.', { coatSaturation: .5 }),
  trial('coat-variation', 'Coat variety', 'Current coat variety versus reduced variety on a new cast.', { coatVariation: .25 }),
  trial('brightness', 'Scene brightness', 'Current scene brightness versus subdued brightness.', { brightness: .8 }),
  trial('lighting', 'Lighting preset', 'Current lighting versus overcast; estimates a bundled lighting effect.', { lighting: 'overcast' }),
  trial('shadows', 'Shadow strength', 'Current shadows versus faint shadows.', { shadowStrength: .1 }),
  {
    id: 'coat-background-2x2', label: 'Coat × background contrast (four arms)',
    description: 'Interaction pilot, not a single-variable comparison: baseline/lighter coat × baseline/reduced floor contrast. Independent uniform four-arm assignment.',
    variants: [{ id: 'A', patch: {} }, { id: 'B', patch: { coatBrightness: 1.25 } },
      { id: 'C', patch: { backgroundContrast: .35 } }, { id: 'D', patch: { coatBrightness: 1.25, backgroundContrast: .35 } }],
    requiresAudio: false, requiresNewCast: true,
  },
];
// Prevent callers from changing the catalog used for attribution.
for (const entry of sensoryTrials) {
  for (const arm of entry.variants) { Object.freeze(arm.patch); Object.freeze(arm); }
  Object.freeze(entry.variants); Object.freeze(entry);
}
Object.freeze(sensoryTrials);
