import { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import axios from 'axios';
import type { Document } from '../App';
import { Save, ArrowLeft, Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Heading2 } from 'lucide-react';

const API_URL = 'https://ajaia-docs-backend.onrender.com/api';

interface EditorProps {
  userId: string;
  document: Document | null;
  onBack: () => void;
  onSaved: () => void;
}

export default function Editor({ userId, document, onBack, onSaved }: EditorProps) {
  const [title, setTitle] = useState(document?.title || 'Untitled');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [docId, setDocId] = useState<string | null>(document?.id || null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({
        placeholder: 'Start writing your document...',
      }),
    ],
    content: document?.content || '<p>Start writing...</p>',
    editorProps: {
      attributes: {
        class: 'editor-content',
      },
    },
  });

  const saveDocument = async () => {
    if (!editor) return;
    setSaving(true);
    try {
      const content = editor.getHTML();
      if (docId) {
        await axios.put(`${API_URL}/documents/${docId}`, { title, content });
      } else {
        const res = await axios.post(`${API_URL}/documents`, {
          title,
          content,
          ownerId: userId
        });
        setDocId(res.data.id);
      }
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    saveDocument();
    onSaved();
    onBack();
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (editor && editor.isEditable) {
        saveDocument();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [editor, title, docId]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (editor && editor.isEditable) {
        saveDocument();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [editor, title, docId]);

  if (!editor) return <div className="loading">Loading editor...</div>;

  return (
    <div className="editor-container">
      <div className="editor-header">
        <button className="btn-icon" onClick={handleBack} title="Back">
          <ArrowLeft size={20} />
        </button>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="title-input"
          placeholder="Document title"
        />
        <button className="btn-primary" onClick={saveDocument} disabled={saving}>
          <Save size={16} />
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div className="toolbar">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'active' : ''}
          title="Bold"
        >
          <Bold size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'active' : ''}
          title="Italic"
        >
          <Italic size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={editor.isActive('underline') ? 'active' : ''}
          title="Underline"
        >
          <UnderlineIcon size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'active' : ''}
          title="Bullet List"
        >
          <List size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'active' : ''}
          title="Numbered List"
        >
          <ListOrdered size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'active' : ''}
          title="Heading"
        >
          <Heading2 size={16} />
        </button>
      </div>

      <EditorContent editor={editor} />

      {lastSaved && (
        <div className="save-status">
          Last saved: {lastSaved.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}