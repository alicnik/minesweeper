export *

const customPopup = document.querySelector('.custom-popup')
const customTriggerButton = document.querySelector('.custom-button')
const customOKButton = document.querySelector('.custom-ok-button')
const customCancelButton = document.querySelector('.custom-cancel-button')
const customHeightInput = document.querySelector('#height-input')
const customWidthInput = document.querySelector('#width-input')
const customMinesInput = document.querySelector('#mines-input')

customTriggerButton.addEventListener('click', () => {
  customPopup.classList.remove('hidden')
})

customOKButton.addEventListener('click', (e) => {
  e.preventDefault()
  height = customHeightInput.value || height
  width = customWidthInput.value || width
  mines = customMinesInput.value || mines
  customHeightInput.value = ''
  customWidthInput.value = ''
  customMinesInput.value = ''
  setTimeout(() => {
    customPopup.classList.add('hidden')
  }, 100)
  reset()
})

customCancelButton.addEventListener('click', (e) => {
  e.preventDefault()
  customPopup.classList.add('hidden')
})



