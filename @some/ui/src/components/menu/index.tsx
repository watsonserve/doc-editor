import { useMemo, useCallback } from 'react';
import { IMenuTree, IMenuProps } from '../../types';
import { classify } from '../../helper';
import './index.css';

function MenuItem(props: IMenuTree & { onClick(): void }) {
  const { title, className, Icon, tip, checkbox, active, disabled, onClick } = props;

  return useMemo(() => {
    const _className = classify([
      'some-menu__item',
      className,
      {
        active: !checkbox && active,
        disabled
      }
    ]);

    const handleClick = (ev: React.MouseEvent<HTMLLIElement, MouseEvent>) => {
      ev.stopPropagation();
      ev.preventDefault();
      onClick && onClick();
    };

    return (
      <li className={_className} onClick={handleClick}>
        {Icon && <Icon />}
        {checkbox && <input type="checkbox" checked={active} /> }
        <span className="some-menu__item__title">{title}</span>
        {tip && <span className="some-menu__item__tip">{tip}</span>}
      </li>
    );
  }, [className, checkbox, active, disabled, title, tip, Icon, onClick]);
}

export default function(props: IMenuProps) {
  const handleClick = useCallback((dist) => {
    if (dist.children) {
      // @TODO
      return;
    }
    props.onClick(dist);
  }, [props.onClick]);

  const list = useMemo(
    () => props.tree.map(item =>
      !item
      ? <hr/>
      : <MenuItem { ...item} key={item.name} onClick={() => handleClick(item)} />
    ),
    [...props.tree, handleClick]
  );

  return useMemo(() => (
    <ul className={classify(['some-menu', props.className])}>
      {list}
    </ul>), [props.className, list]);
}
