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

  useOutsideAlerter(wrapperRef, setStatus, setZoom);
  const onClick = useCallback(() => setIdx((indexNo) => indexNo + 1), []);

  useGesture(
    {
      onDrag: ({
        active,
        direction: [xDir],
        distance,
        offset: [x, y],
        event,
        cancel,
      }) => {
        console.log("DRAG INITIATED: ", zoomState.scale);
        if (active && distance > 0 && zoomState.scale === 1) {
          cancel(
            setIdx((c) => {
              return clamp(c + (xDir > 0 ? -1 : 1), 0, images.length - 1);
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
      onWheel: ({ wheeling, direction: [xdir, ydir] }) =>
        wheeling &&
        zoomState.scale === 1 &&
        setIdx((c) => {
          return clamp(c + ydir, 0, images.length - 1);
        }),
      onPinch: ({ offset: [d] }) => {
        console.log("Pinch Detected");
        let zoomCalc = Math.max(1 + d / 50, 1);
        zoomCalc === 1 && dispatch({ type: "reset" });
        zoomCalc !== 1 && dispatch({ type: "zoom", scale: zoomCalc });
        return;
      },
    },
    { domTarget: lightboxZoomRef, eventOptions: { passive: false } }
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
    <Overlay ref={lightboxZoomRef}>
      <LightBoxWrapper ref={wrapperRef}>
        {transitions.map(({ item, props, key }) => {
          return (
            item && (
              <ContentWrapper key={key}>
                <LightboxImage
                  style={{
                    ...props,
                    touchAction: "none",
                    transform: `scale(${zoomState.scale}) translate(${zoomState.x}px, ${zoomState.y}px)`,
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
