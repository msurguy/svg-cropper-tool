import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import MoveableLib from 'moveable';

const ALLOWED_EVENTS = [
  'dragStart',
  'drag',
  'dragEnd',
  'resizeStart',
  'resize',
  'resizeEnd',
  'scaleStart',
  'scale',
  'scaleEnd',
  'rotateStart',
  'rotate',
  'rotateEnd',
  'warpStart',
  'warp',
  'warpEnd',
  'pinchStart',
  'pinch',
  'pinchEnd',
];

const Moveable = forwardRef(({ children, className, ...props }, ref) => {
  const targetRef = useRef(null);
  const moveableRef = useRef(null);

  useImperativeHandle(ref, () => ({
    updateRect: () => {
      if (moveableRef.current) {
        moveableRef.current.updateRect();
      }
    },
  }));

  useEffect(() => {
    if (!targetRef.current) return;

    const moveable = new MoveableLib(props.container || document.body, {
      ...props,
      target: targetRef.current,
    });

    moveableRef.current = moveable;

    // Set up event handlers
    ALLOWED_EVENTS.forEach((event) => {
      const handler = props[`on${event.charAt(0).toUpperCase()}${event.slice(1)}`];
      if (handler) {
        moveable.on(event, handler);
      }
    });

    const handleResize = () => {
      moveable.updateRect();
    };

    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      ALLOWED_EVENTS.forEach((event) => {
        const handler = props[`on${event.charAt(0).toUpperCase()}${event.slice(1)}`];
        if (handler) {
          moveable.off(event, handler);
        }
      });
      window.removeEventListener('resize', handleResize);
      moveable.destroy();
    };
  }, []);

  // Update moveable options when props change
  useEffect(() => {
    if (!moveableRef.current) return;

    Object.keys(props).forEach((key) => {
      if (key.startsWith('on') || key === 'container' || key === 'className') return;
      const existingValue = moveableRef.current[key];
      const newValue = props[key];
      if (existingValue !== newValue) {
        moveableRef.current[key] = newValue;
      }
    });
  }, [props]);

  return (
    <div ref={targetRef} className={className}>
      {children}
    </div>
  );
});

Moveable.displayName = 'Moveable';

export default Moveable;
