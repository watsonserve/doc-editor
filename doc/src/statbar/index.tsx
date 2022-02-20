import React from 'react';
import './statbar.css';

export default function Statbar() {
  return (
    <footer className="statbar">
      <span className="statbar__info">第1页，共1页</span>
      <span className="statbar__info">0个字</span>
      <span className="statbar__info">英语(美国)</span>
    </footer>
  );
}
