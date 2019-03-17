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

import TNullable from '../../types/nullable';
import { TraceDiffState } from '../../types/trace-diff';

export default function getValidState(state: TraceDiffState) {
  const { a: stA, b: stB, cohort: stCohort } = state;
  const cohortSet = new Set(
    ([] as (string | TNullable)[])
      .concat(stA, stB, stCohort)
      .filter((str: string | TNullable): str is string => Boolean(str))
  );
  const cohort: string[] = Array.from(cohortSet);
  const a = cohort[0];
  const b = cohort[1];
  return { a, b, cohort };
}
