import React, { useMemo } from 'react';
import { IToolProps } from './types';
import ToolBlk from './tool-blk';
import Selector from '@watsonserve/ui/selector';

export default function Tools(props: IToolProps) {
  const { config, onChange } = props;
  const { pageSize } = config;

  const val = useMemo(() => {
    const { width, height } = pageSize;
    return `${width} ${height}`;
  }, [pageSize]);

  const handleChange = (str: string) => {
    const [width, height] = str.split(' ');
    onChange('pageSize', { width, height });
  };

  return (
    <div className={`${props.className} edit-tools`}>
      <ToolBlk title="页面">
        <Selector
          className="edit-tools__font-family"
          options={[
            { name: '210mm 297mm', title: 'A4' },
            { name: '10in 16in', title: '10in' },
          ]}
          value={val}
          onInput={handleChange}
        />
      </ToolBlk>
    </div>
  );
}
