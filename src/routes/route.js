import React, { useEffect } from 'react'
import { Navigate } from 'react-router-dom'

const Authmiddleware = props => {

  return <React.Fragment>{props.children}</React.Fragment>
}

export default Authmiddleware
