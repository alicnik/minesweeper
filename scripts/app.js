function main() {
  const difficultyButtons = document.querySelectorAll('.difficulty')
  const displayBoard = document.querySelector('.displayboard')
  const minesRemaining = document.querySelector('.mines-remaining')
  const smileyButton = document.querySelector('#smiley-face')
  const timer = document.querySelector('.timer')
  const grid = document.querySelector('#grid')
  let width = 9
  let height = 9
  let mines = 10
  const tiles = []
  const mineLocationIndexes = []
  let timerInterval

  drawMinefield()

  difficultyButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      height = e.target.dataset.height
      width = e.target.dataset.width
      mines = e.target.dataset.mines
      drawMinefield()
    })
  })

  function drawMinefield() {
    grid.innerHTML = ''
    grid.style.gridTemplate = `repeat(${height}, 1fr) / repeat(${width}, 1fr)`
    for (let i = 0; i < width * height; i++) {
      const tile = document.createElement('div')
      tile.classList.add('tile-initial')
      tile.addEventListener('click', reveal)
      tiles.push(tile)
      grid.appendChild(tile)
    }
  }

  function populateMines() {}


  function reveal(event) {
    const clickedTileIndex = tiles.indexOf(event.target)
    if (mineLocationIndexes.includes(clickedTileIndex)) {
      console.log('found a mine')
    }
  }

  function startTimer() {
    let timerCount = 0
    timerInterval = setInterval(() => {
      timer.innerHTML = timerCount
      if (timerCount < 999) {
        timerCount++
      }
    }, 1000)
  }

  function reset() {
    clearInterval(timerInterval)
    drawMinefield()
  }

}

window.addEventListener('DOMContentLoaded', main)





