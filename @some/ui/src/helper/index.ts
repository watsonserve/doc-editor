type IClassProps = string | undefined | {
    [name: string]: any;
};

export function classify(p: IClassProps | IClassProps[]): string {
  if (!p) return '';
  if ('string' === typeof p) return p;
  if (Array.isArray(p)) return p.map(i => classify(i)).join(' ');
  return Object.keys(p).filter(Boolean).join(' ');
}
