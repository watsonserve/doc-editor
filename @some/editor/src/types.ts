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

export enum EnWriteType {
  UNKNOW,
  TEXT,
  FONT_STYLE,
  PARAGRAPH_STYLE
}

type TRBL = 'top' | 'right' | 'bottom' | 'left';

export type IBlockSize = Record<TRBL, number>;

export type IPageStyle = {
  padding: IBlockSize;
}

export interface IParagraphStyle {
  firstTab: number;
  tab: number;
  marginTop: number;
  marginBottom: number;
  lineMargin: number;
}

export interface IFontStyle {
  fontSize: number;
  fontWeight: number;
  fontFamily: string;
  lineMargin: number;
}

export type IDocNode = { type: EnWriteType; txt: string; }
  | ({ type: EnWriteType } & IParagraphStyle)
  | ({ type: EnWriteType } & IFontStyle);

export type __IDocNode = { type: EnWriteType; txt: string; } & IFontStyle & IParagraphStyle;