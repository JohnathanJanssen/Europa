const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const app = express();
const PORT = 3456;
const ROOT = process.cwd(); // You can change this to restrict access

app.use(cors());
app.use(express.json());

// List files in a directory
app.get("/files", (req, res) => {
  const dir = req.query.dir ? path.join(ROOT, req.query.dir) : ROOT;
  fs.readdir(dir, { withFileTypes: true }, (err, files) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(
      files.map((f) => ({
        name: f.name,
        isDir: f.isDirectory(),
      }))
    );
  });
});

// Read a file
app.get("/file", (req, res) => {
  const filePath = path.join(ROOT, req.query.path || "");
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ content: data });
  });
});

// Write a file
app.post("/file", (req, res) => {
  const filePath = path.join(ROOT, req.body.path || "");
  fs.writeFile(filePath, req.body.content || "", "utf8", (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Create a directory
app.post("/directory", (req, res) => {
  const dirPath = path.join(ROOT, req.body.path || "");
  fs.mkdir(dirPath, { recursive: true }, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Rename a file or directory
app.put("/file", (req, res) => {
  const oldPath = path.join(ROOT, req.body.from || "");
  const newPath = path.join(ROOT, req.body.to || "");
  fs.rename(oldPath, newPath, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Delete a file or directory
app.delete("/file", (req, res) => {
  const itemPath = path.join(ROOT, req.query.path || "");
  // Use fs.rm for modern, recursive deletion of files and directories
  fs.rm(itemPath, { recursive: true, force: true }, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Run a terminal command
app.post("/terminal", (req, res) => {
  const cmd = req.body.command;
  exec(cmd, { cwd: ROOT, timeout: 10000 }, (err, stdout, stderr) => {
    res.json({
      stdout: stdout,
      stderr: stderr,
      error: err ? err.message : null,
    });
  });
});

// --- Static File Serving ---
// Serve the built React app
app.use(express.static(path.join(__dirname, 'dist')));

// For any other request, serve the index.html file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Jupiter backend running on http://localhost:${PORT}`);
});