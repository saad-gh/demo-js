import React, { useState, useEffect } from "react";
import MaterialTable, { MTableBody } from 'material-table';
import axios from "axios";

import BulkAction from "./table/BulkAction";
import { sClientWorkflow } from "./table/bulkactions/Utils";
import Track from "./table/Track"
import Toolbar from "./table/Toolbar"

const sorting = 'state'
const URLs = {
  documentType : activeDocumentType => `/document_types/${activeDocumentType}/documents/`
}
export const sortedStates = ['metadata','submitted','split','parentid','rejected','approved','children']

/**
 * Documents table using https://material-table.com/#/
 */
export default function Table(props) {
    const api = axios.create(props.apiconf);
    const tableRef = React.createRef();
    let columns = [
      { title: 'Name', field: 'documentname' },
      { title: 'Supplier', field: 'supplier' },
      { title: 'Invoice No.', field: 'invoice_no' },
      { title: 'Total', field: 'total' },
      { title: 'Currency', field: 'currency' },
      { title: 'Date', field: 'date' },
      { title: 'Due Date', field: 'due_date' },
      { title: 'Status', field: 'state' },
    ];

    const columns_line_items = [
      { title: 'Item', field: 'item' },
      { title: 'Description', field: 'description' },
      { title: 'Quantity', field: 'quantity' },
      { title: 'Unit Price', field: 'unit_price' },
      { title: 'Discount', field: 'discount' },
      { title: 'Account', field: 'account' },
      { title: 'Tax Rate', field: 'tax_rate' },
      { title: 'Tax Amount', field: 'tax_amount' },
      { title: 'Amount', field: 'amount' }
    ]
    
    const isLoading_ = props.isLoading_;
    const setIsLoading_ = props.setIsLoading_;
    const [remoteDataCount, setRemoteDataCount] = useState(0);
    const [remoteNext, setRemoteNext] = useState(null);
    const [remoteData, setRemoteData] = useState([]);
    const [remoteDataURL, setRemoteDataURL] = useState('');
    const [remoteDataURL_, setRemoteDataURL_] = useState({ url:'' }); // accepts parameters besides url, used to make ideally a single parent state change from children 
    const [activeState, setActiveState] = useState('')
    const [search, setSearch] = useState('')
    const [remoteDataPageCount, setRemoteDataPageCount] = useState(0);
    const [activeDocumentType, setActiveDocumentType] = useState(-1);
    const [extractAllByStates, setExtractAllByStates] = useState([]);
    const [changeDocumentType, setChangeDocumentType] = useState(false);
    const [pageSize, setPageSize] = useState(10);
    const [tableBodyKey, setTableBodyKey] = useState(0);
    const [refresh, setRefresh] = useState(false);
    const [fireQueryChange, setFireQueryChange] = useState(false);
    const [errorMessage, setErrorMessage] = useState(props.inconsistencyMessage);
    const [error, setError] = useState(props.inconsistent);
    const [error_, setError_] = useState({});

    columns[0].render = rowData => <Track 
      data={rowData} 
      columns_line_items={columns_line_items} 
      columns_metadata={columns} 
      apiconf={props.apiconf}
      setRemoteData={setRemoteData}
      setFireQueryChange={setFireQueryChange}
      setIsLoading_={setIsLoading_}
      roles={props.roles}
      setError={setError}
      setErrorMessage={setErrorMessage}
      setActiveState={setActiveState}
      setRemoteDataURL={setRemoteDataURL} 
      activeState={activeState}
      remoteDataURL={remoteDataURL}
    />

    let remoteDataBuffer = [];
    let promisesBuffer = [];
    let activeStateBuffer = '';    

    useEffect(() => {
      if(fireQueryChange)
        tableRef.current && tableRef.current.onQueryChange();
      setFireQueryChange(false);
    }, [fireQueryChange]);


    const refreshData = () => tableRef.current && tableRef.current.onQueryChange()

    useEffect(() => {
      if(remoteDataURL_.url !== ''){
        setIsLoading_(true)

        // initialize 
        setRemoteData([])
        let refresh = false,
        rdu = '', // local remoteDataURL
        rdcu = '' // local remoteDataCountURL

        if(remoteDataURL_.activeDocumentType !== undefined && Number(remoteDataURL_.activeDocumentType)){  // document type selected 
          setActiveDocumentType(remoteDataURL_.activeDocumentType)

          // clear other search types
          setSearch('')

          // clear previous errors
          if(error)
            setError(false)

          // set remote data url
          rdu = `${remoteDataURL_.url} "${sortedStates[0]}"`

          // setRefresh to move to page 1
          refresh = activeDocumentType != remoteDataURL_.activeDocumentType
          
          // set sorting
          if(sorting === 'state'){
            setActiveState(sortedStates[0])

            // documents count url
            rdcu = URLs.documentType(remoteDataURL_.activeDocumentType)
          }
        } else if(remoteDataURL_.search !== undefined && remoteDataURL_.search !== ''){ // search
          setSearch(remoteDataURL_.search)

          // clear other search types
          setActiveState('')
          
          // set remote data url
          rdu = remoteDataURL_.url
          
          // setRefresh to move to page 1
          refresh = remoteDataURL != remoteDataURL_.url

          // documents count url
          rdcu = remoteDataURL_.url
        }

        if(refresh)
          setRefresh(refresh)
        setRemoteDataURL(rdu)

        Promise.all([
          api.get(rdcu).then(r => setRemoteDataCount(r.data.count))
        ])
        .then(() => {
          setFireQueryChange(true)
          setIsLoading_(false)
        })        
      }
    },[remoteDataURL_])

    const getRemoteChildren = async (parentId, cursor) => {
      const response = await api.get(`/search/advanced/documents.Document/?description=parentId${parentId}`)
      // documentTableBuilder will not add the result to remoteDataBuffer because of parentId
      if(response.data.count > 0)
        remoteDataBuffer.splice(cursor, 0, ...response.data.results.map(documentTableBuilder))
      return remoteDataBuffer
    }

    const sJSONFix = sJSON => {
      return sJSON.split(',').filter(i => i.trim() !== '').join(',')
    }

    /**
     * Return table row data
     * @param doc - json response document fields
     */
    const documentTableBuilder = doc => {
      let docfields = {};
      
      try{
        const description_logs = JSON.parse(`[${sJSONFix(doc.description)}]`);
        if(description_logs.length){

          // iterating all logs
          description_logs.map(description_log => {
            Object.keys(description_log).map(field => {

              // adding to docfields all except empty and state fields
              if(description_log[field] !== "" && field !== "state"){
                if(field == 'line_items'){

                  // transforming line items
                  docfields[field] = description_log[field].split('<br>').map(line_item => {
                    let row = {},
                      field_values = line_item.split(',');
                    for(let i_col_li = 0; i_col_li < columns_line_items.length; i_col_li++){
                      row[columns_line_items[i_col_li].field] = field_values[i_col_li]
                    }
                    return row
                  })
                } else {
                  docfields[field] = description_log[field]
                }
              }
            })
          })
          description_logs.map(l => {
            if(l.state !== undefined && l.state !== "")
              docfields.state = l.state
          })
          // const last_entry = description_logs.pop();
          // docfields.state = last_entry.state;
        }
      } catch(e) {        
        docfields.state = doc.description;
        console.log(e);
      }

      // docfields pushed to remoteDataBuffer will also be updated because they are passed as reference
      docfields.id = doc.id;
      docfields.documentname = docfields.display_name || doc.label;
      docfields.label = doc.label;
      docfields.documenttype = doc.document_type.id;
      docfields.pages_url = doc.latest_version.pages_url;
      docfields.raw_description = doc.description;
      return docfields;
    }

    const documentTableBuilderTypes = doc => {
      let docfields = documentTableBuilder(doc);
    
      // Any children will be disregarded in remoteDataBuffer
      if(docfields.parentId) {
        
      } else
        remoteDataBuffer.push(docfields);            

      // Children requested explicitly and pushed right after parent
      if(docfields.state == 'Split')
        promisesBuffer.push(getRemoteChildren(doc.id, remoteDataBuffer.length))
      
    }

    const documentTableBuilderStates = doc => {
      let docfields = documentTableBuilder(doc);
    
      // confirming if correct search by state
      if(docfields.state.toLowerCase() === activeStateBuffer)
        remoteDataBuffer.push(docfields);            
      
    }

    const documentTableBuilderSearch = doc => remoteDataBuffer.push(documentTableBuilder(doc))

    const getDocumentTableBuilder = () => {
      if(activeState !== '') {
        return documentTableBuilderStates
      } else if(search !== ''){
        return documentTableBuilderSearch
      }
    }

    /**
    * Initialize remote data
    */
    const initRemoteData = async remoteDataURL_ => {
      if(!remoteData.length){    
        const response = await api.get(remoteDataURL_);
        if(response.data.results.length > 0)
          response.data.results.map(getDocumentTableBuilder());

        let remoteNext_ = response.data.next;
        if(remoteNext_ != null){
          remoteNext_ = getURLParams(response.data.next).page;
          setRemoteDataPageCount(response.data.results.length);
        }
        return [remoteNext_, 1]
      }

      remoteDataBuffer = remoteData;
      return [remoteNext, 0]
    }

    const getURLParams = url => {
      let params = {}
      url.split('?')[1].split('&').map(
        p => {
          const [key, value] = p.split('=');
          params[key] = value;
        }
      );
      return params;
    }

    /**
    * Works out table display data
    * @param previousLength - 
    */
    const getDisplayData = async (query, remoteNext_, remoteDataURL__) => {
      console.log('rec')
      let page = query.page;
      if(query.page > 0 && refresh){
        page = 0;
      }

      // making sure children are rendered without delay
      if(promisesBuffer.length > 0){
        const promisesBufferResolve = await Promise.all(promisesBuffer)
      } 

      let dataToDisplay = remoteDataBuffer.slice(page * query.pageSize, query.pageSize * (1 + page));
      const diff = query.pageSize - dataToDisplay.length;

      // checking requirement for more data
      if(diff && Number(remoteNext_)){
        const nextPage = `page=${remoteNext_}`
        let remoteDataURL_ = remoteDataURL__;

        // next page is either first parameter
        if(remoteDataURL.indexOf('?') === -1)
          remoteDataURL_ = remoteDataURL_ + '?'
        else
          remoteDataURL_ = remoteDataURL_ + '&'

        const response = await api.get(remoteDataURL_ + nextPage);
        response.data.results.map(getDocumentTableBuilder());

        // fetching more data recursively
        [dataToDisplay, page] = await getDisplayData(
          query, 
          response.data.next == null ? null : getURLParams(response.data.next).page,
          remoteDataURL__
        )
      } else if(search === '' && activeStateBuffer !== '' && diff && sortedStates.indexOf(activeStateBuffer) < sortedStates.length - 1){  
        activeStateBuffer = sortedStates[sortedStates.indexOf(activeStateBuffer) + 1]             
        const documentType = props.documentTypes.filter(dt => dt.value === activeDocumentType)[0].label;
        let remoteDataURL_ = `/search/advanced/documents.Document/?description="${documentType}" "${activeStateBuffer}"`
        const response = await api.get(remoteDataURL_);
        response.data.results.map(getDocumentTableBuilder());

        // fetching more data recursively
        [dataToDisplay, page] = await getDisplayData(
          query, 
          response.data.next == null ? null : getURLParams(response.data.next).page,
          remoteDataURL_
        )
      } else {
        // remoteDataBuffer.reverse()
        setRemoteData(remoteDataBuffer)
        setRemoteNext(remoteNext_)
        setActiveState(activeStateBuffer)
        setRemoteDataURL(remoteDataURL__)
      }

      return [dataToDisplay, page];
    }
    
    /**
     * Driver function display data
     */
    const getMTableData = activeDocumentType !== -1 ?
      query => 
        new Promise(async (resolve,reject) => {
          if(activeState === '' && search === ''){
            resolve({
              data : [],
              page : 0,
              count : 0
            })
            return
          }
            
          setPageSize(query.pageSize)
          setTableBodyKey(query.page)
             
          activeStateBuffer = activeState    
          const [remoteNext_, initData] = await initRemoteData(remoteDataURL);
          const [dataToDisplay, page] = await getDisplayData(query, remoteNext_, remoteDataURL, activeStateBuffer);

          if(refresh)
            setRefresh(false)

          resolve({
            // data : remoteDataBuffer.slice(dataToDisplay[0],dataToDisplay[1]),
            data : dataToDisplay,
            page : page,
            totalCount : remoteDataCount
          })
        })
      : []

    return (
      <MaterialTable
        title=""

        columns={columns}

        tableRef={tableRef}

        data={getMTableData}

        isLoading={tableRef.current && tableRef.current.isLoading || isLoading_}

        options={{
          selection: props.roles.approver,
          selectionProps: rowData => ({ disabled: rowData.state !== 'Metadata' }),
          search: false,
          pageSize: pageSize,
          pageSizeOptions: [10, 50]
        }}

        // action component is overridden. see components property for implementation
        actions={(() => props.roles.approver ? [{}] : [])()}

        components={{
          Action: props_ => (
            <BulkAction
              data={props_.data}
              apiconf={props.apiconf}
              setRemoteData={setRemoteData}
              setFireQueryChange={setFireQueryChange}
              setIsLoading_={setIsLoading_}
              setError={setError}
              setErrorMessage={setErrorMessage}
              setActiveState={setActiveState}
              setRemoteDataURL={setRemoteDataURL}
              activeState={activeState}
              remoteDataURL={remoteDataURL}
            />
          ),
          Toolbar: props_ => {
            return (
              <Toolbar
                error={error}
                setError={setError}
                errorMessage={errorMessage}
                setExtractAllByStates={setExtractAllByStates}
                setChangeDocumentType={setChangeDocumentType}
                setActiveDocumentType={setActiveDocumentType}
                activeDocumentType={activeDocumentType}
                setRefresh={setRefresh}
                setRemoteData={setRemoteData}
                setRemoteDataURL={setRemoteDataURL}
                setRemoteDataURL_={setRemoteDataURL_}
                setFireQueryChange={setFireQueryChange}
                activeState={activeState}
                setActiveState={setActiveState}
                sortedStates={sortedStates}
                setSearch={setSearch}
                remoteDataURL={remoteDataURL}
                setErrorMessage={setErrorMessage}
                search={search}
                setSearch={setSearch}
                setActiveState={setActiveState}
                setIsLoading_={setIsLoading_}
                props_={props_}
                {...props}
              />
          )},
          Body : props_ => <MTableBody key={tableBodyKey} {...props_} />
        }}

      />
    )
  }