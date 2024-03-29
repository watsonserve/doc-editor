export type EnCmd = 'open'|'save'|'print'|'exportDOM';

export interface IToolProps {
  className?: string;
  config: any;
  onChange(name: string, payload: any): void;
  onCmd(cmd: EnCmd): void;
}
