// BIUS
export enum EnFontStyle {
  LIGHTER = 100,
  NORMAL = 400,
  BOLD = 700,
  BOLDER = 900,
  ITALIC = 0x10000,
  UNDERLINE = 0x20000,
  LINE_THROUGH = 0x40000,
}

export type FontWeight = EnFontStyle.LIGHTER | EnFontStyle.NORMAL | EnFontStyle.BOLD | EnFontStyle.BOLDER;

export const fontStyleMask = Object.keys(EnFontStyle).reduce((s, k) => s | (+k || 0), 0);

type TRBL = 'top' | 'right' | 'bottom' | 'left';

export type IBlockSize = Record<TRBL, number>;

export type IPageStyle = {
  padding: IBlockSize;
}

export interface ITextStyle {
  color: string;
  BIUS: number; // EnFontStyle
  superscript: 'no' | 'up' | 'down';
  letterSpacing: number;
  fontFamily: string;
  fontSize: number;
  backgroundColor: string;
}

export interface IParagraphOnlyStyle {
  firstIndent: number;
  indent: number;
  marginTop: number;
  marginBottom: number;
  lineMargin: number;
  textAlign: 'left' | 'right' | 'center';
  justify: boolean;
};

export type IParagraphStyle = ITextStyle & IParagraphOnlyStyle;

export enum EnWriteType {
  UNKNOW = 0,
  TEXT = 1,
  FONT_STYLE = 2,
  PARAGRAPH_STYLE = 6
}

export interface ITxtNode { type: EnWriteType.TEXT; txt: string; width: number; };
export interface IParagraphNode extends IParagraphStyle { type: EnWriteType.PARAGRAPH_STYLE };
export interface ITextStyleNode extends ITextStyle { type: EnWriteType.FONT_STYLE };

export type IStyleNode = IParagraphNode | ITextStyleNode;
export type IDocNode = ITxtNode | IStyleNode;


// export interface __IDocNode extends IParagraphStyle { type: EnWriteType; txt: string };

export enum EnDeleteType {
  BACK,
  DELETE
}

export interface IRow {
  tab: number;
  baseHeight: number;
  line: IDocNode[];
}

export interface IParagraph {
  sn: number; // 段落號
  marginTop: number;
  marginBottom: number;
  lineMargin: number;
  list: IRow[]; // 行
}
