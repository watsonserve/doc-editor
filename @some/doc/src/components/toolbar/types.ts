export interface IToolProps {
  className?: string;
  config: any;
  onChange(name: string, payload: any): void;
}
