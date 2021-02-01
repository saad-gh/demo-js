import React, { useState, useEffect, createRef } from 'react';

import ButtonGroup from '@material-ui/core/ButtonGroup'
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField'
import Popover from '@material-ui/core/Popover';
import Image from 'react-bootstrap/Image'
import Alert from 'react-bootstrap/Alert'
import Spinner from 'react-bootstrap/Spinner'

import axios from 'axios';
import DenseTable from './trackinginfo/DenseTable';
import handleAction, { actions } from './trackinginfo/Utils';

/**
 * Submit documents dialog
 * @param props.documentType - preserve document type selection in dialog
 * @param props.setDocumentType - preserve document type selection  in dialog
 */
export default function TrackingInfo(props) {
    const api = axios.create(props.apiconf);
    const pages_url = props.data.pages_url;
    const [images, setImages] = useState([]);
    const [comment, setComment] = useState("");
    const [metadata, setMetadata] = useState({});
    const [openFullSize, setOpenFullSize] = useState(true);
    const [cursor, setCursor] = useState('zoom-in');
    const [fullSize, setFullSize] = useState(false);
    const [toggleParent, setToggleParent] = useState([])
    const gridComponentMetadata = createRef();

    // extending tracking by label field
    const columns_metadata = (() => {
        let _ = JSON.parse(JSON.stringify(props.columns_metadata))
        _.splice(1, 0, { title: 'Label', field: 'label' })
        return _
    })()
    const columns_line_items = props.columns_line_items;
    const open = props.open;
    const documentType = props.documentType;
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('Backend maynot have processed the images yet');
    const [showSpinner, setShowSpinner] = useState(false);

    const handleOk = () => {
        props.setOpen(false)
        setCursor('zoom-in')
        setFullSize(false)
    };

    const handleComment = event => {
        setComment(event.target.value)
    }

    const handleClickImage = () => {
        if (fullSize) {
            setFullSize(false)
            setCursor('zoom-in')
        } else {
            setFullSize(true)
            setCursor('zoom-out')
        }
    }

    const showImages = async response => {
        let responses_image = [];
        try {
            responses_image = await Promise.all(response.data.results.map(result => api.get(result.image_url, { responseType: 'blob' })));
        } catch (e) {
            showAlert(true);
            setAlertMessage('Backend maynot have processed the images yet')
            setShowSpinner(false);
            return;
        }
        let dataURLs = [];
        responses_image.map(response_image => {
            const urlCreator = window.URL || window.webkitURL;
            dataURLs.push(urlCreator.createObjectURL(response_image.data));
        });
        setImages(dataURLs);
        setShowSpinner(false);
    }

    const handleToggleParent = () => {
        if (toggleParent.length > 0) {
            const _ = toggleParent
            setToggleParent(images)
            setImages(_)
        } else {
            setShowSpinner(true)
            setToggleParent(images)
            const docId = props.data.parentId.split('parentId')[1]
            api.get(`/documents/${docId}`)
                .then(response => {
                    api.get(response.data.latest_version.pages_url)
                        .then(showImages)
                })
        }
    }

    useEffect(() => {
        let metadata_ = {};
        columns_metadata.map(column_metadata => {
            if (props.data[column_metadata.field] !== undefined)
                metadata_[column_metadata.field] = props.data[column_metadata.field]
            else
                metadata_[column_metadata.field] = ""
        })
        setMetadata(metadata_);

        if (open) {
            if(images.length === 0)                
                setShowSpinner(true);
                api
                    .get(pages_url)
                    .then(showImages)
        }
    }, [open])

    return (
        <Dialog key={props.data.id} open={open} onClose={handleOk} aria-labelledby="form-dialog-title" maxWidth="xl" fullWidth={true} >
            <DialogContent>
                <Alert show={showAlert} variant="info" dismissible onClose={() => setShowAlert(false)} >{alertMessage}</Alert>
                <Grid container spacing={2}>
                    <Grid container item xs={fullSize ? 12 : 6} style={fullSize ? { alignItems: 'center', justifyContent: 'center' } : { alignItems: 'start', justifyContent: 'start' }}>
                        <Spinner animation="border" style={{ display: showSpinner ? '' : 'none' }} />
                        {images.map(image => <Image src={image} onClick={handleClickImage} style={{ cursor: cursor, maxWidth: '100%', height: 'auto' }} />)}
                    </Grid>
                    <Grid container item xs={6} style={{ display: fullSize ? 'none' : '' }} ref={gridComponentMetadata}>
                        {/* <Grid container> */}
                        <Grid item xs={12}>
                            <DenseTable data={[metadata]} columns={columns_metadata} />
                        </Grid>
                        {(() => {
                            if (props.data.line_items !== undefined)
                                return (
                                    <Grid item xs={12}>
                                        <DenseTable data={props.data.line_items} columns={columns_line_items} />
                                    </Grid>
                                )
                        })()}
                        {(() => {
                            if (props.data.parentId !== undefined)
                                return (
                                    <Grid item xs={12} style={{ alignSelf: 'flex-end' }} >
                                        <Button color='primary' variant='contained' onClick={handleToggleParent}>Toggle Parent</Button>
                                    </Grid>
                                )
                        })()}
                        {/* </Grid> */}
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            multiline
                            variant="outlined"
                            label="Comment"
                            onChange={handleComment}
                            value={comment}
                        />
                    </Grid>
                    <Grid item container style={{ justifyContent: 'flex-end' }} xs={12}>
                        <ButtonGroup color="primary" variant="contained" disabled={props.roles.submitter}>
                            {actions.map((a, i) => {
                                if (props.data.state.toLowerCase() !== 'metadata' && i < 2)
                                    return
                                return (
                                    <Button
                                        key={a.name}
                                        onClick={event => {
                                            if (i === 2) {
                                                if (comment === "")
                                                    return
                                                props.data.comment = comment;
                                                props.data.date_commented = new Date().toLocaleString();
                                            }
                                            setShowSpinner(true)
                                            handleAction(event, i, props).then(() => {
                                                setShowSpinner(false)
                                                if (i === 2)
                                                    setComment('')
                                                // close dialog on actions other then comment
                                                if (i < 2)
                                                    props.setOpen(false)
                                            })
                                        }}
                                    >{a.name}</Button>
                                )
                            })}
                        </ButtonGroup>
                    </Grid>
                </Grid>

            </DialogContent>
            {/* <DialogActions>
          <Button onClick={handleOk} color="primary">
            Ok
          </Button>
        </DialogActions> */}
        </Dialog>
    );
}

// https://www.npmjs.com/package/material-ui-dropzone