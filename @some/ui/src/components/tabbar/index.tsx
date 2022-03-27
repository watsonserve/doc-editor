import { useMemo, useRef, useEffect, useState } from 'react';
import { TabItemProps, ITabBarProps } from '../../types';
import { classify } from '../../helper';
import './index.css';

function TabItem(props: TabItemProps) {
  const { active, title, onClick } = props;
  return useMemo(() => (
    <li className={classify({ 'some-title-item': true, active })} onClick={onClick}>
      {title}
    </li>
  ), [active, title, onClick]);
}

function ActiveCursor(props: { n: number }) {
  const n = props.n;
  const oldRef = useRef(0);
  const [left, setLeft] = useState(0);
  const transition = `left ${Math.abs(oldRef.current - n) * 32}ms linear 0s`;
  useEffect(() => {
      setLeft(24 + 60 * n);
      return () => { oldRef.current = n; };
  }, [n]);
  return (<span className="some-active-cursor" style={{ transition, left }} />);
}

export default function TabBar(props: ITabBarProps) {
  const actIdx = useRef(0);
  const { active, list, onClick, children } = props;
  const titleList = useMemo(() => (list || []).map((item, n) => {
      if (item.name === active) {
        actIdx.current = n;
      }

      return (
        <TabItem
          {...item}
          key={item.name}
          active={item.name === active}
          onClick={() => onClick(item.name)}
        />
      );
  }), [active, list, onClick]);

  return (
    <div className="some-tab-bar">
      <ul className="some-tab-bar__titles">
        {titleList}
        <ActiveCursor n={actIdx.current} />
      </ul>
      {children}
    </div>
  );
}