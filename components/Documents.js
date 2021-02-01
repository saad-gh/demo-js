import React, { useState, useEffect } from 'react';

import axios from 'axios';

import Table from "./documents/Table";
import { sortedStates } from "./documents/Table"
import { sClientWorkflow } from "./documents/table/bulkactions/Utils"

const CONST = {
  documentTypes : ['Bill', 'Claim', 'Company Credit Card'],
  sortedStates : sortedStates,
  sClientWorkflow : sClientWorkflow
}

export default function Documents(props) {
  const api = axios.create(props.apiconf);
  const [isLoading_, setIsLoading_] = useState(true);

  // preserving submit dialog state
  const [documentTypes,setDocumentTypes] = useState([]);
  const [documentTypesUI,setDocumentTypesUI] = useState([]);
  const [inconsistent, setInconsistent] = useState(false);
  const [inconsistencyMessage, setInconsistencyMessage] = useState('');
  const [roles, setRoles] = useState({
    submitter : false,
    approver : false
  });

  useEffect(() => {
    async function _(){
      const response = await api.get('/document_types/');
      let documentTypes_ = response.data.results.map(result => {
        return {
          value : result.id,
          label : result.label
        }
      })

      // checking inconsistency
      if(documentTypes_.length !== CONST.documentTypes.length){
        setInconsistent(true)
        setInconsistencyMessage('Inconsistency found: No. of document types do not match. Please contact developer')
      }

      const documentTypesUI_ = documentTypes_.map(result => {
        return {
          value : result.value,
          label : CONST.documentTypes.filter(documentTypeUI_ => result.label.indexOf(documentTypeUI_) !== -1)[0]
        }
      })
      
      const workflows = await Promise.all(documentTypes_.map(async (dt, i) => {
        const r = await api.get(`/document_types/${dt.value}/workflows/`)
        documentTypes_[i].workflows = r.data.results

        // checking inconsistency
        documentTypes_[i].workflows.map(wf => {
          if(wf.label === CONST.sClientWorkflow){
            if(wf.states.length !== CONST.sortedStates.length){
              setInconsistent(true)
              setInconsistencyMessage('Inconsistency found: No. of states do not match. Please contact developer')
            }
          }
        })

      }))


      const response_ = await api.get('/roles/');
      let roles_ = {};
      response_.data.results.map(
        result => ['Submitter','Approver'].map(
          role => {
            if(result.label.indexOf(role) !== -1)
              roles_[role.toLowerCase()] = true
            else
              roles_[role.toLowerCase()] = false
          }
        ))
      setRoles(roles_);
      setDocumentTypes(documentTypes_);
      setDocumentTypesUI(documentTypesUI_);
    }
    
    if(documentTypes.length === 0)
      _().then(() => {
        setIsLoading_(false)
        // documentTypes.map((dt, i) => {
        //   api.get(`/document_types/${dt.value}/workflows/`).then(r => {
        //     // https://stackoverflow.com/questions/45673783/replace-array-entry-with-spread-syntax-in-one-line-of-code
        //     let documentTypes_ = [...documentTypes]
        //     documentTypes_[i].workflows = r.data.results
        //     setDocumentTypes(documentTypes_)
        //   })
        // })
      })
  
  // },[api, documentTypes, setDocumentTypes, roles]);
  },[]);

  return (
    <Table
      apiconf={props.apiconf}
      documentTypes={documentTypes}
      documentTypesUI={documentTypesUI}
      roles={roles}
      isLoading_={isLoading_}
      setIsLoading_={setIsLoading_}
      localStorageKey={props.localStorageKey}
      defaultapiconf={props.defaultapiconf}
      setState={props.setState}
      inconsistent={inconsistent}
      inconsistencyMessage={inconsistencyMessage}       
    />
  )
}