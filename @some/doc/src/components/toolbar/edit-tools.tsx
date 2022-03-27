import { useState } from 'react';
import { IToolProps } from './types';
import ToolBlk from './tool-blk';
import { Selector } from '@some/ui';

const fontLevList = [
  {name: 'h1', title: '标题1'},
  {name: 'h2', title: '标题2'},
  {name: 'h3', title: '标题3'},
  {name: 'h4', title: '标题4'},
  {name: 'h5', title: '标题5'},
  {name: 'h6', title: '标题6'},
  {name: 'p', title: '正文'},
];
const fontSizeList = [10, 10.5, 11, 11.5, 12, 16];

function FontTool(props: IToolProps) {
  const [fontLev, setFontLev] = useState('h1');
  const fontFamilyChange = (ev: React.ChangeEvent<HTMLSelectElement>) => {
    props.onChange('fontFamily', ev.target.value);
  };

  const fontSizeChange = (ev: React.ChangeEvent<HTMLSelectElement>) => {
    props.onChange('fontSize', +ev.target.value * props.dpi / 72);
  };

  const handleFontSizeL = () => {};
  const handleFontSizeS = () => {};
  const handleFontBlod = () => {};

  return (
    <ToolBlk title="字体">
      <div className="edit-tools-btns">
        <Selector className="edit-tools__font-lev" options={fontLevList} value={fontLev} onInput={setFontLev} />
        <select onChange={fontSizeChange}>
        {
          fontSizeList.map(x => (<option value={x} key={x}>{x}pt</option>))
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

function ParagraphTool(props: IToolProps) {
  const lineHeightChange = (ev: React.ChangeEvent<HTMLSelectElement>) => {
    props.onChange('lineHeight', ev.target.value);
  };
  const lineHeightList = [1, 1.5, 2];

  return (
    <ToolBlk title="段落">
      <div className="edit-tools-btns">
        <select onChange={lineHeightChange}>
        {
          lineHeightList.map(x => (<option value={x} key={x}>{x}</option>))
        }
        </select>
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
      <ParagraphTool {...props} />
      <ToolBlk title="样式">
      </ToolBlk>
      <ToolBlk title="编辑">
      </ToolBlk>
    </div>
  );
}
