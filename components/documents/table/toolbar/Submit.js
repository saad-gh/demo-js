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
  const [documentType, setDocumentType] = useState(-1);
  const [split, setSplit] = useState(false);

  // update api config to upload files
  let apiconf = JSON.parse(JSON.stringify(props.apiconf));
  apiconf.headers['Content-Type'] = 'multipart/form-data';
  // new api instance with updated header for file upload
  const api_ = axios.create(apiconf);
  const [files, setFiles] = useState([]);

  const [open, setOpen] = useState(false);
  const handleClose = () => {
    setOpen(false);
  };
  const handleClick = () => {
    setOpen(true);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(documentType !== -1){
      props.setIsLoading_(true);
      const now = new Date()

      // workaround for sorting since documents are sorted by label name in myan
      const format = s => s.length === 1 ? `0${s}` : s
      const month = format((now.getMonth() + 1).toString()) 
      const date = format(now.getDate().toString())
      const hour = format(now.getHours().toString())
      const minutes = format(now.getMinutes().toString())
      const seconds = format(now.getSeconds().toString())

      // const label =20510101000000 - Number([
      //   now.getFullYear().toString(),
      //   month,
      //   date,
      //   hour,
      //   minutes,
      //   seconds
      // ].join(""))

      const label = Number([
        now.getFullYear().toString(),
        month,
        date,
        hour,
        minutes,
        seconds
      ].join(""))
      
      Promise.all(files.map((f) => {
        // need a new instance of formdata since it is passed as a reference in the post function
        let formdata = new FormData();
        formdata.set('document_type',documentType);
        formdata.set('label',label);
        formdata.set('description',`{"split":${split ? 1 : 0},"display_name":"${f.name}"}`);
        formdata.set('file',f);
        return api_.post(
          "/documents/",
          formdata
        );
      })).then(() => props.setIsLoading_(false));
      setOpen(false);
    }        
  };

  return (
    <div>
      <Button 
        variant="contained" 
        color="primary"
        onClick={handleClick}
      >
          Submit Documents
      </Button>
      <Dialog open={open} onClose={handleClose} aria-labelledby="form-dialog-title" maxWidth="md" fullWidth={true} >
        {/* <DialogTitle id="form-dialog-title">Submit Document(s)</DialogTitle> */}
        <DialogContent>
          <div>
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
          </div>
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