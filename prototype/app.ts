import { createMindMap } from '../packages/markmap-nomad/src';
import markdown from './NOMAD.md?raw';

void createMindMap({ target: '#app', markdown }).catch((error) => {
  const target = document.querySelector<HTMLElement>('#app');
  if (target) target.textContent = `Unable to render mind map: ${error}`;
});
