const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const modalMessage = document.getElementById('modalMessage');
const closeModal = document.getElementById('closeModal');

const showModal = ({ title = 'Error', message }) => {
  modalTitle.textContent = title;
  modalMessage.textContent = message;
  modal.classList.add('is-opened');
};

const hideModal = () => {
  modal.classList.remove('is-opened');
};

closeModal.addEventListener('click', hideModal);

document.addEventListener('click', (event) => {
  if (event.target === modal) {
    hideModal();
  }
});

export { showModal, hideModal };
