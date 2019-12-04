import React from 'react'
import {
  HashRouter as Router,
  Switch,
  Route,
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
  return <h2>Home</h2>;
}

export default App;
