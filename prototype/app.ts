import { createMindMap } from '../packages/markmap-nomad/src';
import yaml from './NOMAD.yaml?raw';

void createMindMap({ target: '#app', yaml }).catch((error) => {
  const target = document.querySelector<HTMLElement>('#app');
  if (target) target.textContent = `Unable to render mind map: ${error}`;
});
