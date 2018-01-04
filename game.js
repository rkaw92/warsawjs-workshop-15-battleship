'use strict';

/**
 * This function literally does nothing. It is meant as the default handler
 *  for all events like clicking things, etc.
 */
function noOp() {}

/**
 * A Component is a building block for widgets. It corresponds to and wraps
 *  a single DOM Element.
 * @abstract
 */
function Component() {}
/**
 * Produce the DOM element to represent this component.
 * @abstract
 * @returns {DOMElement}
 */
Component.prototype._createElement = function _createElement() {
  throw new Error('Not implemented');
};
/**
 * Initialize the component after producing the element.
 */
Component.prototype._initialize = function _initialize() {
  // By default, we do nothing. Components may override this function to
  //  enable other behaviors.
};
Component.prototype.run = function run() {
  this._componentState = {
    element: this._createElement()
  };
  this._initialize();
  return this.getElement();
};
Component.prototype.getElement = function getElement() {
  return this._componentState.element;
};

function ShipCell({ onClick = noOp } = {}) {
  Component.call(this);
  /**
   * The state in which the cell is. One of "unknown", "miss", "hit".
   */
  this._state = 'unknown';
  this._onClick = onClick;
}
ShipCell.prototype = new Component();
ShipCell.prototype._createElement = function _createElement() {
  const element = document.createElement('td');
  element.addEventListener('click', this._onClick.bind(this));
  return element;
};
ShipCell.prototype._initialize = function _initialize() {
  this._refresh();
};
/**
 * Change the state of the cell to one of "unknown", "miss", "hit" to represent
 *  the various states in the game.
 */
ShipCell.prototype.setState = function setState(state) {
  if (!ShipCell.states.has(state)) {
    throw new Error('Invalid state for ShipCell: ' + state);
  }
  this._state = state;
  this._refresh();
}
ShipCell.prototype._refresh = function _refresh() {
  // Set our content to the symbol representing the current state:
  let newContent;
  switch (this._state) {
    case 'unknown':
      newContent = '';
      break;
    case 'hit':
      newContent = 'X';
      break;
    case 'miss':
      newContent = '.';
      break;
  }
  this.getElement().textContent = newContent;
  // Update the CSS class so that we can be styled:
  this.getElement().className = 'cell_' + this._state;
};
ShipCell.states = new Set([ 'unknown', 'hit', 'miss' ]);

function GameBoard({ size }) {
  Component.call(this);
  this._cells = [];
  this._columnNumber = size;
  this._rowNumber = size;
  // Note: we simulate a 2-dimensional array by using a single dimension and
  //  simple multiplication operations.
  const totalCells = this._columnNumber * this._rowNumber;
  function handleCellClick() {
    //TODO: Add a call to the game controller here. For now, we just switch
    //  the clicked cell's state to "hit", as if the user scored a hit against
    //  a ship.
    this.setState('hit');
  }
  for (let i = 0; i < totalCells; i += 1) {
    this._cells.push(new ShipCell({ onClick: handleCellClick }));
  }
}
GameBoard.prototype = new Component();
GameBoard.prototype._createElement = function createElement() {
  const table = document.createElement('table');
  table.className = 'gameboard';
  // Generate the DOM elements representing rows and add our cells
  //  to them:
  for (let rowIndex = 0; rowIndex < this._rowNumber; rowIndex += 1) {
    const row = document.createElement('tr');
    for (let columnIndex = 0; columnIndex < this._columnNumber; columnIndex += 1) {
      const cell = this._cells[rowIndex * this._columnNumber + columnIndex];
      row.appendChild(cell.run());
    }
    table.appendChild(row);
  }
  return table;
};
GameBoard.prototype.getCell = function getCell(row, column) {
  const index = row * this._columnNumber + column;
  if (index >= 0 && index < this._cells.length) {
    return this._cells[index];
  } else {
    throw new Error('Invalid cell address: row = ' + row + ', column = ' + column);
  }
};

const boardContainer = document.getElementById('gameboardContainer');
const board = new GameBoard({ size: 10 });
boardContainer.appendChild(board.run());
