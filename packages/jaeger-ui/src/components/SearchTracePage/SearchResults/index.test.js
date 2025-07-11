// Copyright (c) 2017 Uber Technologies, Inc.
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
import { shallow } from 'enzyme';

import { createBlob, UnconnectedSearchResults as SearchResults, SelectSort } from '.';
import * as markers from './index.markers';
import * as track from './index.track';
import * as orderBy from '../../../model/order-by';
import AltViewOptions from './AltViewOptions';
import DiffSelection from './DiffSelection';
import ResultItem from './ResultItem';
import ScatterPlot from './ScatterPlot';
import { getUrl } from '../url';
import LoadingIndicator from '../../common/LoadingIndicator';
import SearchResultsDDG from '../../DeepDependencies/traces';
import DownloadResults from './DownloadResults';
import readJsonFile from '../../../utils/readJsonFile';

describe('<SearchResults>', () => {
  const searchParam = 'view';
  const otherParam = 'param';
  const otherValue = 'value';
  const otherSearch = `?${otherParam}=${otherValue}`;
  let wrapper;
  let traces;
  let rawTraces;
  let props;

  beforeEach(() => {
    traces = [
      { traceID: 'a', spans: [], processes: {} },
      { traceID: 'b', spans: [], processes: {} },
    ];
    rawTraces = traces;
    props = {
      diffCohort: [],
      goToTrace: () => {},
      location: {},
      loading: false,
      maxTraceDuration: 1,
      queryOfResults: {},
      traces,
      rawTraces,
    };
    wrapper = shallow(<SearchResults {...props} />);
  });

  it('shows the "no results" message when the search result is empty', () => {
    wrapper.setProps({ traces: [] });
    expect(wrapper.find(`[data-test="${markers.NO_RESULTS}"]`).length).toBe(1);
  });

  it('shows a loading indicator if loading traces', () => {
    wrapper.setProps({ loading: true });
    expect(wrapper.find(LoadingIndicator).length).toBe(1);
  });

  it('hide scatter plot if queryparam hideGraph', () => {
    wrapper.setProps({ hideGraph: true, embed: true, getSearchURL: () => 'SEARCH_URL' });
    expect(wrapper.find(ScatterPlot).length).toBe(0);
  });

  it('hide DiffSelection when disableComparisons = true', () => {
    wrapper.setProps({ disableComparisons: true });
    expect(wrapper.find(DiffSelection).length).toBe(0);
  });

  it('adds or removes trace from cohort based on flag', () => {
    const cohortAddTrace = jest.fn();
    const cohortRemoveTrace = jest.fn();
    wrapper.setProps({ cohortAddTrace, cohortRemoveTrace });

    const instance = wrapper.instance();
    instance.toggleComparison('id-1');
    instance.toggleComparison('id-2', true);

    expect(cohortAddTrace).toHaveBeenCalledWith('id-1');
    expect(cohortRemoveTrace).toHaveBeenCalledWith('id-2');
  });

  it('sets trace color to red if error tag is present', () => {
    wrapper.setProps({
      traces: [
        {
          traceID: 'err',
          traceName: 'T',
          startTime: 0,
          duration: 1,
          processes: {},
          services: [],
          spans: [
            {
              tags: [{ key: 'error', value: true }],
              process: { serviceName: 'test-service' },
              operationName: 'test-operation',
            },
          ],
        },
      ],
    });
    const data = wrapper.find(ScatterPlot).prop('data');
    expect(data[0].color).toBe('red');
  });

  it('renders DiffSelection when diffCohort is provided', () => {
    wrapper.setProps({ diffCohort: [{ id: 'id-1' }] });
    expect(wrapper.find(DiffSelection)).toHaveLength(1);
  });

  it('calls goToTrace when a ScatterPlot point is clicked', () => {
    const goToTrace = jest.fn();
    const trace = {
      traceID: 'id-1',
      spans: [],
      startTime: 0,
      duration: 1,
      traceName: 'TraceThis',
      processes: {},
    };
    wrapper.setProps({ traces: [trace], goToTrace });
    wrapper.find(ScatterPlot).prop('onValueClick')(trace);
    expect(goToTrace).toHaveBeenCalledWith('id-1');
  });

  it('handles trace with no spans', () => {
    wrapper.setProps({
      traces: [
        {
          traceID: 'no-spans',
          traceName: 'Empty Trace',
          startTime: 0,
          duration: 1,
          processes: {},
          spans: [],
        },
      ],
    });
    const data = wrapper.find(ScatterPlot).prop('data');
    expect(data[0].rootSpanName).toBe('Unknown');
    expect(data[0].services).toEqual([]);
  });

  it('handles trace with no services property', () => {
    wrapper.setProps({
      traces: [
        {
          traceID: 'no-services',
          traceName: 'No Services',
          startTime: 0,
          duration: 1,
          processes: {},
          spans: [
            {
              process: { serviceName: 'test-service' },
              operationName: 'test-operation',
              tags: [],
            },
          ],
        },
      ],
    });
    const data = wrapper.find(ScatterPlot).prop('data');
    expect(data[0].services).toEqual([]);
    expect(data[0].rootSpanName).toBe('test-operation');
  });

  describe('search finished with results', () => {
    it('shows a scatter plot', () => {
      expect(wrapper.find(ScatterPlot).length).toBe(1);
    });

    it('shows a result entry for each trace', () => {
      expect(wrapper.find(ResultItem).length).toBe(traces.length);
    });

    it('deep links traces', () => {
      const uiFind = 'ui-find';
      const spanLinks = {
        [traces[0].traceID]: uiFind,
      };
      wrapper.setProps({ spanLinks });
      const results = wrapper.find(ResultItem);
      expect(results.at(0).prop('linkTo').search).toBe(`uiFind=${uiFind}`);
      expect(results.at(1).prop('linkTo').search).toBeUndefined();
    });

    it('deep links traces with leading 0', () => {
      const uiFind0 = 'ui-find-0';
      const uiFind1 = 'ui-find-1';
      const traceID0 = '00traceID0';
      const traceID1 = 'traceID1';
      const spanLinks = {
        [traceID0]: uiFind0,
        [traceID1]: uiFind1,
      };
      const zeroIDTraces = [
        { traceID: traceID0, spans: [], processes: {} },
        { traceID: `000${traceID1}`, spans: [], processes: {} },
      ];
      wrapper.setProps({ spanLinks, traces: zeroIDTraces });
      const results = wrapper.find(ResultItem);
      expect(results.at(0).prop('linkTo').search).toBe(`uiFind=${uiFind0}`);
      expect(results.at(1).prop('linkTo').search).toBe(`uiFind=${uiFind1}`);
    });

    describe('ddg', () => {
      const viewDdg = 'ddg';
      const viewTraces = 'traces';
      const search = `${searchParam}=${viewDdg}`;
      let trackAltViewSpy;

      beforeAll(() => {
        trackAltViewSpy = jest.spyOn(track, 'trackAltView');
      });

      it('updates url to view ddg and back and back again - and tracks changes', () => {
        const push = jest.fn();
        wrapper.setProps({ history: { push }, location: { search: otherSearch } });

        const toggle = wrapper.find(AltViewOptions).prop('onDdgViewClicked');
        toggle();
        expect(push).toHaveBeenLastCalledWith(getUrl({ [otherParam]: otherValue, [searchParam]: viewDdg }));
        expect(trackAltViewSpy).toHaveBeenLastCalledWith(viewDdg);

        wrapper.setProps({ location: { search: `${otherSearch}&${search}` } });
        toggle();
        expect(push).toHaveBeenLastCalledWith(
          getUrl({ [otherParam]: otherValue, [searchParam]: viewTraces })
        );
        expect(trackAltViewSpy).toHaveBeenLastCalledWith(viewTraces);

        wrapper.setProps({ location: { search: `${otherSearch}&${searchParam}=${viewTraces}` } });
        toggle();
        expect(push).toHaveBeenLastCalledWith(getUrl({ [otherParam]: otherValue, [searchParam]: viewDdg }));
        expect(trackAltViewSpy).toHaveBeenLastCalledWith(viewDdg);
      });

      it('shows ddg instead of scatterplot and results', () => {
        expect(wrapper.find(SearchResultsDDG).length).toBe(0);
        expect(wrapper.find(ResultItem).length).not.toBe(0);
        expect(wrapper.find(ScatterPlot).length).not.toBe(0);

        wrapper.setProps({ location: { search: `?${search}` } });
        expect(wrapper.find(SearchResultsDDG).length).toBe(1);
        expect(wrapper.find(ResultItem).length).toBe(0);
        expect(wrapper.find(ScatterPlot).length).toBe(0);
      });
    });

    describe('DownloadResults', () => {
      it('shows DownloadResults when view is not ddg', () => {
        const view = 'traces';
        wrapper.setProps({ location: { search: `${otherSearch}&${searchParam}=${view}` } });
        expect(wrapper.find(DownloadResults).length).toBe(1);
      });

      it('does not show DownloadResults when view is ddg', () => {
        const view = 'ddg';
        wrapper.setProps({ location: { search: `${otherSearch}&${searchParam}=${view}` } });
        expect(wrapper.find(DownloadResults).length).toBe(0);
      });

      it('when click on DownloadResults then call download function', () => {
        const originalBlob = global.Blob;
        global.Blob = class {
          constructor(text, options) {
            this.text = text;
            this.options = options;
          }
        };
        URL.createObjectURL = jest.fn();
        URL.revokeObjectURL = jest.fn();
        const content = [`{"data":${JSON.stringify(props.rawTraces)}}`];
        const file = new Blob(content, { type: 'application/json' });
        const view = 'traces';
        wrapper.setProps({ location: { search: `${otherSearch}&${searchParam}=${view}` } });

        const download = wrapper.find(DownloadResults).prop('onDownloadResultsClicked');
        download();
        expect(URL.createObjectURL).toBeCalledTimes(1);
        expect(URL.createObjectURL).toBeCalledWith(file);
        expect(file.text).toBe(content);
        expect(URL.revokeObjectURL).toBeCalledTimes(1);
        global.Blob = originalBlob;
      });

      it('when create a download file then it can be read back', async () => {
        const content = `{"data":${JSON.stringify(props.rawTraces)}}`;
        const file = new File([createBlob(props.rawTraces)], 'test.json');
        const contentFile = await readJsonFile({ file });

        return expect(JSON.stringify(contentFile)).toBe(content);
      });
    });

    describe('<SelectSort>', () => {
      let selectSortWrapper;
      let handleSortChange;

      beforeEach(() => {
        handleSortChange = jest.fn();
        selectSortWrapper = shallow(
          <SelectSort sortBy={orderBy.MOST_RECENT} handleSortChange={handleSortChange} />
        );
      });

      it('calls handleSortChange when selection changes', () => {
        const select = selectSortWrapper.find('SearchableSelect');
        select.simulate('change', orderBy.LONGEST_FIRST);
        expect(handleSortChange).toHaveBeenCalledTimes(1);
        expect(handleSortChange).toHaveBeenCalledWith(orderBy.LONGEST_FIRST);
      });

      it('updates selected value when sortBy prop changes', () => {
        selectSortWrapper.setProps({ sortBy: orderBy.SHORTEST_FIRST });
        const select = selectSortWrapper.find('SearchableSelect');
        expect(select.prop('value')).toBe(orderBy.SHORTEST_FIRST);
      });
    });
  });
});
