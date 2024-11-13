
const volumeModal = new bootstrap.Modal(document.getElementById('volumeCheckModal'));
const volumeModalText = document.getElementById("volumeDisplayText");
const volumeModalTitle = document.getElementById("volumeDisplayTitle");
const volumeModalType = document.getElementById("volumeDisplayType");
const volumeModalIcon = document.getElementById("volumeDisplayIcon");
const submitButton = document.getElementById("checkButton");
const submission = document.getElementById("killerName");
const helpButton = document.getElementById("help_button");
const helpBox = document.getElementById("helpBox");

submitButton.addEventListener('click', (e) => {
    let string = submission.value
    let success = string.toUpperCase().trim() == "MISS PEACH"
    displayModal(success, success ? "<a href = '/partyInfo'>Congratulations on finding the killer. Your information lies here. </a>" : "TRY AGAIN")
});

helpButton.addEventListener('click', (e) => {
    if (helpBox.style.display === "none") {
        helpBox.style.display = "block";
    } else {
        helpBox.style.display = "none";
    }
});



function displayModal(passed, innerText) {
    volumeModalText.innerHTML = innerText;
    if (passed) {
        volumeModalType.classList.replace('modal-box-failure', 'modal-box-success');
        volumeModalIcon.classList.replace('fa-thumbs-down', 'fa-thumbs-up');
        volumeModalTitle.innerHTML = "Success!";
        volumeModal.show();
    } else {
        volumeModalType.classList.replace('modal-box-success', 'modal-box-failure');
        volumeModalIcon.classList.replace('fa-thumbs-up', 'fa-thumbs-down');
        volumeModalTitle.innerHTML = "Failure!";
        volumeModal.show();
    }
}