import React from 'react';

import Button from '@material-ui/core/Button';
import ButtonGroup from '@material-ui/core/ButtonGroup';

// Submitted but not approved
export const defaultViewStates = [
    {
        name:'metadata',
        extract:true
    },
    {
        name:'submitted',
        extract:false
    },
    {
        name:'parentid',
        extract:false
    },
    {
        name:'rejected',
        extract:false
    },
    {
        name:'approved',
        extract:false
    },
    {
        name:'split',
        extract:false
    }
];


/**
 * Toolbar document types buttons
 */
export default function DocumentTypes(props) {
    // const classes = useStyles();
    const handleClick = ({target}) => {
        // active document type id
        let activeDocumentType, remoteDataURL_ = {};
        try {
            activeDocumentType = props.documentTypesUI.filter(documentTypeUI => documentTypeUI.label === target.innerHTML)[0].value;
        } catch(e) {
            props.setError(true)
            props.setErrorMessage('Please try again ...')
            return
        }

        const documentType = props.documentTypes.filter(dt => dt.value === activeDocumentType)[0].label;
        props.setRemoteDataURL_({
            url:`/search/advanced/documents.Document/?description="${documentType}"`,
            activeDocumentType:activeDocumentType
        })
    }

    return (
        <ButtonGroup style={{width:"100%"}} variant="contained" color="primary" aria-label="contained primary button group" >
        {props.documentTypesUI.map( 
            documentTypeUI => <Button key={documentTypeUI.value} onClick={handleClick} style={{flexGrow:1}}>{documentTypeUI.label}</Button>
        )}
        </ButtonGroup>
    )
}