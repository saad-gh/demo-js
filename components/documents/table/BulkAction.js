import React, { useState } from "react";

import MenuItem from '@material-ui/core/MenuItem';
import Button from '@material-ui/core/Button';
import Menu from '@material-ui/core/Menu';

import handleAction, { actions } from "./bulkactions/Utils"

/**
 * Bulk action menu for selected rows
 * @param props.data - selected rows
 */
const BulkAction = (props) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return(
    <div>
      <Button aria-controls="simple-menu" aria-haspopup="true" variant="contained" color="primary" onClick={handleClick}>
        Bulk Actions
      </Button>
      <Menu
        id="simple-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        {
          actions.map((action, index) => 
          <MenuItem
            key={action.name} 
            onClick={event => {
              handleAction(event, index, props)
              setAnchorEl(null)
            }}
          >
            {action.name}
          </MenuItem> )
        }
      </Menu>
    </div>
  )
}

export default BulkAction