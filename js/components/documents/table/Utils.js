let remoteData, 
    api, 
    search, 
    sortedStates, 
    activeDocumentType, 
    activeState,
    remoteNext,
    remoteDataCount,
    refresh,
    remoteDataURL,
    props,
    remoteDataBuffer,
    promisesBuffer,
    activeStateBuffer,
    columns_line_items,
    documentTypes;
    

const setProps = props => {
    remoteData = props.remoteData; 
    api = props.api;
    search = props.search;
    sortedStates = props.sortedStates;
    activeDocumentType = props.activeDocumentType;
    activeState = props.activeState;
    remoteNext = props.remoteNext;
    remoteDataCount = props.remoteDataCount;
    refresh = props.refresh;
    remoteDataURL = props.remoteDataURL;
    documentTypes = props.documentTypes;
    remoteDataBuffer =  props.remoteDataBuffer;
    promisesBuffer = props.promisesBuffer;
    activeStateBuffer = props.activeStateBuffer;
    columns_line_items = props.columns_line_items;
}

/**
 * Return table row data
 * @param doc - json response document fields
 */
const documentTableBuilder = doc => {
    let docfields = {};

    try {
        const description_logs = JSON.parse('[' + doc.description + ']');
        if (description_logs.length) {

            // iterating all logs
            description_logs.map(description_log => {
                Object.keys(description_log).map(field => {

                    // adding to docfields all except empty and state fields
                    if (description_log[field] !== "" && field !== "state") {
                        if (field == 'line_items') {

                            // transforming line items
                            docfields[field] = description_log[field].split('<br>').map(line_item => {
                                let row = {},
                                    field_values = line_item.split(',');
                                for (let i_col_li = 0; i_col_li < columns_line_items.length; i_col_li++) {
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
                if (l.state !== undefined && l.state !== "")
                    docfields.state = l.state
            })
            // const last_entry = description_logs.pop();
            // docfields.state = last_entry.state;
        }
    } catch (e) {
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

const documentTableBuilderStates = doc => {
    let docfields = documentTableBuilder(doc);

    // confirming if correct search by state
    if (docfields.state.toLowerCase() === activeStateBuffer)
        remoteDataBuffer.push(docfields);

}

const documentTableBuilderSearch = doc => remoteDataBuffer.push(documentTableBuilder(doc))

const getDocumentTableBuilder = () => {
    if (activeState !== '') {
        return documentTableBuilderStates
    } else if (search !== '') {
        return documentTableBuilderSearch
    }
}

/**
* Initialize remote data
*/
export const initRemoteData = async (remoteDataURL_, documentCountUrl, props) => {
    setProps(props)
    if (!remoteData.length) {
        const response = await api.get(remoteDataURL_);
        if (response.data.results.length > 0)
            response.data.results.map(getDocumentTableBuilder());

        const response_ = await api.get(documentCountUrl);
        const count = response_.data.count;

        let remoteNext_ = response.data.next;
        if (remoteNext_ != null) {
            remoteNext_ = getURLParams(response.data.next).page;
        }
        return [remoteNext_, count, 1]
    }

    remoteDataBuffer = remoteData;
    return [remoteNext, remoteDataCount, 0]
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
*/
export const getDisplayData = async (query, remoteNext_, remoteDataURL__) => {
    console.log('rec')
    let page = query.page;
    if (query.page > 0 && refresh) {
        page = 0;
    }

    // making sure children are rendered without delay
    if (promisesBuffer.length > 0) {
        const promisesBufferResolve = await Promise.all(promisesBuffer)
    }

    let dataToDisplay = remoteDataBuffer.slice(page * query.pageSize, query.pageSize * (1 + page));
    const diff = query.pageSize - dataToDisplay.length;

    // checking requirement for more data
    if (diff && Number(remoteNext_)) {
        const nextPage = `page=${remoteNext_}`
        let remoteDataURL_ = remoteDataURL__;

        // next page is either first parameter
        if (remoteDataURL.indexOf('?') === -1)
            remoteDataURL_ = remoteDataURL_ + '?'
        else
            remoteDataURL_ = remoteDataURL_ + '&'

        const response = await api.get(remoteDataURL_ + nextPage);
        response.data.results.map(getDocumentTableBuilder());

        // fetching more data recursively
        [dataToDisplay, page, remoteDataBuffer, activeStateBuffer, remoteNext_, remoteDataURL__] = await getDisplayData(
            query,
            response.data.next == null ? null : getURLParams(response.data.next).page,
            remoteDataURL__
        )
    } else if (search === '' && activeStateBuffer !== '' && diff && sortedStates.indexOf(activeStateBuffer) < sortedStates.length - 1) {
        activeStateBuffer = sortedStates[sortedStates.indexOf(activeStateBuffer) + 1]
        const documentType = documentTypes.filter(dt => dt.value === activeDocumentType)[0].label;
        let remoteDataURL_ = `/search/advanced/documents.Document/?description="${documentType}" "${activeStateBuffer}"`
        const response = await api.get(remoteDataURL_);
        response.data.results.map(getDocumentTableBuilder());

        // fetching more data recursively
        [dataToDisplay, page, remoteDataBuffer, activeStateBuffer, remoteNext_, remoteDataURL__] = await getDisplayData(
            query,
            response.data.next == null ? null : getURLParams(response.data.next).page,
            remoteDataURL_
        )
    }
    
    return [dataToDisplay, page, remoteDataBuffer, activeStateBuffer, remoteNext_, remoteDataURL__];
}