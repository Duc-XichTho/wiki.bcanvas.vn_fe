import React, { useEffect } from 'react';
import { EditorContent } from '@tiptap/react';
import { useEditor } from '@tiptap/react';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import TextStyle from '@tiptap/extension-text-style';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import Dropcursor from '@tiptap/extension-dropcursor';
import Heading from '@tiptap/extension-heading';
import Placeholder from '@tiptap/extension-placeholder';
import History from '@tiptap/extension-history';
import Image from '@tiptap/extension-image';
import { uploadFiles } from '../../apis/uploadImageWikiNoteService';
import styles from './TaskManagementModal.module.css';

const SimpleEditor = ({ 
  content, 
  onChange, 
  placeholder = "Nhập nội dung..." 
}) => {

  const editor = useEditor({
    extensions: [
      Bold,
      Italic,
      Document,
      Paragraph,
      Text,
      TextStyle,
      BulletList,
      OrderedList,
      ListItem,
      History,
      Dropcursor,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Heading.configure({
        levels: [1, 2, 3],
      }),
      Placeholder.configure({
        placeholder: placeholder,
      }),
    ],
    content: content || '',
    editorProps: {
      attributes: {
        class: styles.simpleEditorContent,
      },
      handlePaste: function (view, event, slice) {
        const items = event.clipboardData?.items;

        if (!items || !items.length) return false;

        for (const item of items) {
          if (item.type.indexOf('image') === 0) {
            event.preventDefault();

            const file = item.getAsFile();
            if (!file) continue;
            
            const timestamp = Date.now();
            const fileExtension = file.name.slice(file.name.lastIndexOf('.'));
            const newFileName = `image-${timestamp}${fileExtension}`;
            const newFile = new File([file], newFileName, { type: file.type });
            const formData = new FormData();
            formData.append('file', newFile);

            uploadFiles(formData)
              .then(url => {
                if (url && url.files && url.files[0] && url.files[0].fileUrl) {
                  editor.chain().focus().setImage({ src: url.files[0].fileUrl }).run();
                }
              })
              .catch(error => {
                console.error('Error uploading image:', error);
              });
            return true;
          }
        }
        return false;
      },
      handleDrop: function (view, event, slice, moved) {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length) {
          const files = Array.from(event.dataTransfer.files);
          const imageFiles = files.filter(file => file.type.startsWith('image/'));
          
          if (imageFiles.length > 0) {
            event.preventDefault();
            
            imageFiles.forEach(file => {
              const timestamp = Date.now();
              const fileExtension = file.name.slice(file.name.lastIndexOf('.'));
              const newFileName = `image-${timestamp}${fileExtension}`;
              const newFile = new File([file], newFileName, { type: file.type });
              const formData = new FormData();
              formData.append('file', newFile);

              uploadFiles(formData)
                .then(url => {
                  if (url) {
                    editor.chain().focus().setImage({ src: url.files[0]?.fileUrl }).run();
                  }
                })
                .catch(error => {
                  console.error('Error uploading image:', error);
                });
            });
            return true;
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      const htmlContent = editor.getHTML();
      onChange(htmlContent);
    },
  });

  useEffect(() => {
    if (editor && content !== undefined) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className={styles.simpleEditorContainer}>
      <EditorContent editor={editor} />
    </div>
  );
};

export default SimpleEditor;
