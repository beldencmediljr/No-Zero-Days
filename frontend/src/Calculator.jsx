import React, { useState, useCallback, useEffect } from 'react';
import './Calculator.css';

// ==========================================
// EXPRESSION PARSER & EVALUATOR
// ==========================================

const tokenize = (str) => {
  const rawTokens = [];
  let i = 0;
  while (i < str.length) {
    const char = str[i];
    if (/\s/.test(char)) {
      i++;
      continue;
    }
    if (/[0-9.]/.test(char)) {
      let numStr = '';
      while (i < str.length && /[0-9.]/.test(str[i])) {
        numStr += str[i];
        i++;
      }
      rawTokens.push({ type: 'NUMBER', value: parseFloat(numStr) });
      continue;
    }
    if (/[a-zA-Z]/.test(char)) {
      let word = '';
      while (i < str.length && /[a-zA-Z0-9]/.test(str[i])) {
        word += str[i];
        i++;
      }
      rawTokens.push({ type: 'WORD', value: word });
      continue;
    }
    if (char === 'π') {
      rawTokens.push({ type: 'CONSTANT', value: Math.PI });
      i++;
      continue;
    }
    if (char === '√') {
      rawTokens.push({ type: 'WORD', value: 'sqrt' });
      i++;
      continue;
    }
    if ('+-*/^()'.includes(char)) {
      rawTokens.push({ type: 'OPERATOR', value: char });
      i++;
      continue;
    }
    // Ignore unrecognized characters
    i++;
  }

  // Insert implicit multiplications (e.g. 2π -> 2 * π, 2(3+4) -> 2 * (3+4))
  const tokens = [];
  for (let k = 0; k < rawTokens.length; k++) {
    const current = rawTokens[k];
    tokens.push(current);
    if (k < rawTokens.length - 1) {
      const next = rawTokens[k + 1];
      const isCurrentValue = current.type === 'NUMBER' || current.type === 'CONSTANT' || (current.type === 'WORD' && current.value.toLowerCase() === 'e') || (current.type === 'OPERATOR' && current.value === ')');
      const isNextValue = next.type === 'NUMBER' || next.type === 'CONSTANT' || next.type === 'WORD' || (next.type === 'OPERATOR' && next.value === '(');
      if (isCurrentValue && isNextValue) {
        tokens.push({ type: 'OPERATOR', value: '*' });
      }
    }
  }
  return tokens;
};

class Parser {
  constructor(tokens, isDegree = true) {
    this.tokens = tokens;
    this.index = 0;
    this.isDegree = isDegree;
  }

  peek() {
    return this.tokens[this.index] || null;
  }

  consume() {
    return this.tokens[this.index++];
  }

  parse() {
    if (this.tokens.length === 0) return 0;
    const val = this.expression();
    if (this.peek() !== null) {
      throw new Error(`Unexpected symbol: ${this.peek().value || JSON.stringify(this.peek())}`);
    }
    return val;
  }

  expression() {
    let val = this.term();
    while (true) {
      const next = this.peek();
      if (next && next.type === 'OPERATOR' && (next.value === '+' || next.value === '-')) {
        this.consume();
        const rhs = this.term();
        if (next.value === '+') val += rhs;
        else val -= rhs;
      } else {
        break;
      }
    }
    return val;
  }

  term() {
    let val = this.factor();
    while (true) {
      const next = this.peek();
      if (next && next.type === 'OPERATOR' && (next.value === '*' || next.value === '/')) {
        this.consume();
        const rhs = this.factor();
        if (next.value === '*') val *= rhs;
        else {
          if (rhs === 0) throw new Error('Division by zero');
          val /= rhs;
        }
      } else {
        break;
      }
    }
    return val;
  }

  factor() {
    let val = this.unary();
    const next = this.peek();
    if (next && next.type === 'OPERATOR' && next.value === '^') {
      this.consume();
      const rhs = this.factor();
      val = Math.pow(val, rhs);
    }
    return val;
  }

  unary() {
    const next = this.peek();
    if (next && next.type === 'OPERATOR' && next.value === '+') {
      this.consume();
      return this.unary();
    }
    if (next && next.type === 'OPERATOR' && next.value === '-') {
      this.consume();
      return -this.unary();
    }
    return this.primary();
  }

  primary() {
    const token = this.peek();
    if (!token) throw new Error('Unexpected end of expression');

    if (token.type === 'NUMBER') {
      this.consume();
      return token.value;
    }

    if (token.type === 'CONSTANT') {
      this.consume();
      return token.value;
    }

    if (token.type === 'WORD') {
      const word = token.value.toLowerCase();
      if (word === 'e') {
        this.consume();
        return Math.E;
      }
      if (word === 'pi') {
        this.consume();
        return Math.PI;
      }
      
      // Function execution
      this.consume(); // Consume function name
      const openParen = this.peek();
      if (!openParen || openParen.type !== 'OPERATOR' || openParen.value !== '(') {
        throw new Error(`Expected "(" after "${word}"`);
      }
      this.consume(); // Consume '('
      const arg = this.expression();
      const closeParen = this.consume();
      if (!closeParen || closeParen.type !== 'OPERATOR' || closeParen.value !== ')') {
        throw new Error(`Unmatched parenthesis in "${word}"`);
      }

      switch (word) {
        case 'sin':
          return this.isDegree ? Math.sin(arg * Math.PI / 180) : Math.sin(arg);
        case 'cos':
          return this.isDegree ? Math.cos(arg * Math.PI / 180) : Math.cos(arg);
        case 'tan':
          return this.isDegree ? Math.tan(arg * Math.PI / 180) : Math.tan(arg);
        case 'log':
          if (arg <= 0) throw new Error('Log domain error');
          return Math.log10(arg);
        case 'ln':
          if (arg <= 0) throw new Error('Ln domain error');
          return Math.log(arg);
        case 'sqrt':
          if (arg < 0) throw new Error('Square root domain error');
          return Math.sqrt(arg);
        default:
          throw new Error(`Unknown function: "${word}"`);
      }
    }

    if (token.type === 'OPERATOR' && token.value === '(') {
      this.consume();
      const val = this.expression();
      const closeParen = this.consume();
      if (!closeParen || closeParen.type !== 'OPERATOR' || closeParen.value !== ')') {
        throw new Error('Unmatched parenthesis');
      }
      return val;
    }

    throw new Error(`Unexpected token: "${token.value || token.type}"`);
  }
}

const parseAndEvaluate = (expr, isDegree = true) => {
  // Normalize formula syntax
  const cleanExpr = expr
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/π/g, 'π');
  
  const tokens = tokenize(cleanExpr);
  const parser = new Parser(tokens, isDegree);
  return parser.parse();
};

// ==========================================
// CALCULATOR REACT COMPONENT
// ==========================================

export default function Calculator({ isVisible, onToggle }) {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [isDegree, setIsDegree] = useState(true);
  const [error, setError] = useState(null);
  const [isEvaluated, setIsEvaluated] = useState(false);
  const [history, setHistory] = useState([]);

  const copyToClipboard = (val) => {
    if (val === 'Error' || !val) return;
    navigator.clipboard.writeText(val).catch(() => {});
  };

  const handleKeyPress = useCallback((value) => {
    setError(null);
    
    if (value === 'C') {
      setDisplay('0');
      setExpression('');
      setIsEvaluated(false);
      return;
    }
    
    if (value === 'CE') {
      setDisplay('0');
      return;
    }
    
    if (value === '⌫') {
      if (isEvaluated || display === 'Error') {
        setDisplay('0');
        setExpression('');
        setIsEvaluated(false);
      } else {
        setDisplay(prev => {
          if (prev.length <= 1 || prev === 'Error') return '0';
          
          // Check if it ends with a function pattern
          const funcMatch = prev.match(/(sin\(|cos\(|tan\(|log\(|ln\(|√\()$/);
          if (funcMatch) {
            const newPrev = prev.slice(0, -funcMatch[0].length);
            return newPrev === '' ? '0' : newPrev;
          }

          if (prev.endsWith(' ')) {
            return prev.trimEnd().slice(0, -1).trimEnd();
          }
          return prev.slice(0, -1);
        });
      }
      return;
    }
    
    if (value === '=') {
      try {
        if (display === '0' || display === 'Error' || !display) return;
        const result = parseAndEvaluate(display, isDegree);
        
        // Handle NaN/Infinity
        if (isNaN(result) || !isFinite(result)) {
          throw new Error('Mathematical error');
        }
        
        // Precision rounding (6 decimal places)
        const rounded = Math.round(result * 1000000) / 1000000;
        const displayVal = String(rounded);
        
        setExpression(display + ' =');
        
        const entry = `${display} = ${displayVal}`;
        setHistory(prev => [entry, ...prev].slice(0, 8));
        
        setDisplay(displayVal);
        setIsEvaluated(true);
      } catch (err) {
        setError(err.message || 'Error');
        setExpression(display + ' =');
        setDisplay('Error');
        setIsEvaluated(true);
      }
      return;
    }
    
    if (value === 'DEG' || value === 'RAD') {
      setIsDegree(prev => !prev);
      return;
    }

    // Input validations before standard appends/toggles
    
    // 1. Decimal Point Validation
    if (value === '.') {
      if (display === 'Error' || isEvaluated) {
        setDisplay('0.');
        setExpression('');
        setIsEvaluated(false);
        return;
      }
      if (/\.\d*$/.test(display)) {
        return; // Ignore duplicate decimal point in current number
      }
    }

    // 2. Operators Validation (+, −, ×, ÷, ^)
    if (['+', '−', '×', '÷', '^'].includes(value)) {
      if (display === 'Error') {
        setDisplay('0 ' + value + ' ');
        setExpression('');
        setIsEvaluated(false);
        return;
      }
      if (isEvaluated) {
        setDisplay(display + ' ' + value + ' ');
        setExpression('');
        setIsEvaluated(false);
        return;
      }
      
      // Prevent operators directly after opening parenthesis '('
      if (display.trim().endsWith('(')) {
        return; // Ignore operator right after '('
      }

      setDisplay(prev => {
        // If it already ends with an operator, replace it
        if (/\s*[+−×÷^]\s*$/.test(prev)) {
          return prev.replace(/\s*[+−×÷^]\s*$/, ' ' + value + ' ');
        }
        if (prev === '0') {
          return '0 ' + value + ' ';
        }
        return prev + ' ' + value + ' ';
      });
      return;
    }

    // 3. Percentage Validation
    if (value === '%') {
      if (display === 'Error' || isEvaluated) {
        setDisplay('0%');
        setExpression('');
        setIsEvaluated(false);
        return;
      }
      if (display.endsWith('%')) {
        return; // Prevent duplicate percentage
      }
      if (/\s*[+−×÷^]\s*$/.test(display)) {
        return; // Prevent percentage immediately after an operator
      }
      setDisplay(prev => prev === '0' ? '0%' : prev + '%');
      return;
    }

    // 4. Closing Parenthesis Validation
    if (value === ')') {
      if (display === 'Error' || isEvaluated) {
        return; // Can't start a closing parenthesis on new/error state
      }
      if (display.trim().endsWith('(')) {
        return; // Prevent empty parentheses "()"
      }
      const openCount = (display.match(/\(/g) || []).length;
      const closeCount = (display.match(/\)/g) || []).length;
      if (closeCount >= openCount) {
        return; // Prevent unmatched closing parenthesis
      }
    }

    // 5. Sign Toggle (±)
    if (value === '±') {
      if (display === 'Error') {
        setDisplay('-');
        setExpression('');
        setIsEvaluated(false);
        return;
      }
      if (isEvaluated) {
        if (display.startsWith('-')) {
          setDisplay(display.slice(1));
        } else {
          setDisplay('-' + display);
        }
        setExpression('');
        setIsEvaluated(false);
      } else {
        setDisplay(prev => {
          if (prev.startsWith('-(') && prev.endsWith(')')) {
            return prev.slice(2, -1);
          } else if (prev.startsWith('-') && !prev.includes(' ')) {
            return prev.slice(1);
          } else if (prev === '0') {
            return '-';
          } else {
            return prev.includes(' ') ? `-(${prev})` : `-${prev}`;
          }
        });
      }
      return;
    }

    // Standard appends for functions, constants, digits, opening parenthesis
    let appendValue = value;
    if (['sin', 'cos', 'tan', 'log', 'ln'].includes(value)) {
      appendValue = value + '(';
    } else if (value === '√') {
      appendValue = '√(';
    }

    if (display === 'Error' || isEvaluated) {
      setDisplay(appendValue);
      setExpression('');
      setIsEvaluated(false);
    } else {
      setDisplay(prev => prev === '0' ? appendValue : prev + appendValue);
    }
  }, [display, isDegree, isEvaluated]);

  // Keyboard Event Listener
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (e) => {
      // Prevent taking inputs when focusing on text inputs, textareas, selects or content editable elements (avoid collision)
      const activeEl = document.activeElement;
      if (activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.tagName === 'SELECT' || 
        activeEl.isContentEditable
      )) {
        return;
      }

      // Ignore key combinations with Ctrl, Alt, or Meta keys (avoids browser hotkey conflicts like Ctrl+C, Ctrl+V, etc.)
      if (e.ctrlKey || e.altKey || e.metaKey) {
        return;
      }

      const key = e.key;

      if (/[0-9.]/.test(key)) {
        e.preventDefault();
        handleKeyPress(key);
      } else if (key === '+') {
        e.preventDefault();
        handleKeyPress('+');
      } else if (key === '-') {
        e.preventDefault();
        handleKeyPress('−');
      } else if (key === '*') {
        e.preventDefault();
        handleKeyPress('×');
      } else if (key === '/') {
        e.preventDefault();
        handleKeyPress('÷');
      } else if (key === '%') {
        e.preventDefault();
        handleKeyPress('%');
      } else if (key === '^') {
        e.preventDefault();
        handleKeyPress('^');
      } else if (key === '(' || key === ')') {
        e.preventDefault();
        handleKeyPress(key);
      } else if (key === 'Enter') {
        e.preventDefault();
        handleKeyPress('=');
      } else if (key === 'Backspace') {
        e.preventDefault();
        handleKeyPress('⌫');
      } else if (key === 'Escape' || key === 'Delete') {
        e.preventDefault();
        handleKeyPress('C');
      } else if (key === '_') {
        e.preventDefault();
        handleKeyPress('±');
      } else if (key.toLowerCase() === 'p') {
        e.preventDefault();
        handleKeyPress('π');
      } else if (key.toLowerCase() === 'e') {
        e.preventDefault();
        handleKeyPress('e');
      } else if (key.toLowerCase() === 's') {
        e.preventDefault();
        handleKeyPress('sin');
      } else if (key.toLowerCase() === 'c') {
        e.preventDefault();
        handleKeyPress('cos');
      } else if (key.toLowerCase() === 't') {
        e.preventDefault();
        handleKeyPress('tan');
      } else if (key.toLowerCase() === 'l') {
        e.preventDefault();
        handleKeyPress('log');
      } else if (key.toLowerCase() === 'n') {
        e.preventDefault();
        handleKeyPress('ln');
      } else if (key.toLowerCase() === 'r') {
        e.preventDefault();
        handleKeyPress('√');
      } else if (key.toLowerCase() === 'd') {
        e.preventDefault();
        handleKeyPress('DEG');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible, handleKeyPress]);


  const BUTTONS = [
    { label: 'sin', action: () => handleKeyPress('sin'), style: 'btn-sci' },
    { label: 'cos', action: () => handleKeyPress('cos'), style: 'btn-sci' },
    { label: 'tan', action: () => handleKeyPress('tan'), style: 'btn-sci' },
    { label: '^',   action: () => handleKeyPress('^'),   style: 'btn-sci' },
    { label: '√',   action: () => handleKeyPress('√'),   style: 'btn-sci' },

    { label: 'log', action: () => handleKeyPress('log'), style: 'btn-sci' },
    { label: 'ln',  action: () => handleKeyPress('ln'),  style: 'btn-sci' },
    { label: '(',   action: () => handleKeyPress('('),   style: 'btn-sci' },
    { label: ')',   action: () => handleKeyPress(')'),   style: 'btn-sci' },
    { label: isDegree ? 'DEG' : 'RAD', action: () => handleKeyPress(isDegree ? 'DEG' : 'RAD'), style: 'btn-mode' },

    { label: 'π',   action: () => handleKeyPress('π'),   style: 'btn-const' },
    { label: 'e',   action: () => handleKeyPress('e'),   style: 'btn-const' },
    { label: 'C',   action: () => handleKeyPress('C'),   style: 'btn-clear' },
    { label: 'CE',  action: () => handleKeyPress('CE'),  style: 'btn-clear' },
    { label: '⌫',   action: () => handleKeyPress('⌫'),   style: 'btn-clear' },

    { label: '7',   action: () => handleKeyPress('7'),   style: 'btn-num' },
    { label: '8',   action: () => handleKeyPress('8'),   style: 'btn-num' },
    { label: '9',   action: () => handleKeyPress('9'),   style: 'btn-num' },
    { label: '÷',   action: () => handleKeyPress('÷'),   style: 'btn-op' },
    { label: '×',   action: () => handleKeyPress('×'),   style: 'btn-op' },

    { label: '4',   action: () => handleKeyPress('4'),   style: 'btn-num' },
    { label: '5',   action: () => handleKeyPress('5'),   style: 'btn-num' },
    { label: '6',   action: () => handleKeyPress('6'),   style: 'btn-num' },
    { label: '−',   action: () => handleKeyPress('−'),   style: 'btn-op' },
    { label: '+',   action: () => handleKeyPress('+'),   style: 'btn-op' },

    { label: '1',   action: () => handleKeyPress('1'),   style: 'btn-num' },
    { label: '2',   action: () => handleKeyPress('2'),   style: 'btn-num' },
    { label: '3',   action: () => handleKeyPress('3'),   style: 'btn-num' },
    { label: '±',   action: () => handleKeyPress('±'),   style: 'btn-sci' },
    { label: '=',   action: () => handleKeyPress('='),   style: 'btn-equals' },

    { label: '0',   action: () => handleKeyPress('0'),   style: 'btn-num-double' },
    { label: '.',   action: () => handleKeyPress('.'),   style: 'btn-num' },
    { label: '%',   action: () => handleKeyPress('%'),   style: 'btn-sci' }
  ];

  return (
    <>
      {/* Sliding Calculator Panel */}
      <div className={`calc-panel ${isVisible ? 'calc-panel-visible' : ''}`}>
        {/* Header */}
        <div className="calc-header">
          <span className="calc-title">🔬 SCIENTIFIC CALCULATOR</span>
          <button className="calc-close-btn" onClick={onToggle}>✕</button>
        </div>

        {/* Display */}
        <div className="calc-display-wrapper">
          <div className="calc-expression">{expression || '\u00A0'}</div>
          <div
            className="calc-display"
            onClick={() => copyToClipboard(display)}
            title={display !== 'Error' ? 'Click to copy' : ''}
          >
            {display}
          </div>
          {error ? (
            <div className="calc-error-banner">⚠️ {error}</div>
          ) : (
            <div className="calc-copy-hint">📋 click display to copy</div>
          )}
        </div>

        {/* Button Grid */}
        <div className="calc-grid">
          {BUTTONS.map((btn, i) => (
            <button
              key={i}
              className={`calc-btn ${btn.style}`}
              onClick={btn.action}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* History Log */}
        {history.length > 0 && (
          <div className="calc-history">
            <div className="calc-history-header">
              <span>📜 CALCULATION HISTORY</span>
              <button onClick={() => setHistory([])} className="calc-clear-history">CLEAR</button>
            </div>
            <div className="calc-history-list">
              {history.map((entry, i) => (
                <div
                  key={i}
                  className="calc-history-entry"
                  onClick={() => {
                    const result = entry.split('= ')[1];
                    if (result && result !== 'Error') {
                      setDisplay(result);
                      setIsEvaluated(true);
                    }
                  }}
                  title="Click to use this result"
                >
                  {entry}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Help */}
        <div className="calc-payroll-hint">
          <span style={{ color: '#60a5fa', fontSize: '0.7rem', display: 'block', marginBottom: '4px' }}>💡 QUICK FORMULAS:</span>
          <code style={{ color: '#94a3b8', fontSize: '0.68rem', display: 'block', lineHeight: '1.6' }}>
            Gross = Daily Rate × Days Present<br/>
            OT Pay = HR × (OT hrs − 1.0) × 1.25<br/>
            Holiday = Daily Rate × 2.0<br/>
            PhilHealth = Basic Salary × 0.025
          </code>
        </div>
      </div>

      {/* Floating Toggle Button */}
      <button
        className={`calc-toggle-btn ${isVisible ? 'calc-toggle-active' : ''}`}
        onClick={onToggle}
        title={isVisible ? 'Hide Calculator' : 'Open Calculator'}
        aria-label="Toggle Calculator"
      >
        <span className="calc-toggle-icon">🧮</span>
        <span className="calc-toggle-label">{isVisible ? 'HIDE CALC' : 'CALCULATOR'}</span>
      </button>
    </>
  );
}
