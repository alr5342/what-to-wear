// Temporary SVG shapes for the approved 13-piece wardrobe. These prove garment
// and color changes in Checkpoint 2; they are not the final character design.
const NS = 'http://www.w3.org/2000/svg';

function top(longSleeves, sweater = false) {
  const end = longSleeves ? 165 : 130;
  return `<path d="M70 102 L55 ${end} M130 102 L145 ${end}" fill="none" stroke="currentColor" stroke-width="24" stroke-linecap="round"/>
    <rect x="66" y="87" width="68" height="95" rx="16"/>
    <path d="M88 88 Q100 ${sweater ? 109 : 99} 112 88" fill="none"/>
    ${sweater ? '<path d="M91 91 V102 M96 94 V105 M104 94 V105 M109 91 V102 M70 174 H130 M75 177 V182 M85 177 V182 M115 177 V182 M125 177 V182" fill="none"/>' : ''}`;
}

function bottom(id) {
  const end = id === 'shorts' ? 214 : id === 'joggers' ? 249 : 257;
  return `<path d="M88 180 L86 ${end} M112 180 L114 ${end}" fill="none" stroke="currentColor" stroke-width="${id === 'joggers' ? 23 : 27}" stroke-linecap="${id === 'joggers' ? 'round' : 'butt'}"/>
    <rect x="68" y="169" width="64" height="25" rx="8"/>
    <path d="M100 174 V196 ${id === 'joggers' ? 'M95 175 L99 182 M105 175 L101 182 M76 245 H96 M104 245 H124' : 'M71 176 L80 186 M129 176 L120 186'}" fill="none"/>`;
}

function footwear(id) {
  const height = id === 'sneakers' ? 258 : id === 'ankleboots' ? 246 : 232;
  return `<path d="M62 276 Q62 261 74 258 V${height} H94 V276 Z M138 276 Q138 261 126 258 V${height} H106 V276 Z"/>
    <path d="M62 272 H94 M106 272 H138 M78 261 H90 M110 261 H122 ${id === 'winterboots' ? 'M74 237 H94 M106 237 H126 M78 247 H90 M110 247 H122' : ''}" fill="none"/>`;
}

function outerwear(coat) {
  const hem = coat ? 207 : 190;
  // Open center preserves the visible top differences underneath both layers.
  return `<path d="M70 102 L55 165 M130 102 L145 165" fill="none" stroke="currentColor" stroke-width="29" stroke-linecap="round"/>
    <path d="M94 88 Q65 87 63 110 V${hem} H94 Z M106 88 Q135 87 137 110 V${hem} H106 Z"/>
    <path d="M94 88 L83 103 L94 109 M106 88 L117 103 L106 109" fill="none"/>
    ${coat ? '<path d="M65 120 H93 M65 139 H93 M65 158 H93 M65 177 H93 M107 120 H135 M107 139 H135 M107 158 H135 M107 177 H135" fill="none"/>' : '<path d="M68 163 H86 V177 H68 Z M114 163 H132 V177 H114 Z" fill="none"/>'}`;
}

const SHAPES = {
  tee: top(false), longsleeve: top(true), sweater: top(true, true),
  shorts: bottom('shorts'), chinos: bottom('chinos'), joggers: bottom('joggers'),
  sneakers: footwear('sneakers'), ankleboots: footwear('ankleboots'), winterboots: footwear('winterboots'),
  shell: outerwear(false), coat: outerwear(true),
  sunhat: '<path d="M75 42 L82 18 H118 L125 42 Z"/><ellipse cx="100" cy="43" rx="44" ry="8"/><path d="M78 34 H122" fill="none"/>',
  beanie: '<path d="M69 44 Q69 13 100 13 Q131 13 131 44 Z"/><rect x="68" y="36" width="64" height="13" rx="4"/><path d="M75 39 V46 M84 39 V46 M93 39 V46 M102 39 V46 M111 39 V46 M120 39 V46" fill="none"/>',
};

export function garmentLayer(item) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 200 300');
  svg.setAttribute('class', `layer layer-${item.category}`);
  svg.setAttribute('aria-hidden', 'true');
  svg.dataset.item = item.itemId;
  svg.dataset.color = String(item.colorIndex);
  svg.style.color = item.color;
  // Markup comes only from this static catalog, never from user/API text.
  svg.innerHTML = `<g fill="currentColor" stroke="#2b2622" stroke-width="2.5" stroke-linejoin="round">${SHAPES[item.itemId]}</g>`;
  return svg;
}
