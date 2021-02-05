import axios from "axios";

export const actions = [
{  
    name: "Approve",
    destination: "Approved"
},
{
    name: "Reject",
    destination: "Rejected"
}
];

// client workflow myan internal name
export const sClientWorkflow = "client";

export default async function handleAction (event, index, props) {
    props.setIsLoading_(true);
    const destination = actions[index].destination;

    /**
     * @param d - selected row data from material ui table
     */
    const attach = (workflows, d) => new Promise((resolve, reject) => {
        const clientWorkFlow = workflows.data.results.filter(result => result.workflow.internal_name === sClientWorkflow)[0];
        let _ = clientWorkFlow.document_workflow_url.split("/");
        d.workflowPK = _[_.length - 2];
        d.transition = clientWorkFlow.transition_choices.filter(transition => transition.origin_state.label === d.state && transition.destination_state.label === destination)[0];
        resolve(d);
    })

    let p;
    if(Array.isArray(props.data))
        Promise.all(props.data.map(
            d => axios.create(props.apiconf).get(`/documents/${d.id}/workflows/`).then(workflows => attach(workflows,d))
        )).then( async data_ => {
            const rs = await Promise.all(data_.map( 
                async d => {
                return axios.create(props.apiconf).post(   
                    `/documents/${d.id}/workflows/${d.workflowPK}/log_entries/`,
                    { transition_pk : d.transition.id }
                )
            }));
            let ids = []
            // let getId = url => url.match(/(?<=documents\/).+?(?=\/workflows)/g)[0]
            rs.map((r, i) => r.status !== 201 ? ids.push(data_[i].id) : undefined)
            if(ids.length > 0){
                props.setError(true)
                props.setErrorMessage(`Transition unsuccessful. Document(s) id(s): ${ids.join(', ')}`)
                return
            }
            
            if(props.activeState !== ''){
                props.setActiveState(data_[data_.length - 1].state)
                let remoteDataURL = props.remoteDataURL.split(" ")[0]
                props.setRemoteDataURL(remoteDataURL + ` "${data_[data_.length - 1].state}"`)
            }
         
            props.setRemoteData([])
            props.setFireQueryChange(true)

            props.setIsLoading_(false);
        });
    else
        axios.create(props.apiconf).get(`/documents/${props.data.id}/workflows/`).then(workflows => attach(workflows, props.data))
        .then(async d => {
            const r = await axios.create(props.apiconf).post(   
                `/documents/${d.id}/workflows/${d.workflowPK}/log_entries/`,
                { transition_pk : d.transition.id }
            )
            if(r.status !== 201){
                props.setError(true)
                props.setErrorMessage(`Transition unsuccessful. Document id: ${d.id}`)
                return
            }

            if(props.activeState !== ''){
                props.setActiveState(d.state)
                let remoteDataURL = props.remoteDataURL.split(" ")[0]
                props.setRemoteDataURL(remoteDataURL + ` "${d.state}"`)
            }
            
            props.setRemoteData([])
            props.setFireQueryChange(true)
            props.setIsLoading_(false);
        })
}