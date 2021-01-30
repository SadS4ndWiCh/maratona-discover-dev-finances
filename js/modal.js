const Modal = {
    open() {
        // Open modal
        // Add active class to modal
        document.querySelector('.modal-overlay').classList.add('active');
    },
    close() {
        // Close modal
        // Remove active class from modal
        document.querySelector('.modal-overlay').classList.remove('active');
    }
}