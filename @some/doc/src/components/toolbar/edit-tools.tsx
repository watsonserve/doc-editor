import { useMemo, useState } from 'react';
import { IToolProps } from './types';
import { fontLevList, fontFamilyList, fontCnSizeDict, lineMarginList } from './constant';
import ToolBlk from './tool-blk';
import { Button, Selector, Steper } from '@some/ui';
import { EnFontStyle } from '@some/editor';

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
const fontSizeList = fontSizeRange(210);

function FontTool(props: IToolProps) {
  const { config, onChange } = props;
  const { BIUS: statBIUS } = config;
  const [fontFamily, setFontFamily] = useState(config.fontFamily);

  const fontFamilyChange = (family: string) => {
    setFontFamily(family);
    onChange('fontFamily', family);
  };

  const fontSteper = useMemo(() => (
    <Steper
      min={fontSizeList[0].name}
      max={fontSizeList[fontSizeList.length - 1].name}
      value={config.fontSize}
      options={fontSizeList}
      onInput={(pt: number) => onChange('fontSize', pt)}
    />
  ), [config.fontSize, onChange]);

  const btns = useMemo(() => {
    const btnCfg: [string, string, any][] = [
      ['bold', 'B', (statBIUS & 0xffff) === 700],
      ['italic', 'I', !!(statBIUS & EnFontStyle.ITALIC)],
      ['underline', 'U', !!(statBIUS & EnFontStyle.UNDERLINE)],
      ['through', 'S',  !!(statBIUS & EnFontStyle.LINE_THROUGH)],
      ['super', 'x', false],
      ['sub', 'x', false],
      ['upper', 'Aa', false],
    ];

    const handleFont = (n: string, a: boolean) => {
      switch (n) {
        case 'bold':
          const nxt = (statBIUS ^ (statBIUS & 0xffff)) | (a ? 700 : 400);
          console.log(nxt)
          return onChange('BIUS', nxt);
        case 'italic':
          return onChange('BIUS', statBIUS ^ EnFontStyle.ITALIC);
        case 'underline':
          return onChange('BIUS', statBIUS ^ EnFontStyle.UNDERLINE);
        case 'through':
          return onChange('BIUS', statBIUS ^ EnFontStyle.LINE_THROUGH);
        default:
      }
    };

    return btnCfg.map(
      ([name, title, active]) =>
        <Button
          key={name}
          className={`edit-tools-btn edit-tools__font-${name}`}
          title={title}
          active={active}
          onClick={() => handleFont(name, !active)}
        />
    );
  }, [onChange, statBIUS]);

  return (
    <ToolBlk title="字体">
      <div className="edit-tools-btns">
        {/* 字体选择器 */}
        <Selector
          className="edit-tools__font-family"
          options={fontFamilyList}
          value={fontFamily}
          onInput={fontFamilyChange}
        />
        {/* 字号选择器 */}
        {fontSteper}
      </div>
      <div className="edit-tools-btns">
        {btns}
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
