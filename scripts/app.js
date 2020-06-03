

// DOM ELEMENTS

const difficultyButtons = document.querySelectorAll('.difficulty')
const container = document.querySelector('.container')
const minesRemaining = document.querySelector('.mines-remaining')
const smileyButton = document.querySelector('.smiley-face')
const timer = document.querySelector('.timer')
const minimiseButton = document.querySelector('.minimise-button')
const closeButton = document.querySelector('.close-button')
const grid = document.querySelector('#grid')
const desktopIcon = document.querySelector('.desktop-icon-container')
const draggableElements = Array.from(document.querySelectorAll('.draggable'))
const monitorButtons = document.querySelectorAll('.monitor-button')
const mobileFlagButton = document.querySelector('.mobile-flag-button')
const mobileFlagButtonImg = document.querySelector('.mobile-flag-button-image')
const taskbarTile = document.querySelector('.taskbar-tile')

// Custom Board Size Elements
const customPopup = document.querySelector('.custom-popup')
const customTriggerButton = document.querySelector('.custom-button')
const customOKButton = document.querySelector('.custom-ok-button')
const customCancelButton = document.querySelector('.custom-cancel-button')
const customHeightInput = document.querySelector('#height-input')
const customWidthInput = document.querySelector('#width-input')
const customMinesInput = document.querySelector('#mines-input')
const customInputArray = [customHeightInput, customWidthInput, customMinesInput]
const customPlusButtons = document.querySelectorAll('.plus-button')
const customMinusButtons = document.querySelectorAll('.minus-button')

// PROGRAM VARIABLES

let width = 9
let height = 9
let mines = 10
let inGameMineCount = mines
let tilesArray = []
let mineLocations = []
// timerInterval (for game timer) declared here so that interval can be cleared outside setInterval
let timerInterval
let mobileFlagActive = false
  
// EVENT LISTENERS

// Change board size and assign drag and drop limitations
difficultyButtons.forEach(button => {
  button.addEventListener('click', (e) => {
    ({ height, width, mines } = e.target.dataset)
    calculateGameContainerDragBoundaries()
    recentreContainer()
    reset()
  })
})

monitorButtons.forEach(button => {
  button.addEventListener('mousedown', () => {
    const audio = new Audio('../assets/button-press.mp3')
    audio.volume = 0.25
    audio.play()
  })
})

// Change smiley face expression on tile click
grid.addEventListener('mousedown', (e) => {
  if (e.button !== 2 && !tilesArray[e.target.dataset.index].isFlagged) {
    smileyButton.classList.add('shocked-smiley')
  }
})

document.addEventListener('mouseup', () => {
  smileyButton.classList.remove('shocked-smiley')
})

// Reset board when Smiley Button clicked
smileyButton.addEventListener('click', reset)

// Switch to flag placement in mobile

mobileFlagButton.addEventListener('click', () => {
  if (!mobileFlagActive){
    mobileFlagActive = true
    mobileFlagButtonImg.style.opacity = 1
    tilesArray.forEach(tile => {
      tile.element.removeEventListener('click', clickTile)
      tile.element.addEventListener('click', flagTile)
    })
  } else {
    mobileFlagActive = false
    mobileFlagButtonImg.style.opacity = 0.3
    tilesArray.forEach(tile => {
      tile.element.addEventListener('click', clickTile)
      tile.element.removeEventListener('click', flagTile)
    })
  }
})

// Custom

customTriggerButton.addEventListener('click', () => {
  customPopup.classList.remove('hidden')
})

customOKButton.addEventListener('click', (e) => {
  e.preventDefault()
  height = customHeightInput.value || height
  width = customWidthInput.value || width
  mines = customMinesInput.value || mines
  calculateGameContainerDragBoundaries()
  customInputArray.forEach(input => input.value = '')
  setTimeout(() => {
    customPopup.classList.add('hidden')
  }, 100)
  recentreContainer()
  reset()
})

customCancelButton.addEventListener('click', (e) => {
  e.preventDefault()
  customInputArray.forEach(input => input.value = '')
  customPopup.classList.add('hidden')
})

customPlusButtons.forEach(button => {
  button.addEventListener('click', () => customInputArray[button.dataset.customElementIndex].stepUp())
})

customMinusButtons.forEach(button => {
  button.addEventListener('click', () => customInputArray[button.dataset.customElementIndex].stepDown())
})


// FIRST DRAW

drawMinefield()
  
// GAME INITIATION

//Restarts the record of tiles in tilesArray, clears grid of all existing divs and makes it clickable again (game functionality is such that when game is lost/won the grid becomes unclickable). Grid template is then dynamically modified in DOM depending on size of board.
// Grid is automatically populated with div.tile.initial, event listeners for left and right click added to each element, the element is appended to the DOM in the game grid, and an object with essential properties is pushed into the tilesArray to allow for functionality in later game. Count is added to represent index on the element and in the tile object so that it can be easily accessed whether approaching from the DOM or through the tilesArray.
function drawMinefield() {
  tilesArray = []
  grid.innerHTML = ''
  addAndRemoveClass(grid, 'clickable', 'unclickable')
  grid.style.gridTemplate = `repeat(${height}, 1fr) / repeat(${width}, 1fr)`
  let count = 0
  for (let i = 0; i < width * height; i++) {
    const tile = document.createElement('div')
    tile.dataset.index = count
    tile.classList.add('tile')
    tile.classList.add('tile-initial')
    tile.addEventListener('click', clickTile)
    tile.addEventListener('contextmenu', flagTile)
    grid.appendChild(tile)
    tilesArray.push({ 
      element: tile, 
      adjacentTiles: adjacentTiles(width, height, i),
      isFlagged: false, 
      clicked: false,
      recursed: false,
      index: count
    })
    count++
  }
}

// GAME INITIATION HELPER FUNCTIONS

//Main functionality event. If all tiles are unclicked, start timer running and populate minefield. First click cannot be on a mine or on a tile next to a mine, accomplished through while loop. Principal revealClicked function is then run. Same revealClicked function is run after the first click on any tile that has not been flagged. After each click, progress is assessed.
function clickTile(event) {
  if (tilesArray.every(tile => !tile.clicked)) {
    startTimer()
    populateMines()
    const clickedTile = tilesArray[event.target.dataset.index]
    while (clickedTile.adjacentTiles.some(adjacentTileIndex => mineLocations.includes(adjacentTileIndex)) || 
      mineLocations.includes(clickedTile.index)) {
      populateMines()
    }
    revealClicked(event)
  } else if (!event.target.classList.contains('flag')) {
    revealClicked(event)
  }
  checkProgress()
}

function flagTile(event) {
  event.preventDefault()
  addOrRemoveFlag(event.target)
}

// Calculates which tiles are above, below, to the side and at the diagonals of a tile.
function adjacentTiles(width, height, index) {
  let workingArray 
  width = Number(width)
  height = Number(height)
  if (index % width === 0) {
    workingArray = [
      index - width, 
      index - width + 1,  
      index + 1, 
      index + width, 
      index + width + 1
    ]
  } else if (index % width === width - 1) {
    workingArray = [
      index - width - 1, 
      index - width, 
      index - 1, 
      index + width - 1, 
      index + width
    ]
  } else {
    workingArray = [
      index - width - 1, 
      index - width, 
      index - width + 1, 
      index - 1, 
      index + 1, 
      index + width - 1, 
      index + width, 
      index + width + 1
    ]
  }
  return workingArray.filter(tileIndex => 0 <= tileIndex && tileIndex < width * height)
}

//Simultaneously add and remove a class from a given element
function addAndRemoveClass(element, classToAdd, classToRemove) {
  element.classList.add(classToAdd)
  element.classList.remove(classToRemove)
}


// GENERAL GAME FUNCTIONS

function startTimer() {
  let timerCount = 1
  timerInterval = setInterval(() => {
    timerCount < 10 ? timer.innerHTML = `00${timerCount}` :
      timerCount < 100 ? timer.innerHTML = `0${timerCount}` : 
        timer.innerHTML = timerCount 
    if (timerCount < 999) {
      timerCount++
    }
  }, 1000)
}

// If tile is not flagged, reveal whether there is a mine underneath, whether it is blank (in which case recursive function below is called), or whether it is next to a mine, in which case the right numerical depiction is uncovered. 
function revealClicked(event) {
  const clickedTile = event.target
  const clickedTileIndex = Number(clickedTile.dataset.index)
  if (tilesArray[clickedTileIndex].isFlagged) return
  tilesArray[clickedTileIndex].clicked = true
  if (mineLocations.includes(clickedTileIndex)) {
    gameOver(clickedTileIndex)
  } else if (adjacentMineCount(clickedTileIndex) === 0) {
    clickedTile.classList.remove('tile-initial')
    revealExtended(clickedTileIndex)
  } else {
    const numberClass = `adjacent-mines-${adjacentMineCount(clickedTileIndex)}`
    addAndRemoveClass(clickedTile, numberClass, 'tile-initial')
  }
}

// Recursive function to examine tiles surrounding the first tile clicked, and if one of the surrounding tiles has no mines next to it to perform the same analysis. Allows for functionality where a series of blank tiles can be exposed with one click.
function revealExtended(tileIndex) {
  tilesArray[tileIndex].adjacentTiles.forEach(adjacentTileIndex => {
    if (adjacentMineCount(adjacentTileIndex) === 0 && !tilesArray[adjacentTileIndex].recursed) {
      addAndRemoveClass(tilesArray[adjacentTileIndex].element, 'adjacent-mines-0', 'tile-initial')
      tilesArray[adjacentTileIndex].recursed = true
      tilesArray[adjacentTileIndex].clicked = true
      revealExtended(adjacentTileIndex)
    } else if (mineLocations.includes(adjacentTileIndex)) {
      return
    } else {
      const numberClass = `adjacent-mines-${adjacentMineCount(adjacentTileIndex)}`
      addAndRemoveClass(tilesArray[adjacentTileIndex].element, numberClass, 'tile-initial')
      tilesArray[adjacentTileIndex].clicked = true
    }
  })
}

function addOrRemoveFlag(clickedTile) {
  // Prevent flag placement on first click
  if (tilesArray.every(tile => !tile.clicked)) {
    alert('You can\'t place a flag yet, please uncover a tile first')
    return
  }
  // Place flag only on tiles that are not flagged and have not been clicked; remove flag from tiles that have not been clicked (to avoid changing state of clicked tile)
  if (!tilesArray[clickedTile.dataset.index].isFlagged && !tilesArray[clickedTile.dataset.index].clicked) {
    addAndRemoveClass(clickedTile, 'flag', 'tile-initial')
    tilesArray[clickedTile.dataset.index].isFlagged = true
    inGameMineCount--
  } else if (!tilesArray[clickedTile.dataset.index].clicked) {
    addAndRemoveClass(clickedTile, 'tile-initial', 'flag')
    tilesArray[clickedTile.dataset.index].isFlagged = false
    inGameMineCount++
  }
  updateMineCounterDisplay()
}

// Check to see if all tiles without mines have been clicked
function checkProgress() {
  if (tilesArray.filter(tile => !mineLocations.includes(tile.index)).every(tile => tile.clicked)) {
    winGame()
  }
}

function updateMineCounterDisplay() {
  minesRemaining.innerHTML = inGameMineCount
}

function winGame() {
  clearInterval(timerInterval)
  smileyButton.classList.add('sunglasses-smiley')
  addAndRemoveClass(grid, 'unclickable', 'clickable')
  // Automatically place flags on mine tiles where user has clicked all non-mine tiles
  tilesArray.filter(tile => mineLocations.includes(tile.index)).forEach(tile => {
    tile.element.classList.add('flag')
  })
  minesRemaining.innerHTML = '0'
}

function gameOver(clickedTileIndex) {
  clearInterval(timerInterval)
  smileyButton.classList.add('dead-smiley')
  // Reveal mine locations
  mineLocations.forEach(mineLocationIndex => {
    if (mineLocationIndex !== clickedTileIndex) {
      addAndRemoveClass(tilesArray[mineLocationIndex].element,'undetected-mine', 'initial-tile')
    } else {
      addAndRemoveClass(tilesArray[mineLocationIndex].element,'exploded-mine', 'initial-tile')
    }
  })
  // Reveal tiles incorrectly flagged as having a mine
  tilesArray.filter(tile => tile.isFlagged).forEach(tile => {
    if (!mineLocations.includes(tile.index)) {
      addAndRemoveClass(tile.element,'wrong-mine', 'flag')
    }
  })
  addAndRemoveClass(grid, 'unclickable', 'clickable')
}

function reset() {
  clearInterval(timerInterval)
  smileyButton.classList = 'smiley-face'
  timer.innerHTML = '000'
  minesRemaining.innerHTML = mines
  inGameMineCount = mines
  drawMinefield()
}

// HELPER FUNCTIONS

function populateMines() {
  mineLocations = []
  for (let i = 0; i < mines; i++) {
    placeMine()
  }
}
  
//Recursive mine placement function to ensure that no tile has more than one mine
function placeMine() {
  const mineLocation = Math.floor(Math.random() * width * height)
  mineLocations.includes(mineLocation) ? placeMine() : mineLocations.push(mineLocation)
}

function adjacentMineCount(tileIndex) {
  return tilesArray[tileIndex].adjacentTiles.reduce((count, adjacentTileIndex) => {
    return mineLocations.includes(adjacentTileIndex) ? ++count : count
  }, 0)
}

function calculateGameContainerDragBoundaries() {
  const containerWidth = width * 20 + 20
  const containerHeight = height * 20 + 95
  container.dataset.minx = (containerWidth / 2) + 223
  container.dataset.maxx = 1108 - (containerWidth / 2) 
  container.dataset.miny = (containerHeight / 2) + 111
  container.dataset.maxy = 638 - (containerHeight / 2)
}

function recentreContainer() {
  container.style.left = '50%'
  container.style.top = '49%'
}

// DRAG AND DROP FUNCTIONALITY

// Because positioning limits on the background were calculated in relation to the container of the element being moved, many of the variables are calculated by reference to the parentElement. This was also necessary because the title bar of the minesweeper window is a child of the main container and it is the whole container that needs to move, but only when the title bar is dragged.

draggableElements.forEach(element => dragElement(element))

function dragElement(element) {
  let startingPosX, startingPosY, posChangeX, posChangeY

  element.addEventListener('mousedown', clickToDrag)
  // Because of z-index in CSS, dragging the desktop icon under the minesweeper window caused the event to change to the minesweeper window, which would then start moving instead of the desktop icon. To resolve this, pointer events were disabled for the other element.
  const otherDraggableElements = draggableElements.filter(otherElement => otherElement !== element)

  function clickToDrag(e) {
    e.preventDefault()
    if (e.target.tagName === 'BUTTON') return
    otherDraggableElements.forEach(element => {
      element.parentElement.style.pointerEvents = 'none'
    })
    addAndRemoveClass(grid, 'unclickable', 'clickable')
    // Clicking close button on title bar should not drag window
    // Record where click started on x and y axis
    startingPosX = e.clientX
    startingPosY = e.clientY
    element.onmousemove = moveElement
    document.onmouseup = stopMoving
  }
  
  function moveElement(e) {
    e.preventDefault()
    e.target.classList.add('travelling')
    // Destructuring assigment to lowercase as dataset does not allow uppercase letters/camelCase
    const { minx, maxx, miny, maxy } = element.parentElement.dataset
    // Measure change in x and y values to establish where window is going to
    posChangeX = startingPosX - e.clientX
    posChangeY = startingPosY - e.clientY
    // Update starting position for the posChange calculations above for continued dynamic movement
    startingPosX = e.clientX
    startingPosY = e.clientY
    // Set min/max limitations on how far window/icon can be dragged so that it doesn't move off the screen in the background picture. Change is calculated against offset to establish distance of container from edges.
    const minMaxX = Math.min(Math.max(element.parentElement.offsetLeft - posChangeX, minx), maxx)
    const minMaxY = Math.min(Math.max(element.parentElement.offsetTop - posChangeY, miny), maxy)
    // Set new positions
    element.parentElement.style.left = `${minMaxX}px`
    element.parentElement.style.top = `${minMaxY}px`
  }
  
  // Reinstate pointer events, remove relevant classes, and set event listeners to null
  function stopMoving(e) {
    otherDraggableElements.forEach(element => element.parentElement.style.pointerEvents = 'initial')
    if (e.target.classList.contains('travelling')) {
      desktopIcon.classList.remove('desktop-icon-container-active')
      e.target.classList.remove('travelling')
    }
    addAndRemoveClass(grid, 'clickable', 'unclickable')
    document.onmouseup = null
    element.onmousemove = null
  }
}

// CLOSE/MINIMISE FUNCTIONALITY AND DESKTOP ICON

// Set timeout used as window removal was too quick for human eye. Resets game otherwise game runs in background.
closeButton.addEventListener('click', () => {
  setTimeout(() => {
    container.classList.add('hidden')
    taskbarTile.classList.add('hidden')
    reset()
  }, 110)
})

minimiseButton.addEventListener('click', () => {
  setTimeout(() => {
    container.classList.add('hidden')
    reset()
  }, 110)
})

taskbarTile.addEventListener('click', () => {
  container.classList.toggle('hidden')
})

// Functionality to add/remove "selection highlighting" of desktop icon
desktopIcon.addEventListener('mousedown', () => {
  desktopIcon.classList.toggle('desktop-icon-container-active')
})

document.addEventListener('click', (e) => {
  if (!e.target.classList.contains('desktop-icon')) {
    desktopIcon.classList.remove('desktop-icon-container-active')
  }
})

desktopIcon.addEventListener('dblclick', () => {
  container.classList.remove('hidden')
  setTimeout(() => {
    taskbarTile.classList.remove('hidden')
  }, 34)
})

// ON LOAD EVENT LISTENERS

// Start desktop background clock running

window.addEventListener('DOMContentLoaded', () => {
  const clock = document.querySelector('.clock')
  clock.innerHTML = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  setInterval(() => {
    clock.innerHTML = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }, 1000)
})