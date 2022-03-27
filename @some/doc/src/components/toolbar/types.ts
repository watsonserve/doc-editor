export interface IToolProps {
  className?: string;
  dpi: number;
  config: any;
  onChange(name: string, payload: any): void;
}
