import { useState } from 'react';
import { IToolProps } from './types';
import { fontLevList, fontCnSizeDict } from './constant';
import ToolBlk from './tool-blk';
import { getPPI, pt2px, px2pt } from '../../helper/unit';
import { Selector, Steper } from '@some/ui';

const fontSizeRange = (mm: number) => {
  const ppi = getPPI();
  const min = Math.ceil(864 / window.devicePixelRatio / ppi);
  const max = Math.floor(mm * 72 / 25.4);

  const foo = [];
  for (let mid = (min + max) >> 1; mid > 72; mid >>= 1) {
    foo.unshift(mid);
  }

  return Array.from(new Set([min, ...Array.from(fontCnSizeDict.keys()), 72, ...foo, max]))
  .sort((a, b) => a - b)
  .map(n => {
    const cnSize = fontCnSizeDict.get(n);

    return {
      name: n, title: `${n}pt`, tip: cnSize ? ` (${cnSize})` : ''
    };
  });
}

function FontTool(props: IToolProps) {
  const [fontLev, setFontLev] = useState('h1');

  const fontSizeList = fontSizeRange(210);

  const fontFamilyChange = (ev: React.ChangeEvent<HTMLSelectElement>) => {
    props.onChange('fontFamily', ev.target.value);
  };

  const fontSizeChange = (pt: number) => props.onChange('fontSize', pt2px(pt));

  const handleFontSizeL = () => {};
  const handleFontSizeS = () => {};
  const handleFontBlod = () => {};

  return (
    <ToolBlk title="字体">
      <div className="edit-tools-btns">
        <Selector className="edit-tools__font-lev" options={fontLevList} value={fontLev} onInput={setFontLev} />
        {/* 字号选择器 */}
        <Steper
          min={fontSizeList[0].name}
          max={fontSizeList[fontSizeList.length - 1].name}
          value={px2pt(props.config.fontSize)}
          options={fontSizeList}
          onInput={fontSizeChange}
        />
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
