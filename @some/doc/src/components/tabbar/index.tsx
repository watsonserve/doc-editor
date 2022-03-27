import
  React,
  {
    useEffect,
    useMemo,
    useRef,
    useState,
    ReactElement,
    JSXElementConstructor,
    ReactNodeArray,
    ReactPortal
} from 'react';
import './tabbar.css';

interface INameTitle {
  name: string;
  title: string;
}

interface ITabBarProps {
  children: string | number | boolean | {} | null | undefined
    | ReactElement<any, string | JSXElementConstructor<any>> | ReactNodeArray | ReactPortal;
  active: string;
  list: INameTitle[];
  onClick(name:string): void;
}

interface TabItemProps {
  name: string;
  title: string;
  active: boolean;
  onClick(): void;
}

function TabItem(props: TabItemProps) {
  const { active, name, title, onClick } = props;

  return useMemo(() => (
    <li className={`title-item ${active ? 'active' : ''}`} key={name} onClick={onClick}>
      { title }
    </li>
  ), [active, name, title, onClick]);
}

function ActiveCursor(props: {n: number}) {
  const n = props.n;
  const oldRef = useRef(0);
  const [left, setLeft] = useState(0);
  const transition = `left ${Math.abs(oldRef.current - n) * 50}ms linear 0s`;

  useEffect(() => {
    setLeft(24 + 60 * n);
    return () => { oldRef.current = n; };
  }, [n]);

  return (
    <span className="active-cursor" style={{ transition, left }} />
  );
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
    <div className="tab-bar">
      <ul className="tab-bar__titles">{titleList}</ul>
      <ActiveCursor n={actIdx.current} />
      {children}
    </div>
  );
}
