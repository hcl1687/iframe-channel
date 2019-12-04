import React from 'react'
import {
  HashRouter as Router,
  Switch,
  Route,
  Link
} from 'react-router-dom'
import ChildRequest from './ChildRequest'
import ParentRequest from './ParentRequest'
import PostBeforeConnect from './PostBeforeConnect'
import PostFunction from './PostFunction'
import './App.css'

function App() {
  return (
    <Router>
      <div>
        <nav>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/parent-request">Parent request connect</Link>
            </li>
            <li>
              <Link to="/child-request">Child request connect</Link>
            </li>
            <li>
              <Link to="/post-before-connect">Post message before connect</Link>
            </li>
            <li>
              <Link to="/post-function">Post function</Link>
            </li>
          </ul>
        </nav>

        {/* A <Switch> looks through its children <Route>s and
            renders the first one that matches the current URL. */}
        <Switch>
          <Route path="/parent-request">
            <ParentRequest />
          </Route>
          <Route path="/child-request">
            <ChildRequest />
          </Route>
          <Route path="/post-before-connect">
            <PostBeforeConnect />
          </Route>
          <Route path="/post-function">
            <PostFunction />
          </Route>
          <Route path="/">
            <Home />
          </Route>
        </Switch>
      </div>
    </Router>
  );
}

function Home() {
  return <h2>Home</h2>
}

export default App
