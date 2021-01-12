import "./App.css";
import styled from "@emotion/styled";
import React, { useState, useRef, useEffect, useCallback } from "react";
import Lightbox from "./Lightbox";

const Button = styled.button`
  margin: 0;
  width: 200px;
  height: 150px;
  position: relative;
  display: inline-block;
  overflow: hidden;
  &:focus {
    outline: none;
    box-shadow: none;
  }
`;

const PhotoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  grid-gap: 1rem;
`;

const GridImage = styled.img`
  display: block;
  position: absolute;
  top: 50%;
  left: 50%;
  min-height: 100%;
  min-width: 100%;
  transform: translate(-50%, -50%);
`;

function App() {
  const [status, setStatus] = useState(false);
  const [images, setImages] = useState([]);

  const [idx, setIdx] = useState(null);

  useEffect(() => {
    function fetchImages() {
      let x = Array(50)
        .fill(true)
        .map((_, i) => ({
          id: i,
          url: `https://picsum.photos/600/400?random=${i}`,
        }));
      setImages(x);
    }
    fetchImages();
  }, [setImages]);

  useEffect(() => {
    status && (document.body.style.overflow = "hidden");
    !status && (document.body.style.overflow = "unset");
  }, [status]);

  return (
    <div className="App">
      <div>HI!</div>
      <PhotoGrid>
        {images.map((x, i) => (
          <Button
            key={i}
            onClick={() => {
              setIdx(i);
              setStatus((c) => !c);
            }}
          >
            <GridImage src={x.url} alt="logo" />
          </Button>
        ))}
      </PhotoGrid>

      {status && (
        <Lightbox
          idx={idx}
          setIdx={setIdx}
          images={images}
          setStatus={setStatus}
        />
      )}
    </div>
  );
}

export default App;
