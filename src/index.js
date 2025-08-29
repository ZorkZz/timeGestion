const { app, BrowserWindow, Notification, ipcMain } = require('electron');
const path = require('node:path');
const fs = require('fs');

if (require('electron-squirrel-startup')) {
  app.quit();
}

Date.prototype.getWeekNumber = function() {
    const d = new Date(Date.UTC(this.getFullYear(), this.getMonth(), this.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const firstThursday = d.valueOf();
    d.setUTCMonth(0, 1);
    if (d.getUTCDay() !== 4) {
        d.setUTCMonth(0, 1 + ((4 - d.getUTCDay()) + 7) % 7);
    }
    return Math.ceil((firstThursday - d) / (7 * 24 * 3600 * 1000)) + 1;
};

const date = new Date();
const semaineActuelle = date.getWeekNumber();
const fileToSave = `${semaineActuelle}-${date.getFullYear()}`;

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 1000,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

ipcMain.on('FORM_DATA', (event, data) => {
  if (data.request == "0")
    createAction(data);
  else if (data.request == "1")
    finishAction(data);
  else if (data.request == "2")
    addAction(data);
  else if (data.request == "3")
    removeAction(data);
  else if (data.request == "4")
    pauseAction(data);
  else if (data.request == "5")
    reLaunchAction(data);
  else if (data.request == "6" || data.request == "7")
    modifieAction(data);
  else if (data.request == "8")
    deleteAction(data);
  else if (data.request == "9")
    addTime(data);
  else if (data.request == "10")
    removeTime(data);
  else if (data.request == "-1")
  {
    const windows = BrowserWindow.getAllWindows();
    if (windows.length > 0)
    {
      const mainWindow = windows[0];
      mainWindow.webContents.reload();
    }
  }
});

const addTime = data =>
{
  const filePath = path.join(__dirname, `Data/${fileToSave}.json`);
  fs.readFile(filePath, "utf8", (error, content) =>
  {
    let actionData = [];
    if (error)
    {
      console.log(error);
      return
    }
    if (content && content != undefined && content != "" && content.length > 0)
    {
      actionData = JSON.parse(content);
      let actualAction = actionData[data.id];
      if (!actualAction.timeToAdd)
        actualAction.timeToAdd = `${data.time}:00`;
      else
      actualAction.timeToAdd = addHours(actualAction.timeToAdd, `${data.time}:00`);
      actionData[data.id] = actualAction;
      fs.writeFile(filePath, JSON.stringify(actionData, null, 2), "utf8", err =>
      {
        if (err)
          console.log(err);
      });
    }
  });
}

const removeTime = data =>
{
  const filePath = path.join(__dirname, `Data/${fileToSave}.json`);
  fs.readFile(filePath, "utf8", (error, content) =>
  {
    let actionData = [];
    if (error)
    {
      console.log(error);
      return
    }
    if (content && content != undefined && content != "" && content.length > 0)
    {
      actionData = JSON.parse(content);
      let actualAction = actionData[data.id];
      if (!actualAction.timeToRemove)
        actualAction.timeToRemove = `${data.time}:00`;
      else
        actualAction.timeToRemove = addHours(actualAction.timeToRemove, `${data.time}:00`);
      actionData[data.id] = actualAction;
      fs.writeFile(filePath, JSON.stringify(actionData, null, 2), "utf8", err =>
      {
        if (err)
          console.log(err);
      });
    }
  });
}

const deleteAction = data =>
{
  const filePath = path.join(__dirname, `Data/${fileToSave}.json`);
  fs.readFile(filePath, "utf8", (error, content) =>
  {
    if (error)
    {
      console.log(error);
      return
    }
    let actionData = [];
      if (content && content != undefined && content != "" && content.length > 0)
      {
        actionData = JSON.parse(content);
        let result = actionData;
        let j = 0;
        while (result && result[j])
        {
          if (j >= data.id)
          {
            if (result[j + 1])
            {
              result[j + 1].id = j;
              result[j] = result[j + 1];
            }
            else
              result[j] = NaN;
          }
          j++;
        }
        result.splice(j - 1);
        actionData = result;
        fs.writeFile(filePath, JSON.stringify(actionData, null, 2), "utf8", err =>
        {
          if (err)
            console.log(err);
        });
      }
  });
}

const modifieAction = data =>
{
  const filePath = path.join(__dirname, `Data/${fileToSave}.json`);
  fs.readFile(filePath, "utf8", (error, content) =>
  {
    let currentActionData = [];
    if (content)
      currentActionData = JSON.parse(content);
    else
      return;
    let dataToChange = currentActionData[data.id];
    dataToChange.value = data.value;
    dataToChange.start = data.beginH;
    if (data.request == 7)
    {
      dataToChange.endHour = data.endH;
      dataToChange.time = data.time;
    }
    currentActionData[data.id] = dataToChange;
    fs.writeFile(filePath, JSON.stringify(currentActionData, null, 2), "utf8", err =>
    {
      if (err)
        console.log(err);
    });
  });
}

const createAction = (data) =>
{
  const filePath = path.join(__dirname, `Data/${fileToSave}.json`);
  fs.readFile(filePath, 'utf8', (error, content) =>
  {
    let currentActionData = [];
    if (content)
      currentActionData = JSON.parse(content);
    const newData = {id: data.id , value: data.selectedValue, precision: data.precision, date: data.date, start: data.timestamp, finish: data.finish, nbPause: data.nbPause};
    currentActionData.push(newData);
    if (error)
      console.log(error);
    fs.writeFile(filePath, JSON.stringify(currentActionData, null, 2), 'utf8', (err) =>
    {
      if (err)
        console.log(err);
      else
      {

        const windows = BrowserWindow.getAllWindows();
        if (windows.length > 0)
        {
          const mainWindow = windows[0];
          mainWindow.webContents.reload();
        }
      }
    })
  });
}

const finishAction = (data) =>
{
  const filePath = path.join(__dirname, `Data/${fileToSave}.json`);
  fs.readFile(filePath, 'utf8', (error, content) =>
  {

    let time = "";
    let i = 0;
    let currentActionData = JSON.parse(content);
    if (!currentActionData)
      return;
    if (data.timestamP)
    {
      if (currentActionData[data.id].nbPause > 0)
      {
        if ((currentActionData[data.id].launch && (currentActionData[data.id].pause.length != currentActionData[data.id].launch.length)) || !currentActionData[data.id].launch)
        {
          let launch = [];
          if (currentActionData[data.id].launch)
            launch = currentActionData[data.id].launch;
          launch.push(data.timestamP);
          currentActionData[data.id].launch = launch;
        }
      }
    }
    currentActionData[data.id].finish = true;
    currentActionData[data.id].endHour = data.timestamp;
    currentActionData[data.id].time = getDiff(currentActionData[data.id].start, data.timestamp);
    while (currentActionData[data.id].pause && currentActionData[data.id].pause[i] && currentActionData[data.id].launch && currentActionData[data.id].launch[i])
    {
      time += getDiff(currentActionData[data.id].pause[i], currentActionData[data.id].launch[i]);
      i++;
    }
    if (currentActionData[data.id].nbPause > 0)
      currentActionData[data.id].time = removeHours(currentActionData[data.id].time, time);
    if (currentActionData[data.id].timeToAdd)
      currentActionData[data.id].time = addHours(currentActionData[data.id].time, currentActionData[data.id].timeToAdd);
      if (currentActionData[data.id].timeToRemove)
        currentActionData[data.id].time = removeHours(currentActionData[data.id].time, currentActionData[data.id].timeToRemove);
    fs.writeFile(filePath, JSON.stringify(currentActionData, null, 2), 'utf8', (err) =>
    {
      if (err)
        console.log(err);
      else if (!data.notReaload)
      {
        const windows = BrowserWindow.getAllWindows();
        if (windows.length > 0)
        {
          const mainWindow = windows[0];
          mainWindow.webContents.reload();
        }
      }
    });
  });
}

const pauseAction = data =>
{
  const filePath = path.join(__dirname, `Data/${fileToSave}.json`);
  fs.readFile(filePath, 'utf8', (error, content) =>
  {
    let currentActionData = JSON.parse(content);
    currentActionData[data.id].nbPause++;
    let pause = []
    if (currentActionData[data.id].pause)
      pause = currentActionData[data.id].pause;
    pause.push(data.timestamp);
    currentActionData[data.id].pause = pause;
    fs.writeFile(filePath, JSON.stringify(currentActionData, null, 2), 'utf8', (err) =>
    {
      if (err)
        console.log(err);
    });
  });
}

const reLaunchAction = data =>
{
  const filePath = path.join(__dirname, `Data/${fileToSave}.json`);
  fs.readFile(filePath, 'utf8', (error, content) =>
  {
    let currentActionData = JSON.parse(content);
    let launch = [];
    if (currentActionData[data.id].launch)
      launch = currentActionData[data.id].launch;
    launch.push(data.timestamp);
    currentActionData[data.id].launch = launch;
    fs.writeFile(filePath, JSON.stringify(currentActionData, null, 2), 'utf8', (err) =>
    {
      if (err)
        console.log(err);
    });
  });
}

const getDiff = (hour1, hour2) => {
    const [h1, m1, s1] = hour1.split(':').map(Number);
    const [h2, m2, s2] = hour2.split(':').map(Number);

    const date1 = new Date(0, 0, 0, h1, m1, s1);
    const date2 = new Date(0, 0, 0, h2, m2, s2);
    const differenceMs = Math.abs(date2 - date1);

    const heures = Math.floor(differenceMs / 3600000);
    const minutes = Math.floor((differenceMs % 3600000) / 60000);
    const secondes = Math.floor((differenceMs % 60000) / 1000);

    return `${heures}:${minutes}:${secondes}`;
}

const addHours = (hour1, hour2) =>
{
  const [h1, m1, s1] = hour1.split(':').map(Number);
  const [h2, m2, s2] = hour2.split(':').map(Number);
  const totalSeconds = (h1 * 3600 + m1 * 60 + s1) + (h2 * 3600 + m2 * 60 + s2);
  const totalHeures = Math.floor(totalSeconds / 3600);
  const resteMinutes = totalSeconds % 3600;
  const totalMinutes = Math.floor(resteMinutes / 60);
  const totalSecondes = resteMinutes % 60;
  return `${totalHeures}:${totalMinutes.toString().padStart(2, '0')}:${totalSecondes.toString().padStart(2, '0')}`;
}

const removeHours = (hour1, hour2) => {
    const [h1, m1, s1] = hour1.split(':').map(Number);
    const [h2, m2, s2] = hour2.split(':').map(Number);

    const date1 = new Date(0, 0, 0, h1, m1, s1);
    const date2 = new Date(0, 0, 0, h2, m2, s2);
    const totalMs = date1.getTime() - date2.getTime();

    const totalSeconds = Math.floor(totalMs / 1000);
    const heures = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secondes = totalSeconds % 60;

    return `${heures}:${minutes.toString().padStart(2, '0')}:${secondes.toString().padStart(2, '0')}`;
}

const addAction = (data) =>
{
  const filePath = path.join(__dirname, 'action.json');
  fs.readFile(filePath, 'utf8', (error, content) =>
  {
    let actionData = {};
    let i = 1;
    if (content && content != undefined && content != "" && content.length > 0)
    {
      actionData = JSON.parse(content);
      i = 0;
      while (actionData[i++]);
    }
    actionData[i - 1] = data.value;
    fs.writeFile(filePath, JSON.stringify(actionData, null, 2), 'utf8', (err) =>
    {
      if (err)
        console.log(err);
    });
    const windows = BrowserWindow.getAllWindows();
    if (windows.length > 0)
    {
      const mainWindow = windows[0];
      mainWindow.webContents.reload();
    }
  });
}

const removeAction = (data) =>
{
  const filePath = path.join(__dirname, 'action.json');
  fs.readFile(filePath, 'utf8', (error, content) =>
  {
    let actionData = {};
    let i = 1;
    if (content && content != undefined && content != "" && content.length > 0)
    {
      actionData = JSON.parse(content);
      let result = actionData;
      let j = 0;
      while (result && result[j])
      {
        if (j >= data.id)
          result[j] = result[j + 1];
        j++;
      }
      actionData = result;
    }
    fs.writeFile(filePath, JSON.stringify(actionData, null, 2), 'utf8', (err) =>
    {
      if (err)
        console.log(err);
    });
    const windows = BrowserWindow.getAllWindows();
    if (windows.length > 0)
    {
      const mainWindow = windows[0];
      mainWindow.webContents.reload();
    }
  });
}

const notif = () =>
{
  const NOTIFICATION_TITLE = "Tu m'as oublié?";
  const NOTIFICATION_BODY = "N'oublies pas de vérifier ce que tu fais";

  new Notification({
    title: NOTIFICATION_TITLE,
    body: NOTIFICATION_BODY
  }).show();
}

app.whenReady().then(() => {
  const notifIntervall = setInterval(notif, 3600000);
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0)
    {
      createWindow();
    }
  });
});


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
