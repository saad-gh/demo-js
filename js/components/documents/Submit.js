import React, { useState } from 'react';

import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import { DropzoneArea } from 'material-ui-dropzone'
import axios from 'axios';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';

import DocumentTypes from './submit/DocumentTypes';

/**
 * Submit documents dialog
 * @param props.documentType - preserve document type selection in dialog
 * @param props.setDocumentType - preserve document type selection  in dialog
 */
export default function Submit(props) {
  // active document type
  const documentType = props.documentType;
  const setDocumentType = props.setDocumentType;

  const [split, setSplit] = useState(false);

  // update api config to upload files
  let apiconf = JSON.parse(JSON.stringify(props.apiconf));
  apiconf.headers['Content-Type'] = 'multipart/form-data';
  // new api instance with updated header for file upload
  const api_ = axios.create(apiconf);
  const [files, setFiles] = useState([]);

  const setOpen = props.setOpen;
  const handleClose = () => {
    setOpen(false);
  };

  const handleSubmit = async (e) => {
    console.log(documentType);
    e.preventDefault();
    if(documentType !== -1){
      await props.setDisplayCircularProgress('block');
      Promise.all(files.map((f) => {
        // need a new instance of formdata since it is passed as a reference in the post function
        let formdata = new FormData();
        formdata.set('document_type',documentType);
        if(split)
          formdata.set('description','{"split":1}');
        formdata.set('file',f);
        return api_.post(
          "/documents/",
          formdata
        );
      })).then(() => props.setDisplayCircularProgress('none'));
      setOpen(false);
    }        
  };

  return (
    <div>
      <Dialog open={props.open} onClose={handleClose} aria-labelledby="form-dialog-title" maxWidth="md" fullWidth={true} >
        {/* <DialogTitle id="form-dialog-title">Submit Document(s)</DialogTitle> */}
        <DialogContent>
          <FormControlLabel
            control={
              <Checkbox
                checked={split}
                onChange={() => split ? setSplit(false) : setSplit(true)}
                name="split"
              />
            }
            label="Split Document(s)"
          />
          <DocumentTypes 
            value={documentType}
            setValue={setDocumentType}
            documentTypes={props.documentTypesUI}
          />
          <DropzoneArea
            onChange={(files) => { setFiles(files) }}
            filesLimit={100}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleSubmit} color="primary">
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

// https://www.npmjs.com/package/material-ui-dropzone