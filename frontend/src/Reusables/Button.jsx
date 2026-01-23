import React from "react";
import {Button as MuiButton} from "@mui/material";

const Button = ({ children, ...props }) => {
  return(
    <>
      <MuiButton 
      variant = "contained"
      color = "primary"
      {...props}>
        
        {children}
        
      </MuiButton>
    </>
  );
};

export default Button;