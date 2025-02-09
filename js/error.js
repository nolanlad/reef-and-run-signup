function error_message(msg) {
    const errorMessage = document.getElementById('errorMessage');
    document.getElementById('errorText').innerText = msg;
    errorMessage.style.display = 'block';
}

function closeErrorMessage() {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.style.display = 'none';
}