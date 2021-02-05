import React from 'react';

import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import RadioGroup from '@material-ui/core/RadioGroup';
import Radio from '@material-ui/core/Radio';

/**
 * Submit documents dialog document types radio buttons
 * @param props.setValue - preserve document selection  
 */
export default function DocumentTypes(props) {
    const documentTypes = props.documentTypes;
  
    // set initial selected document type value
    const setValue = props.setValue;
    const handleChange = (event) => {
      setValue(parseInt(event.target.value));
    };
  
    return (
      // <FormControl component="fieldset">
        <RadioGroup row name="documentTypes" value={props.value} onChange={handleChange}>
          {documentTypes.map((docType,key) => {
            return (
              <FormControlLabel 
                value={docType.value} 
                label={docType.label} 
                key={key} 
                control={<Radio />} 
              />
            )
          })}
        </RadioGroup>
      // {/* </FormControl> */}
    );
  }