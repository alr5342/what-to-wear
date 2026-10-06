// Developer-only preview controls. Not part of the product.
//
//   ?view=loaded|firstrun|loading|error|denied   start in a given Main state
//   ?condition=sunny|cloudy|rain|snow|storm       start with a given weather tint
//   ?dev                                          show a small toolbar to switch both live
//
// This grows into the developer override for testing recommendation
// thresholds, and must be gated or removed before peer usability testing
// (see plan.md).

export const VIEWS = ['loaded', 'firstrun', 'loading', 'error', 'denied'];
export const CONDITIONS = ['sunny', 'cloudy', 'rain', 'snow', 'storm'];

/** Reads URL overrides and, with ?dev, mounts the toolbar. Returns the overrides. */
export function initDevTools({ onView, onCondition }) {
  const params = new URLSearchParams(window.location.search);
  const overrides = {
    view: VIEWS.includes(params.get('view')) ? params.get('view') : null,
    condition: CONDITIONS.includes(params.get('condition')) ? params.get('condition') : null,
  };

  if (params.has('dev')) {
    document.body.append(buildToolbar({ onView, onCondition }));
  }
  return overrides;
}

function buildToolbar({ onView, onCondition }) {
  const bar = document.createElement('details');
  bar.className = 'devbar';
  bar.innerHTML = '<summary>dev preview</summary>';
  bar.append(
    buttonGroup('View', VIEWS, onView, () => document.getElementById('main').dataset.view),
    buttonGroup('Condition', CONDITIONS, onCondition, () => document.body.dataset.condition),
  );
  return bar;
}

function buttonGroup(title, values, onPick, getCurrent) {
  const group = document.createElement('fieldset');
  const legend = document.createElement('legend');
  legend.textContent = title;
  group.append(legend);

  const buttons = values.map((value) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = value;
    button.addEventListener('click', () => {
      onPick(value);
      sync();
    });
    return button;
  });
  // Highlight whichever value is active right now.
  const sync = () => buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.textContent === getCurrent())));

  group.append(...buttons);
  queueMicrotask(sync);
  return group;
}
