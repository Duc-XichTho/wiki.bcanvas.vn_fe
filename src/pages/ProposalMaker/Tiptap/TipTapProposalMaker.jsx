import { EditorContent } from '@tiptap/react';
import React, { useEffect, useRef, useState } from 'react';
import css from './TipTap.module.css';
import { TiptapToolbar } from './TiptapToolbar.jsx';
import { useEditor } from './useEditor.js';

export default function TipTapProposalMaker({ selectedDocument, onUpdate, showToolbar = true }) {
	const { editor } = useEditor();
	const [headingMenuOpen, setHeadingMenuOpen] = useState(false);
	const [tableMenuOpen, setTableMenuOpen] = useState(false);
	const [fontMenuOpen, setFontMenuOpen] = useState(false);
	const [colorPickerMenuOpen, setColorPickerMenuOpen] = useState(false);
	const [fontSizeMenuOpen, setFontSizeMenuOpen] = useState(false);
	const [lineHeightMenuOpen, setLineHeightMenuOpen] = useState(false);

	// Debounce + guard to avoid spamming updates
	const debounceTimerRef = useRef(null);
	const ignoreNextUpdateRef = useRef(false);
	const lastSentContentRef = useRef('');

	useEffect(() => {
		if (!editor) return;
		const html = selectedDocument?.content || '';
		if (html !== editor.getHTML()) {
			// Prevent the immediate 'update' event from triggering a save
			ignoreNextUpdateRef.current = true;
			editor.commands.setContent(html);
			lastSentContentRef.current = html;
		}
	}, [editor, selectedDocument?.id, selectedDocument?.content]);

	useEffect(() => {
		if (!editor) return;
		editor.setEditable(!selectedDocument?.isLocked);
	}, [selectedDocument?.isLocked, editor]);


	// Realtime bridge using TipTap update event (debounced + guarded)
	useEffect(() => {
		if (!editor) return;
		const handler = () => {
			if (ignoreNextUpdateRef.current) {
				ignoreNextUpdateRef.current = false;
				return;
			}
			if (typeof onUpdate !== 'function') return;
			const html = editor.getHTML();
			if (html === lastSentContentRef.current) return;
			if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
			debounceTimerRef.current = setTimeout(() => {
				lastSentContentRef.current = html;
				onUpdate(html);
			}, 500);
		};
		const off = editor.on('update', handler);
		return () => {
			if (off && typeof off === 'function') off();
			if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
		};
	}, [editor, onUpdate]);

	if (!editor) {
		return (
			<div className={css.main}>
				<div className={css.loadingContainer}>
					<div className={css.loadingCircle}></div>
					<span>Đang tải editor...</span>
				</div>
			</div>
		);
	}

	return (
		<div className={css.tiptap}>
			{ showToolbar && !selectedDocument?.isLocked && (
				<TiptapToolbar
					editor={editor}
					headingMenuOpen={headingMenuOpen}
					setHeadingMenuOpen={setHeadingMenuOpen}
					tableMenuOpen={tableMenuOpen}
					setTableMenuOpen={setTableMenuOpen}
					fontMenuOpen={fontMenuOpen}
					setFontMenuOpen={setFontMenuOpen}
					colorPickerMenuOpen={colorPickerMenuOpen}
					setColorPickerMenuOpen={setColorPickerMenuOpen}
					fontSizeMenuOpen={fontSizeMenuOpen}
					setFontSizeMenuOpen={setFontSizeMenuOpen}
					lineHeightMenuOpen={lineHeightMenuOpen}
					setLineHeightMenuOpen={setLineHeightMenuOpen} />
			)}
			<div className={css.editorContentWrap}>
				<EditorContent editor={editor} />
			</div>
		</div>
	);
}
