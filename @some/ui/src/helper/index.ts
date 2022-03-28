type IClassProps = string | undefined | {
    [name: string]: any;
};

export function classify(p: IClassProps | IClassProps[]): string {
  if (!p) return '';
  if ('string' === typeof p) return p;
  if (Array.isArray(p)) return p.map(i => classify(i)).join(' ');
  return Object.keys(p).filter(k => p[k]).join(' ');
}

export function fixPosition(el: HTMLElement | Element | null) {
  let x = 0;
  let y = 0;

  for (; el; el = (el as HTMLElement).offsetParent) {
    x += (el as HTMLElement).offsetLeft;
    y += (el as HTMLElement).offsetTop;
  }

  return { x, y };
}

export function numValidate(n: number, max = Infinity, min = -Infinity) {
  return Math.max(Math.min(n, max), min);
}

