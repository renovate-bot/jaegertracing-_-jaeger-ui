// Copyright (c) 2023 The Jaeger Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import React, { ReactNode, useState } from 'react';
import { Digraph, LayoutManager } from '@jaegertracing/plexus';
import { TEdge, TVertex } from '@jaegertracing/plexus/lib/types';
import { TLayoutOptions } from '@jaegertracing/plexus/lib/LayoutManager/types';
import { IoLocate } from 'react-icons/io5';
import NewWindowIcon from '../common/NewWindowIcon';
import ActionsMenu, { IActionMenuItem } from '../common/ActionMenu/ActionsMenu';
import { getUrl as getSearchUrl } from '../SearchTracePage/url';

import './dag.css';
import { DAG_MAX_NUM_SERVICES } from '../../constants';

type TProps = {
  data: {
    nodes: TVertex[];
    edges: TEdge[];
  };
  selectedLayout: string;
  selectedDepth: number;
  selectedService: string;
  uiFind?: string;
  onServiceSelect?: (service: string) => void;
};

export const renderNode = (
  vertex: TVertex,
  selectedService: string | null,
  uiFind?: string,
  onMouseEnter?: (vertex: TVertex, event: React.MouseEvent) => void,
  onMouseLeave?: () => void,
  onClick?: (vertex: TVertex, event: React.MouseEvent) => void
): ReactNode => {
  if (!vertex) return null;

  const isFocalNode = vertex.key === selectedService;
  const isMatch = uiFind ? vertex.key.toLowerCase().includes(uiFind.toLowerCase()) : false;

  return (
    <div
      className="DAG--node"
      role="button"
      onMouseEnter={e => onMouseEnter?.(vertex, e)}
      onMouseLeave={onMouseLeave}
      onClick={e => {
        onClick?.(vertex, e);
      }}
      style={{ cursor: 'pointer' }}
    >
      <div className={`DAG--nodeCircle ${isFocalNode ? 'is-focalNode' : ''} ${isMatch ? 'is-match' : ''}`} />
      <div className="DAG--nodeLabel" data-testid="dagNodeLabel">
        {vertex?.key ?? ''}
      </div>
    </div>
  ) as ReactNode;
};

export const handleViewTraces = (hoveredNode: TVertex | null) => {
  window.open(getSearchUrl({ service: hoveredNode?.key }), '_blank');
};

export const createHandleNodeClick =
  (
    hoveredNode: TVertex | null,
    setHoveredNode: (node: TVertex | null) => void,
    setMenuPosition: (position: { x: number; y: number } | null) => void,
    setIsMenuVisible: (visible: boolean) => void
  ) =>
  (vertex: TVertex, event: React.MouseEvent) => {
    event.stopPropagation();
    if (hoveredNode?.key === vertex.key) {
      setHoveredNode(null);
      setMenuPosition(null);
      setIsMenuVisible(false);
    } else {
      setHoveredNode(vertex);
      setMenuPosition({ x: event.clientX, y: event.clientY });
      setIsMenuVisible(true);
    }
  };

export const createHandleCanvasClick =
  (
    setHoveredNode: (node: TVertex | null) => void,
    setMenuPosition: (position: { x: number; y: number } | null) => void,
    setIsMenuVisible: (visible: boolean) => void
  ) =>
  () => {
    setIsMenuVisible(false);
    setHoveredNode(null);
    setMenuPosition(null);
  };

export const createMenuItems = (
  hoveredNode: TVertex | null,
  onServiceSelect?: (service: string) => void
): IActionMenuItem[] => {
  if (!hoveredNode) return [];

  return [
    {
      id: 'set-focus',
      label: 'Set focus',
      icon: <IoLocate />,
      onClick: () => {
        onServiceSelect?.(hoveredNode.key);
      },
    },
    {
      id: 'view-traces',
      label: 'View traces',
      icon: <NewWindowIcon />,
      onClick: () => handleViewTraces(hoveredNode),
    },
  ];
};

const { classNameIsSmall } = Digraph.propsFactories;

const DAGMenu = ({
  menuPosition,
  hoveredNode,
  isMenuVisible,
  menuItems,
}: {
  menuPosition: { x: number; y: number } | null;
  hoveredNode: TVertex | null;
  isMenuVisible: boolean;
  menuItems: IActionMenuItem[];
}) => {
  if (!menuPosition || !hoveredNode || !isMenuVisible) {
    return null;
  }

  return (
    <div
      role="menu"
      style={{
        position: 'fixed',
        left: menuPosition.x,
        top: menuPosition.y - 10,
        zIndex: 1000,
        pointerEvents: 'auto',
      }}
    >
      <ActionsMenu items={menuItems} />
    </div>
  );
};

export default function DAG({
  data,
  selectedLayout,
  selectedDepth,
  selectedService,
  uiFind,
  onServiceSelect,
}: TProps) {
  const [hoveredNode, setHoveredNode] = useState<TVertex | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  const handleNodeClick = createHandleNodeClick(
    hoveredNode,
    setHoveredNode,
    setMenuPosition,
    setIsMenuVisible
  );
  const handleCanvasClick = createHandleCanvasClick(setHoveredNode, setMenuPosition, setIsMenuVisible);

  const menuItems: IActionMenuItem[] = React.useMemo(
    () => createMenuItems(hoveredNode, onServiceSelect),
    [hoveredNode, onServiceSelect]
  );

  const forceFocalServiceSelection = data.nodes.length > DAG_MAX_NUM_SERVICES;

  const layoutManager = React.useMemo(() => {
    const config: TLayoutOptions =
      selectedLayout === 'dot'
        ? {
            nodesep: 1.5,
            ranksep: 1.6,
            rankdir: 'TB',
            splines: 'polyline',
            useDotEdges: true,
          }
        : {
            engine: 'sfdp',
            splines: 'false',
            sfdpOptions: {
              maxiter: 1,
              overlap: false,
              dim: 2,
            },
            dpi: data.nodes.length > 100 ? Math.min(data.nodes.length * 2, 2000) : 300,
          };

    return new LayoutManager(config);
  }, [selectedLayout, data.nodes.length]);

  React.useEffect(() => {
    return () => {
      layoutManager.stopAndRelease();
    };
  }, [layoutManager]);

  if (forceFocalServiceSelection) {
    return (
      <div className="DAG">
        <div className="DAG--error">
          {`Too many services to render (${data.nodes.length}). Hierarchical layout is disabled. For the Force-Directed layout, please select a focal service and the depth.`}
        </div>
      </div>
    );
  }

  return (
    <div className="DAG" onClick={handleCanvasClick} role="button">
      <Digraph<TVertex>
        key={`${selectedLayout}-${selectedService}-${selectedDepth}-${uiFind}`}
        zoom
        minimap
        className="DAG--dag"
        setOnGraph={classNameIsSmall}
        minimapClassName="u-miniMap"
        layoutManager={layoutManager}
        measurableNodesKey="nodes"
        layers={[
          {
            key: 'edges',
            defs: [{ localId: 'arrowHead' }],
            edges: true,
            layerType: 'svg',
            markerEndId: 'arrowHead',
          },
          {
            key: 'nodes',
            layerType: 'html',
            measurable: true,
            renderNode: (vertex: TVertex) =>
              renderNode(vertex, selectedService, uiFind, undefined, undefined, handleNodeClick),
          },
        ]}
        edges={data.edges}
        vertices={data.nodes}
      />
      <DAGMenu
        menuPosition={menuPosition}
        hoveredNode={hoveredNode}
        isMenuVisible={isMenuVisible}
        menuItems={menuItems}
      />
    </div>
  );
}
