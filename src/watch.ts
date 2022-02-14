import { useEffect } from 'react';

export function useWatch(editorRef: any) {
    useEffect(() => {
    // 创建一个观察器实例并传入回调函数
    const observer = new MutationObserver((mutationsList: any[], observer: MutationObserver) => {
        // Use traditional 'for loops' for IE 11
        for(let mutation of mutationsList) {
        switch (mutation.type) {
            case 'childList':
            console.log('A child node has been added or removed.');
            break;
            case 'attributes':
            default:
            console.log('The ' + mutation.attributeName + ' attribute was modified.');
        }
        }
    });
    // 以上述配置开始观察目标节点
    editorRef.current && observer.observe(editorRef.current, { attributes: true, childList: true, subtree: true });

    // 之后，可停止观察
    // observer.disconnect();
    }, [editorRef.current]);
}