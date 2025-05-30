// Copyright (c) 2019 Uber Technologies, Inc.
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

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';

import DiffSelection from './DiffSelection';
import { fetchedState } from '../../../constants';

describe('DiffSelection', () => {
  const toggleComparison = () => {};
  const traces = [
    {
      id: 'trace-id-0',
      data: {
        duration: 0,
        traceName: 'trace-name-0',
      },
      error: new Error('error-0'),
      state: fetchedState.DONE,
    },
    {
      id: 'trace-id-1',
      // deliberately missing data to test default
      error: new Error('error-1'),
      state: fetchedState.DONE,
    },
    {
      id: 'trace-id-2',
      // deliberately missing data to test default
      error: new Error('error-2'),
      state: fetchedState.ERROR,
    },
  ];

  it('renders a trace as expected', () => {
    render(
      <MemoryRouter>
        <DiffSelection traces={traces.slice(0, 1)} toggleComparison={toggleComparison} />
      </MemoryRouter>
    );

    expect(screen.getByText('1 Selected for comparison')).toBeInTheDocument();
    expect(screen.getByText('Compare Traces')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '1 Selected for comparison' })).toBeInTheDocument();
  });

  it('renders multiple traces as expected', () => {
    render(
      <MemoryRouter>
        <DiffSelection traces={traces} toggleComparison={toggleComparison} />
      </MemoryRouter>
    );

    const resultItems = document.querySelectorAll('.ResultItemTitle');
    expect(resultItems).toHaveLength(traces.length);
    expect(screen.getByText('2 Selected for comparison')).toBeInTheDocument();
    expect(screen.getByText('Compare Traces')).toBeInTheDocument();
  });

  it('renders CTA_MESSAGE when given empty traces array', () => {
    render(
      <MemoryRouter>
        <DiffSelection traces={[]} toggleComparison={toggleComparison} />
      </MemoryRouter>
    );
    expect(screen.getByText('Compare traces by selecting result items')).toBeInTheDocument();
  });
});
