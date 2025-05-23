// Copyright (c) 2021 The Jaeger Authors.
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

import * as React from 'react';
import { Row, Col, Button, Alert } from 'antd';
import './index.css';
import { MonitorEmptyStateConfig } from '../../../types/config';
import { getConfigValue } from '../../../utils/config/get-config';
import monitorImg from './media/monitor.png';

const MonitorATMEmptyState: React.FC = () => {
  const config: MonitorEmptyStateConfig = getConfigValue('monitor.emptyState');

  return (
    <Col>
      <Row justify="center">
        <Col span={8}>
          <img
            className="monitor-preview-image-empty-state"
            alt="jaeger-monitor-tab-preview"
            src={monitorImg}
          />
        </Col>
      </Row>
      <Row justify="center">
        <Col span={6} className="center-empty-state">
          {config.mainTitle && <h2 className="main-title-empty-state">{config.mainTitle}</h2>}
          {config.subTitle && <h3 className="sub-title-empty-state">{config.subTitle}</h3>}
          {config.description && <h4 className="description-empty-state">{config.description}</h4>}
          {config.button?.text && (
            <Button className="button-empty-state" onClick={() => config.button?.onClick?.()}>
              {config.button.text}
            </Button>
          )}
          {config.alert && (
            <Row justify="center">
              <Col span={20}>
                <Alert message={config.alert.message} type={config.alert.type} showIcon />
              </Col>
            </Row>
          )}
        </Col>
      </Row>
    </Col>
  );
};

export default MonitorATMEmptyState;
