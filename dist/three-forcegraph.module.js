import { Mesh, MeshLambertMaterial, BufferGeometry, BufferAttribute, Matrix4, Vector3, SphereBufferGeometry, CylinderBufferGeometry, ConeBufferGeometry, Line, LineBasicMaterial, QuadraticBezierCurve3, CubicBezierCurve3, Group } from 'three';
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceRadial } from 'd3-force-3d';
import graph from 'ngraph.graph';
import forcelayout from 'ngraph.forcelayout';
import forcelayout3d from 'ngraph.forcelayout3d';
import Kapsule from 'kapsule';
import accessorFn from 'accessor-fn';
import { scaleOrdinal } from 'd3-scale';
import { schemePaired } from 'd3-scale-chromatic';
import tinyColor from 'tinycolor2';

function _typeof(obj) {
  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof = function (obj) {
      return typeof obj;
    };
  } else {
    _typeof = function (obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
  }

  return _typeof(obj);
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function");
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      writable: true,
      configurable: true
    }
  });
  if (superClass) _setPrototypeOf(subClass, superClass);
}

function _getPrototypeOf(o) {
  _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
    return o.__proto__ || Object.getPrototypeOf(o);
  };
  return _getPrototypeOf(o);
}

function _setPrototypeOf(o, p) {
  _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
    o.__proto__ = p;
    return o;
  };

  return _setPrototypeOf(o, p);
}

function isNativeReflectConstruct() {
  if (typeof Reflect === "undefined" || !Reflect.construct) return false;
  if (Reflect.construct.sham) return false;
  if (typeof Proxy === "function") return true;

  try {
    Date.prototype.toString.call(Reflect.construct(Date, [], function () {}));
    return true;
  } catch (e) {
    return false;
  }
}

function _construct(Parent, args, Class) {
  if (isNativeReflectConstruct()) {
    _construct = Reflect.construct;
  } else {
    _construct = function _construct(Parent, args, Class) {
      var a = [null];
      a.push.apply(a, args);
      var Constructor = Function.bind.apply(Parent, a);
      var instance = new Constructor();
      if (Class) _setPrototypeOf(instance, Class.prototype);
      return instance;
    };
  }

  return _construct.apply(null, arguments);
}

function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return self;
}

function _possibleConstructorReturn(self, call) {
  if (call && (typeof call === "object" || typeof call === "function")) {
    return call;
  }

  return _assertThisInitialized(self);
}

function _toConsumableArray(arr) {
  return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread();
}

function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  }
}

function _iterableToArray(iter) {
  if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter);
}

function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance");
}

var colorStr2Hex = function colorStr2Hex(str) {
  return isNaN(str) ? parseInt(tinyColor(str).toHex(), 16) : str;
};

var colorAlpha = function colorAlpha(str) {
  return isNaN(str) ? tinyColor(str).getAlpha() : 1;
};

var autoColorScale = scaleOrdinal(schemePaired); // Autoset attribute colorField by colorByAccessor property
// If an object has already a color, don't set it
// Objects can be nodes or links

function autoColorObjects(objects, colorByAccessor, colorField) {
  if (!colorByAccessor || typeof colorField !== 'string') return;
  objects.filter(function (obj) {
    return !obj[colorField];
  }).forEach(function (obj) {
    obj[colorField] = autoColorScale(colorByAccessor(obj));
  });
}

function getDagDepths (_ref, idAccessor) {
  var nodes = _ref.nodes,
      links = _ref.links;
  // linked graph
  var graph = {};
  nodes.forEach(function (node) {
    return graph[idAccessor(node)] = {
      data: node,
      out: [],
      depth: -1
    };
  });
  links.forEach(function (_ref2) {
    var source = _ref2.source,
        target = _ref2.target;
    var sourceId = getNodeId(source);
    var targetId = getNodeId(target);
    if (!graph.hasOwnProperty(sourceId)) throw "Missing source node with id: ".concat(sourceId);
    if (!graph.hasOwnProperty(targetId)) throw "Missing target node with id: ".concat(targetId);
    var sourceNode = graph[sourceId];
    var targetNode = graph[targetId];
    sourceNode.out.push(targetNode);

    function getNodeId(node) {
      return _typeof(node) === 'object' ? idAccessor(node) : node;
    }
  });
  traverse(Object.values(graph)); // cleanup

  Object.keys(graph).forEach(function (id) {
    return graph[id] = graph[id].depth;
  });
  return graph;

  function traverse(nodes) {
    var nodeStack = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
    var currentDepth = nodeStack.length;

    for (var i = 0, l = nodes.length; i < l; i++) {
      var node = nodes[i];

      if (nodeStack.indexOf(node) !== -1) {
        var loop = [].concat(_toConsumableArray(nodeStack.slice(nodeStack.indexOf(node))), [node]).map(function (d) {
          return idAccessor(d.data);
        });
        throw "Invalid DAG structure! Found cycle in node path: ".concat(loop.join(' -> '), ".");
      }

      if (currentDepth > node.depth) {
        // Don't unnecessarily revisit chunks of the graph
        node.depth = currentDepth;
        traverse(node.out, [].concat(_toConsumableArray(nodeStack), [node]));
      }
    }
  }
}

var three = window.THREE ? window.THREE // Prefer consumption from global THREE, if exists
: {
  Mesh: Mesh,
  MeshLambertMaterial: MeshLambertMaterial,
  BufferGeometry: BufferGeometry,
  BufferAttribute: BufferAttribute,
  Matrix4: Matrix4,
  Vector3: Vector3,
  SphereBufferGeometry: SphereBufferGeometry,
  CylinderBufferGeometry: CylinderBufferGeometry,
  ConeBufferGeometry: ConeBufferGeometry,
  Line: Line,
  LineBasicMaterial: LineBasicMaterial,
  QuadraticBezierCurve3: QuadraticBezierCurve3,
  CubicBezierCurve3: CubicBezierCurve3
};
var ngraph = {
  graph: graph,
  forcelayout: forcelayout,
  forcelayout3d: forcelayout3d
};

var DAG_LEVEL_NODE_RATIO = 2;
var ForceGraph = Kapsule({
  props: {
    jsonUrl: {
      onChange: function onChange(jsonUrl, state) {
        var _this = this;

        if (jsonUrl && !state.fetchingJson) {
          // Load data asynchronously
          state.fetchingJson = true;
          state.onLoading();
          fetch(jsonUrl).then(function (r) {
            return r.json();
          }).then(function (json) {
            state.fetchingJson = false;

            _this.graphData(json);
          });
        }
      },
      triggerUpdate: false
    },
    graphData: {
      "default": {
        nodes: [],
        links: []
      },
      onChange: function onChange(graphData, state) {
        if (graphData.nodes.length || graphData.links.length) {
          console.info('force-graph loading', graphData.nodes.length + ' nodes', graphData.links.length + ' links');
        }

        state.engineRunning = false; // Pause simulation immediately

        state.sceneNeedsRepopulating = true;
        state.simulationNeedsReheating = true;
      }
    },
    numDimensions: {
      "default": 3,
      onChange: function onChange(numDim, state) {
        state.simulationNeedsReheating = true;
        var chargeForce = state.d3ForceLayout.force('charge'); // Increase repulsion on 3D mode for improved spatial separation

        if (chargeForce) {
          chargeForce.strength(numDim > 2 ? -60 : -30);
        }

        if (numDim < 3) {
          eraseDimension(state.graphData.nodes, 'z');
        }

        if (numDim < 2) {
          eraseDimension(state.graphData.nodes, 'y');
        }

        function eraseDimension(nodes, dim) {
          nodes.forEach(function (d) {
            delete d[dim]; // position

            delete d["v".concat(dim)]; // velocity
          });
        }
      }
    },
    dagMode: {
      onChange: function onChange(dagMode, state) {
        // td, bu, lr, rl, zin, zout, radialin, radialout
        !dagMode && state.forceEngine === 'd3' && (state.graphData.nodes || []).forEach(function (n) {
          return n.fx = n.fy = n.fz = undefined;
        }); // unfix nodes when disabling dag mode

        state.simulationNeedsReheating = true;
      }
    },
    dagLevelDistance: {
      onChange: function onChange(_, state) {
        state.simulationNeedsReheating = true;
      }
    },
    nodeRelSize: {
      "default": 4,
      onChange: function onChange(_, state) {
        state.sceneNeedsRepopulating = true;
      }
    },
    // volume per val unit
    nodeId: {
      "default": 'id',
      onChange: function onChange(_, state) {
        state.simulationNeedsReheating = true;
      }
    },
    nodeVal: {
      "default": 'val',
      onChange: function onChange(_, state) {
        state.sceneNeedsRepopulating = true;
      }
    },
    nodeResolution: {
      "default": 8,
      onChange: function onChange(_, state) {
        state.sceneNeedsRepopulating = true;
      }
    },
    // how many slice segments in the sphere's circumference
    nodeColor: {
      "default": 'color',
      onChange: function onChange(_, state) {
        state.sceneNeedsRepopulating = true;
      }
    },
    nodeAutoColorBy: {
      onChange: function onChange(_, state) {
        state.sceneNeedsRepopulating = true;
      }
    },
    nodeOpacity: {
      "default": 0.75,
      onChange: function onChange(_, state) {
        state.sceneNeedsRepopulating = true;
      }
    },
    nodeThreeObject: {
      onChange: function onChange(_, state) {
        state.sceneNeedsRepopulating = true;
      }
    },
    nodeThreeObjectExtend: {
      "default": false,
      onChange: function onChange(_, state) {
        state.sceneNeedsRepopulating = true;
      }
    },
    linkSource: {
      "default": 'source',
      onChange: function onChange(_, state) {
        state.simulationNeedsReheating = true;
      }
    },
    linkTarget: {
      "default": 'target',
      onChange: function onChange(_, state) {
        state.simulationNeedsReheating = true;
      }
    },
    linkVisibility: {
      "default": true,
      onChange: function onChange(_, state) {
        state.sceneNeedsRepopulating = true;
      }
    },
    linkColor: {
      "default": 'color',
      onChange: function onChange(_, state) {
        state.sceneNeedsRepopulating = true;
      }
    },
    linkAutoColorBy: {
      onChange: function onChange(_, state) {
        state.sceneNeedsRepopulating = true;
      }
    },
    linkOpacity: {
      "default": 0.2,
      onChange: function onChange(_, state) {
        state.sceneNeedsRepopulating = true;
      }
    },
    linkWidth: {
      onChange: function onChange(_, state) {
        state.sceneNeedsRepopulating = true;
      }
    },
    // Rounded to nearest decimal. For falsy values use dimensionless line with 1px regardless of distance.
    linkResolution: {
      "default": 6,
      onChange: function onChange(_, state) {
        state.sceneNeedsRepopulating = true;
      }
    },
    // how many radial segments in each line tube's geometry
    linkCurvature: {
      "default": 0,
      triggerUpdate: false
    },
    // line curvature radius (0: straight, 1: semi-circle)
    linkCurveRotation: {
      "default": 0,
      triggerUpdate: false
    },
    // line curve rotation along the line axis (0: interection with XY plane, PI: upside down)
    linkMaterial: {
      onChange: function onChange(_, state) {
        state.sceneNeedsRepopulating = true;
      }
    },
    linkThreeObject: {
      onChange: function onChange(_, state) {
        state.sceneNeedsRepopulating = true;
      }
    },
    linkThreeObjectExtend: {
      "default": false,
      onChange: function onChange(_, state) {
        state.sceneNeedsRepopulating = true;
      }
    },
    linkPositionUpdate: {
      triggerUpdate: false
    },
    // custom function to call for updating the link's position. Signature: (threeObj, { start: { x, y, z},  end: { x, y, z }}, link). If the function returns a truthy value, the regular link position update will not run.
    linkDirectionalArrowLength: {
      "default": 0,
      onChange: function onChange(_, state) {
        state.sceneNeedsRepopulating = true;
      }
    },
    linkDirectionalArrowColor: {
      onChange: function onChange(_, state) {
        state.sceneNeedsRepopulating = true;
      }
    },
    linkDirectionalArrowRelPos: {
      "default": 0.5,
      triggerUpdate: false
    },
    // value between 0<>1 indicating the relative pos along the (exposed) line
    linkDirectionalArrowResolution: {
      "default": 8,
      onChange: function onChange(_, state) {
        state.sceneNeedsRepopulating = true;
      }
    },
    // how many slice segments in the arrow's conic circumference
    linkDirectionalParticles: {
      "default": 0,
      onChange: function onChange(_, state) {
        state.sceneNeedsRepopulating = true;
      }
    },
    // animate photons travelling in the link direction
    linkDirectionalParticleSpeed: {
      "default": 0.01,
      triggerUpdate: false
    },
    // in link length ratio per frame
    linkDirectionalParticleWidth: {
      "default": 0.5,
      onChange: function onChange(_, state) {
        state.sceneNeedsRepopulating = true;
      }
    },
    linkDirectionalParticleColor: {
      onChange: function onChange(_, state) {
        state.sceneNeedsRepopulating = true;
      }
    },
    linkDirectionalParticleResolution: {
      "default": 4,
      onChange: function onChange(_, state) {
        state.sceneNeedsRepopulating = true;
      }
    },
    // how many slice segments in the particle sphere's circumference
    forceEngine: {
      "default": 'd3',
      onChange: function onChange(_, state) {
        state.simulationNeedsReheating = true;
      }
    },
    // d3 or ngraph
    d3AlphaDecay: {
      "default": 0.0228,
      triggerUpdate: false,
      onChange: function onChange(alphaDecay, state) {
        state.d3ForceLayout.alphaDecay(alphaDecay);
      }
    },
    d3AlphaTarget: {
      "default": 0,
      triggerUpdate: false,
      onChange: function onChange(alphaTarget, state) {
        state.d3ForceLayout.alphaTarget(alphaTarget);
      }
    },
    d3VelocityDecay: {
      "default": 0.4,
      triggerUpdate: false,
      onChange: function onChange(velocityDecay, state) {
        state.d3ForceLayout.velocityDecay(velocityDecay);
      }
    },
    warmupTicks: {
      "default": 0,
      triggerUpdate: false
    },
    // how many times to tick the force engine at init before starting to render
    cooldownTicks: {
      "default": Infinity,
      triggerUpdate: false
    },
    cooldownTime: {
      "default": 15000,
      triggerUpdate: false
    },
    // ms
    onLoading: {
      "default": function _default() {},
      triggerUpdate: false
    },
    onFinishLoading: {
      "default": function _default() {},
      triggerUpdate: false
    },
    onEngineTick: {
      "default": function _default() {},
      triggerUpdate: false
    },
    onEngineStop: {
      "default": function _default() {},
      triggerUpdate: false
    }
  },
  methods: {
    refresh: function refresh(state) {
      state.sceneNeedsRepopulating = true;
      state.simulationNeedsReheating = true;

      state._rerender();

      return this;
    },
    // Expose d3 forces for external manipulation
    d3Force: function d3Force(state, forceName, forceFn) {
      if (forceFn === undefined) {
        return state.d3ForceLayout.force(forceName); // Force getter
      }

      state.d3ForceLayout.force(forceName, forceFn); // Force setter

      return this;
    },
    _updateScene: function _updateScene(state) {},
    // reset cooldown state
    resetCountdown: function resetCountdown(state) {
      state.cntTicks = 0;
      state.startTickTime = new Date();
      state.engineRunning = true;
      return this;
    },
    tickFrame: function tickFrame(state) {
      var isD3Sim = state.forceEngine !== 'ngraph';

      if (state.engineRunning) {
        layoutTick();
      }

      updateArrows();
      updatePhotons();
      return this; //

      function layoutTick() {
        if (++state.cntTicks > state.cooldownTicks || new Date() - state.startTickTime > state.cooldownTime) {
          state.engineRunning = false; // Stop ticking graph

          state.onEngineStop();
        } else {
          state.layout[isD3Sim ? 'tick' : 'step'](); // Tick it

          state.onEngineTick();
        } // Update nodes position


        state.graphData.nodes.forEach(function (node) {
          var obj = node.__threeObj;
          if (!obj) return;
          var pos = isD3Sim ? node : state.layout.getNodePosition(node[state.nodeId]);
          obj.position.x = pos.x;
          obj.position.y = pos.y || 0;
          obj.position.z = pos.z || 0;
        }); // Update links position

        var linkCurvatureAccessor = accessorFn(state.linkCurvature);
        var linkCurveRotationAccessor = accessorFn(state.linkCurveRotation);
        var linkThreeObjectExtendAccessor = accessorFn(state.linkThreeObjectExtend);
        state.graphData.links.forEach(function (link) {
          var line = link.__lineObj;
          if (!line) return;
          var pos = isD3Sim ? link : state.layout.getLinkPosition(state.layout.graph.getLink(link.source, link.target).id);
          var start = pos[isD3Sim ? 'source' : 'from'];
          var end = pos[isD3Sim ? 'target' : 'to'];
          if (!start.hasOwnProperty('x') || !end.hasOwnProperty('x')) return; // skip invalid link

          calcLinkCurve(link); // calculate link curve for all links, including custom replaced, so it can be used in directional functionality

          var extendedObj = linkThreeObjectExtendAccessor(link);

          if (state.linkPositionUpdate && state.linkPositionUpdate(extendedObj ? line.children[0] : line, // pass child custom object if extending the default
          {
            start: {
              x: start.x,
              y: start.y,
              z: start.z
            },
            end: {
              x: end.x,
              y: end.y,
              z: end.z
            }
          }, link) && !extendedObj) {
            // exit if successfully custom updated position of non-extended obj
            return;
          }

          if (line.type === 'Line') {
            // Update line geometry
            var curveResolution = 30; // # line segments

            var curve = link.__curve;

            if (!curve) {
              // straight line
              var linePos = line.geometry.getAttribute('position');

              if (!linePos || !linePos.array || linePos.array.length !== 6) {
                line.geometry.addAttribute('position', linePos = new three.BufferAttribute(new Float32Array(2 * 3), 3));
              }

              linePos.array[0] = start.x;
              linePos.array[1] = start.y || 0;
              linePos.array[2] = start.z || 0;
              linePos.array[3] = end.x;
              linePos.array[4] = end.y || 0;
              linePos.array[5] = end.z || 0;
              linePos.needsUpdate = true;
            } else {
              // bezier curve line
              line.geometry.setFromPoints(curve.getPoints(curveResolution));
            }

            line.geometry.computeBoundingSphere();
          } else if (line.type === 'Mesh') {
            // Update cylinder geometry
            // links with width ignore linkCurvature because TubeGeometries can't be updated
            link.__curve = null; // force reset link curve

            var vStart = new three.Vector3(start.x, start.y || 0, start.z || 0);
            var vEnd = new three.Vector3(end.x, end.y || 0, end.z || 0);
            var distance = vStart.distanceTo(vEnd);
            line.position.x = vStart.x;
            line.position.y = vStart.y;
            line.position.z = vStart.z;
            line.scale.z = distance;
            line.parent.localToWorld(vEnd); // lookAt requires world coords

            line.lookAt(vEnd);
          }
        }); //

        function calcLinkCurve(link) {
          var pos = isD3Sim ? link : state.layout.getLinkPosition(state.layout.graph.getLink(link.source, link.target).id);
          var start = pos[isD3Sim ? 'source' : 'from'];
          var end = pos[isD3Sim ? 'target' : 'to'];
          if (!start.hasOwnProperty('x') || !end.hasOwnProperty('x')) return; // skip invalid link

          var curvature = linkCurvatureAccessor(link);

          if (!curvature) {
            link.__curve = null; // Straight line
          } else {
            // bezier curve line (only for line types)
            var vStart = new three.Vector3(start.x, start.y || 0, start.z || 0);
            var vEnd = new three.Vector3(end.x, end.y || 0, end.z || 0);
            var l = vStart.distanceTo(vEnd); // line length

            var curve;
            var curveRotation = linkCurveRotationAccessor(link);

            if (l > 0) {
              var dx = end.x - start.x;
              var dy = end.y - start.y || 0;
              var vLine = new three.Vector3().subVectors(vEnd, vStart);
              var cp = vLine.clone().multiplyScalar(curvature).cross(dx !== 0 || dy !== 0 ? new three.Vector3(0, 0, 1) : new three.Vector3(0, 1, 0)) // avoid cross-product of parallel vectors (prefer Z, fallback to Y)
              .applyAxisAngle(vLine.normalize(), curveRotation) // rotate along line axis according to linkCurveRotation
              .add(new three.Vector3().addVectors(vStart, vEnd).divideScalar(2));
              curve = new three.QuadraticBezierCurve3(vStart, cp, vEnd);
            } else {
              // Same point, draw a loop
              var d = curvature * 70;
              var endAngle = -curveRotation; // Rotate clockwise (from Z angle perspective)

              var startAngle = endAngle + Math.PI / 2;
              curve = new three.CubicBezierCurve3(vStart, new three.Vector3(d * Math.cos(startAngle), d * Math.sin(startAngle), 0).add(vStart), new three.Vector3(d * Math.cos(endAngle), d * Math.sin(endAngle), 0).add(vStart), vEnd);
            }

            link.__curve = curve;
          }
        }
      }

      function updateArrows() {
        // update link arrow position
        var arrowRelPosAccessor = accessorFn(state.linkDirectionalArrowRelPos);
        var arrowLengthAccessor = accessorFn(state.linkDirectionalArrowLength);
        var nodeValAccessor = accessorFn(state.nodeVal);
        state.graphData.links.forEach(function (link) {
          var arrowObj = link.__arrowObj;
          if (!arrowObj) return;
          var pos = isD3Sim ? link : state.layout.getLinkPosition(state.layout.graph.getLink(link.source, link.target).id);
          var start = pos[isD3Sim ? 'source' : 'from'];
          var end = pos[isD3Sim ? 'target' : 'to'];
          if (!start.hasOwnProperty('x') || !end.hasOwnProperty('x')) return; // skip invalid link

          var startR = Math.sqrt(Math.max(0, nodeValAccessor(start) || 1)) * state.nodeRelSize;
          var endR = Math.sqrt(Math.max(0, nodeValAccessor(end) || 1)) * state.nodeRelSize;
          var arrowLength = arrowLengthAccessor(link);
          var arrowRelPos = arrowRelPosAccessor(link);
          var getPosAlongLine = link.__curve ? function (t) {
            return link.__curve.getPoint(t);
          } // interpolate along bezier curve
          : function (t) {
            // straight line: interpolate linearly
            var iplt = function iplt(dim, start, end, t) {
              return start[dim] + (end[dim] - start[dim]) * t || 0;
            };

            return {
              x: iplt('x', start, end, t),
              y: iplt('y', start, end, t),
              z: iplt('z', start, end, t)
            };
          };
          var lineLen = link.__curve ? link.__curve.getLength() : Math.sqrt(['x', 'y', 'z'].map(function (dim) {
            return Math.pow((end[dim] || 0) - (start[dim] || 0), 2);
          }).reduce(function (acc, v) {
            return acc + v;
          }, 0));
          var posAlongLine = startR + arrowLength + (lineLen - startR - endR - arrowLength) * arrowRelPos;
          var arrowHead = getPosAlongLine(posAlongLine / lineLen);
          var arrowTail = getPosAlongLine((posAlongLine - arrowLength) / lineLen);
          ['x', 'y', 'z'].forEach(function (dim) {
            return arrowObj.position[dim] = arrowTail[dim];
          });

          var headVec = _construct(three.Vector3, _toConsumableArray(['x', 'y', 'z'].map(function (c) {
            return arrowHead[c];
          })));

          arrowObj.parent.localToWorld(headVec); // lookAt requires world coords

          arrowObj.lookAt(headVec);
        });
      }

      function updatePhotons() {
        // update link particle positions
        var particleSpeedAccessor = accessorFn(state.linkDirectionalParticleSpeed);
        state.graphData.links.forEach(function (link) {
          var photons = link.__photonObjs;
          if (!photons || !photons.length) return;
          var pos = isD3Sim ? link : state.layout.getLinkPosition(state.layout.graph.getLink(link.source, link.target).id);
          var start = pos[isD3Sim ? 'source' : 'from'];
          var end = pos[isD3Sim ? 'target' : 'to'];
          if (!start.hasOwnProperty('x') || !end.hasOwnProperty('x')) return; // skip invalid link

          var particleSpeed = particleSpeedAccessor(link);
          var getPhotonPos = link.__curve ? function (t) {
            return link.__curve.getPoint(t);
          } // interpolate along bezier curve
          : function (t) {
            // straight line: interpolate linearly
            var iplt = function iplt(dim, start, end, t) {
              return start[dim] + (end[dim] - start[dim]) * t || 0;
            };

            return {
              x: iplt('x', start, end, t),
              y: iplt('y', start, end, t),
              z: iplt('z', start, end, t)
            };
          };
          photons.forEach(function (photon, idx) {
            var photonPosRatio = photon.__progressRatio = ((photon.__progressRatio || idx / photons.length) + particleSpeed) % 1;
            var pos = getPhotonPos(photonPosRatio);
            ['x', 'y', 'z'].forEach(function (dim) {
              return photon.position[dim] = pos[dim];
            });
          });
        });
      }
    }
  },
  stateInit: function stateInit() {
    return {
      d3ForceLayout: forceSimulation().force('link', forceLink()).force('charge', forceManyBody()).force('center', forceCenter()).force('dagRadial', null).stop(),
      engineRunning: false,
      sceneNeedsRepopulating: true,
      simulationNeedsReheating: true
    };
  },
  init: function init(threeObj, state) {
    // Main three object to manipulate
    state.graphScene = threeObj;
  },
  update: function update(state) {
    state.engineRunning = false; // pause simulation

    if (state.sceneNeedsRepopulating) {
      state.sceneNeedsRepopulating = false;

      if (state.nodeAutoColorBy !== null) {
        // Auto add color to uncolored nodes
        autoColorObjects(state.graphData.nodes, accessorFn(state.nodeAutoColorBy), state.nodeColor);
      }

      if (state.linkAutoColorBy !== null) {
        // Auto add color to uncolored links
        autoColorObjects(state.graphData.links, accessorFn(state.linkAutoColorBy), state.linkColor);
      } // Clear the scene


      var materialDispose = function materialDispose(material) {
        if (material instanceof Array) {
          material.forEach(materialDispose);
        } else {
          if (material.map) {
            material.map.dispose();
          }

          material.dispose();
        }
      };

      var deallocate = function deallocate(obj) {
        if (obj.geometry) {
          obj.geometry.dispose();
        }

        if (obj.material) {
          materialDispose(obj.material);
        }

        if (obj.texture) {
          obj.texture.dispose();
        }

        if (obj.children) {
          obj.children.forEach(deallocate);
        }
      };

      while (state.graphScene.children.length) {
        var obj = state.graphScene.children[0];
        state.graphScene.remove(obj);
        deallocate(obj);
      } // Add WebGL objects


      var customNodeObjectAccessor = accessorFn(state.nodeThreeObject);
      var customNodeObjectExtendAccessor = accessorFn(state.nodeThreeObjectExtend);
      var valAccessor = accessorFn(state.nodeVal);
      var colorAccessor = accessorFn(state.nodeColor);
      var sphereGeometries = {}; // indexed by node value

      var sphereMaterials = {}; // indexed by color

      state.graphData.nodes.forEach(function (node) {
        var customObj = customNodeObjectAccessor(node);
        var extendObj = customNodeObjectExtendAccessor(node);

        if (customObj && state.nodeThreeObject === customObj) {
          // clone object if it's a shared object among all nodes
          customObj = customObj.clone();
        }

        var obj;

        if (customObj && !extendObj) {
          obj = customObj;
        } else {
          // Add default object (sphere mesh)
          var val = valAccessor(node) || 1;

          if (!sphereGeometries.hasOwnProperty(val)) {
            sphereGeometries[val] = new three.SphereBufferGeometry(Math.cbrt(val) * state.nodeRelSize, state.nodeResolution, state.nodeResolution);
          }

          var color = colorAccessor(node);

          if (!sphereMaterials.hasOwnProperty(color)) {
            sphereMaterials[color] = new three.MeshLambertMaterial({
              color: colorStr2Hex(color || '#ffffaa'),
              transparent: true,
              opacity: state.nodeOpacity * colorAlpha(color)
            });
          }

          obj = new three.Mesh(sphereGeometries[val], sphereMaterials[color]);

          if (customObj && extendObj) {
            obj.add(customObj); // extend default with custom
          }
        }

        obj.__graphObjType = 'node'; // Add object type

        obj.__data = node; // Attach node data

        state.graphScene.add(node.__threeObj = obj);
      });
      var customLinkObjectAccessor = accessorFn(state.linkThreeObject);
      var customLinkObjectExtendAccessor = accessorFn(state.linkThreeObjectExtend);
      var customLinkMaterialAccessor = accessorFn(state.linkMaterial);
      var linkVisibilityAccessor = accessorFn(state.linkVisibility);
      var linkColorAccessor = accessorFn(state.linkColor);
      var linkWidthAccessor = accessorFn(state.linkWidth);
      var linkArrowLengthAccessor = accessorFn(state.linkDirectionalArrowLength);
      var linkArrowColorAccessor = accessorFn(state.linkDirectionalArrowColor);
      var linkParticlesAccessor = accessorFn(state.linkDirectionalParticles);
      var linkParticleWidthAccessor = accessorFn(state.linkDirectionalParticleWidth);
      var linkParticleColorAccessor = accessorFn(state.linkDirectionalParticleColor);
      var lineMaterials = {}; // indexed by link color

      var cylinderGeometries = {}; // indexed by link width

      var particleMaterials = {}; // indexed by link color

      var particleGeometries = {}; // indexed by particle width

      state.graphData.links.forEach(function (link) {
        if (!linkVisibilityAccessor(link)) {
          // Exclude non-visible links
          link.__lineObj = link.__arrowObj = link.__photonObjs = null;
          return;
        }

        var color = linkColorAccessor(link);
        var customObj = customLinkObjectAccessor(link);
        var extendObj = customLinkObjectExtendAccessor(link);

        if (customObj && state.linkThreeObject === customObj) {
          // clone object if it's a shared object among all links
          customObj = customObj.clone();
        }

        var lineObj;

        if (customObj && !extendObj) {
          lineObj = customObj;
        } else {
          // Add default line object
          var linkWidth = Math.ceil(linkWidthAccessor(link) * 10) / 10;
          var useCylinder = !!linkWidth;
          var geometry;

          if (useCylinder) {
            if (!cylinderGeometries.hasOwnProperty(linkWidth)) {
              var r = linkWidth / 2;
              geometry = new three.CylinderBufferGeometry(r, r, 1, state.linkResolution, 1, false);
              geometry.applyMatrix(new three.Matrix4().makeTranslation(0, 1 / 2, 0));
              geometry.applyMatrix(new three.Matrix4().makeRotationX(Math.PI / 2));
              cylinderGeometries[linkWidth] = geometry;
            }

            geometry = cylinderGeometries[linkWidth];
          } else {
            // Use plain line (constant width)
            geometry = new three.BufferGeometry();
            geometry.addAttribute('position', new three.BufferAttribute(new Float32Array(2 * 3), 3));
          }

          var lineMaterial = customLinkMaterialAccessor(link);

          if (!lineMaterial) {
            if (!lineMaterials.hasOwnProperty(color)) {
              var lineOpacity = state.linkOpacity * colorAlpha(color);
              lineMaterials[color] = new three.MeshLambertMaterial({
                color: colorStr2Hex(color || '#f0f0f0'),
                transparent: lineOpacity < 1,
                opacity: lineOpacity,
                depthWrite: lineOpacity >= 1 // Prevent transparency issues

              });
            }

            lineMaterial = lineMaterials[color];
          }

          lineObj = new three[useCylinder ? 'Mesh' : 'Line'](geometry, lineMaterial);

          if (customObj && extendObj) {
            lineObj.add(customObj); // extend default with custom
          }
        }

        lineObj.renderOrder = 10; // Prevent visual glitches of dark lines on top of nodes by rendering them last

        lineObj.__graphObjType = 'link'; // Add object type

        lineObj.__data = link; // Attach link data

        state.graphScene.add(link.__lineObj = lineObj); // Add arrow

        var arrowLength = linkArrowLengthAccessor(link);

        if (arrowLength && arrowLength > 0) {
          var arrowColor = linkArrowColorAccessor(link) || color || '#f0f0f0';
          var coneGeometry = new three.ConeBufferGeometry(arrowLength * 0.25, arrowLength, state.linkDirectionalArrowResolution); // Correct orientation

          coneGeometry.translate(0, arrowLength / 2, 0);
          coneGeometry.rotateX(Math.PI / 2);
          var arrowObj = new three.Mesh(coneGeometry, new three.MeshLambertMaterial({
            color: colorStr2Hex(arrowColor),
            transparent: true,
            opacity: state.linkOpacity * 3
          }));
          state.graphScene.add(link.__arrowObj = arrowObj);
        } // Add photon particles


        var numPhotons = Math.round(Math.abs(linkParticlesAccessor(link)));
        var photonR = Math.ceil(linkParticleWidthAccessor(link) * 10) / 10 / 2;
        var photonColor = linkParticleColorAccessor(link) || color || '#f0f0f0';

        if (!particleGeometries.hasOwnProperty(photonR)) {
          particleGeometries[photonR] = new three.SphereBufferGeometry(photonR, state.linkDirectionalParticleResolution, state.linkDirectionalParticleResolution);
        }

        var particleGeometry = particleGeometries[photonR];

        if (!particleMaterials.hasOwnProperty(photonColor)) {
          particleMaterials[photonColor] = new three.MeshLambertMaterial({
            color: colorStr2Hex(photonColor),
            transparent: true,
            opacity: state.linkOpacity * 3
          });
        }

        var particleMaterial = particleMaterials[photonColor];

        var photons = _toConsumableArray(Array(numPhotons)).map(function () {
          return new three.Mesh(particleGeometry, particleMaterial);
        });

        photons.forEach(function (photon) {
          return state.graphScene.add(photon);
        });
        link.__photonObjs = photons;
      });
    }

    if (state.simulationNeedsReheating) {
      state.simulationNeedsReheating = false;
      state.engineRunning = false; // Pause simulation
      // parse links

      state.graphData.links.forEach(function (link) {
        link.source = link[state.linkSource];
        link.target = link[state.linkTarget];
      }); // Feed data to force-directed layout

      var isD3Sim = state.forceEngine !== 'ngraph';
      var layout;

      if (isD3Sim) {
        // D3-force
        (layout = state.d3ForceLayout).stop().alpha(1) // re-heat the simulation
        .numDimensions(state.numDimensions).nodes(state.graphData.nodes); // add links (if link force is still active)

        var linkForce = state.d3ForceLayout.force('link');

        if (linkForce) {
          linkForce.id(function (d) {
            return d[state.nodeId];
          }).links(state.graphData.links);
        } // setup dag force constraints


        var nodeDepths = state.dagMode && getDagDepths(state.graphData, function (node) {
          return node[state.nodeId];
        });
        var maxDepth = Math.max.apply(Math, _toConsumableArray(Object.values(nodeDepths || [])));
        var dagLevelDistance = state.dagLevelDistance || state.graphData.nodes.length / (maxDepth || 1) * DAG_LEVEL_NODE_RATIO * (['radialin', 'radialout'].indexOf(state.dagMode) !== -1 ? 0.7 : 1); // Fix nodes to x,y,z for dag mode

        if (state.dagMode) {
          var getFFn = function getFFn(fix, invert) {
            return function (node) {
              return !fix ? undefined : (nodeDepths[node[state.nodeId]] - maxDepth / 2) * dagLevelDistance * (invert ? -1 : 1);
            };
          };

          var fxFn = getFFn(['lr', 'rl'].indexOf(state.dagMode) !== -1, state.dagMode === 'rl');
          var fyFn = getFFn(['td', 'bu'].indexOf(state.dagMode) !== -1, state.dagMode === 'td');
          var fzFn = getFFn(['zin', 'zout'].indexOf(state.dagMode) !== -1, state.dagMode === 'zout');
          state.graphData.nodes.forEach(function (node) {
            node.fx = fxFn(node);
            node.fy = fyFn(node);
            node.fz = fzFn(node);
          });
        }

        state.d3ForceLayout.force('dagRadial', ['radialin', 'radialout'].indexOf(state.dagMode) !== -1 ? forceRadial(function (node) {
          var nodeDepth = nodeDepths[node[state.nodeId]];
          return (state.dagMode === 'radialin' ? maxDepth - nodeDepth : nodeDepth) * dagLevelDistance;
        }).strength(1) : null);
      } else {
        // ngraph
        var _graph = ngraph.graph();

        state.graphData.nodes.forEach(function (node) {
          _graph.addNode(node[state.nodeId]);
        });
        state.graphData.links.forEach(function (link) {
          _graph.addLink(link.source, link.target);
        });
        layout = ngraph['forcelayout' + (state.numDimensions === 2 ? '' : '3d')](_graph);
        layout.graph = _graph; // Attach graph reference to layout
      }

      for (var i = 0; i < state.warmupTicks; i++) {
        layout[isD3Sim ? 'tick' : 'step']();
      } // Initial ticks before starting to render


      state.layout = layout;
      this.resetCountdown();
      state.onFinishLoading();
    }

    state.engineRunning = true; // resume simulation
  }
});

function fromKapsule (kapsule) {
  var baseClass = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : Object;
  var initKapsuleWithSelf = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

  var FromKapsule =
  /*#__PURE__*/
  function (_baseClass) {
    _inherits(FromKapsule, _baseClass);

    function FromKapsule() {
      var _getPrototypeOf2;

      var _this;

      _classCallCheck(this, FromKapsule);

      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      _this = _possibleConstructorReturn(this, (_getPrototypeOf2 = _getPrototypeOf(FromKapsule)).call.apply(_getPrototypeOf2, [this].concat(args)));
      _this.__kapsuleInstance = kapsule().apply(void 0, [].concat(_toConsumableArray(initKapsuleWithSelf ? [_assertThisInitialized(_this)] : []), args));
      return _this;
    }

    return FromKapsule;
  }(baseClass); // attach kapsule props/methods to class prototype


  Object.keys(kapsule()).forEach(function (m) {
    return FromKapsule.prototype[m] = function () {
      var _this$__kapsuleInstan;

      var returnVal = (_this$__kapsuleInstan = this.__kapsuleInstance)[m].apply(_this$__kapsuleInstan, arguments);

      return returnVal === this.__kapsuleInstance ? this // chain based on this class, not the kapsule obj
      : returnVal;
    };
  });
  return FromKapsule;
}

var three$1 = window.THREE ? window.THREE : {
  Group: Group
}; // Prefer consumption from global THREE, if exists
var threeForcegraph = fromKapsule(ForceGraph, three$1.Group, true);

export default threeForcegraph;
