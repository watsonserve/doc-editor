import { Suspense, lazy, useRef, useState, useEffect } from 'react';
import './App.css';
import EditorView from '@some/editor';
import { Syncer } from './helper/syncer';

const Toolbar = lazy(() => import('./components/toolbar'));
const Statbar = lazy(() => import('./components/statbar'));

function App() {
  const editorApiRef = useRef<any>(null);
  const mainRef = useRef<any>(null);

  const [config, setConfig] = useState({
    fontSize: 16,
    BIUS: 400,
    fontFamily: 'sans-serif',
    lineMargin: 1,
    color: '#333',
    bgColor: 'transparent',
    pageSize: { width: '210mm', height: '297mm' },
    pagePadding: { top: 20, right: 20, bottom: 20, left: 20 } // unit: pt
  });

  useEffect(() => {
    editorApiRef.current = new EditorView(new Syncer());
    mainRef.current.appendChild(editorApiRef.current);
    Object.entries(config).forEach(
      ([key, val]) => editorApiRef.current.change(key, val)
    );

    return () => {
      editorApiRef.current.destroy();
      delete editorApiRef.current;
    };
  }, []);

  const handleConfigChange = (attr: string, val: any) => {
    console.log(`config change set${attr} =`, val);
    editorApiRef.current.change(attr, val);

    setConfig({ ...config, [attr]: val });
  };

  return (
    <div className="App">
      <header className="App-header">
        <Suspense fallback={<div></div>}>
          <Toolbar config={config} onChange={handleConfigChange} />
        </Suspense>
      </header>
      <div className="main" ref={mainRef}>
        {/* <editor-view /> */}
      </div>
      <Suspense fallback={<div></div>}>
        <Statbar />
      </Suspense>
    </div>
  );
}

export default App;
