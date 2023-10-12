import React, { useEffect, useState, useRef } from 'react';
import Menu from '../menu';
import { classify, numValidate } from '../../helper';
import { useDownOptions } from '../../helper/hook';
import { ISteperProps, INameTitle } from '../../types';
import './index.css';

export default function Steper(props: ISteperProps) {
  const [num, setNum] = useState(props.value.toString());
  const [showOpts, setShowOpts] = useState(0);
  const selfRef = useRef(null);
  const optTimer = useRef(0);

  useEffect(() => {
    setNum(numValidate(props.value, props.max, props.min).toString());
  }, [props.value, props.max, props.min, setNum]);

  const _emitInput = (_n: number) => {
    _n = Number.isNaN(_n) ? props.value : numValidate(_n, props.max, props.min);
    setNum(_n.toString());
    props.onInput(_n);
  };
  
  const emitInput = (ev: React.SyntheticEvent) => {
    ev.stopPropagation();
    ev.preventDefault();

    let _n: number;
    if (num.startsWith('0x') || num.startsWith('0X')) {
      _n = parseInt(num, 16);
    } else {
      _n = parseFloat(num);
    }
    if (_n !== props.value) {
      _emitInput(_n);
    }

    setShowOpts(1);

    optTimer.current = window.setTimeout(() => {
      if (optTimer.current) clearTimeout(optTimer.current);
      optTimer.current = 0;
      setShowOpts(0);
    }, 1000);
  };

  const handleInput = (ev: React.FormEvent<HTMLInputElement>) => {
    ev.stopPropagation();
    ev.preventDefault();
    setNum((ev.target as HTMLInputElement).value);
  };

  const handleClick = (ev: React.MouseEvent<HTMLSpanElement, MouseEvent>, c: -1 | 1) => {
    ev.stopPropagation();
    ev.preventDefault();
    _emitInput(+num + c * (props.step || 1));
  };

  const handleFocus = (ev: React.FocusEvent) => {
    ev.stopPropagation();
    ev.preventDefault();

    if (optTimer.current) clearTimeout(optTimer.current);
    setShowOpts(2);
  };

  const handleCheck = (dist: INameTitle<number>) => {
    _emitInput(dist.name);
    setShowOpts(0);
  };

  const { getPosition, options } = useDownOptions(+num, props.options);

  const min = props.min || -Infinity;
  const max = props.max || Infinity;

  return (
    <div className={classify(['some-steper', props.className])} ref={selfRef}>
      <span
        className={classify({"some-steper__sub": true, disabled: +num <= min })}
        onClick={ev => handleClick(ev, -1)}
      >-</span>
      <input
        className="some-steper__input"
        type="text"
        value={num}
        onInput={handleInput}
        onFocus={handleFocus}
        onBlurCapture={emitInput}
        onKeyUp={(ev) => 'enter' === ev.key.toLowerCase() && emitInput(ev)}
      />
      <span
        className={classify({"some-steper__add": true, disabled: +num >= max })}
        onClick={ev => handleClick(ev, 1)}
      >+</span>

      {!!showOpts && <Menu
        className={classify({ 'some-hide': showOpts === 1 })}
        tree={options}
        style={getPosition(selfRef.current!)}
        onClick={handleCheck}
      />}
    </div>
  );
}
