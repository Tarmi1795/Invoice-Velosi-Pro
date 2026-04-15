const sqlite3 = require('sqlite3');
const fs = require('fs');
const path = require('path');

const SOURCE_DB = 'C:/Users/Admin/.openclaw/workspace/accountant/Invoice Velosi Pro/prisma/dev.db';
const BACKUP_DIR = 'C:/Users/Admin/OneDrive - ApplusGlobal/GIAN/ACSI_backups';

function timestamp() {
  const now = new Date();
  const y = now.getFullYear();
  const mo = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  return `${y}-${mo}-${d}_${h}-${mi}-${s}`;
}

async function backup() {
  const start = Date.now();

  if (!fs.existsSync(SOURCE_DB)) {
    return { success: false, error: `Source database not found: ${SOURCE_DB}` };
  }

  try {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  } catch (err) {
    return { success: false, error: `Could not create backup directory: ${err.message}` };
  }

  const destFile = `dev_backup_${timestamp()}.db`;
  const destPath = path.join(BACKUP_DIR, destFile);

  try {
    fs.copyFileSync(SOURCE_DB, destPath);
  } catch (err) {
    return { success: false, error: `copyFileSync failed: ${err.message}` };
  }

  return new Promise((resolve) => {
    try {
      const testDb = new sqlite3.Database(destPath, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
          try { fs.unlinkSync(destPath); } catch (_) {}
          resolve({ success: false, error: `Backup verification failed: ${err.message}` });
          return;
        }
        testDb.close(() => {
          const stats = fs.statSync(destPath);
          resolve({
            success: true,
            backupPath: destPath,
            sizeKB: Math.round((stats.size / 1024) * 100) / 100,
            durationMs: Date.now() - start
          });
        });
      });
    } catch (err) {
      try { fs.unlinkSync(destPath); } catch (_) {}
      resolve({ success: false, error: `Backup verification error: ${err.message}` });
    }
  });
}

module.exports = { backup };
