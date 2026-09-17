const siteInput = document.getElementById('siteInput');
const addSiteBtn = document.getElementById('addSiteBtn');
const sitesList = document.getElementById('sitesList');

const startTimeSelect = document.getElementById('startTime');
const endTimeSelect = document.getElementById('endTime');
const addScheduleBtn = document.getElementById('addScheduleBtn');
const schedulesList = document.getElementById('schedulesList');

const resetBlockBtn = document.getElementById('resetBlockBtn');
const statusDiv = document.getElementById('status');

function populateTimeDropdowns() {
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const h24 = h < 10 ? `0${h}` : `${h}`;
      const mStr = m < 10 ? `0${m}` : `${m}`;
      const val = `${h24}:${mStr}`;

      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 === 0 ? 12 : h % 12;
      const label = `${h12}:${mStr} ${ampm}`;

      startTimeSelect.add(new Option(label, val));
      endTimeSelect.add(new Option(label, val));
    }
  }

  startTimeSelect.value = "11:00";
  endTimeSelect.value = "03:00";
}

function formatTimeString(timeVal) {
  if (typeof timeVal === 'number') {
    const ampm = timeVal >= 12 ? 'PM' : 'AM';
    const h12 = timeVal % 12 === 0 ? 12 : timeVal % 12;
    return `${h12}:00 ${ampm}`;
  }
  if (typeof timeVal === 'string' && timeVal.includes(':')) {
    const [hStr, mStr] = timeVal.split(':');
    let h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 === 0 ? 12 : h % 12;
    const mFormatted = m < 10 ? `0${m}` : m;
    return `${h}:${mFormatted} ${ampm}`;
  }
  return timeVal;
}

function showStatus(msg) {
  statusDiv.textContent = msg;
  setTimeout(() => statusDiv.textContent = '', 2500);
}

function loadAll() {
  chrome.storage.local.get(['domains', 'schedules'], (data) => {
    const domains = data.domains || ['bbc.com', 'bbc.co.uk', 'x.com', 'linkedin.com', 'theguardian.com', 'cnn.com', 'reddit.com'];
    const schedules = data.schedules || [{ startTime: '11:00', endTime: '03:00' }];
    
    renderSites(domains);
    renderSchedules(schedules);
  });
}

function renderSites(domains) {
  sitesList.innerHTML = domains.length === 0 ? '<div style="font-size:11px; color:#71717a;">No sites added.</div>' : '';
  domains.forEach((domain, idx) => {
    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML = `<span>${domain}</span><button class="del-btn" data-type="site" data-idx="${idx}">✕</button>`;
    sitesList.appendChild(item);
  });
}

function renderSchedules(schedules) {
  schedulesList.innerHTML = schedules.length === 0 ? '<div style="font-size:11px; color:#71717a;">No active schedules.</div>' : '';
  schedules.forEach((s, idx) => {
    const startDisp = formatTimeString(s.startTime ?? s.startHour);
    const endDisp = formatTimeString(s.endTime ?? s.endHour);
    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML = `<span>${startDisp} to ${endDisp}</span><button class="del-btn" data-type="schedule" data-idx="${idx}">✕</button>`;
    schedulesList.appendChild(item);
  });
}

document.addEventListener('click', (e) => {
  if (!e.target.classList.contains('del-btn')) return;
  const type = e.target.getAttribute('data-type');
  const idx = parseInt(e.target.getAttribute('data-idx'), 10);

  if (type === 'site') {
    chrome.storage.local.get(['domains'], (data) => {
      const domains = data.domains || [];
      domains.splice(idx, 1);
      chrome.storage.local.set({ domains }, loadAll);
    });
  } else if (type === 'schedule') {
    chrome.storage.local.get(['schedules'], (data) => {
      const schedules = data.schedules || [];
      schedules.splice(idx, 1);
      chrome.storage.local.set({ schedules }, loadAll);
    });
  }
});

function addSite() {
  const val = siteInput.value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '');
  if (!val) return;

  chrome.storage.local.get(['domains'], (data) => {
    const domains = data.domains || [];
    if (!domains.includes(val)) {
      domains.push(val);
      chrome.storage.local.set({ domains }, () => {
        siteInput.value = '';
        loadAll();
      });
    }
  });
}

addSiteBtn.addEventListener('click', addSite);
siteInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addSite(); });

addScheduleBtn.addEventListener('click', () => {
  const startTime = startTimeSelect.value;
  const endTime = endTimeSelect.value;

  chrome.storage.local.get(['schedules'], (data) => {
    const schedules = data.schedules || [];
    schedules.push({ startTime, endTime });
    chrome.storage.local.set({ schedules }, loadAll);
  });
});

populateTimeDropdowns();
loadAll();