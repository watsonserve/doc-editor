import React, { Suspense, lazy, useRef, useEffect } from 'react';
import './App.css';
import 'editor';

const Toolbar = lazy(() => import('./toolbar'));
const Statbar = lazy(() => import('./statbar'));

function getDPI() {
  const foo = document.createElement('div');
  foo.style.width = '1in';
  document.body.append(foo);
  const dpi = foo.clientWidth;
  foo.remove();
  return dpi;
}

function App() {
  const dpi = useRef(getDPI());
  const editorApiRef = useRef<any>(null);
  const mainRef = useRef<any>(null);

  useEffect(() => {
    editorApiRef.current = document.createElement('editor-view');
    mainRef.current.appendChild(editorApiRef.current);
    editorApiRef.current.change('size', { width: '210mm', height: '297mm' });
  }, []);

  const handleConfigChange = (attr: string, val: any) => {
    console.log(`config change set${attr} =`, val);
    editorApiRef.current.change(attr, val);
  };

  return (
    <div className="App">
      <header className="App-header">
        <Suspense fallback={<div></div>}>
          <Toolbar dpi={dpi.current} onChange={handleConfigChange} />
        </Suspense>
      </header>
      <div className="main" ref={mainRef}>
      </div>
      <Suspense fallback={<div></div>}>
        <Statbar />
      </Suspense>
    </div>
  );
}

export default App;
