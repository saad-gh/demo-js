import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import ListItemText from '@material-ui/core/ListItemText';
import ListItem from '@material-ui/core/ListItem';
import List from '@material-ui/core/List';
import Divider from '@material-ui/core/Divider';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import CloseIcon from '@material-ui/icons/Close';
import Slide from '@material-ui/core/Slide';
import Image from 'react-bootstrap/Image';
import Grid from '@material-ui/core/Grid';

const useStyles = makeStyles((theme) => ({
  appBar: {
    position: 'relative',
  },
  title: {
    marginLeft: theme.spacing(2),
    flex: 1,
  },
}));

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function FullSize(props){
  const classes = useStyles();

  const handleClose = () => {
    props.setOpen(false);
  };

  return (
    <Dialog fullScreen open={props.open} onClose={handleClose} TransitionComponent={Transition}>
    <AppBar className={classes.appBar}>
        <Toolbar>
        <IconButton color="inherit" onClick={handleClose} aria-label="close">
            <CloseIcon />
        </IconButton>
        </Toolbar>
    </AppBar>
    <Grid container >
        { props.images.map(image => <Grid item xs={12}><Image src={ image } /></Grid>) }
    </Grid>
    </Dialog>
  );
}