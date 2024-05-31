let timer;
let seconds = 0;

function start() {
    if (timer) {
        clearInterval(timer);
    }
    timer = setInterval(updateTimer, 1000);
}

function restart() {
    const textArea = document.getElementById('text-area');
    textArea.value = '';
    // const pdfReader = document.getElementById('pdf-reader');
    // pdfReader.src = '';
    clearInterval(timer);
    seconds = 0;
    updateTimer();
    const spellCheckedDiv = document.getElementById('spell-checked-text');
    spellCheckedDiv.innerText = '';
    checkForErrors(); // Reset counts
}

async function createPdf() {
    const textArea = document.getElementById('text-area');
    const text = textArea.value;
    const timerElement = document.getElementById('timer');
    const timerValue = timerElement.textContent;

    clearInterval(timer);

    try {
        const response = await fetch('/create-pdf/', {
            method: 'POST', headers: {
                'Content-Type': 'application/json', 'X-CSRFToken': getCSRFToken()
            }, body: JSON.stringify({text, timer: timerValue})
        });

        if (!response.ok) {
            throw new Error('Create PDF failed');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'spell_checked.pdf';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function spellCheck() {
    const textArea = document.getElementById('text-area');
    const text = textArea.value;

    try {
        const response = await fetch('/spell-check/', {
            method: 'POST', headers: {
                'Content-Type': 'application/json', 'X-CSRFToken': getCSRFToken()
            }, body: JSON.stringify({text})
        });

        if (!response.ok) {
            throw new Error('Spell check failed');
        }

        const result = await response.json();
        const spellCheckedDiv = document.getElementById('spell-checked-text');
        spellCheckedDiv.innerText = result.spell_checked_text;
    } catch (error) {
        console.error('Error:', error.message);
    }
}

function getCSRFToken() {
    let token = null;
    const cookieValue = document.cookie.match(/csrftoken=([^ ;]+)/);
    if (cookieValue && cookieValue.length > 1) {
        token = cookieValue[1];
    }
    return token;
}

function openPdf() {
    const pdfInput = document.getElementById('pdf-input');
    const pdfReader = document.getElementById('pdf-reader');
    const file = pdfInput.files[0];

    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            pdfReader.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function closePdf() {
    document.getElementById('pdf-reader').src = '';
}

function loadFromDatabase() {
    fetch('/load_pdf_from_db/')
        .then(response => response.json())
        .then(data => {
            const pdfReader = document.getElementById('pdf-reader');
            if (data.length > 0) {
                pdfReader.src = data[0].url;  // Load the first PDF for simplicity
            } else {
                alert('No PDFs found in the database.');
            }
        });
}

function checkForErrors() {
    const text = document.getElementById('text-area').value;
    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
    const slashCount = (text.match(/\//g) || []).length;
    const averageCount = wordCount > 0 ? (wordCount / text.split(/\n/).length).toFixed(2) : 0;

    document.getElementById('word-count').innerText = `Words: ${wordCount}`;
    document.getElementById('slash-count').innerText = `Slashes: ${slashCount}`;
    document.getElementById('average-count').innerText = `Average: ${averageCount}`;
}


function updateTimer() {
    const timerElement = document.getElementById('timer');
    let hours = Math.floor(seconds / 3600);
    let minutes = Math.floor((seconds % 3600) / 60);
    let secs = seconds % 60;
    timerElement.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    seconds++;
}

// Your existing JavaScript functions

function highlightTextArea() {
    const highlightingTools = document.querySelector('.highlighting-tools');
    highlightingTools.classList.toggle('active');
}

