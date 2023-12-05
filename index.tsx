const React = (() => {
  let isFirstElement = true;
  const createElement = (tag, props, ...children) => {
    if (typeof tag === "function") {
      try {
        if (isFirstElement) {
          isFirstElement = false;
          baseComponent.tag = tag;
          baseComponent.props = props;
        }
        return tag(props);
      } catch ({ promise, key }) {
        promise.then((data) => {
          promiseCache.set(key, data);
          rerender();
        });
        return { tag: "h1", props: { children: ["To carregando"] } };
      }
    }
    const element = { tag, props: { ...props, children } };
    return element;
  };

  const promiseCache = new Map();

  const createResource = (coisaQueRetornaAlgumaOutraCoisa, key) => {
    if (promiseCache.has(key)) {
      return promiseCache.get(key);
    }

    throw { promise: coisaQueRetornaAlgumaOutraCoisa(), key };
  };

  let baseContainer = null;
  let baseComponent = {
    tag: null,
    props: null,
  };

  const renderer = (reactElementOrElse, container) => {
    if (typeof reactElementOrElse !== "object") {
      container.appendChild(
        document.createTextNode(String(reactElementOrElse))
      );
      return;
    }
    if (reactElementOrElse === null) {
      return;
    }

    const actualDOMElement = document.createElement(reactElementOrElse.tag);
    if (reactElementOrElse.props) {
      Object.keys(reactElementOrElse.props)
        .filter((key) => key !== "children")
        .forEach((prop) => {
          actualDOMElement[prop] = reactElementOrElse.props[prop];
        });
    }

    if (reactElementOrElse.props.children) {
      reactElementOrElse.props.children.forEach((child) =>
        renderer(child, actualDOMElement)
      );
    }
    container.appendChild(actualDOMElement);
  };

  const render = (reactElement, container) => {
    baseContainer = container;

    renderer(reactElement, container);
  };

  let rerendering = false;

  const executeRendering = () => {
    if (rerendering) {
      setTimeout(() => {
        executeRendering();
      }, 1);
      return;
    }
    statesCursor = 0;
    rerendering = true;
    baseContainer.firstChild?.remove();
    render(baseComponent.tag?.(baseComponent.props), baseContainer);
    cleanup();
    rerendering = false;
    return;
  };

  const rerender = () => {
    executeRendering();
  };

  let states = [];
  let statesCursor = 0;

  const useState = (initialState) => {
    const FROZEN_CURSOR = statesCursor;
    states[FROZEN_CURSOR] =
      states[FROZEN_CURSOR] !== undefined
        ? states[FROZEN_CURSOR]
        : initialState;

    const setState = (newState) => {
      states[FROZEN_CURSOR] = newState;
      rerender();
    };
    statesCursor++;

    return [states[FROZEN_CURSOR], setState];
  };

  const useEffect = (callback, dependencies) => {
    const FROZEN_CURSOR = statesCursor;
    const dependenciesChanged =
      states[FROZEN_CURSOR]?.dependencies === undefined ||
      dependencies.some(
        (dependency, i) => dependency !== states[FROZEN_CURSOR]?.dependencies[i]
      );

    if (dependenciesChanged) {
      rerendering = true;
      states[FROZEN_CURSOR] = {
        dependencies,
        cleanup: callback(),
      };
      rerendering = false;
    }

    statesCursor++;
  };

  const cleanup = () => {
    Array.from({ length: states.length - statesCursor })
      .map((_, i) => i + statesCursor)
      .forEach((value) => {
        if (typeof states[value]?.cleanup === "function") {
          states[value]?.cleanup();
        }
        states[value] = undefined;
      });
  };

  return {
    render,
    createElement,
    useState,
    useEffect,
    createResource,
  };
})();

const Dog = () => {
  const [count, setCount] = React.useState(0);
  const fotoDeCachorroTop = React.createResource(
    () =>
      fetch("https://dog.ceo/api/breeds/image/random")
        .then((r) => r.json())
        .then((payload) => payload.message),
    "cachorroTop"
  );

  React.useEffect(() => {
    console.log("mount");
    // setCount(1);

    return () => {
      console.log("unmount");
    };
  }, []);

  return (
    <h1>
      <h1>O total e {count}</h1>
      <button onclick={() => setCount(count + 1)}>+</button>
      <button onclick={() => setCount(count - 1)}>-</button>
      <img src={fotoDeCachorroTop} alt='dogao' />
    </h1>
  );
};

const App = () => {
  const [name, setName] = React.useState("oi");
  // const [count, setCount] = React.useState(0);
  const [show, setShow] = React.useState(false);

  return (
    <div className='class'>
      <h1>Fala {name}</h1>
      <input
        value={name}
        onchange={(e) => setName(e.target.value)}
        type='text'
        placeholder='e ai time'
      />
      <button onclick={() => setShow(!show)}>Mostrar dog</button>
      {show ? <Dog /> : null}
      <p>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptatum,
        distinctio suscipit! Ea quibusdam consectetur illo nulla sunt enim
        aperiam fugiat ipsa cupiditate, deserunt, optio dicta incidunt et,
        provident harum excepturi.
      </p>
    </div>
  );
};

React.render(<App />, document.querySelector("#app"));
