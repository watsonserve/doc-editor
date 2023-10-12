import { useMemo, useCallback } from 'react';
import { IMenuTree, IMenuProps } from '../../types';
import { classify } from '../../helper';
import './index.css';

function MenuItem<T>(props: IMenuTree<T> & { onClick(): void }) {
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
        <div className="some-menu__item__main">
          {Icon && <Icon />}
          {checkbox && <input type="checkbox" checked={active} /> }
          <span className="some-menu__item__title">{title}</span>
        </div>
        {tip && <span className="some-menu__item__tip">{tip}</span>}
      </li>
    );
  }, [className, checkbox, active, disabled, title, tip, Icon, onClick]);
}

export default function Menu<T>(props: IMenuProps<T>) {
  const { className, style, tree, onClick } = props;

  const handleClick = useCallback((dist) => {
    if (dist.children) {
      // @TODO
      return;
    }
    onClick(dist);
  }, [onClick]);

  const list = useMemo(
    () => tree.map(item =>
      !item
      ? <hr/>
      : <MenuItem { ...item} key={item.name as any} onClick={() => handleClick(item)} />
    ),
    [...tree, handleClick]
  );

  return useMemo(() => (
    <ul className={classify(['some-menu', className])} style={style}>
      {list}
    </ul>
  ), [className, style, list]);
}
