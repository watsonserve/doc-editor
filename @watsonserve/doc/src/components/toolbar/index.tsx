import { useMemo, useState, useRef } from 'react';
import { IToolProps } from './types';
import { menuList } from './constant';
import TabBar from '@watsonserve/ui/tabbar';
import FileTools from './file-tools';
import EditTools from './edit-tools';
import InsertTools from './insert-tools';
import LayoutTools from './layout-tools';
import TefTools from './ref-tools';
import ViewTools from './view-tools';
import HelpTools from './help-tools';
import './tools.css';

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
  const [active, setActive] = useState('edit');
  handleClickRef.current = setActive;

  return useMemo(() => {
    const Comp = compDict[active];

    return (
      <TabBar active={active} list={menuList} onClick={handleClickRef.current!}>
        <Comp className="tools" {...props} />
      </TabBar>
    );
  }, [active, props]);
}
