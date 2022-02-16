export interface IToolProps {
  className?: string;
  dpi: number;
  onChange(name: string, payload: any): void;
}
