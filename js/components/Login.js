import React, { useState } from 'react';

import Container from '@material-ui/core/Container';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import CssBaseline from '@material-ui/core/CssBaseline';
import { makeStyles } from '@material-ui/core/styles';
import Alert from 'react-bootstrap/Alert';

import axios from 'axios';

const useStyles = makeStyles((theme) => ({
  paper: {
    marginTop: theme.spacing(8),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  form: {
    width: '100%', // Fix IE 11 issue.
    marginTop: theme.spacing(1),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
}));

// https://www.freecodecamp.org/news/how-to-persist-a-logged-in-user-in-react/
const Login = (props) => {
    const [err, setError] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const classes = useStyles();

    let api = axios.create(props.apiconf);
  
    const handleSubmit = async e => {
      e.preventDefault();      
      try {
        const response = await api.post(
          "/auth/token/obtain/?format=json",
          {
            username:username,
            password:password
          }
        );
        setError(false);
        let apiconf = Object.assign({},props.apiconf);
        apiconf.headers = {
          Authorization : `Token ${response.data['token']}`
        }
        const loggedin_state = {
          user:{username:username},
          apiconf:apiconf
        }
        props.setState(loggedin_state);
        localStorage.setItem(props.localStorageKey,JSON.stringify(loggedin_state));      
      } catch(err) {        
        setError(true);
      }
    };
  
    return (
      <Container maxWidth="xs">
        <CssBaseline />
        <div className={classes.paper} >
          <form onSubmit={handleSubmit}>
            <Alert variant="danger" show={err} >Please check username password, if the issue persists contact admin</Alert>
            <TextField 
              id="username" 
              label="Username" 
              variant="outlined"
              value={username}
              onChange={({ target }) => setUsername(target.value)}
              fullWidth
              margin="normal" 
            />
            <TextField 
              id="password" 
              label="Password" 
              variant="outlined"
              value={password}
              type="password"
              onChange={({ target }) => setPassword(target.value)}
              fullWidth
              margin="normal" 
            />
            <Button 
              type="submit" 
              variant="contained"
              color="primary"
              className={classes.submit} 
              fullWidth
            >
              Login
            </Button>
          </form>
        </div>
      </Container>
    );
  };

  export default Login;