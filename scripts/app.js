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
  let mines = 1
  let inGameMineCount = mines
  let tilesArray = []
  let mineLocations = []
  let timerInterval

  // EVENT LISTENERS

  difficultyButtons.forEach(button => {
    button.addEventListener('click', (e) => {
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
        if (tilesArray.every(tileObj => tileObj.clicked === false)) {
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
    timer.innerHTML = 0
    minesRemaining.innerHTML = mines
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

  // DEBUGGING

  // const debugButtons = document.querySelectorAll('.debug')
  // const clearButton = document.querySelector('#clear')
  // const clickedTrueArray = document.querySelector('#clicked-true-array')
  // const revealAllButton = document.querySelector('.reveal-all')
  // debugButtons.forEach(button => {
  //   button.addEventListener('click', e => {
  //     console.log(eval(e.target.dataset.arg))
  //   })
  // })
  // clickedTrueArray.addEventListener('click', () => {
  //   console.log(tilesArray.filter(tile => !mineLocations.includes(tile.index)).every(tile => tile.clicked === true))
  // })
  // clearButton.addEventListener('click', console.clear)
  // revealAllButton.addEventListener('click', () => {
  //   document.querySelectorAll('.tile').forEach(tile => {
  //     const clickedTileIndex = Array.from(tileDivs).indexOf(tile)
  //     if (mineLocations.includes(clickedTileIndex)) {
  //       tile.classList.remove('tile-initial')
  //       tile.classList.add('exploded-mine')
  //       console.log('Run endGame()')
  //     } else {
  //       const numberClass = `adjacent-mines-${adjacentMineCount(clickedTileIndex)}`
  //       tile.classList.remove('tile-initial')
  //       tile.classList.add(numberClass)
  //     }
  //   })
  // })
}

window.addEventListener('DOMContentLoaded', main)
