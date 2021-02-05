import React, { Component } from "react";

import Container from '@material-ui/core/Container';
import CssBaseline from '@material-ui/core/CssBaseline';

import Login from "./components/Login";
import Documents from "./components/Documents";

class App extends Component{
  constructor(){
    super();
    const baseURL = "http://54.255.226.191/api";
    this.state = {
      user : {},
      apiconf : {
        baseURL : baseURL
      },
      defaultapiconf : {
        baseURL : baseURL
      }
    }
    this.localStorageKey = "myan_edms";
    this.setState = this.setState.bind(this)
  }

  componentDidMount(){
    const loggedInUser = localStorage.getItem(this.localStorageKey);
    if (loggedInUser) 
      this.setState(JSON.parse(loggedInUser));
  }

  render(){
    if(Object.keys(this.state.user).length)
      return (
        <Container>
        <CssBaseline />
        <Documents 
        setState = {this.setState}
        defaultapiconf = {this.state.defaultapiconf}
        apiconf = {this.state.apiconf}
        localStorageKey = {this.localStorageKey}
        />
        </Container>       
      )
    else
      return (
        <Container maxWidth="xs">
        <CssBaseline />
        <Login 
        setState={this.setState}
        apiconf={this.state.apiconf}
        localStorageKey={this.localStorageKey}
        />
        </Container>
      )
  }
}

export default App;