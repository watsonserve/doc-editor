export enum EnFontStyle {
  LIGHTER = 100,
  NORMAL = 400,
  BOLD = 700,
  BOLDER = 900,
  ITALIC = 1 << 16,
  UNDERLINE = 1 << 17,
  LINE_THROUGH = 1 << 18,
}

export const FontWeight = EnFontStyle.LIGHTER | EnFontStyle.NORMAL | EnFontStyle.BOLD | EnFontStyle.BOLDER;

export const fontStyleMask = Object.keys(EnFontStyle).reduce((s, k) => s & (+k || 0), 0);

type TRBL = 'top' | 'right' | 'bottom' | 'left';

export type IBlockSize = Record<TRBL, number>;

export type IPageStyle = {
  padding: IBlockSize;
}

export interface IFontStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
}

export interface IParagraphOnlyStyle {
  firstTab: number;
  tab: number;
  marginTop: number;
  marginBottom: number;
  lineMargin: number;
};

export type IParagraphStyle = IFontStyle & IParagraphOnlyStyle;

export enum EnWriteType {
  UNKNOW = 0,
  TEXT = 1,
  FONT_STYLE = 2,
  PARAGRAPH_STYLE = 6
}

export interface ITxtNode { type: EnWriteType.TEXT; txt: string; width: number; };
export interface IParagraphNode extends IParagraphStyle { type: EnWriteType.PARAGRAPH_STYLE };
export interface IFontStyleNode extends IFontStyle { type: EnWriteType.FONT_STYLE };

export type IStyleNode = IParagraphNode | IFontStyleNode;
export type IDocNode = ITxtNode | IStyleNode;


// export interface __IDocNode extends IParagraphStyle { type: EnWriteType; txt: string };

export interface IParagraphDesc {
  marginTop: number;
  marginBottom: number;
  lineMargin: number;
  paragraph: {
    line: IDocNode[];
    tab: number;
    baseHeight: number;
  }[];
}

export interface IRow {
  segments: IDocNode[];
  tab: number;
  baseHeight: number;
}
