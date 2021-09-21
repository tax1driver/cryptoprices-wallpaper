import React from 'react'
import { TransitionGroup } from 'react-transition-group'

class Ticker extends React.Component {
  constructor(props) {
    super(props);
    this.validateValue = this.validateValue.bind(this);
  }
  
  shouldComponentUpdate(nextProps, nextState) {
    return this.validateValue(nextProps.value, nextProps.charsSet);
  }
  
  render() {
    let {value, charsSet, textSize = 20} = this.props;
    let style = {
      fontFamily: '"Lato", Arial, sans-serif',
      display: 'flex',
      overflow: 'hidden',
      justifyContent: 'center'
    };

    let characterColumns = value.toString().split('').map((char, idx) => {
        return <TickerCharacterColumn key={idx} textSize={textSize} char={char} charsSet={charsSet}/>
    });
    
    return (
      <TransitionGroup component="div" style={style} transitionName="char-column" transitionEnterTimeout={400} transitionLeaveTimeout={400}>
        {characterColumns}
      </TransitionGroup>
    )
  }
  
  validateValue(value, charsSet) {
    let charIsInCharsSet = (char) => {
      return charsSet.indexOf(char) !== -1;
    };
    
    return typeof value === 'string' &&
           value.split('').every(charIsInCharsSet);
  }
}

class TickerCharacterColumn extends React.Component {
  constructor(props) {
    super(props);
    this.renderChars = this.renderChars.bind(this);
  }
  
  render() {
    let {char, charsSet, textSize = 20} = this.props;
    let textWidth = textSize * 0.75;
    let charIndex = charsSet.indexOf(char);
    let containerHeight = textSize * 1.5;
    let translateY = -1 * charIndex * containerHeight;
    let style = {
      transform: `translate(0, ${translateY}px)`,
      boxSizing: 'border-box'
    };
    
    return (
        <div className="ticker__char-column" style={style}>
          {this.renderChars({
            textSize,
            containerHeight
          })}
        </div>
    )
  }
  renderChars(opts) {
    let {charsSet = []} = this.props;
    let {textSize, containerHeight} = opts;
    let charStyle = {
      height: containerHeight,
      padding: 0,
      lineHeight: `${containerHeight}px`,
      fontSize: textSize,
      color: '#fff',
      fontWeight: 100,
      textAlign: 'center',
      width: 30
    };
    
    return charsSet.map((char, idx) => {
      return <div key={idx} className="ticker__char-column__char" style={charStyle}>{char}</div>;
    });
  }
}

export default Ticker;