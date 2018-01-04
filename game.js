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
class Component {
  /**
   * Produce the DOM element to represent this component. Implement this in
   *  actual component classes.
   * @abstract
   * @returns {DOMElement}
   */
  _createElement() {
    throw new Error('Not implemented');
  }

  /**
   * Initialize the component after producing the element. By default, this does
   *  nothing and is meant to be overridden.
   */
  _initialize() {
    // no-op
  }

  /**
   * Start the component by creating its element and running the initialization
   *  procedure. This must be called to actually bring the component to life.
   * @returns {DOMElement} The created element.
   */
  run() {
    this._componentState = {
      element: this._createElement()
    };
    this._initialize();
    return this.getElement();
  }

  /**
   * Get the element that represents the component. This is only legal after
   *  run() - otherwise, an error is thrown.
   * @returns {DOMElement}
   */
  getElement() {
    return this._componentState.element;
  }
}

class ShipCell extends Component {
  constructor({ onClick = noOp } = {}) {
    super();
    /**
     * The state in which the cell is. One of "unknown", "miss", "hit".
     */
    this._state = 'unknown';
    this._onClick = onClick;
  }

  _createElement() {
    const element = document.createElement('td');
    element.addEventListener('click', this._onClick.bind(this));
    return element;
  };

  _initialize() {
    // Render our initial state in the cell.
    this._refresh();
  }

  /**
   * Change the state of the cell to one of "unknown", "miss", "hit" to reflect
   *  the various states in the game.
   * @param {string} state - The state word, as described.
   */
  setState(state) {
    if (!ShipCell.states.has(state)) {
      throw new Error('Invalid state for ShipCell: ' + state);
    }
    this._state = state;
    this._refresh();
  }

  _refresh() {
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
  }
}
ShipCell.states = new Set([ 'unknown', 'hit', 'miss' ]);

class GameBoard extends Component {
  constructor({ size }) {
    super();
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

  _createElement() {
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
  }

  getCell(row, column) {
    const index = row * this._columnNumber + column;
    if (index >= 0 && index < this._cells.length) {
      return this._cells[index];
    } else {
      throw new Error('Invalid cell address: row = ' + row + ', column = ' + column);
    }
  }
}

const boardContainer = document.getElementById('gameboardContainer');
const board = new GameBoard({ size: 10 });
boardContainer.appendChild(board.run());
