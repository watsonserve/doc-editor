import React, { useMemo } from 'react';
import { fixPosition } from './index';
import { INameTitle } from '../types';

export function useDownOptions<T>(value: T, options: INameTitle<T>[]) {
  const getPosition = (el: HTMLElement) => {
    let left = 0, top = 0;

    if (el) {
      const { x, y } = fixPosition(el);
      left = x;
      top = y + el.clientHeight;
    }

    return { left, top };
  };

  const opts = useMemo(() => {
    const opts = new Array(options.length);
    let item, active, title = '';

    for (let idx in options) {
      item = options[idx];
      active = item.name === value;
      if (active) {
        title = item.title;
      }
      opts[idx] = { ...item, active };
    }

    return opts;
  }, [value, ...options]);

  return useMemo(() => ({ getPosition, options: opts }), [opts, getPosition]);
}
