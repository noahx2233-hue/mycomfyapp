/* journal.js - Handles Daily Journal persistence and UI interactions */

// Initialize IndexedDB for journal entries
const DB_NAME = 'sorenity_journal';
const DB_VERSION = 1;
const STORE_NAME = 'entries';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = (e) => reject(e.target.error);
    request.onsuccess = (e) => resolve(e.target.result);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'date' }); // date as primary key (YYYY-MM-DD)
      }
    };
  });
}

async function saveJournalEntry(entry) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(e.target.error);
  });
}

async function getJournalEntry(date) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(date);
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

async function getAllEntries() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

// UI Helpers
function renderEntry(entry) {
  const textarea = document.getElementById('journal-text');
  const preview = document.getElementById('journal-preview');
  if (!textarea || !preview) return;
  textarea.value = entry.text || '';
  preview.innerHTML = marked.parse(entry.text || '');
  // render image thumbnails if any
  const imageContainer = document.getElementById('journal-image-thumbnails');
  if (imageContainer) {
    imageContainer.innerHTML = '';
    (entry.images || []).forEach(img => {
      const url = URL.createObjectURL(img.blob);
      const imgEl = document.createElement('img');
      imgEl.src = url;
      imgEl.className = 'journal-thumb';
      imgEl.style.maxWidth = '80px';
      imgEl.style.margin = '4px';
      imageContainer.appendChild(imgEl);
    });
  }
}

function initJournalUI() {
  const textarea = document.getElementById('journal-text');
  const preview = document.getElementById('journal-preview');
  const saveBtn = document.getElementById('save-journal-btn');
  const fileInput = document.getElementById('journal-images');

  // Live markdown preview
  if (textarea && preview) {
    textarea.addEventListener('input', () => {
      preview.innerHTML = marked.parse(textarea.value);
    });
  }

  // Load today entry on startup
  const today = new Date().toISOString().split('T')[0];
  getJournalEntry(today).then(entry => {
    if (entry) renderEntry(entry);
  }).catch(console.error);

  // Save button handler
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const text = textarea ? textarea.value : '';
      const date = new Date().toISOString().split('T')[0];
      // collect images as blobs
      const images = [];
      if (fileInput && fileInput.files) {
        for (let i = 0; i < fileInput.files.length; i++) {
          const file = fileInput.files[i];
          // store file blob directly
          images.push({ name: file.name, blob: file });
        }
      }
      const entry = { date, text, images, createdAt: new Date().toISOString() };
      await saveJournalEntry(entry);
      // give user feedback via global toast if available
      if (window.app && window.app.showToast) {
        window.app.showToast('Journal entry saved');
      }
      // re-render (preview already up‑to‑date, just ensure thumbnails)
      renderEntry(entry);
    });
  }
}

// Run after DOM loaded (but after other scripts may also call init)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initJournalUI);
} else {
  initJournalUI();
}
