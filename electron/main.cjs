const { app, BrowserWindow, ipcMain} = require("electron");
const path = require("path");
const fs = require("fs/promises");

function getDataFilePath() {
  // Best practice: always writable, works packaged
  // This will be something like:
  // Windows: C:\Users\YOU\AppData\Roaming\swg-resource-tracker\swg-resource-tracker.txt
  // macOS: ~/Library/Application Support/swg-resource-tracker/swg-resource-tracker.txt
  return path.join(app.getPath("userData"), "swg-resource-tracker.txt");
}

async function readData() {
  try {
    const raw = await fs.readFile(getDataFilePath(), "utf8");
    if (!raw.trim()) return { resources: [], inventory: [] };
    const parsed = JSON.parse(raw);

    return {
      resources: Array.isArray(parsed.resources) ? parsed.resources : [],
      inventory: Array.isArray(parsed.inventory) ? parsed.inventory : []
    };
  } catch (_e) {
    return { resources: [], inventory: [] };
  }
}

async function writeData(data) {
  const safe = {
    resources: Array.isArray(data?.resources) ? data.resources : [],
    inventory: Array.isArray(data?.inventory) ? data.inventory : []
  };

  await fs.mkdir(path.dirname(getDataFilePath()), { recursive: true });
  await fs.writeFile(getDataFilePath(), JSON.stringify(safe, null, 2), "utf8");
  return { ok: true, path: getDataFilePath() };
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1500,
    height: 950,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;

  if (devUrl) {
    win.loadURL(devUrl);
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.handle("storage:load", async () => {
  return await readData();
});

ipcMain.handle("storage:save", async (_evt, data) => {
  return await writeData(data);
});

ipcMain.handle("storage:path", async () => {
  return { path: getDataFilePath() };
});


