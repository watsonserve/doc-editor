import React, { useCallback, useMemo, useRef, forwardRef, useImperativeHandle } from 'react';
import { IPoint } from 'editor';
import './inputer.scss';

export interface IInputerCtrl {
  focus: (p: IPoint) => void;
}

interface IInputerProps {
  className: string;
  onWrite: (str: string) => void;
}

export default forwardRef(function Inputer(props: IInputerProps, ref) {
  const selfRef = useRef<HTMLDivElement>(null);
  // 输入缓存
  const inputRef = useRef<HTMLDivElement>(null);
  // 是否开启输入法
  const compositionRef = useRef<boolean>(false);

  const follow = useCallback((inputType: string, str: string) => {
    switch (inputType) {
      case 'insertParagraph':
        str = '\n';
    }
    console.log(`inputType: ${inputType}, str: ${str}`);
    props.onWrite(str);
    inputRef.current && (inputRef.current.innerHTML = '');
  }, [props]);

  const handleInput = useCallback((ev: any) => {
    if (!inputRef.current || compositionRef.current) return;
    const { inputType, data } = ev.nativeEvent;
    if ('insertCompositionText' === inputType) return;
    follow(inputType, data);
  }, [follow, compositionRef, inputRef]);

  const handleComposition = useCallback((ev: any, enter: boolean) => {
    if (!inputRef.current) return;
    compositionRef.current = enter;
    if (enter) return;
    follow('insertText', ev.data);
  }, [follow, compositionRef, inputRef]);

  const handleKeyDown = useCallback((ev: any) => {
    console.log(ev);
    switch (ev.keyCode) {
      case 8: // backspace
        follow('backspace', '');
        break;
      default:
    }
  }, [follow]);

  useImperativeHandle(ref, () => ({
    focus(p: IPoint) {
      const elSelf = selfRef.current;
      if (!elSelf) return;
      elSelf.style.left = `${p.x || 0}px`;
      elSelf.style.top = `${p.y || 0}px`;
      elSelf.style.height = `${p.height || 16}px`;
      inputRef.current?.focus();
    }
  }));

  const className = useMemo(() => 'inputer' + (props.className ? ' ' : '') + props.className, [props.className]);
  /* 光标 & 输入缓存 */
  return useMemo(() => (
    <div className={className} ref={selfRef}>
      <div className="inputer__caret" />
      <div
        ref={inputRef}
        tabIndex={0}
        className="inputer__cache"
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onCompositionStart={(ev: any) => handleComposition(ev, true)}
        onCompositionEnd={(ev: any) => handleComposition(ev, false)}
      />
    </div>
  ), [className, handleComposition, handleInput, handleKeyDown]);
});
