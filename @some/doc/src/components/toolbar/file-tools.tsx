import React from 'react';
import { IToolProps } from './types';
import ToolBlk from './tool-blk';

export default function FileTools(props: IToolProps) {
  const { onCmd } = props;
  return (
    <div className={`${props.className} file-tools`}>
      <ToolBlk title="开始">
        <a className="file-tools__btn">新建</a>
        <a className="file-tools__btn" onClick={() => onCmd('open')}>打开</a>
        <a className="file-tools__btn">导入</a>
      </ToolBlk>
      <ToolBlk title="输出">
        <a className="file-tools__btn" onClick={() => onCmd('save')}>导出</a>
        <a className="file-tools__btn" onClick={() => onCmd('print')}>打印</a>
      </ToolBlk>
      <ToolBlk title="版本">
        <a className="file-tools__btn">查看历史版本</a>
      </ToolBlk>
    </div>
  );
}
