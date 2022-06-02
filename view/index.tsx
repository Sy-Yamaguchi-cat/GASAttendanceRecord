import React from "react";
import ReactDOM from "react-dom";
import preload from "preload"

ReactDOM.render(
    <div>{JSON.stringify(preload.resource)}</div>,
    document.getElementById("root")
)
