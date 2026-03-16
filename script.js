const defaultBackgrounds = [
    'https://picsum.photos/id/1015/1920/1080',
    'https://picsum.photos/id/1018/1920/1080',
    'https://picsum.photos/id/1019/1920/1080',
    'https://picsum.photos/id/1035/1920/1080',
    'https://picsum.photos/id/1036/1920/1080',
    'https://picsum.photos/id/1037/1920/1080',
    'https://picsum.photos/id/1038/1920/1080',
    'https://picsum.photos/id/1039/1920/1080',
    'https://picsum.photos/id/1043/1920/1080',
    'https://picsum.photos/id/1044/1920/1080'
];

let backgrounds = [...defaultBackgrounds];
let currentBackgroundIndex = 0;
let backgroundInterval;
let changeIntervalMinutes = 5;
let useLocalStorage = false;

let currentClockFont = 'Orbitron';
let currentDateFont = 'Rajdhani';
let currentClockColor = '#ffffff';
let currentDateColor = '#f0f0f0';
let currentClockPosition = 'pos-center';
let customTexts = [];

function loadGoogleFont(fontFamily) {
    if (!fontFamily) return;
    const fontId = `google-font-${fontFamily.replace(/\s+/g, '-')}`;
    if (!document.getElementById(fontId)) {
        const link = document.createElement('link');
        link.id = fontId;
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, '+')}:wght@400;600;700;900&display=swap`;
        document.head.appendChild(link);
    }
}

function applyAppearanceStyles() {
    document.documentElement.style.setProperty('--clock-font', `"${currentClockFont}", monospace`);
    document.documentElement.style.setProperty('--date-font', `"${currentDateFont}", sans-serif`);
    document.documentElement.style.setProperty('--clock-color', currentClockColor);
    document.documentElement.style.setProperty('--date-color', currentDateColor);

    const clockContainer = document.querySelector('.clock-container');
    clockContainer.classList.remove('pos-top', 'pos-center', 'pos-bottom');
    if (currentClockPosition) {
        clockContainer.classList.add(currentClockPosition);
    } else {
        clockContainer.classList.add('pos-center');
    }

    loadGoogleFont(currentClockFont);
    loadGoogleFont(currentDateFont);
}

function renderCustomTexts() {
    const container = document.getElementById('custom-texts-container');
    if (!container) return;
    container.innerHTML = '';
    customTexts.forEach(item => {
        loadGoogleFont(item.font);
        const el = document.createElement('div');
        el.className = 'custom-text-item-display';
        el.textContent = item.text;
        el.style.fontFamily = `"${item.font}", sans-serif`;
        el.style.color = item.color;
        container.appendChild(el);
    });
}

function renderCustomTextsSettingsList() {
    const list = document.getElementById('custom-texts-list');
    if (!list) return;
    list.innerHTML = '';
    customTexts.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'bg-item';
        div.innerHTML = `
            <span style="font-family: '${item.font}', sans-serif; color: ${item.color}">${item.text.substring(0, 20)}${item.text.length > 20 ? '...' : ''}</span>
            <button data-index="${index}" class="remove-text-btn">Remove</button>
        `;
        list.appendChild(div);
    });
    
    list.querySelectorAll('.remove-text-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(e.target.dataset.index);
            customTexts.splice(idx, 1);
            saveCustomTexts();
        });
    });
}

function saveCustomTexts() {
    chrome.storage.sync.set({ customTexts }, () => {
        renderCustomTexts();
        renderCustomTextsSettingsList();
    });
}

function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
    document.getElementById('time').textContent = timeString;

    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateString = now.toLocaleDateString('en-US', options);
    document.getElementById('date').textContent = dateString;
}

function setBackgroundImage() {
    const backgroundContainer = document.querySelector('.background-container');
    if (backgrounds.length > 0) {
        if (currentBackgroundIndex >= backgrounds.length || currentBackgroundIndex < 0) {
            currentBackgroundIndex = 0;
        }
        backgroundContainer.style.backgroundImage = `url('${backgrounds[currentBackgroundIndex]}')`;
    } else {
        backgroundContainer.style.backgroundImage = 'none';
        backgroundContainer.style.backgroundColor = '#1a1a1a';
    }
}

function nextBackground() {
    if (backgrounds.length > 0) {
        currentBackgroundIndex = (currentBackgroundIndex + 1) % backgrounds.length;
        setBackgroundImage();
    }
}

function prevBackground() {
    if (backgrounds.length > 0) {
        currentBackgroundIndex = (currentBackgroundIndex - 1 + backgrounds.length) % backgrounds.length;
        setBackgroundImage();
    }
}

function startBackgroundRotation() {
    if (backgroundInterval) {
        clearInterval(backgroundInterval);
    }
    setBackgroundImage();
    backgroundInterval = setInterval(nextBackground, changeIntervalMinutes * 60 * 1000);
}

function loadSettings() {
    chrome.storage.sync.get(['changeInterval', 'useLocalStorage', 'clockFont', 'dateFont', 'clockColor', 'dateColor', 'customTexts', 'clockPosition'], (result) => {
        if (result.changeInterval) {
            changeIntervalMinutes = result.changeInterval;
            document.getElementById('interval-input').value = changeIntervalMinutes;
        }

        if (result.useLocalStorage !== undefined) {
            useLocalStorage = result.useLocalStorage;
            document.getElementById('use-local-storage').checked = useLocalStorage;
            toggleLocalBgSection();
        }

        if (result.clockFont) currentClockFont = result.clockFont;
        if (result.dateFont) currentDateFont = result.dateFont;
        if (result.clockColor) currentClockColor = result.clockColor;
        if (result.dateColor) currentDateColor = result.dateColor;
        if (result.clockPosition) currentClockPosition = result.clockPosition;
        
        if (result.customTexts) customTexts = result.customTexts;

        document.getElementById('clock-font').value = currentClockFont;
        document.getElementById('date-font').value = currentDateFont;
        document.getElementById('clock-color').value = currentClockColor;
        document.getElementById('date-color').value = currentDateColor;
        document.getElementById('clock-position').value = currentClockPosition;

        applyAppearanceStyles();
        renderCustomTexts();
        renderCustomTextsSettingsList();

        chrome.storage.local.get(['localBackgrounds'], (localResult) => {
            const localBgs = localResult.localBackgrounds || [];
            if (useLocalStorage) {
                backgrounds = localBgs.length > 0 ? localBgs : [];
            } else {
                backgrounds = [...defaultBackgrounds];
            }
            if (localBgs.length > 0) {
                renderLocalBackgrounds();
            }

            if (backgrounds.length === 0) {
                document.querySelector('.background-container').style.backgroundImage = 'none';
                document.querySelector('.background-container').style.backgroundColor = '#1a1a1a';
            }

            startBackgroundRotation();
        });
    });
}

function renderLocalBackgrounds() {
    chrome.storage.local.get(['localBackgrounds'], (result) => {
        const localBgList = document.getElementById('local-bg-list');
        localBgList.innerHTML = '';

        if (result.localBackgrounds && result.localBackgrounds.length > 0) {
            result.localBackgrounds.forEach((url, index) => {
                const item = document.createElement('div');
                item.className = 'bg-item';
                const displayText = url.startsWith('data:') ? `Local Image ${index + 1}` : url.substring(0, 30) + '...';
                item.innerHTML = `
                    <span title="${url.startsWith('data:') ? 'Local file' : url}">${displayText}</span>
                    <button data-index="${index}">Remove</button>
                `;
                localBgList.appendChild(item);
            });

            localBgList.querySelectorAll('button').forEach(btn => {
                btn.addEventListener('click', () => removeBackground(parseInt(btn.dataset.index)));
            });
        }
    });
}

function addBackground() {
    const urlInput = document.getElementById('bg-url-input');
    const url = urlInput.value.trim();

    if (url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:'))) {
        chrome.storage.local.get(['localBackgrounds'], (result) => {
            const localBackgrounds = result.localBackgrounds || [];
            localBackgrounds.push(url);

            chrome.storage.local.set({ localBackgrounds }, () => {
                if (useLocalStorage) {
                    backgrounds = localBackgrounds;
                    startBackgroundRotation();
                }
                renderLocalBackgrounds();
                urlInput.value = '';
            });
        });
    }
}

function handleFileSelect(event) {
    const files = event.target.files;
    if (files.length === 0) return;

    const fileReaders = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;

        const reader = new FileReader();
        const promise = new Promise((resolve, reject) => {
            reader.onload = (e) => {
                resolve(e.target.result);
            };
            reader.onerror = (e) => {
                console.error("File reading error:", reader.error);
                resolve(null); // Resolve with null to not break Promise.all
            };
            reader.readAsDataURL(file);
        });

        fileReaders.push(promise);
    }

    Promise.all(fileReaders).then(results => {
        const dataUrls = results.filter(url => url !== null);
        if (dataUrls.length === 0) return;

        chrome.storage.local.get(['localBackgrounds'], (result) => {
            const localBackgrounds = result.localBackgrounds || [];
            const updatedBackgrounds = [...localBackgrounds, ...dataUrls];

            chrome.storage.local.set({ localBackgrounds: updatedBackgrounds }, () => {
                if (useLocalStorage) {
                    backgrounds = updatedBackgrounds;
                    startBackgroundRotation();
                }
                renderLocalBackgrounds();
            });
        });
    });

    event.target.value = '';
}

function removeBackground(index) {
    chrome.storage.local.get(['localBackgrounds'], (result) => {
        const localBackgrounds = result.localBackgrounds || [];
        localBackgrounds.splice(index, 1);

        chrome.storage.local.set({ localBackgrounds }, () => {
            if (useLocalStorage) {
                backgrounds = localBackgrounds.length > 0 ? localBackgrounds : [...defaultBackgrounds];
                startBackgroundRotation();
            }
            renderLocalBackgrounds();
        });
    });
}

function toggleLocalBgSection() {
    const section = document.getElementById('local-bg-section');
    if (document.getElementById('use-local-storage').checked) {
        section.classList.remove('hidden');
    } else {
        section.classList.add('hidden');
    }
}

function saveSettings() {
    const intervalInput = document.getElementById('interval-input');
    const newInterval = parseInt(intervalInput.value);
    const useLocal = document.getElementById('use-local-storage').checked;

    currentClockFont = document.getElementById('clock-font').value;
    currentDateFont = document.getElementById('date-font').value;
    currentClockColor = document.getElementById('clock-color').value;
    currentDateColor = document.getElementById('date-color').value;
    currentClockPosition = document.getElementById('clock-position').value;

    if (newInterval > 0 && newInterval <= 60) {
        changeIntervalMinutes = newInterval;
        useLocalStorage = useLocal;

        applyAppearanceStyles();

        chrome.storage.local.get(['localBackgrounds'], (result) => {
            const localBgs = result.localBackgrounds || [];
            if (useLocalStorage) {
                backgrounds = localBgs.length > 0 ? localBgs : [];
            } else {
                backgrounds = [...defaultBackgrounds];
            }

            chrome.storage.sync.set({
                changeInterval: changeIntervalMinutes,
                useLocalStorage: useLocalStorage,
                clockFont: currentClockFont,
                dateFont: currentDateFont,
                clockColor: currentClockColor,
                dateColor: currentDateColor,
                clockPosition: currentClockPosition
            }, () => {
                startBackgroundRotation();
                toggleSettingsPanel();
            });
        });
    }
}

function toggleSettingsPanel() {
    const panel = document.getElementById('settings-panel');
    panel.classList.toggle('hidden');
}

document.getElementById('settings-btn').addEventListener('click', toggleSettingsPanel);
document.getElementById('save-settings').addEventListener('click', saveSettings);
document.getElementById('use-local-storage').addEventListener('change', toggleLocalBgSection);
document.getElementById('add-bg-btn').addEventListener('click', addBackground);
document.getElementById('file-input').addEventListener('change', handleFileSelect);

document.getElementById('add-custom-text-btn').addEventListener('click', () => {
    const textInput = document.getElementById('custom-text-input');
    const text = textInput.value.trim();
    if (text) {
        const font = document.getElementById('custom-text-font').value;
        const color = document.getElementById('custom-text-color').value;
        customTexts.push({ text, font, color });
        saveCustomTexts();
        textInput.value = '';
    }
});

// Live preview appearance settings without saving immediately
const appearanceInputs = ['clock-font', 'date-font', 'clock-color', 'date-color', 'clock-position'];
appearanceInputs.forEach(id => {
    document.getElementById(id).addEventListener('input', () => {
        currentClockFont = document.getElementById('clock-font').value;
        currentDateFont = document.getElementById('date-font').value;
        currentClockColor = document.getElementById('clock-color').value;
        currentDateColor = document.getElementById('date-color').value;
        currentClockPosition = document.getElementById('clock-position').value;
        applyAppearanceStyles();
    });
});

document.getElementById('bg-url-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addBackground();
    }
});

document.addEventListener('keydown', (e) => {
    // Only trigger if focus is not inside an input, textarea, or select element
    const tagName = e.target.tagName.toUpperCase();
    if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
        return;
    }

    if (e.key === 'ArrowRight') {
        nextBackground();
        startBackgroundRotation(); // reset interval timing
    } else if (e.key === 'ArrowLeft') {
        prevBackground();
        startBackgroundRotation(); // reset interval timing
    }
});

document.addEventListener('click', (e) => {
    const settingsPanel = document.getElementById('settings-panel');
    const settingsBtn = document.getElementById('settings-btn');

    if (!settingsPanel.contains(e.target) && !settingsBtn.contains(e.target)) {
        settingsPanel.classList.add('hidden');
    }
});

updateClock();
setInterval(updateClock, 1000);
loadSettings();
