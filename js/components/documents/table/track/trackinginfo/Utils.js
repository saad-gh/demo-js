import axios from 'axios'
import handleAction_, { actions as actions_ } from '../../bulkactions/Utils'

// extending bulk actions
export const actions = (()=>{
    let _ = JSON.parse(JSON.stringify(actions_));
    _.push({
        name: 'Comment'
    })
    return _
})()

export default async function handleAction(event, index, props){
    // index < 2 are actions same as bulk action
    if(index < 2){
        await handleAction_(event, index, props)
    } else {
        await axios.create(props.apiconf)
        .put(`/documents/${props.data.id}/`,
        { description : `${props.data.raw_description},{"comment":"${props.data.comment}","comment_added":"${props.data.date_commented}"}` })
    }        
}