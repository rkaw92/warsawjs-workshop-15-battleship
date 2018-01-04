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
function Component() {
  this._componentState = {
    element: null
  };
}
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
  this._componentState.element = this._createElement();
  this._initialize();
  return this.getElement();
};
Component.prototype.getElement = function getElement() {
  return this._componentState.element;
};

function ShipCell({ onClick = noOp } = {}) {
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

const boardContainer = document.getElementById('gameboardContainer');
const cell = new ShipCell();
boardContainer.appendChild(cell.run());
setTimeout(function() {
  cell.setState('hit');
}, 3000);
