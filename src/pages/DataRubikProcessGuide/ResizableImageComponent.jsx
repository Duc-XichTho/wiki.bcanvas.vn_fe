import React, { useState, useRef, useEffect } from 'react'
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react'

export function ResizableImageComponent({ node, updateAttributes }) {
  const [isResizing, setIsResizing] = useState(false)
  const [startX, setStartX] = useState(0)
  const [startWidth, setStartWidth] = useState(0)
  const imageRef = useRef(null)
  const resizerRef = useRef(null)

  const handleMouseDown = (e) => {
    e.preventDefault()
    setIsResizing(true)
    setStartX(e.clientX)
    setStartWidth(imageRef.current.offsetWidth)
  }

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return

      const deltaX = e.clientX - startX
      const newWidth = Math.max(50, startWidth + deltaX)
      updateAttributes({ width: `${newWidth}px` })
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, startX, startWidth, updateAttributes])

  return (
    <NodeViewWrapper className="resizable-image">
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <img
          ref={imageRef}
          src={node.attrs.src}
          alt={node.attrs.alt}
          title={node.attrs.title}
          style={{
            width: node.attrs.width,
            height: node.attrs.height,
            maxWidth: '100%',
            display: 'block',
          }}
        />
        <div
          ref={resizerRef}
          onMouseDown={handleMouseDown}
          style={{
            position: 'absolute',
            right: '-5px',
            bottom: '-5px',
            width: '10px',
            height: '10px',
            backgroundColor: '#007bff',
            border: '1px solid white',
            cursor: 'se-resize',
            borderRadius: '50%',
          }}
        />
      </div>
    </NodeViewWrapper>
  )
}
