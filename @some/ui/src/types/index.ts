import { ReactElement, JSXElementConstructor, ReactPortal } from 'react';

export interface INameTitle {
  name: string;
  title: string;
}

export interface TabItemProps {
  active: boolean;
  title: string;
  onClick(): void;
}

export interface ITabBarProps {
  children: string | number | boolean | {} | null | undefined | ReactElement<any, string | JSXElementConstructor<any>> | ReactPortal;
  active: string;
  list: INameTitle[];
  onClick(name: string): void;
}

export interface IMenuTree extends INameTitle {
  className?: string;
  Icon?: () => JSX.Element;
  tip?: string;
  checkbox?: boolean;
  active?: boolean;
  disabled?: boolean;
  children?: (IMenuTree | null)[];
}

export interface IMenuProps {
  className?: string;
  tree: (IMenuTree | null)[];
  onClick(dist: IMenuTree): void;
}

export interface ISelectorProps {
  className?: string;
  value: string;
  options: INameTitle[];
  onInput(v: string): void;
}
