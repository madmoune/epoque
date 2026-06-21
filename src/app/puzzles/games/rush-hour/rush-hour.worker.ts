/// <reference lib="webworker" />

import { generateRushHourPuzzle } from './rush-hour.generator';

addEventListener('message', ({ data }: MessageEvent<{ count?: number }>) => {
  const count = Math.max(1, Math.min(4, data.count ?? 1));
  for (let index = 0; index < count; index++) {
    const puzzle = generateRushHourPuzzle((batch) =>
      postMessage({ type: 'progress', batch, puzzleIndex: index }),
    );
    postMessage({ type: 'ready', puzzle });
  }
  postMessage({ type: 'complete' });
});
