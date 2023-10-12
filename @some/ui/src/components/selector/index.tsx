import { useEffect, useMemo, useState, useRef } from 'react';
import { ISelectorProps, INameTitle } from '../../types';
import { classify, fixPosition } from '../../helper';
import Menu from '../menu';
import './index.css';

export default function Selector<T> (props: ISelectorProps<T>) {
  const [show, setShow] = useState(false);
  const selfRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!show) return;

    const hide = () => {
      const timer = setTimeout(() => {
        clearTimeout(timer);
        setShow(false);
      }, 0);
    };
    window.addEventListener('click', hide, true);

    return () => window.removeEventListener('click', hide, true);
  }, [show]);

  return useMemo(() => {
    const { value, options } = props;
    const opts = new Array(options.length);
    let item, active, title = '';

    let left = 0, top = 0, width = 100;
    if (selfRef.current) {
      const { x, y } = fixPosition(selfRef.current!);
      left = x;
      top = y + selfRef.current.clientHeight;
      width = selfRef.current.clientWidth;
    }

    for (let idx in options) {
      item = options[idx];
      active = item.name === value;
      if (active) {
        title = item.title;
      }
      opts[idx] = { ...item, active };
    }

    return (
    <div className={classify(['some-selector', props.className])} ref={selfRef}>
      <span className="some-selector__title" onClick={() => !show && setShow(true)}>
        {title}
      </span>
      {show && <Menu tree={opts} style={{ left, top, width }} onClick={(dist: INameTitle<T>) => props.onInput(dist.name)} />}
    </div>
  )}, [props.className, props.value, props.options, setShow, props.onInput, show]);
}
