import { useState } from 'react';
import { IToolProps } from './types';
import { fontLevList, fontFamilyList, fontCnSizeDict, lineMarginList } from './constant';
import ToolBlk from './tool-blk';
import { Selector, Steper } from '@some/ui';

const fontSizeRange = (mm: number) => {
  const min = 5;
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
  const [fontFamily, setFontFamily] = useState(props.config.fontFamily);
  const fontSizeList = fontSizeRange(210);

  const fontFamilyChange = (family: string) => {
    setFontFamily(family);
    props.onChange('fontFamily', family);
  };

  const fontSizeChange = (pt: number) => props.onChange('fontSize', pt);

  const handleFontSizeL = () => {};
  const handleFontSizeS = () => {};
  const handleFontBlod = () => {};

  return (
    <ToolBlk title="字体">
      <div className="edit-tools-btns">
        {/* 字体选择器 */}
        <Selector
          className="edit-tools__font-lev"
          options={fontFamilyList}
          value={fontFamily}
          onInput={fontFamilyChange}
        />
        {/* 字号选择器 */}
        <Steper
          min={fontSizeList[0].name}
          max={fontSizeList[fontSizeList.length - 1].name}
          value={props.config.fontSize}
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
  const [lineMargin, setLineMargin] = useState(props.config.lineMargin);

  const lineHeightChange = (_lineMargin: number) => {
    props.onChange('lineMargin', _lineMargin);
    setLineMargin(_lineMargin);
  };

  return (
    <ToolBlk title="段落">
      <div className="edit-tools-btns">
        <Steper
          min={1}
          max={10}
          step={0.25}
          options={lineMarginList}
          value={lineMargin}
          onInput={lineHeightChange}
        />
      </div>
    </ToolBlk>
  );
}

export default function EditTools(props: IToolProps) {
  const [fontLev, setFontLev] = useState('h1');

  return (
    <div className={`${props.className} edit-tools`}>
      <ToolBlk title="撤销">
      </ToolBlk>
      <ToolBlk title="剪贴板">
      </ToolBlk>
      <FontTool {...props} />
      <ParagraphTool {...props} />
      <ToolBlk title="样式">
        <Selector className="edit-tools__font-lev" options={fontLevList} value={fontLev} onInput={setFontLev} />
      </ToolBlk>
      <ToolBlk title="编辑">
      </ToolBlk>
    </div>
  );
}
