import React, { useState } from 'react';

import Button from '@material-ui/core/Button';

import TrackingInfo from './track/TrackingInfo'

export default function Track(props){
    const [open, setOpen] = useState(false);
    const handleClickOpen = () => {
        setOpen(true)
    }

    return (
        <>
            <Button variant="outlined" color="primary" fullWidth onClick={handleClickOpen}>
                { props.data.documentname }
            </Button>
            <TrackingInfo 
                open={open}
                setOpen={setOpen}
                {...props}
            />
        </>
    )
}