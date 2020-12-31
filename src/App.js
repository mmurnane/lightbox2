import "./App.css";
import styled from "styled-components";
import { FixedSizeList as List } from "react-window";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useTransition, animated } from "react-spring";
import { useGesture } from "react-use-gesture";
import clamp from "lodash-es/clamp";

function useOutsideAlerter(ref, setStatus, setZoom) {
  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && event.target === ref.current) {
        setZoom(null);
        setStatus(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, setStatus]);
}

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

const Overlay = styled.div`
  height: 100vh;
  width: 100vw;
  position: fixed;
  z-index: 1;
  top: 0;
  left: 0;
  background-color: rgb(0, 0, 0);
  background-color: rgba(0, 0, 0, 0.9);
  overflow-x: hidden;
  transition: 0.5s;
`;

const LightboxImage = styled(animated.img)`
  max-width: 100%;
  max-height: 100%;
  align-self: flex-end;
`;

const LightBoxWrapper = styled.div`
  position: relative;
  margin: auto;
  height: 97vh;
  width: 98vw;
  border: 1px solid red;
`;

const ContentWrapper = styled(animated.div)`
  position: absolute;
  top: 30%; /* position the top  edge of the element at the middle of the parent */
  left: 50%; /* position the left edge of the element at the middle of the parent */
  transform: translate(-50%, -50%);
  border: 1px solid purple;
  width: 80%;
  height: 60%;
  display: flex;
  text-align: center;
  justify-content: center; /* align horizontal */
`;

const ScrollWrapper = styled.div`
  position: absolute;
  top: 70%; /* position the top  edge of the element at the middle of the parent */
  left: 50%; /* position the left edge of the element at the middle of the parent */
  transform: translate(-50%, -50%);
  border: 1px solid purple;
`;

const PhotoScroll = styled(List)`
  border: 1px solid #d9dddd;
`;

const Column = ({ index, style, data }) => {
  return (
    <button onClick={() => data.setIdx(index)}>
      <img style={style} src={data.images[index].url} />;
    </button>
  );
};

const Example = ({ images, idx, photoRef, setIdx }) => {
  useEffect(() => {
    idx && photoRef.current.scrollToItem(idx, "center");
  }, [idx, photoRef]);

  return (
    <PhotoScroll
      height={75}
      itemCount={50}
      itemSize={100}
      itemData={{ images, selectedIndex: idx, setIdx }}
      layout="horizontal"
      width={0.6 * document.documentElement.clientWidth}
      ref={photoRef}
    >
      {Column}
    </PhotoScroll>
  );
};

function App() {
  const [status, setStatus] = useState(false);
  const [images, setImages] = useState([]);
  const [zoom, setZoom] = useState(null);
  const [imageMove, setImageMove] = useState({ x: 0, y: 0 });
  const [idx, setIdx] = useState(null);
  const photoLocateRef = useRef();
  const wrapperRef = useRef(null);
  const moveRef = useRef(true);
  useOutsideAlerter(wrapperRef, setStatus, setZoom);

  useEffect(() => {
    let browserZoomLevel = Math.round(window.devicePixelRatio * 100);
    console.log(browserZoomLevel);
  });

  useEffect(() => {
    function fetchImages() {
      let x = Array(50)
        .fill(true)
        .map((_, i) => ({
          id: i,
          url: `https://picsum.photos/500/500?random=${i}`,
        }));
      setImages(x);
    }
    fetchImages();
  }, [setImages]);

  useEffect(() => {
    status && (document.body.style.overflow = "hidden");
    !status && (document.body.style.overflow = "unset");
  }, [status]);

  const onClick = useCallback(() => setIdx((indexNo) => indexNo + 1), []);
  const onClickLeft = useCallback(() => setIdx((indexNo) => indexNo - 1), []);

  const bind = useGesture({
    onDrag: ({
      active,
      movement: [mx],
      direction: [xDir],
      distance,
      offset: [dx, dy],
      cancel,
    }) => {
      if (
        active &&
        distance > 0 &&
        moveRef.current &&
        Math.round(window.devicePixelRatio * 100) <= zoom
      ) {
        moveRef.current = false;
        cancel(
          setIdx((c) => {
            return clamp(c + (xDir > 0 ? -1 : 1), 0, images.length - 1);
          })
        );
      }
      if (active && Math.round(window.devicePixelRatio * 100) > zoom) {
        setImageMove({ x: dx, y: dy });
      }
      if (!active) {
        moveRef.current = true;
      }
      return;
    },
    onWheel: ({ wheeling, direction: [xdir, ydir] }) =>
      wheeling &&
      Math.round(window.devicePixelRatio * 100) <= zoom &&
      setIdx((c) => {
        return clamp(c + ydir, 0, images.length - 1);
      }),
    onPinch: (x) => console.log(x),
  });

  const bind2 = useGesture({
    onDrag: ({
      active,
      movement: [mx],
      direction: [xDir],
      distance,
      offset: [dx, dy],
      cancel,
    }) => {
      setImageMove({ x: dx, y: dy });
    },
  });

  const transitions = useTransition(
    images[idx],
    (item) => {
      return item && item.id;
    },
    {
      from: { opacity: 0 },
      enter: { opacity: 1 },
      leave: { opacity: 0 },
    }
  );

  return (
    <div className="App">
      <PhotoGrid>
        {images.map((x, i) => (
          <Button
            key={i}
            onClick={() => {
              setZoom(Math.round(window.devicePixelRatio * 100));
              setIdx(i);
              setStatus((c) => !c);
            }}
          >
            <GridImage src={x.url} alt="logo" />
          </Button>
        ))}
      </PhotoGrid>

      {status && (
        <Overlay>
          <LightBoxWrapper
            style={{ left: imageMove.x, top: imageMove.y }}
            ref={wrapperRef}
          >
            {transitions.map(({ item, props, key }) => {
              return (
                item && (
                  <ContentWrapper {...bind()} key={key}>
                    <LightboxImage
                      onClick={onClick}
                      key={key}
                      style={props}
                      src={item.url}
                      alt="logo"
                    />
                  </ContentWrapper>
                )
              );
            })}

            <ScrollWrapper>
              <Example
                photoRef={photoLocateRef}
                setIdx={setIdx}
                images={images}
                idx={idx}
              />
            </ScrollWrapper>
          </LightBoxWrapper>
        </Overlay>
      )}
    </div>
  );
}

export default App;
