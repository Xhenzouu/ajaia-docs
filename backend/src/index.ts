import express, { Request, Response } from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('./database.sqlite');

interface Document {
  id: string;
  title: string;
  content: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

interface User {
  id: string;
  name: string;
}

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      title TEXT,
      content TEXT,
      owner_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS shares (
      doc_id TEXT,
      user_id TEXT,
      PRIMARY KEY (doc_id, user_id)
    )
  `);

  db.get("SELECT * FROM users WHERE id = 'user1'", (err, row: User) => {
    if (!row) {
      db.run("INSERT INTO users VALUES ('user1', 'Alice')");
      db.run("INSERT INTO users VALUES ('user2', 'Bob')");
      console.log('Mock users created: Alice (user1), Bob (user2)');
    }
  });
});

app.get('/api/documents', (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  if (!userId) {
    res.status(400).json({ error: 'userId required' });
    return;
  }
  const query = `
    SELECT DISTINCT d.* FROM documents d
    LEFT JOIN shares s ON d.id = s.doc_id
    WHERE d.owner_id = ? OR s.user_id = ?
    ORDER BY d.updated_at DESC
  `;
  db.all(query, [userId, userId], (err, rows: Document[]) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.get('/api/documents/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  db.get("SELECT * FROM documents WHERE id = ?", [id], (err, row: Document) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }
    res.json(row);
  });
});

app.post('/api/documents', (req: Request, res: Response) => {
  const { title, content, ownerId } = req.body;
  const id = uuidv4();
  db.run(
    "INSERT INTO documents (id, title, content, owner_id) VALUES (?, ?, ?, ?)",
    [id, title || 'Untitled', content || '<p>Start writing...</p>', ownerId],
    function(this: sqlite3.RunResult, err: Error | null) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id, title, content, owner_id: ownerId });
    }
  );
});

app.put('/api/documents/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, content } = req.body;
  db.run(
    "UPDATE documents SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [title, content, id],
    function(this: sqlite3.RunResult, err: Error | null) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ success: true });
    }
  );
});

app.delete('/api/documents/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  db.run("DELETE FROM shares WHERE doc_id = ?", [id]);
  db.run("DELETE FROM documents WHERE id = ?", [id], function(this: sqlite3.RunResult, err: Error | null) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ success: true });
  });
});

app.post('/api/documents/:id/share', (req: Request, res: Response) => {
  const { id } = req.params;
  const { sharedWithUserId } = req.body;
  db.run(
    "INSERT OR IGNORE INTO shares (doc_id, user_id) VALUES (?, ?)",
    [id, sharedWithUserId],
    function(this: sqlite3.RunResult, err: Error | null) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ success: true });
    }
  );
});

app.get('/api/users', (req: Request, res: Response) => {
  const currentUserId = req.query.currentUserId as string;
  db.all("SELECT id, name FROM users WHERE id != ?", [currentUserId], (err, rows: User[]) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

app.post('/api/upload', upload.single('file'), (req: Request, res: Response) => {
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }
  const filePath = path.join(__dirname, '..', file.path);
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      res.status(500).json({ error: 'Failed to read file' });
      return;
    }
    res.json({ filename: file.originalname, content: data });
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});