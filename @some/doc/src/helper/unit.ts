let _ppi = 0;

export function getPPI(flush = false) {
  if (!flush && _ppi) return _ppi;

  const foo = document.createElement('div');
  foo.style.width = '1in';
  document.body.append(foo);
  const ppi = foo.clientWidth;
  foo.remove();
  _ppi = ppi;
  return ppi;
}

export function pt2px(pt: number) {
  return pt * _ppi / 72;
}

export function px2pt(px: number) {
  return px / _ppi * 72;
}
