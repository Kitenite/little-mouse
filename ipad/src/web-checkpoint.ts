export function webCheckpointScript(origin: string): string {
  return `(() => {
    if (location.origin !== ${JSON.stringify(origin)}) return true;
    const checkpoint = () => {
      const state = window.mouseDiagnostics?.();
      if (!state) return;
      // Recovery retains the last healthy session, even while play is suspended.
      if (!state.recovering) {
        try { localStorage.setItem('mouse-resume', JSON.stringify({playing:state.playing,catches:state.catches,elapsed:state.elapsed,at:Date.now()})); } catch {}
      }
      window.ReactNativeWebView?.postMessage(JSON.stringify({type:'play-state',playing:state.playing}));
    };
    checkpoint(); setInterval(checkpoint, 1000); return true;
  })(); true;`;
}
