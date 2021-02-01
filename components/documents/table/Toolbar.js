import React from 'react';

import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import Alert from 'react-bootstrap/Alert';

import { MTableToolbar } from "material-table"

import { sortedStates } from "../Table"
import Submit from "./toolbar/Submit"
import Search from "./toolbar/Search"
import DocumentTypes from "./toolbar/DocumentTypes"

const useStyles_controls = makeStyles((theme) => ({
    container: {
      padding: theme.spacing(1)
    },
    paper: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    },
    paper: {
      display: 'flex',
      justifyContent: 'space-between',
      margin: theme.spacing(1)
    }
  }));

  export default function Toolbar(props){
    const classes_controls = useStyles_controls();
    const handleLogout = () => {
        props.setState({
            user : {},
            apiconf : props.defaultapiconf
          }
        )
        localStorage.removeItem(props.localStorageKey);
      }
    return (
        <>
        <Alert variant="danger" show={props.error} dismissible onClose={() => props.setError(false)} >{ props.errorMessage }</Alert>
        <div className={ classes_controls.container }>
              <Grid container spacing={1}> 
                <Grid item sm={4}>
                  <DocumentTypes
                    {...props}               
                  />
                </Grid>
                <Grid item sm={3}>
                  <Search
                    {...props}
                  />
                </Grid>
                <Grid item container style={{justifyContent:"flex-end"}} xs={5}>
                  <Button 
                    variant="contained" color="primary"
                    onClick={handleLogout}
                  >
                      Logout
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  {
                    (() => {
                    if(props.roles.submitter)
                      return (
                          <Submit
                            apiconf={props.apiconf}                           
                            documentTypesUI={props.documentTypesUI}
                            setIsLoading_={props.setIsLoading_}
                          />
                        )
                    else if(props.roles.approver)
                      return <MTableToolbar {...props.props_} />
                    })()
                  }
                </Grid>                     
              </Grid>                  
        </div>
      </>
    )
  }