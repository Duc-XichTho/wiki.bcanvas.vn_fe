import css from './TipTap.module.css'
import { useRef, useEffect, useState } from 'react';
import { EditorContent } from '@tiptap/react'
import { TiptapToolbar } from './TiptapToolbar'
import { useEditor } from './useEditor'

export default function Tiptap() {
  const { editor } = useEditor();
  const [tableMenuOpen, setTableMenuOpen] = useState(false);
  const [fontMenuOpen, setFontMenuOpen] = useState(false);
  const [colorPickerMenuOpen, setColorPickerMenuOpen] = useState(false);

  if (!editor) {
    return null
  }

  return (
    <div className={css.main}>
      <TiptapToolbar
        editor={editor}
        tableMenuOpen={tableMenuOpen}
        setTableMenuOpen={setTableMenuOpen}
        fontMenuOpen={fontMenuOpen}
        setFontMenuOpen={setFontMenuOpen}
        colorPickerMenuOpen={colorPickerMenuOpen}
        setColorPickerMenuOpen={setColorPickerMenuOpen}
      />

      <div className={css.editorContent}>
        <EditorContent
          className={css.editorContentWrap}
          editor={editor}
        />
      </div>
    </div>
  )
}
