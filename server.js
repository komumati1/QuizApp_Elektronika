const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

const PARENT_DIR = path.join(__dirname, '..');
const DATA_DIR = path.join(__dirname, 'pytania_extracted');

app.use(express.json({ limit: '10mb' }));

// Normalize a filename: replace dots (except extension dot) and commas with underscores.
// Real files:  "12,13.png"  "16.09.07.png"  "com.android.chrome.jpg"
// JSON paths:  "12_13.png"  "16_09_07.png"  "com_android_chrome.jpg"
function normalizeFilename(name) {
  const lastDot = name.lastIndexOf('.');
  if (lastDot === -1) return name.replace(/[.,]/g, '_');
  const base = name.substring(0, lastDot).replace(/[.,]/g, '_');
  const ext = name.substring(lastDot);
  return base + ext;
}

// Serve source images with fuzzy filename matching
app.get('/source/*', (req, res) => {
  const relPath = req.params[0];
  const absolute = path.normalize(path.join(PARENT_DIR, relPath));

  if (!absolute.startsWith(path.normalize(PARENT_DIR))) return res.status(403).send('Forbidden');

  const ext = path.extname(absolute).toLowerCase();
  if (!['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(ext))
    return res.status(403).send('Not an image');

  // Try exact path first
  if (fs.existsSync(absolute)) return res.sendFile(absolute);

  // Fuzzy: scan directory, normalize all filenames, find match
  const dir = path.dirname(absolute);
  const requestedBase = path.basename(absolute);
  const normalizedReq = normalizeFilename(requestedBase);

  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    const match = files.find(f => normalizeFilename(f) === normalizedReq);
    if (match) return res.sendFile(path.join(dir, match));
  }

  res.status(404).send('Image not found: ' + relPath);
});

// List available source JSON files
app.get('/api/sources', (req, res) => {
  try {
    const files = fs.readdirSync(DATA_DIR)
      .filter(f => /^extracted.*\.json$/.test(f))
      .sort();

    const sources = files.map(filename => {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, filename), 'utf-8'));
        return { filename, metadata: data.metadata, questionCount: data.questions ? data.questions.length : 0 };
      } catch {
        return { filename, metadata: null, questionCount: 0 };
      }
    });

    res.json(sources);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Merge questions from selected files; each question gets _uid and _sourceFile
// ?files=extracted.json,extracted_2.json   (defaults to all extracted*.json)
app.get('/api/questions', (req, res) => {
  try {
    let fileNames;
    if (req.query.files) {
      fileNames = String(req.query.files).split(',').map(s => s.trim()).filter(Boolean);
    } else {
      fileNames = fs.readdirSync(DATA_DIR).filter(f => /^extracted.*\.json$/.test(f)).sort();
    }

    let combinedMetadata = null;
    const allQuestions = [];

    for (const filename of fileNames) {
      const filePath = path.normalize(path.join(DATA_DIR, filename));
      if (!filePath.startsWith(path.normalize(DATA_DIR)) || !filename.endsWith('.json')) continue;
      if (!fs.existsSync(filePath)) continue;

      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      if (!combinedMetadata) combinedMetadata = { ...data.metadata };

      const baseName = filename.replace('.json', '');
      for (const q of (data.questions || [])) {
        allQuestions.push({ ...q, _uid: `${baseName}:${q.id}`, _sourceFile: filename });
      }
    }

    res.json({ metadata: combinedMetadata, questions: allQuestions });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Save a single updated question back to its source file
app.put('/api/question/:filename/:id', (req, res) => {
  try {
    const { filename, id } = req.params;
    const filePath = path.normalize(path.join(DATA_DIR, filename));
    if (!filePath.startsWith(path.normalize(DATA_DIR)) || !filename.endsWith('.json'))
      return res.status(403).json({ error: 'Forbidden' });
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });

    const questionId = parseInt(id);
    const fileData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const { _uid, _sourceFile, ...cleanQuestion } = req.body;

    fileData.questions = fileData.questions.map(q => q.id === questionId ? cleanQuestion : q);
    fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2), 'utf-8');
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
}

app.listen(PORT, () => console.log(`Server: http://localhost:${PORT}`));
