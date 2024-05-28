// let timer;
// let seconds = 0;
//
// function start() {
//     if (timer) {
//         clearInterval(timer);
//     }
//     timer = setInterval(updateTimer, 1000);
// }
//
// function restart() {
//     const textArea = document.getElementById('text-area');
//     textArea.value = '';
//     const pdfReader = document.getElementById('pdf-reader');
//     pdfReader.src = '';
//     clearInterval(timer);
//     seconds = 0;
//     updateTimer();
// }
//
// async function spellCheck() {
//     const textArea = document.getElementById('text-area');
//     const text = textArea.value;
//
//     try {
//         const response = await fetch('/spell-check/', {
//             method: 'POST', headers: {
//                 'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken')
//             }, body: JSON.stringify({text})
//         });
//
//         if (!response.ok) {
//             throw new Error('Spell check failed');
//         }
//
//         const result = await response.json();
//         textArea.value = result.spell_checked_text;
//     } catch (error) {
//         console.error('Error:', error.message);
//     }
// }
//
// async function createPdf() {
//     const textArea = document.getElementById('text-area');
//     const timerElement = document.getElementById('timer');
//     const text = textArea.value;
//     const timer = timerElement.textContent;  // دریافت مقدار تایمر از عنصر HTML
//
//     // توقف تایمر
//     clearInterval(timer);
//     const timerValue = document.getElementById('timer').textContent;
//
//     try {
//         const response = await fetch('/create-pdf/', {
//             method: 'POST', headers: {
//                 'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken')
//             }, body: JSON.stringify({text, timer})
//         });
//
//         if (!response.ok) {
//             throw new Error('Create PDF failed');
//         }
//
//         const result = await response.json();
//         const pdfReader = document.getElementById('pdf-reader');
//         pdfReader.src = result.pdfUrl;
//     } catch (error) {
//         alert('Error: ' + error.message);
//     }
// }
//
//
// function openPdf() {
//     const pdfReader = document.getElementById('pdf-reader');
//     const pdfInput = document.getElementById('pdf-input');
//     const file = pdfInput.files[0];
//     const fileURL = URL.createObjectURL(file);
//     pdfReader.src = fileURL;
// }
//
// function closePdf() {
//     const pdfReader = document.getElementById('pdf-reader');
//     pdfReader.src = '';
// }
//
// function getCookie(name) {
//     let cookieValue = null;
//     if (document.cookie && document.cookie !== '') {
//         const cookies = document.cookie.split(';');
//         for (let i = 0; i < cookies.length; i++) {
//             const cookie = cookies[i].trim();
//             if (cookie.substring(0, name.length + 1) === (name + '=')) {
//                 cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
//                 break;
//             }
//         }
//     }
//     return cookieValue;
// }
//
// document.getElementById('pdf-form').onsubmit = async function (e) {
//     e.preventDefault();
//     const formData = new FormData(this);
//
//     try {
//         const response = await fetch('/upload-pdf/', {
//             method: 'POST', body: formData, headers: {
//                 'X-CSRFToken': getCookie('csrftoken')
//             }
//         });
//
//         if (!response.ok) {
//             throw new Error('PDF upload failed');
//         }
//
//         const result = await response.json();
//         const pdfReader = document.getElementById('pdf-reader');
//         pdfReader.src = result.pdfUrl;
//     } catch (error) {
//         console.error('Error:', error.message);
//     }
// };
//
// function updateTimer() {
//     const timerElement = document.getElementById('timer');
//     let hours = Math.floor(seconds / 3600);
//     let minutes = Math.floor((seconds % 3600) / 60);
//     let secs = seconds % 60;
//     timerElement.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
//     seconds++;
// }


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
    const pdfReader = document.getElementById('pdf-reader');
    pdfReader.src = '';
    clearInterval(timer);
    seconds = 0;
    updateTimer();
}

// async function spellCheck() {
//     const textArea = document.getElementById('text-area');
//     const text = textArea.value;
//
//     try {
//         const response = await fetch('/spell-check/', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'X-CSRFToken': getCookie('csrftoken')
//             },
//             body: JSON.stringify({text})
//         });
//
//         if (!response.ok) {
//             throw new Error('Spell check failed');
//         }
//
//         const result = await response.json();
//         textArea.value = result.spell_checked_text;
//     } catch (error) {
//         alert('Error: ' + error.message);
//     }
// }


async function spellCheck() {
    const textArea = document.getElementById('text-area');
    const text = textArea.value;

    try {
        const response = await fetch('/spell-check/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({text: text})
        });

        if (!response.ok) {
            throw new Error('Spell check failed');
        }

        const result = await response.json();
        textArea.value = result.spell_checked_text;
    } catch (error) {
        console.error('Error:', error.message);
    }
}


async function createPdf() {
    const textArea = document.getElementById('text-area');
    const text = textArea.value;

    // توقف تایمر
    clearInterval(timer);
    const timerValue = document.getElementById('timer').textContent;

    try {
        const response = await fetch('/create-pdf/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({text, timer: timerValue})
        });

        if (!response.ok) {
            throw new Error('Create PDF failed');
        }

        const result = await response.json();
        const pdfReader = document.getElementById('pdf-reader');
        pdfReader.src = result.pdfUrl;
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

function openPdf() {
    const pdfReader = document.getElementById('pdf-reader');
    const pdfInput = document.getElementById('pdf-input');
    const file = pdfInput.files[0];
    const fileURL = URL.createObjectURL(file);
    pdfReader.src = fileURL;
}

function closePdf() {
    const pdfReader = document.getElementById('pdf-reader');
    pdfReader.src = '';
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function updateTimer() {
    const timerElement = document.getElementById('timer');
    let hours = Math.floor(seconds / 3600);
    let minutes = Math.floor((seconds % 3600) / 60);
    let secs = seconds % 60;
    timerElement.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    seconds++;
}
