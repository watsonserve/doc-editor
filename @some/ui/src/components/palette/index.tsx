import { ChangeEvent } from 'react';
import { classify } from '../../helper';
import './index.css';

interface IPaletteProps {
  className?: string;
  value: number;
  onInput: (n: string) => void;
  children: any;
}

export default function Palette(props: IPaletteProps) {
  const { className, value, onInput, children } = props;

  const handleChange = (ev: ChangeEvent<HTMLInputElement>) => onInput(ev.target.value);

  return (
    <div className={classify(['some-palette', className])}>
      {children}
      <input type="color" className="some-palette__inner" value={value} onChange={handleChange} />
    </div>
  );
}
