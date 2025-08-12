const body = document.querySelector("body");
body.style.margin = "auto";
body.style.maxWidth = "55rem";
const form = document.querySelector("#form");
const select = document.querySelector("#select");
const precision = document.querySelector("#precision");
var   index = 0;

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

const removeZeroIfNeed = (hour, splitChar) =>
{
  let splitHour = hour.split(splitChar);
  hour = "";
  for (let i = 0; i < 3; i++)
  {
    if (splitHour[i].length == 2 && splitHour[i][0] == "0")
      splitHour[i] = splitHour[i][1];
    hour += `${splitHour[i]}`
    if(i != 2)
      hour += splitChar;
  }
  return (hour);
}

const addZeroIfNeed = (hour, splitChar) =>
{
  let splitHour = hour.split(splitChar);
  hour = "";
  for (let i = 0; i < 3; i++)
  {
    if (splitHour[i].length < 2)
      splitHour[i] = "0" + splitHour[i];
    hour += `${splitHour[i]}`
    if(i != 2)
      hour += splitChar;
  }
  return (hour);
}

const ListMission = () =>
{
  fetch('action.json')
      .then(response => response.json())
      .then(data =>
      {
        let i = 0;
        listMission = document.querySelector("#listMission");
        while (data[i])
        {
          let txt = document.createElement("p");
          txt.id = "toChoose " + i;
          txt.className = "delete";
          txt.innerText = data[i];
          txt.style = "padding:0.5rem; color:blue; text-decoration:underline; cursor:pointer";
          txt.addEventListener("click", e =>
          {
            e.preventDefault();
            let res = confirm("ca va supprimer") ;
            if (res == true)
            {
              const data =
              {
                request       : "3",
                value : txt.innerText,
                id    : txt.id.split("toChoose")[1]
              }
              window.api.sendFormData(data);
            }
          })
          listMission.appendChild(txt);
          i++;
        }
      })
      .catch(error => console.error('Error fetching JSON:', error));
}

const AddOption = () =>
{
  const addMissionForm = document.querySelector("#addMissionForm");
  addMissionForm.addEventListener("submit", e =>
  {
    e.preventDefault();
    const input = document.querySelector("#inputMission");
    if (input.value && input.value != "")
    {
      const data =
      {
        request       : "2",
        value : input.value
      }
      window.api.sendFormData(data);
      input.value = "";
      this.display = "none";
    }
  });
}

const SelectOptions = () =>
{
  fetch('action.json')
      .then(response => response.json())
      .then(data =>
      {
        let i = 0;
        while (data[i])
        {
          const option = document.createElement("option");
          option.value = i;
          option.innerText = data[i];
          option.id = "option" + i;
          select.appendChild(option);
          i++;
        }
      })
      .catch(error => console.error('Error fetching JSON:', error));
}

const FormManage = () =>
{
  form.addEventListener("submit", e =>
  {
    e.preventDefault();

    const date = new Date();
    const formData =
    {
      request       : "0",
      id            : index,
      selectedValue : document.querySelector(`#option${select.value}`).innerText,
      precision     : precision.value,
      timestamp     : `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`,
      date          : `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`,
      finish        : false,
      nbPause       : 0
    }
    window.api.sendFormData(formData);
  })
}


const AffActions = () =>
{
  let date = new Date();
  const listCurrentMissions = document.querySelector("#listCurrentMissions");
  fetch(`Data/${date.getWeekNumber()}-${date.getFullYear()}.json`)
      .then(response => {return (response.json())})
      .then(data =>
      {
        for (let i = 0; data[i]; i++)
        {
          if (!data[i].finish)
          {
            const selectedValue = document.querySelector(`#option${data[i].value}`);
            const newLine = document.createElement("div");
            newLine.id = data[i].id;
            newLine.innerText = data[i].value + " " + data[i].precision + " debut: " + data[i].start;
            const stopButton = document.createElement("button");
            stopButton.id = "stop" + data[i].id;
            stopButton.innerText = "fin de tache";
            stopButton.className = "btn btn-secondary";
            const pauseButton = document.createElement("button");
            pauseButton.className = "btn btn-warning"
            pauseButton.id = "pause" + data[i].id;
            stopButton.className = "btn btn-danger";
            if ((!data[i].pause && !data[i].launch) || (data[i].pause && data[i].launch && (data[i].launch.length == data[i].pause.length)))
            {
              pauseButton.innerText = "mettre en pause";
              stopButton.style.display = '';
            }
            else
            {
              pauseButton.innerText = "reprendre";
              pauseButton.id = "reprendre" + data[i].id;
              stopButton.style.display = 'none';
            }
            const changeTime = document.createElement("input");
            const addButton = document.createElement("button");
            const removeButton = document.createElement("button");
            changeTime.type = "time";
            changeTime.className = "form-control";
            changeTime.style = "max-width: 8rem; margin-left: 0.75rem;";
            changeTime.value = "00:00";
            newLine.style = "margin-top: 0.75rem; margin-bottom: 0.75rem; display: flex;";
            addButton.className = "btn btn-secondary";
            addButton.style = "margin-right: 0.75rem; margin-left: 0.75rem";
            removeButton.className = "btn btn-dark";
            addButton.innerText = "ajouter";
            removeButton.innerText = "retirer";
            pauseButton.style = "margin-right: 0.75rem; margin-left: 0.75rem";
            stop.style = "margin-right: 0.75rem; margin-left: 0.75rem";
            newLine.appendChild(pauseButton);
            newLine.appendChild(stopButton);
            newLine.appendChild(changeTime);
            newLine.appendChild(addButton);
            newLine.appendChild(removeButton);
            listCurrentMissions.appendChild(newLine);
            addButton.addEventListener("click", e =>
            {
              e.preventDefault();
              const dataForm =
              {
                request     : "9",
                id          : data[i].id,
                time        : changeTime.value
              };
              window.api.sendFormData(dataForm);
              changeTime.value = "00:00";
            });
            removeButton.addEventListener("click", e =>
            {
              e.preventDefault();
              const dataForm =
              {
                request     : "10",
                id          : data[i].id,
                time        : changeTime.value
              };
              window.api.sendFormData(dataForm);
              changeTime.value = "00:00";
            });
            removeButton.addEventListener("click", e =>
            {
              e.preventDefault();
              const dataForm =
              {
                request     : "10",
                id          : data[i].id,
                time        : changeTime.value
              };
              window.api.sendFormData(dataForm);
            });
            stopButton.addEventListener("click", e =>
            {
              e.preventDefault();
              date = new Date();
              const dataForm =
              {
                request       : "1",
                id            : data[i].id,
                timestamp     : `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
              }
              window.api.sendFormData(dataForm);
            });
            pauseButton.addEventListener("click", e =>
            {
              if (pauseButton.id == "pause" + data[i].id)
              {
                e.preventDefault();
                date = new Date();
                const dataForm =
                {
                  request      :  "4",
                  id           :  data[i].id,
                  timestamp  :  `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
                }
                window.api.sendFormData(dataForm);
                pauseButton.id = "reprendre" + data[i].id;
                pauseButton.innerText = "reprendre";
                stopButton.style.display = 'none';
              }
              else
              {
                e.preventDefault();
                date = new Date();
                const dataForm =
                {
                  request      :  "5",
                  id           :  data[i].id,
                  timestamp  :  `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
                }
                window.api.sendFormData(dataForm);
                pauseButton.id = "pause" + data[i].id;
                pauseButton.innerText = "mettre en pause";
                stopButton.style.display = '';
              }
            });
          }
          index = i + 1;
        }
      }) // Work with JSON data
      .catch(error => console.error('Error fetching JSON:', error));
}

const forceReload = () =>
{
  const dataForm =
  {
    request      :  "-1",
  }
  window.api.sendFormData(dataForm);
}

const reload = () =>
{
  document.querySelector("#reloadPage").addEventListener("click", e =>
  {
    const dataForm =
    {
      request      :  "-1",
    }
    window.api.sendFormData(dataForm);
  })

}

const isInTab = (tab, value) =>
{
  for (let i = 0; tab[i]; i++)
    if (tab[i] == value)
      return (i);
  return (-1);
}

const addGraph = (valueTab, timeTab) =>
{
  for (let i = 0; timeTab[i]; i++)
  {
    h = timeTab[i].split(':');
    timeTab[i] = h[0];
    if (h[1] > "30")
      timeTab[i]++;
  }
  const config =
  {
    type: 'pie',
    data:
    {
      labels: valueTab,
      datasets:
      [{
        data: timeTab,
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)'],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)'],
        borderWidth: 1
      }]
    },
    options:
    {
      responsive: true,
      plugins:
      {
        legend:
        {
          position: 'top',
        },
        title:
        {
          display: true,
          text: 'Répartition du temps'
        }
      }
    }
  };
  const canva = document.createElement("canvas");
  canva.id = "canva";
  const ctx = canva.getContext('2d');
  new Chart(ctx, config);
  canva.style.maxWidth = "500px";
  canva.style.maxHeight = "500px";
  return (canva);
}

const loadMultipleJsonFiles = () =>
{
  const fileInput = document.querySelector("#loadJsonInput");
  fileInput.addEventListener("change", async e =>
  {
    e.preventDefault();
    body.innerText = "";
    let timeTab = [];
    let valueTab = [];
    let weekNumber = [];
    let specialValue = [];
    const files = e.target.files;
    const bigDiv = document.createElement("div");
    const h1 = document.createElement("h1");
    bigDiv.id = "content";
    bigDiv.style.overflowY = "auto";
    bigDiv.style.maxHeight = "816px";
    h1.innerText = "Résumé des semaine";
    let reloadPage = document.createElement("button");
    reloadPage.id = "reloadPage"
    reloadPage.innerText = "menu précédent";
    reloadPage.className = "btn btn-secondary";
    body.appendChild(h1);
    body.appendChild(reloadPage);
    reload();
    for (let i = 0; i < files.length; i++)
    {
      const reader = new FileReader();
      const content = await new Promise((resolve, reject) =>
      {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsText(files[i]);
      });
      if (!reader.result)
      {
        alert("Erreur de chargement de fichier");
        forceReload();
        return;
      }
      weekNumber.push(files[i].name.split('-')[0]);
      const data = JSON.parse(reader.result);
      let specialIndexTab = 0;
      for (let j = 0; data[j]; j++)
      {
        let indexTab = isInTab(valueTab, data[j].value);
        if (indexTab == -1)
          valueTab.push(data[j].value);
        indexTab = isInTab(valueTab, data[j].value);
        if ( data[j].precision.length != "" && data[j].time)
        {
          specialValue[specialIndexTab] = `${data[j].value}: ${data[j].precision}; ${data[j].time}`;
          specialIndexTab++;
        }
        if (indexTab != -1)
        {
          if (data[j].time)
          {
            if (timeTab && !timeTab[indexTab])
              timeTab[indexTab] = data[j].time;
            else
              timeTab[indexTab] = addHours(timeTab[indexTab], data[j].time);
          }
        }
      }
    }
    if (timeTab.length > 0 && valueTab.length > 0)
    {
      for (var i = 0; i < weekNumber.length; i++)
      {
        h1.innerText += ` ${weekNumber[i]}`;
      }
      const resumeDiv = document.createElement("div");
      bigDiv.style = "display: flex; gap: 5rem;";
      for (let j = 0; timeTab[j] && valueTab[j]; j++)
      {
        const div = document.createElement("div");
        const value = document.createElement("h4");
        const hour = document.createElement("h4");
        hour.innerText = `${timeTab[j]}`;
        value.innerText = `${valueTab[j]}:`;
        div.style = "display: flex;"
        hour.style = "padding: 1rem;";
        value.style = "padding: 1rem;";
        div.appendChild(value);
        div.appendChild(hour);
        resumeDiv.appendChild(div);
        bigDiv.appendChild(resumeDiv);
        body.appendChild(bigDiv);
      }
      bigDiv.appendChild(addGraph(valueTab, timeTab));
    }
    if (specialValue.length > 0)
    {
      const secondTitle = document.createElement("h1");
      secondTitle.innerText = "Temps spéciaux";
      const secondBigDiv = document.createElement("div");
      secondBigDiv.appendChild(secondTitle);
      for (let i = 0; specialValue[i]; i++)
      {
        const txt = document.createElement("h4");
        txt.innerText = specialValue[i];
        secondBigDiv.appendChild(txt);
      }
      body.appendChild(secondBigDiv);
    }
  });
}

const AddOptionv2 = () =>
{
  const add = document.querySelector("#newMission").addEventListener("click", e =>
  {
    const addMissions = document.querySelector("#addMissions");

    if (addMissions.style.display == "none")
      addMissions.style.display = "";
    else
      addMissions.style.display = "none";
  });
}

document.addEventListener('DOMContentLoaded', () =>
{
  loadMultipleJsonFiles();
  reload();
  AffActions();
  AddOptionv2();
  AddOption();
  ListMission();
  SelectOptions();
  FormManage();
});
