import React, { Suspense, lazy, useRef, useEffect } from 'react';
import './App.css';
import Editor from './editor';

const Tabbar = lazy(() => import('./toolbar'));
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

  useEffect(() => {
    editorApiRef.current.setSize('210mm', '297mm');
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <Suspense fallback={<div></div>}>
          <Tabbar onChange={(...foo) => console.log(...foo)} />
        </Suspense>
      </header>
      <div className="main">
        <Editor ref={editorApiRef} />
      </div>
      <Suspense fallback={<div></div>}>
        <Statbar />
      </Suspense>
    </div>
  );
}

export default App;
