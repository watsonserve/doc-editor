import { useEffect, useMemo, useState, useRef } from 'react';
import { ISelectorProps, INameTitle } from '../../types';
import { classify, fixPosition } from '../../helper';
import Menu from '../menu';
import './index.css';

type INTA<T> = INameTitle<T> & { active: boolean };

export default function Radio<T> (props: ISelectorProps<T>) {
  const [show, setShow] = useState(false);
  const selfRef = useRef(null);
  const { className, value, options, onInput } = props;

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

  const data = useMemo(() => {
    const opts = new Array<INTA<T>>(options.length);
    let item, active, title = '';

    let left = 0, top = 0;
    if (selfRef.current) {
      const { x, y } = fixPosition(selfRef.current!);
      left = x;
      top = y + (selfRef.current! as HTMLDivElement).clientHeight;
    }

    for (let idx in options) {
      item = options[idx];
      active = item.name === value;
      if (active) {
        title = item.title;
      }
      opts[idx] = { ...item, active };
    }

    return { opts, title, style: { left, top } };
  }, [options, value]);

  return (
    <div className={classify(['some-selector', className])} ref={selfRef}>
      <span className="some-selector__title" onClick={() => !show && setShow(true)}>
        {data.title}
      </span>
      {show && <Menu tree={data.opts} style={data.style} onClick={(dist: INameTitle<T>) => onInput(dist.name)} />}
    </div>
  );
}
