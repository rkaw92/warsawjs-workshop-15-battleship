'use strict';

// ### Base classes ###

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

// ### Components (view classes) ###
// Views are responsible for generating and displaying a human-facing
//  representation of some part of the app. The top-level view must also process
//  ("handle") updates coming from the model, and possibly distribute them among
//  its sub-views that are contained within.

class BoardCellComponent extends Component {
  /**
   * @param {Object} params.location - An object describing this cell's location within the game. This is not used directly by the cell, but is sent to the click handler.
   * @param {function} params.clickHandler - The function to call when the cell is clicked.
   */
  constructor({ location, clickHandler }) {
    super();
    /**
     * The state in which the cell is. One of "unknown", "miss", "hit".
     */
    this._state = 'unknown';
    this._location = location;
    this._onClick = (function() {
      clickHandler.call(this, location);
    }).bind(this);
  }

  _createElement() {
    const element = document.createElement('td');
    element.addEventListener('click', this._onClick);
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
    if (!BoardCellComponent.states.has(state)) {
      throw new Error('Invalid state for BoardCellComponent: ' + state);
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
BoardCellComponent.states = new Set([ 'unknown', 'hit', 'miss' ]);

class GameBoardComponent extends Component {
  constructor({ size, cellClickHandler }) {
    super();
    this._cells = [];
    this._columnNumber = size;
    this._rowNumber = size;
    // Note: we simulate a 2-dimensional array by using a single dimension and
    //  simple multiplication operations.
    for (let rowIndex = 0; rowIndex < this._rowNumber; rowIndex += 1) {
      for (let columnIndex = 0; columnIndex < this._columnNumber; columnIndex += 1) {
        this._cells.push(new BoardCellComponent({
          clickHandler: cellClickHandler,
          location: { row: rowIndex, column: columnIndex }
        }));
      }
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

  //TODO: Move this observer function to the top-level Game component!
  modelObserver(type, data) {
    switch (type) {
      case 'shotFired':
        this.getCell(data.row, data.column).setState(data.result);
        break;
      default:
        // We do not handle unknown model events; they do not interest us.
        return;
    }
  }
}

// ### Model classes ###
// Models represent the application state. In our game, a single top-level
//  game model exists, which encapsulates the game board(s) and routes
//  commands to the appropriate board.

class ShipModel {
  constructor() {
    this._size = 0;
    this._cells = new Set();
    this._shotTimes = 0;
  }

  addToCell(cell) {
    // Guard clause: do not re-add to the same cell!
    if (this._cells.has(cell)) {
      return;
    }
    this._cells.add(cell);
    this._size += 1;
  }

  shoot() {
    this._shotTimes += 1;
  }

  isSunk() {
    return (this._shotTimes >= this._size);
  }
}

class CellModel {
  constructor() {
    this._used = false;
    this._ship = null;
  }

  setShip(ship) {
    this._ship = ship;
    ship.addToCell(this);
  }

  isUsed() {
    return this._used;
  }

  shoot() {
    if (!this._used) {
      this._used = true;
      if (this._ship) {
        this._ship.shoot();
        return this._ship;
      } else {
        return null;
      }
    } else {
      throw new Error('Cannot re-use an already-used cell!');
    }
  }
}

class BoardModel {
  constructor({ size }) {
    this._cells = {};
    this._rowNumber = size;
    this._columnNumber = size;
    for (let rowIndex = 0; rowIndex <= this._rowNumber; rowIndex += 1) {
      for (let columnIndex = 0; columnIndex <= this._columnNumber; columnIndex += 1) {
        this._cells[rowIndex + 'x' + columnIndex] = new CellModel();
      }
    }
    // Add a single hard-coded ship:
    const shipsToAdd = [
      [ '0x2', '0x3', '0x4' ]
    ];
    shipsToAdd.forEach(function(cellsToPlaceIn) {
      const ship = new ShipModel();
      cellsToPlaceIn.forEach(function(cellLocation) {
        const cell = this._cells[cellLocation];
        cell.setShip(ship);
      }, this);
    }, this);
  }

  _getCellAt(row, column) {
    return this._cells[row + 'x' + column];
  }

  shootAt(row, column) {
    const cell = this._getCellAt(row, column);
    // Guard clause: if already shot at or otherwise disabled, exit early.
    if (cell.isUsed()) {
      return;
    }
    const shotShip = cell.shoot();
    let shootingResult = (shotShip ? 'hit' : 'miss');
    // Return the result to the caller - we're typically not the root model.
    return shootingResult;
  }
}

/**
 * The GameModel is the top-level model for the game of Battleships. It keeps
 *  the state of the game (by encapsulating instances of BoardModel) and allows
 *  one to run behaviors on the game - namely, to shoot ships.
 * NOTE: A single-player variant only is currently implemented.
 */
class GameModel {
  /**
   * Construct a new model of the game.
   * @param {Object} params
   * @param {BoardModel} params.board - The board model to use for simulating the sole board of ships. It must have some ships already on it, as we do not fill it afterwards.
   */
  constructor({ board }) {
    this._board = board;
    this._observers = new Set();
    //TODO: Add logic for turn handling, 2 boards, and victory/loss conditions.
  }

  shootAt(row, column) {
    const shootingResult = this._board.shootAt(row, column);
    // Publish the shooting result for our observers:
    // (This feels a lot like .NET MVC!)
    this._publishChange('shotFired', { row, column, result: shootingResult });
  }

  addObserver(observerFunction) {
    this._observers.add(observerFunction);
  }

  _publishChange(type, data) {
    let observerError;
    this._observers.forEach(function(observerFunction) {
      // Isolate the observers w.r.t. error handling:
      try {
        observerFunction(type, data);
      } catch (error) {
        // Save only 1 error - other errors are eaten for now.
        observerError = error;
      }
    });
    // Throw at the end so that whatever caused the last error is not ignored:
    if (observerError) {
      throw observerError;
    }
  }
}


// ### Controller class ###
// The controller is the class that translates events from outside sources
//  (in our case, user input) into commands and applies them to the model.

class GameController {
  constructor({ view, model }) {
    this._view = view;
    this._model = model;
  }

  cellClickHandler(location) {
    this._model.shootAt(location.row, location.column);
  }
}

// ### Application composition and init ###

// Initialize models:
const boardModel = new BoardModel({ size: 10 });
const model = new GameModel({ board: boardModel });
// Create the controller, telling it to route commands to the model:
const controller = new GameController({ model });
// Make the game view and bind it to the controller:
const view = new GameBoardComponent({
  size: 10,
  // Bind the method to the controller (or "this" would be undefined).
  cellClickHandler: controller.cellClickHandler.bind(controller)
});
// One last thing to do is to make the view observe the model, so that changes
//  applied to the model are propagated to the view and displayed.
model.addObserver(view.modelObserver.bind(view));

// Actually put our game in the DOM.
const boardContainer = document.getElementById('gameboardContainer');
boardContainer.appendChild(view.run());
