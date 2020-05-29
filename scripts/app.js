function main() {
  
  // DOM ELEMENTS
  const difficultyButtons = document.querySelectorAll('.difficulty')
  const minesRemaining = document.querySelector('.mines-remaining')
  const smileyButton = document.querySelector('.smiley-face')
  const timer = document.querySelector('.timer')
  const grid = document.querySelector('#grid')
  let tileDivs

  // PROGRAM VARIABLES

  let mineLocations = []
  let tiles = []
  let width = 9
  let height = 9
  let mines = 10
  let inGameMineCount = mines
  let timerInterval

  // INVOKE FUNCTIONS 

  drawMinefield()
  updateMineCounterDisplay()

  // EVENT LISTENERS

  difficultyButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      height = Number(e.target.dataset.height)
      width = Number(e.target.dataset.width)
      mines = Number(e.target.dataset.mines)
      drawMinefield()
      inGameMineCount = mines
      updateMineCounterDisplay()
    })
  })

  smileyButton.addEventListener('click', reset)

  // DOM MANIPULATION

  

  // FUNCTIONS

  function drawMinefield() {
    tiles = []
    grid.innerHTML = ''
    grid.style.gridTemplate = `repeat(${height}, 1fr) / repeat(${width}, 1fr)`
    let count = 0
    for (let i = 0; i < width * height; i++) {
      const tile = document.createElement('div')
      tile.id = count
      tile.classList.add('tile')
      tile.classList.add('tile-initial')
      tile.addEventListener('click', event => {
        if (tiles.every(tile => tile.clicked === false)) {
          populateMines()
          revealClicked(event)
          startTimer()
          markClicked(event)
        } else if (!event.target.classList.contains('flag')) {
          revealClicked(event)
          markClicked(event)
        }
      })
      tile.addEventListener('contextmenu', event => {
        event.preventDefault()
        addRemoveFlag(event.target)
      })
      tiles.push({ 
        id: tile, 
        adjacentTiles: adjacentTiles(width, height, i),
        // aboveBelowEitherSide: aboveBelowEitherSide(width, height, i),
        mine: false, 
        flagged: false, 
        clicked: false,
        recursed: false
      })
      grid.appendChild(tile)
      count++
    }
    tileDivs = document.querySelectorAll('.tile')
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

  // function aboveBelowEitherSide(width, height, index) {
  //   let workingArray 
  //   if (index % width === 0) {
  //     workingArray = [
  //       index - width,   
  //       index + 1, 
  //       index + width 
  //     ]
  //   } else if (index % width === width - 1) {
  //     workingArray = [ 
  //       index - width, 
  //       index - 1,  
  //       index + width
  //     ]
  //   } else {
  //     workingArray = [ 
  //       index - width,  
  //       index - 1, 
  //       index + 1,  
  //       index + width 
  //     ]
  //   }
  //   return workingArray.filter(index => 0 <= index && index < width * height)
  // }

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
    const clickedTileIndex = Number(clickedTile.id)
    if (tiles[clickedTileIndex].flagged) return
    if (mineLocations.includes(clickedTileIndex)) {
      gameOver(clickedTileIndex)
    } else if (adjacentMineCount(clickedTileIndex) === 0) {
      console.log('blank')
      clickedTile.classList.remove('tile-initial')
      revealExtended(clickedTileIndex)
    } else {
      const numberClass = `adjacent-mines-${adjacentMineCount(clickedTileIndex)}`
      clickedTile.classList.remove('tile-initial')
      clickedTile.classList.add(numberClass)
    }
  }

  function revealExtended(tileIndex) {
    tiles[tileIndex].adjacentTiles.forEach(adjacentTileIndex => {
      if (adjacentMineCount(adjacentTileIndex) === 0 && tiles[adjacentTileIndex].recursed === false) {
        tiles[adjacentTileIndex].id.classList.remove('tile-initial')
        tiles[adjacentTileIndex].id.classList.add('adjacent-mines-0')
        tiles[adjacentTileIndex].recursed = true
        revealExtended(adjacentTileIndex)
      } else if (mineLocations.includes(adjacentTileIndex)) {
        return
      } else {
        const numberClass = `adjacent-mines-${adjacentMineCount(adjacentTileIndex)}`
        tiles[adjacentTileIndex].id.classList.remove('tile-initial')
        tiles[adjacentTileIndex].id.classList.add(numberClass)
      }
    })
  }

  function adjacentMineCount(tileIndex) {
    let adjacentMineCount = 0
    tiles[tileIndex].adjacentTiles.forEach(adjacentTileIndex => {
      if (mineLocations.includes(adjacentTileIndex)) {
        adjacentMineCount++
      }
    })
    return adjacentMineCount
  }

  function addRemoveFlag(targetDiv) {
    if (tiles[targetDiv.id].flagged === false) {
      targetDiv.classList.remove('tile-initial')
      targetDiv.classList.add('flag')
      inGameMineCount--
      tiles[targetDiv.id].flagged = true
      updateMineCounterDisplay()
    } else {
      targetDiv.classList.remove('flag')
      targetDiv.classList.add('tile-initial')
      inGameMineCount++
      tiles[targetDiv.id].flagged = false
      updateMineCounterDisplay()
    }
  }


  function markClicked(event) {
    tiles[event.target.id].clicked = true
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

  function checkProgress() {}


  function winGame() {}

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
        tiles[mineLocationIndex].id.classList.remove('initial-tile')
        tiles[mineLocationIndex].id.classList.add('undetected-mine')
      } else {
        tiles[mineLocationIndex].id.classList.remove('initial-tile')
        tiles[mineLocationIndex].id.classList.add('exploded-mine')
      }
    })
    grid.style.pointerEvents = 'none'
  }

  function updateMineCounterDisplay() {
    minesRemaining.innerHTML = inGameMineCount
  }

  // DEBUGGING

  const debugButtons = document.querySelectorAll('.debug')
  const clearButton = document.querySelector('#clear')
  const revealAllButton = document.querySelector('.reveal-all')
  debugButtons.forEach(button => {
    button.addEventListener('click', e => {
      console.log(eval(e.target.dataset.arg))
    })
  })
  clearButton.addEventListener('click', console.clear)
  // grid.addEventListener('click', e => console.log(e.target))
  revealAllButton.addEventListener('click', (e) => {
    document.querySelectorAll('.tile').forEach(tile => {
      const clickedTileIndex = Array.from(tileDivs).indexOf(tile)
      if (mineLocations.includes(clickedTileIndex)) {
        tile.classList.remove('tile-initial')
        tile.classList.add('exploded-mine')
        console.log('Run endGame()')
      } else {
        const numberClass = `adjacent-mines-${adjacentMineCount(clickedTileIndex)}`
        tile.classList.remove('tile-initial')
        tile.classList.add(numberClass)
      }
    })
  })
}

window.addEventListener('DOMContentLoaded', main)
