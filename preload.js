// Preload script for Electron
const { contextBridge, ipcRenderer } = require('electron');
const remote = require('@electron/remote');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'electron', {
    remote: remote,
    ipcRenderer: {
      send: (channel, data) => {
        // whitelist channels
        const validChannels = ['toMain'];
        if (validChannels.includes(channel)) {
          ipcRenderer.send(channel, data);
        }
      },
      receive: (channel, func) => {
        const validChannels = ['fromMain'];
        if (validChannels.includes(channel)) {
          // Deliberately strip event as it includes `sender`
          ipcRenderer.on(channel, (event, ...args) => func(...args));
        }
      }
    }
  }
);

// Expose all Node.js APIs to the renderer process
// This is not recommended for production, but needed for compatibility with the existing code
window.require = require;
