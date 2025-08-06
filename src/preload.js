const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    sendFormData: (data) => ipcRenderer.send('FORM_DATA', data),
});
