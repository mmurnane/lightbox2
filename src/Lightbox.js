import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useReducer,
} from "react";
import styled from "@emotion/styled";
import { FixedSizeList as List } from "react-window";
import { useTransition, animated, useSpring } from "react-spring";
import { useGesture } from "react-use-gesture";
import clamp from "lodash-es/clamp";

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

const XItem = styled.div`
  top: 15px;
  right: 20px;
  cursor: pointer;
  position: absolute;
  width: 18px;
  height: auto;
  color: white;
  font-size: 24px;
`;

const LightboxImage = styled(animated.img)`
  align-self: flex-end;
  max-width: 100%;
  max-height: 100%;
`;

const LightBoxWrapper = styled.div`
  position: relative;
  margin: auto;
  height: 97vh;
  width: 98vw;
`;

const ContentWrapper = styled(animated.div)`
  position: absolute;
  top: 35%; /* position the top  edge of the element at the middle of the parent */
  left: 50%; /* position the left edge of the element at the middle of the parent */
  transform: translate(-50%, -50%);
  width: 80%;
  height: 60%;
  display: flex;
  text-align: center;
  justify-content: center; /* align horizontal */
`;

const ScrollWrapper = styled.div`
  position: absolute;
  top: 80%; /* position the top  edge of the element at the middle of the parent */
  left: 50%; /* position the left edge of the element at the middle of the parent */
  transform: translate(-50%, -50%);
`;

const PhotoScroll = styled(List)`
  border: 1px solid #d9dddd;
`;

function useOutsideAlerter(ref, setStatus, setZoom) {
  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && event.target === ref.current) {
        setZoom(1);
        setStatus(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, setStatus, setZoom]);
}

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

function reducer(state, action) {
  switch (action.type) {
    case "zoom":
      return { ...state, scale: action.scale };
    case "pan":
      return { ...state, x: action.x, y: action.y };
    case "reset":
      return { x: 0, y: 0, scale: 1 };
    default:
      throw new Error();
  }
}

function Lightbox(props) {
  const { idx, setIdx, images, setStatus } = props;
  const [zoom, setZoom] = useState(1);
  const [zoomState, dispatch] = useReducer(reducer, { x: 0, y: 0, scale: 1 });
  const photoLocateRef = useRef();
  const wrapperRef = useRef();
  const lightboxZoomRef = useRef();

  const handleUserKeyPress = useCallback((event) => {
    const { key, keyCode } = event;

    if (keyCode === 37) {
      setIdx((c) => {
        return clamp(c - 1, 0, images.length - 1);
      });
    }
    if (keyCode === 39) {
      setIdx((c) => {
        return clamp(c + 1, 0, images.length - 1);
      });
    }
    if (keyCode === 27) {
      setStatus(false);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleUserKeyPress);

    return () => {
      window.removeEventListener("keydown", handleUserKeyPress);
    };
  }, [handleUserKeyPress]);
  useOutsideAlerter(wrapperRef, setStatus, setZoom);
  const onClick = useCallback(() => setIdx((indexNo) => indexNo + 1), []);

  useGesture(
    {
      onDrag: ({
        active,
        direction: [xDir, yDir],
        distance,
        offset: [x, y],
        event,
        cancel,
      }) => {
        if (active && distance > 0 && zoomState.scale === 1) {
          console.log("Y DIR:", yDir);
          cancel(
            setIdx((c) => {
              return (
                Math.abs(yDir) < 0.5 &&
                clamp(c + (xDir > 0 ? -1 : 1), 0, images.length - 1)
              );
            })
          );
        }
        if (active && zoomState.scale > 1) {
          event.preventDefault();
          console.log("GETTING HERE: ", x, y);
          dispatch({ type: "pan", x, y });
        }
        return;
      },
      onPinch: ({ event, offset: [d] }) => {
        console.log("Pinch Detected");
        event.preventDefault();
        let zoomCalc = Math.max(1 + d / 100, 1);
        zoomCalc === 1 && dispatch({ type: "reset" });
        zoomCalc !== 1 && dispatch({ type: "zoom", scale: zoomCalc });
        return;
      },
    },
    {
      domTarget: lightboxZoomRef,
      eventOptions: { passive: false },
      drag: {
        ...(zoomState.scale === 1 && {
          axis: "x",
          bounds: { left: -100, right: 100, top: -50, bottom: 50 },
        }),
      },
    }
  );

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
    <Overlay
      ref={lightboxZoomRef}
      tabIndex={-1}
      onKeyDown={(e) => handleUserKeyPress(e)}
    >
      <XItem
        onClick={() => {
          setStatus(false);
        }}
      >
        X
      </XItem>
      <LightBoxWrapper ref={wrapperRef}>
        {transitions.map(({ item, props, key }) => {
          return (
            item && (
              <ContentWrapper key={key}>
                <LightboxImage
                  style={{
                    ...props,
                    touchAction: "none",
                    transform: `scale(${zoomState.scale}) translate(${
                      Math.abs(zoomState.x) < 150 && zoomState.x
                    }px, ${Math.abs(zoomState.y) < 150 && zoomState.y}px)`,
                  }}
                  /*  onClick={onClick} */
                  key={key}
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
  );
}

export default Lightbox;
