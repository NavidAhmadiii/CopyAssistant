let timer;
let seconds = 0;

function start() {
    if (timer) {
        clearInterval(timer);
    }
    timer = setInterval(updateTimer, 1000);
}

function restart() {
    const editorContent = document.querySelector('.ql-editor');
    editorContent.innerHTML = '';
    clearInterval(timer);
    seconds = 0;
    updateTimer();
    const spellCheckedDiv = document.getElementById('spell-checked-text');
    spellCheckedDiv.innerText = '';
}

async function createPdf() {
    const editorContent = document.querySelector('.ql-editor').innerText; // استفاده از innerText برای حذف تگ‌های HTML
    const timerElement = document.getElementById('timer');
    const timerValue = timerElement.textContent;

    clearInterval(timer);

    // ارسال محتوای ویرایش شده به سرور
    const response = await fetch('/create-pdf/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify({text: editorContent, timer: timerValue})
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

    // تبدیل متن HTML به محتوای PDF
    const pdfContent = [];

    // جدا کردن متن به کلمات و اعمال تنظیمات مربوط به هر کلمه
    const words = editorContent.split(/\s+/);
    words.forEach(word => {
        let style = {};
        // اعمال تنظیمات مربوط به هر کلمه
        if (word.includes('bold')) {
            style.bold = true;
        }
        if (word.includes('italic')) {
            style.italics = true;
        }
        if (word.includes('underline')) {
            style.decoration = 'underline';
        }
        if (word.includes('red')) {
            style.color = 'red';
        }
        // اضافه کردن کلمه با تنظیمات به محتوای PDF
        pdfContent.push({text: word, ...style});
    });

    // تنظیمات مربوط به محتوای PDF
    const docDefinition = {
        content: [
            {text: `Timer: ${timerValue}`, style: 'header'},
            {text: ' '}, // خط خالی برای فاصله
            ...pdfContent // محتوای تبدیل شده
        ],
        styles: {
            header: {
                fontSize: 18,
                bold: true,
                margin: [0, 0, 0, 10]
            },
        }
    };

    // ایجاد و دانلود PDF
    pdfMake.createPdf(docDefinition).download('document.pdf');
}

document.querySelector(".create-pdf").addEventListener("click", createPdf);

async function spellCheck() {
    const editorContent = document.querySelector('.ql-editor');
    const text = editorContent.innerHTML;

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

function checkForErrors() {
    const text = document.getElementById('editor').innerText;
    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
    const slashCount = (text.match(/\//g) || []).length;
    const averageCount = slashCount > 0 ? (wordCount / slashCount).toFixed(2) : 0;

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


function highlightTextArea() {
    const highlightingTools = document.querySelector('.highlighting-tools');
    highlightingTools.classList.toggle('active');
}


// load from db

async function loadFromDatabase() {
    try {
        const response = await fetch('/load_pdfs/');
        if (!response.ok) {
            throw new Error('Failed to load PDFs from database');
        }
        const pdfs = await response.json();
        displayPDFList(pdfs);
        openModal();
    } catch (error) {
        console.error('Error loading PDFs from database:', error.message);
    }
}

function displayPDFList(pdfs) {
    const pdfListContainer = document.getElementById('pdf-list');
    pdfListContainer.innerHTML = ''; // Clear existing list

    pdfs.forEach(pdf => {
        console.log('PDF URL:', pdf.url); // برای نمایش URL در کنسول
        const pdfItem = document.createElement('div');
        pdfItem.className = 'pdf-item';
        pdfItem.textContent = pdf.title;
        pdfItem.onclick = () => openPdfFromUrl(pdf.url);
        pdfListContainer.appendChild(pdfItem);
    });
}

function openPdfFromUrl(url) {
    const pdfReader = document.getElementById('pdf-reader');
    pdfReader.src = `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(url)}`;
    closePdfModal();
}

function openModal() {
    const modal = document.getElementById('pdf-modal');
    modal.style.display = 'block';
}

// function closeModal() {
//     const modal = document.getElementById('pdf-modal');
//     modal.style.display = 'none';
// }

// Ensure this function is called when the 'Load from DB' button is clicked
document.querySelector('.load-from-db').addEventListener('click', loadFromDatabase);

// Close the modal when the user clicks outside of it
window.onclick = function (event) {
    const modal = document.getElementById('pdf-modal');
    if (event.target == modal) {
        closePdfModal();
    }
}

<!-- Quill JS -->
// editor
document.addEventListener("DOMContentLoaded", function () {
    var toolbarOptions = [['bold', 'italic', 'underline', 'strike'], ['blockquote', 'code-block'], [{'header': 1}, {'header': 2}], [{'list': 'ordered'}, {'list': 'bullet'}], [{'script': 'sub'}, {'script': 'super'}], [{'indent': '-1'}, {'indent': '+1'}], [{'direction': 'rtl'}], [{'size': ['small', false, 'large', 'huge']}], [{'header': [1, 2, 3, 4, 5, 6, false]}], [{'color': []}, {'background': []}], [{'font': []}], [{'align': []}], ['clean']];

    var quill = new Quill('#editor', {
        modules: {
            toolbar: toolbarOptions
        }, theme: 'snow'
    });

    let previousRange = null;

    quill.on('text-change', function (delta, oldDelta, source) {
        if (source === 'user') {
            let currentRange = quill.getSelection();
            if (previousRange && currentRange.index < previousRange.index) {
                let length = delta.ops[1].insert ? delta.ops[1].insert.length : 1;
                quill.formatText(currentRange.index - length, length, {'color': 'red'});
            }
            previousRange = currentRange;
        }
    });

    quill.keyboard.addBinding({
        key: 'space', collapsed: true, format: [], handler: function (range, context) {
            quill.format('color', 'black');
            return true;
        }

    });
    quill.container.addEventListener('keydown', function (event) {
        if (event.key === 'Backspace') {
            let currentRange = quill.getSelection();
            setTimeout(function () {
                let length = previousRange ? previousRange.length : 0;
                if (currentRange && previousRange && currentRange.index < previousRange.index && length > 0) {
                    quill.formatText(currentRange.index, length, {'color': 'red'});
                }
            }, 0);
        }
    });


    quill.on('selection-change', function (range, oldRange, source) {
        if (source === 'user' && oldRange) {
            let length = oldRange.length === 0 ? 1 : oldRange.length;
            quill.formatText(oldRange.index, length, {'color': 'black'});
        }
    });

    // رنگ متن را مشکی کنید هنگامی که کاربر اسپیس می‌زند
    quill.container.addEventListener('keyup', function (event) {
        if (event.key === ' ' || event.code === 'Space') {
            quill.format('color', 'black');
        }
    });

    quill.focus();

    function checkPlaceholder() {
        var editor = document.querySelector('.ql-editor');
        if (editor.innerText.trim().length === 0) {
            editor.setAttribute('data-placeholder', 'Start typing here...');
        } else {
            editor.removeAttribute('data-placeholder');
        }
    }

    quill.on('text-change', checkPlaceholder);
    checkPlaceholder();  // Check placeholder on load

    document.querySelector(".create-pdf").addEventListener("click", function () {
        var editorContent = document.querySelector('.ql-editor').innerHTML;
        console.log(editorContent);
    });
});


//setting and chart

document.addEventListener("DOMContentLoaded", function () {
    // Modal settings
    const settingsModal = document.getElementById("settings-modal");
    const closeSettingsBtn = document.querySelector(".close");

    window.openSettingsModal = function () {
        settingsModal.style.display = "block";
    }

    window.closeSettingsModal = function () {
        settingsModal.style.display = "none";
    }

// Close the modal when the user clicks outside of it
    window.onclick = function (event) {
        if (event.target == settingsModal) {
            settingsModal.style.display = "none";
        }
    }

    // Chart.js setup
    const ctx = document.getElementById('activity-chart').getContext('2d');
    let chart = new Chart(ctx, {
        type: 'line', data: {
            labels: [], datasets: [{
                label: 'User Activity', data: [], borderColor: 'rgba(75, 192, 192, 1)', borderWidth: 1, fill: false
            }]
        }, options: {
            scales: {
                x: {
                    beginAtZero: true
                }, y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Example data
    const activityData = {
        daily: {
            labels: ["12 AM", "1 AM", "2 AM", "3 AM", "4 AM", "5 AM", "6 AM", "7 AM", "8 AM", "9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM", "6 PM", "7 PM", "8 PM", "9 PM", "10 PM", "11 PM"],
            data: [0, 10, 0, 35, 20, 40, 45, 53, 55, 55, 55, 32, 60, 63, 65, 68, 70, 75, 78, 80, 90, 93, 93, 95]
        }, weekly: {
            labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], data: [10, 15, 17, 20, 25, 32, 50]
        }, monthly: {
            labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"], data: [0, 0, 0, 0, 0, 0]
        }, yearly: {
            labels: ["2023", "2024"], data: [0, 0]
        }
    };

    window.showChart = function (period) {
        const data = activityData[period];
        chart.data.labels = data.labels;
        chart.data.datasets[0].data = data.data;
        chart.update();
    }
});

function closePdfModal() {
    const pdfModal = document.getElementById('pdf-modal');
    pdfModal.style.display = 'none';
}
