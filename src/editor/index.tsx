import React, { useEffect, useImperativeHandle, useMemo, useRef, forwardRef } from 'react';
import Inputer, { IInputerCtrl } from './inputer';
import { IPoint, Editor } from './editor';
import { OfflineSyncer } from './collector';
import './editor.scss';

interface IEditorProps {
}

export default forwardRef(function EditorView(props: IEditorProps, ref: React.Ref<any> | undefined) {
  console.warn('editor component render');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputerRef = useRef<IInputerCtrl>();
  const editorRef = useRef<Editor | null>(null);

  useEffect(() => {
    console.warn('on editor mounted');
    const editor = new Editor(new OfflineSyncer());
    editorRef.current = editor;
    wrapperRef.current?.appendChild(editor.canvas);
    editor.onCaretMove = (p: IPoint) => {
      inputerRef.current?.focus(p);
    };
    editor.resize();
    editor.bgColor = '#f00';

    return () => {
      console.warn('on editor unmount');
      editorRef.current?.destroy();
    };
  }, []);

  useImperativeHandle(ref, () => {
  
    const setSize = (width: string, height: string) => {
      if (!wrapperRef.current) return;
      wrapperRef.current.style.width = width;
      wrapperRef.current.style.height = height;
      editorRef.current?.resize();
    };

    const setLineHeight = (margin = 1) => {
      editorRef.current!.lineMargin = margin;
    };

    const setFontSize = (fontSize = 32) => {
      editorRef.current!.fontSize = fontSize;
      editorRef.current!.lineHeight = fontSize / 2 * 3;
    };

    return {
      change(attr: string, val: any) {
        switch (attr) {
          case 'size':
            return setSize(val.width, val.height);
          case 'fontSize':
            return setFontSize(val);
          case 'lineHeight':
            return setLineHeight(val);
          default:
            console.warn(attr, val);
        }
      }
    };
  });

  return useMemo(() => {
    console.warn('editor general');

    const handleClick = (ev: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      const x = Math.max(ev.nativeEvent.offsetX - 4, 0);
      const y = ev.nativeEvent.offsetY;
      if (!editorRef.current) return;
      editorRef.current.point = { x, y };
    };

    return (
      <div className="editor" ref={wrapperRef} onClick={handleClick}>
        {/* 光标 & 输入缓存 */}
        <Inputer
          ref={inputerRef}
          className="editor__inputer"
          onWrite={(txt: string) => editorRef.current?.write(txt)}
        />
        {/* canvas 画板 */}
      </div>
    );
  }, []);
});
