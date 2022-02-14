import React from 'react';
import './tool-blk.css';

export default function ToolBlk(props: any) {
  const { title, children } = props;
  return (
    <dl className="tool-block">
      <dt className="tool-block__title">{ title }</dt>
      <dd className="tool-block__list">{ children }</dd>
    </dl>
  );
}
