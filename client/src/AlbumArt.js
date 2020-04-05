import React from "react";
import "./App.css";

const AlbumArt = props => {
  return (
    <div className={props.classStyle}>
      <img
        name="image"
        src={props.albumArt}
        style={{ height: props.height }}
        alt={props.subtitle}
      />
      <div className="middle text">{props.subtitle}</div>
    </div>
  );
};

export default AlbumArt;
