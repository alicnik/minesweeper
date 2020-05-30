function main() {
  
  // DOM ELEMENTS
  const difficultyButtons = document.querySelectorAll('.difficulty')
  const minesRemaining = document.querySelector('.mines-remaining')
  const smileyButton = document.querySelector('.smiley-face')
  const timer = document.querySelector('.timer')
  const grid = document.querySelector('#grid')

  // PROGRAM VARIABLES

  let width = 9
  let height = 9
  let mines = 10
  let inGameMineCount = mines
  let tilesArray = []
  let mineLocations = []
  let timerInterval

  // EVENT LISTENERS

  difficultyButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      console.log(button)
      height = Number(e.target.dataset.height)
      width = Number(e.target.dataset.width)
      mines = Number(e.target.dataset.mines)
      reset()
    })
  })

  grid.addEventListener('mousedown', (e) => {
    if (e.button !== 2 && tilesArray[e.target.dataset.index].flagged === false) {
      smileyButton.classList.add('shocked-smiley')
    }
  })
  
  document.addEventListener('mouseup', () => {
    smileyButton.classList.remove('shocked-smiley')
  })

  smileyButton.addEventListener('click', reset)

  // FIRST DRAW

  drawMinefield()
  
  // FUNCTIONS

  function drawMinefield() {
    tilesArray = []
    grid.innerHTML = ''
    grid.style.gridTemplate = `repeat(${height}, 1fr) / repeat(${width}, 1fr)`
    let count = 0
    for (let i = 0; i < width * height; i++) {
      const tile = document.createElement('div')
      tile.dataset.index = count
      tile.classList.add('tile')
      tile.classList.add('tile-initial')
      tile.addEventListener('click', event => {
        if (tilesArray.every(tile => tile.clicked === false)) {
          const clickedTile = tilesArray[event.target.dataset.index]
          populateMines()
          while (clickedTile.adjacentTiles.some(tileIndex => mineLocations.includes(tileIndex)) || mineLocations.includes(clickedTile.index)) {
            populateMines()
          }
          revealClicked(event)
          startTimer()
          markClicked(event)
        } else if (!event.target.classList.contains('flag')) {
          revealClicked(event)
          markClicked(event)
        }
        checkProgress()
      })
      tile.addEventListener('contextmenu', event => {
        event.preventDefault()
        addRemoveFlag(event.target)
      })
      tilesArray.push({ 
        element: tile, 
        adjacentTiles: adjacentTiles(width, height, i),
        mine: false, 
        flagged: false, 
        clicked: false,
        recursed: false,
        index: count
      })
      grid.appendChild(tile)
      count++
    }
  }

  function adjacentTiles(width, height, index) {
    let workingArray 
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
    return workingArray.filter(index => 0 <= index && index < width * height)
  }

  function populateMines() {
    mineLocations = []
    for (let i = 0; i < mines; i++) {
      placeMine()
    }
  }
  
  function placeMine() {
    const mineLocation = Math.floor(Math.random() * width * height)
    mineLocations.includes(mineLocation) ? placeMine() : mineLocations.push(mineLocation)
  }

  function revealClicked(e) {
    const clickedTile = e.target
    const clickedTileIndex = Number(clickedTile.dataset.index)
    if (tilesArray[clickedTileIndex].flagged) return
    tilesArray[clickedTileIndex].clicked === true
    if (mineLocations.includes(clickedTileIndex)) {
      gameOver(clickedTileIndex)
    } else if (adjacentMineCount(clickedTileIndex) === 0) {
      clickedTile.classList.remove('tile-initial')
      revealExtended(clickedTileIndex)
    } else {
      const numberClass = `adjacent-mines-${adjacentMineCount(clickedTileIndex)}`
      clickedTile.classList.remove('tile-initial')
      clickedTile.classList.add(numberClass)
    }
  }

  function revealExtended(tileIndex) {
    tilesArray[tileIndex].adjacentTiles.forEach(adjacentTileIndex => {
      if (adjacentMineCount(adjacentTileIndex) === 0 && tilesArray[adjacentTileIndex].recursed === false) {
        tilesArray[adjacentTileIndex].element.classList.remove('tile-initial')
        tilesArray[adjacentTileIndex].element.classList.add('adjacent-mines-0')
        tilesArray[adjacentTileIndex].recursed = true
        tilesArray[adjacentTileIndex].clicked = true
        revealExtended(adjacentTileIndex)
      } else if (mineLocations.includes(adjacentTileIndex)) {
        return
      } else {
        const numberClass = `adjacent-mines-${adjacentMineCount(adjacentTileIndex)}`
        tilesArray[adjacentTileIndex].element.classList.remove('tile-initial')
        tilesArray[adjacentTileIndex].element.classList.add(numberClass)
        tilesArray[adjacentTileIndex].clicked = true
      }
    })
  }

  function adjacentMineCount(tileIndex) {
    let adjacentMineCount = 0
    tilesArray[tileIndex].adjacentTiles.forEach(adjacentTileIndex => {
      if (mineLocations.includes(adjacentTileIndex)) {
        adjacentMineCount++
      }
    })
    return adjacentMineCount
  }

  function addRemoveFlag(clickedTile) {
    if (tilesArray.every(tileObj => !tileObj.clicked)) return
    if (tilesArray[clickedTile.dataset.index].flagged === false && tilesArray[clickedTile.dataset.index].clicked === false) {
      clickedTile.classList.remove('tile-initial')
      clickedTile.classList.add('flag')
      inGameMineCount--
      tilesArray[clickedTile.dataset.index].flagged = true
    } else if (tilesArray[clickedTile.dataset.index].clicked === false) {
      clickedTile.classList.remove('flag')
      clickedTile.classList.add('tile-initial')
      inGameMineCount++
      tilesArray[clickedTile.dataset.index].flagged = false
    }
    updateMineCounterDisplay()
  }

  function markClicked(event) {
    tilesArray[Number(event.target.dataset.index)].clicked = true
  }

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

  function checkProgress() {
    if (tilesArray.filter(tile => !mineLocations.includes(tile.index)).every(tile => tile.clicked)) {
      winGame()
    }
  }

  function winGame() {
    tilesArray.filter(tile => mineLocations.includes(tile.index)).forEach(tile => {
      tile.element.classList.add('flag')
    })
    clearInterval(timerInterval)
    smileyButton.classList.add('sunglasses-smiley')
    grid.style.pointerEvents = 'none'
  }

  function reset() {
    clearInterval(timerInterval)
    drawMinefield()
    smileyButton.classList.remove('dead-smiley')
    smileyButton.classList.remove('sunglasses-smiley')
    timer.innerHTML = '000'
    minesRemaining.innerHTML = `0${mines}`
    inGameMineCount = mines
    grid.style.pointerEvents = 'initial'
  }

  function gameOver(clickedTileIndex) {
    clearInterval(timerInterval)
    smileyButton.classList.add('dead-smiley')
    mineLocations.forEach(mineLocationIndex => {
      if (mineLocationIndex !== clickedTileIndex) {
        tilesArray[mineLocationIndex].element.classList.remove('initial-tile')
        tilesArray[mineLocationIndex].element.classList.add('undetected-mine')
      } else {
        tilesArray[mineLocationIndex].element.classList.remove('initial-tile')
        tilesArray[mineLocationIndex].element.classList.add('exploded-mine')
      }
    })
    grid.style.pointerEvents = 'none'
  }

  function updateMineCounterDisplay() {
    minesRemaining.innerHTML = inGameMineCount
  }

  // DRAG AND DROP FUNCTIONALITY

  const container = document.querySelector('.container')
  const titleBar = document.querySelector('.title-bar')
  let startingPosX, startingPosY, newPosX, newPosY

  titleBar.addEventListener('mousedown', e => {
    console.log(e)
    e.preventDefault()
    startingPosX = e.clientX
    startingPosY = e.clientY
    document.onmouseup = stopMoving
    document.onmousemove = dragElement
  })

  function dragElement(e) {
    e.preventDefault()
    newPosX = startingPosX - e.clientX
    newPosY = startingPosY - e.clientY
    startingPosX = e.clientX
    startingPosY = e.clientY
    const minMaxX = Math.min(Math.max(container.offsetLeft - newPosX, 324), 1008)
    const minMaxY = Math.min(Math.max(container.offsetTop - newPosY, 248), 504)
    container.style.left = `${minMaxX}px`
    container.style.top = `${minMaxY}px`
  }

  function stopMoving(e) {
    console.log(e)
    document.onmouseup = null
    document.onmousemove = null
  }

}

window.addEventListener('DOMContentLoaded', main)
window.addEventListener('DOMContentLoaded', () => {
  const clock = document.querySelector('.clock')
  clock.innerHTML = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  setInterval(() => {
    clock.innerHTML = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }, 1000)
})


