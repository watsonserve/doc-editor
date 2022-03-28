import React, { useEffect, useState } from 'react';
import { classify, numValidate } from '../../helper';
import { ISteperProps } from '../../types';
import './index.css';

export default function(props: ISteperProps) {
  const [num, setNum] = useState(props.value.toString());

  useEffect(() => {
    setNum(numValidate(props.value, props.max, props.min).toString());
  }, [props.value, props.max, props.min, setNum]);

  const _emitInput = (_n: number) => {
    _n = Number.isNaN(_n) ? props.value : numValidate(_n, props.max, props.min);
    setNum(_n.toString());
    props.onInput(_n);
  };
  
  const emitInput = (ev: React.FocusEvent) => {
    ev.stopPropagation();
    ev.preventDefault();

    let _n = props.value;
    if (num.startsWith('0x') || num.startsWith('0X')) {
      _n = parseInt(num, 16);
    } else {
      _n = parseFloat(num);
    }
    _emitInput(_n);
  };

  const handleInput = (ev: React.FormEvent<HTMLInputElement>) => {
    ev.stopPropagation();
    ev.preventDefault();
    setNum((ev.target as HTMLInputElement).value);
  };

  const handleClick = (ev: React.MouseEvent<HTMLSpanElement, MouseEvent>, c: -1 | 1) => {
    ev.stopPropagation();
    ev.preventDefault();
    _emitInput(props.value + c * (props.step || 1));
  };

  const min = props.min || -Infinity;
  const max = props.max || Infinity;

  return (
    <div className={classify(['some-steper', props.className])}>
      <span
        className={classify({"some-steper__sub": true, disabled: +num <= min })}
        onClick={ev => handleClick(ev, -1)}
      >-</span>
      <input
        className="some-steper__input"
        type="text"
        value={num}
        onInput={handleInput}
        onFocus={props.onFocus}
        onBlurCapture={emitInput}
      />
      <span
        className={classify({"some-steper__add": true, disabled: +num >= max })}
        onClick={ev => handleClick(ev, 1)}
      >+</span>
    </div>
  );
}
