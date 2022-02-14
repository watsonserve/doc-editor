import React from 'react';
import { IToolProps } from './types';
import ToolBlk from './tool-blk';

const fontFamilyList = ['标题', '正文'];
const fontSizeList = [10, 10.5, 11, 11.5, 12];

function FontTool(props: IToolProps) {
  const fontFamilyChange = (ev: React.ChangeEvent<HTMLSelectElement>) => {
    props.onChange('fontFamily', ev.target.value);
  };

  const fontSizeChange = (ev: React.ChangeEvent<HTMLSelectElement>) => {
    props.onChange('fontSize', ev.target.value);
  };

  const handleFontSizeL = () => {};
  const handleFontSizeS = () => {};
  const handleFontBlod = () => {};

  return (
    <ToolBlk title="字体">
      <div className="edit-tools-btns">
        <select onChange={fontFamilyChange}>
        {
          fontFamilyList.map(x => (<option value={x} key={x}>{x}</option>))
        }
        </select>
        <select onChange={fontSizeChange}>
        {
          fontSizeList.map(x => (<option value={x} key={x}>{x}</option>))
        }
        </select>
        <a className="edit-tools-btn" onClick={handleFontSizeL}>
          <span className="edit-tools__font-size-large">A</span>
        </a>
        <a className="edit-tools-btn" onClick={handleFontSizeS}>
          <span className="edit-tools__font-size-small">A</span>
        </a>
      </div>
      <div className="edit-tools-btns">
        <a className="edit-tools-btn" onClick={handleFontBlod}>
          <span className="edit-tools__font-bold">B</span>
        </a>
        <a className="edit-tools-btn" onClick={handleFontSizeS}>
          <span className="edit-tools__font-italic">I</span>
        </a>
        <a className="edit-tools-btn" onClick={handleFontSizeS}>
          <span className="edit-tools__font-underline">U</span>
        </a>
        <a className="edit-tools-btn" onClick={handleFontSizeS}>
          <span className="edit-tools__font-through">S</span>
        </a>
        <a className="edit-tools-btn" onClick={handleFontSizeL}>
          <span className="edit-tools__font-super">x</span>
        </a>
        <a className="edit-tools-btn" onClick={handleFontSizeS}>
          <span className="edit-tools__font-sub">x</span>
        </a>
        <a className="edit-tools-btn" onClick={handleFontSizeS}>
          <span className="edit-tools__font-upper">Aa</span>
        </a>
      </div>
    </ToolBlk>
  );
}

export default function EditTools(props: IToolProps) {

  return (
    <div className={`${props.className} edit-tools`}>
      <ToolBlk title="撤销">
      </ToolBlk>
      <ToolBlk title="剪贴板">
      </ToolBlk>
      <FontTool {...props} />
      <ToolBlk title="段落">
      </ToolBlk>
      <ToolBlk title="样式">
      </ToolBlk>
      <ToolBlk title="编辑">
      </ToolBlk>
    </div>
  );
}
