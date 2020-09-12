import React from 'react';
import './App.css';
import { Link } from 'react-router-dom';

function App() {
  return (
    <div>
      <nav>
        <ul>
          <li>
            <Link to="/broadcaster">Broadcaster</Link>
          </li>
          <li>
            <Link to="/listener">Listener</Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}

export default App;
