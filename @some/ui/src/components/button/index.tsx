import { useMemo } from 'react';
import { classify } from '../../helper';
import { type IBtnProps } from '../../types';
import './index.css';

export default function Button(props: IBtnProps) {
  const { className, title, disabled, type, active, children, onClick } = props;
  const _className = useMemo(() => classify(['some-button', className, type, { active }]), [className, type, active]);

  return <button className={_className} disabled={disabled} onClick={onClick}>{ children || title }</button>
}
