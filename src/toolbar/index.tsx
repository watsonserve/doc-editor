import React, { useMemo, useState, useRef } from 'react';
import { IToolProps } from './types';
import TabBar from '../tabbar';
import FileTools from './file-tools';
import EditTools from './edit-tools';
import InsertTools from './insert-tools';
import LayoutTools from './layout-tools';
import TefTools from './ref-tools';
import ViewTools from './view-tools';
import HelpTools from './help-tools';
import './tools.css';

const list = [{
  name: 'file',
  title: '文件'
}, {
  name: 'edit',
  title: '编辑'
}, {
  name: 'insert',
  title: '插入'
}, {
  name: 'layout',
  title: '布局'
}, {
  name: 'ref',
  title: '引用'
}, {
  name: 'view',
  title: '视图'
}, {
  name: 'help',
  title: '帮助'
}];

const compDict: { [name: string]: (props: IToolProps) => JSX.Element } = {
  file: FileTools,
  edit: EditTools,
  insert: InsertTools,
  layout: LayoutTools,
  ref: TefTools,
  view: ViewTools,
  help: HelpTools,
};

export default function Toolbar(props: IToolProps) {
  const handleClickRef = useRef<null | ((s: string) => void)>(null);
  const [active, setActive] = useState('file');
  handleClickRef.current = setActive;

  return useMemo(() => {
    const Comp = compDict[active];

    return (
      <TabBar active={active} list={list} onClick={handleClickRef.current!}>
        <Comp className="tools" {...props} />
      </TabBar>
    );
  }, [active, props]);
}
