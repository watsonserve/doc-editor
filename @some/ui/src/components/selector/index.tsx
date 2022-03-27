import { useState } from 'react';
import { ISelectorProps, INameTitle } from '../../types';
import { classify } from '../../helper';
import Menu from '../menu';
import './index.css';

export default function (props: ISelectorProps) {
  const [show, setShow] = useState(false);
  const { title = '' } = props.options.find(opt => opt.name === props.value) || {};
  const handleInput = (dist: INameTitle) => {
      props.onInput(dist.name);
      setShow(false);
  };
  return (
    <div className={classify(['some-selector', props.className])}>
      <span className="some-selector__title" onClick={() => setShow(!show)}>{title}</span>
      {show && <Menu tree={props.options} onClick={handleInput} />}
    </div>
  );
}
