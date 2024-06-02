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
    const editorContent = document.querySelector('.ql-editor').innerHTML;
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

    const pdfContent = htmlToPdfmake(editorContent);

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
            content: {
                fontSize: 12
            }
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
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            },
            body: JSON.stringify({text})
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
        const pdfItem = document.createElement('div');
        pdfItem.className = 'pdf-item';
        pdfItem.textContent = pdf.title;
        pdfItem.onclick = () => openPdfFromUrl(pdf.url);
        pdfListContainer.appendChild(pdfItem);
    });
}

function openPdfFromUrl(url) {
    const pdfReader = document.getElementById('pdf-reader');
    pdfReader.src = url;
    closeModal();
}

function openModal() {
    const modal = document.getElementById('pdf-modal');
    modal.style.display = 'block';
}

function closeModal() {
    const modal = document.getElementById('pdf-modal');
    modal.style.display = 'none';
}

// Ensure this function is called when the 'Load from DB' button is clicked
document.querySelector('.load-from-db').addEventListener('click', loadFromDatabase);

// Close the modal when the user clicks outside of it
window.onclick = function (event) {
    const modal = document.getElementById('pdf-modal');
    if (event.target == modal) {
        closeModal();
    }
}

<!-- Quill JS -->
// editor
document.addEventListener("DOMContentLoaded", function () {
    var toolbarOptions = [
        ['bold', 'italic', 'underline', 'strike'],
        ['blockquote', 'code-block'],
        [{'header': 1}, {'header': 2}],
        [{'list': 'ordered'}, {'list': 'bullet'}],
        [{'script': 'sub'}, {'script': 'super'}],
        [{'indent': '-1'}, {'indent': '+1'}],
        [{'direction': 'rtl'}],
        [{'size': ['small', false, 'large', 'huge']}],
        [{'header': [1, 2, 3, 4, 5, 6, false]}],
        [{'color': []}, {'background': []}],
        [{'font': []}],
        [{'align': []}],
        ['clean']
    ];

    var quill = new Quill('#editor', {
        modules: {
            toolbar: toolbarOptions
        },
        theme: 'snow'
    });

    document.querySelector(".create-pdf").addEventListener("click", function () {
        var editorContent = document.querySelector('.ql-editor').innerHTML;
        console.log(editorContent);
    });
});