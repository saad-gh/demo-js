import React, { useState } from 'react';

import IconButton from '@material-ui/core/IconButton';
import SearchIcon from '@material-ui/icons/Search';
import TextField from '@material-ui/core/TextField';
import Form from 'react-bootstrap/Form'
import InputGroup from 'react-bootstrap/InputGroup'

/**
 *  
 */
export default function Search(props) {
    const [search, setSearch] = useState('');
    const handleClick = () => {
      
      if(props.activeDocumentType === -1){
        props.setErrorMessage('Before search, a document type (Bill, Claims, Company Credit Card) needs to be clicked')
        props.setError(true)
        return
      }
      const documentType = props.documentTypes.filter(dt => dt.value === props.activeDocumentType)[0].label;
      const remoteDataURL = `/search/advanced/documents.Document/?description="${documentType}" ${search}`;
      props.setRemoteDataURL_({
        url:remoteDataURL,
        search:search
      });

    }  
    const handleChange = ({target}) => setSearch(target.value)
  
    return (
      <InputGroup>
        <Form.Control onChange={handleChange} placeholder="Search" onKeyDown={event => event.key === 'Enter' ? handleClick() : undefined } />
        <InputGroup.Append>
          <InputGroup.Text onClick={handleClick}>
            <SearchIcon />
          </InputGroup.Text>          
        </InputGroup.Append>
        {/* <TextField onChange={handleChange} variant="outlined" label="Search" onKeyDown={event => event.key === 'Enter' ? handleClick() : undefined } /> */}
        {/* <IconButton onClick={handleClick} color="primary" component="span"><SearchIcon/></IconButton>     */}
      </InputGroup>
    )
}
  