// SPDX-FileCopyrightText: 2017-2023 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

/* eslint-disable  */
/* eslint-enable react-hooks/exhaustive-deps */

import range from 'lodash/range'
import { useCallback, useMemo, useRef, useState } from 'react'

import { boolean } from './fields'
import {
  AnyForm,
  ErrorOf,
  Form,
  ObjectFieldError,
  OutputOf,
  ShapeOf,
  StateOf,
  ValidationResult
} from './types'

export type InfoStatus = 'warning' | 'success'

export interface InputInfo {
  text: string
  status?: InfoStatus
}

export interface BoundForm<F extends AnyForm> {
  form: F
  state: StateOf<F>
  update: (fn: (state: StateOf<F>) => StateOf<F>) => void
  set: (value: StateOf<F>) => void

  inputInfo: () => InputInfo | undefined
  translateError: (error: Exclude<ErrorOf<F>, ObjectFieldError>) => string

  isValid: () => boolean
  validationError: () => ErrorOf<F> | undefined
  value: () => OutputOf<F> // throws if form is invalid
}

/** For use with components that only need the state and/or translated validation errors */
export type BoundFormState<State> = BoundForm<
  Form<unknown, string, State, unknown>
>

/** For use with components that only use useFormField etc. */
export type BoundFormShape<State, Shape> = BoundForm<
  Form<unknown, string, State, Shape>
>

export function useForm<F extends AnyForm>(
  form: F,
  initialState: () => StateOf<F>,
  errorDict: Record<Exclude<ErrorOf<F>, ObjectFieldError>, string>,
  options: {
    onUpdate?: (
      prevState: StateOf<F>,
      nextState: StateOf<F>,
      form: F
    ) => StateOf<F>
  } = {}
): BoundForm<F> {
  const onUpdateRef = useRef(options.onUpdate)
  onUpdateRef.current = options.onUpdate

  const [state, setState] = useState(initialState)
  const update = useCallback(
    (fn: (prev: StateOf<F>) => StateOf<F>) => {
      setState((prev) => {
        const next = fn(prev)
        const onUpdate = onUpdateRef.current
        return onUpdate ? onUpdate(prev, next, form) : next
      })
    },
    [form]
  )
  const set = useCallback((value: StateOf<F>) => {
    setState(value)
  }, [])
  const translateError = useCallback(
    (error: Exclude<ErrorOf<F>, ObjectFieldError>): string => errorDict[error],
    [errorDict]
  )
  return useMemo(
    () => ({
      form,
      state,
      update,
      set,
      ...validationHelpers(() => state, form.validate as any, translateError)
    }),
    [form, set, state, translateError, update]
  )
}

export function useFormFields<F extends AnyForm>({
  form,
  state,
  update,
  translateError
}: BoundForm<F>): { [K in keyof ShapeOf<F>]: BoundForm<ShapeOf<F>[K]> } {
  const fieldShapes = useMemo(() => Object.entries(form.shape), [form.shape])

  const fieldCallbacks = useMemo(
    () =>
      Object.fromEntries(
        fieldShapes.map(([key]) => {
          const fieldUpdate = (
            fn: (prev: StateOf<F>) => StateOf<F>[number]
          ) => {
            update((prevState) => ({
              ...prevState,
              [key]: fn(prevState[key])
            }))
          }
          const fieldSet = (value: StateOf<F>[number]) =>
            fieldUpdate(() => value)
          return [key, { fieldUpdate, fieldSet }]
        })
      ),
    [fieldShapes, update]
  )

  return useMemo(
    () =>
      Object.fromEntries(
        fieldShapes.map(([key, field]) => [
          key,
          {
            form: field,
            state: state[key],
            update: fieldCallbacks[key].fieldUpdate,
            set: fieldCallbacks[key].fieldSet,
            ...validationHelpers(
              () => state[key],
              form.shape[key].validate,
              translateError
            )
          }
        ])
      ) as any,
    [fieldCallbacks, fieldShapes, form.shape, state, translateError]
  )
}

export function useFormField<F extends AnyForm, K extends keyof ShapeOf<F>>(
  { form, state, update, translateError }: BoundForm<F>,
  key: K
): ShapeOf<F>[K] extends AnyForm ? BoundForm<ShapeOf<F>[K]> : never {
  const field = form.shape[key]
  const fieldState = state[key]

  const fieldUpdate = useCallback(
    (fn: (state: StateOf<F>[K]) => StateOf<F>[K]) => {
      update((prev) => ({
        ...prev,
        [key]: fn(prev[key])
      }))
    },
    [key, update]
  )

  const fieldSet = useCallback(
    (value: StateOf<F>[K]) => {
      fieldUpdate(() => value)
    },
    [fieldUpdate]
  )

  return useMemo(
    () =>
      ({
        form: field,
        state: fieldState,
        update: fieldUpdate,
        set: fieldSet,
        ...validationHelpers(() => fieldState, field.validate, translateError)
      } as any),
    [field, fieldSet, fieldState, fieldUpdate, translateError]
  )
}

export function useFormElem<F extends AnyForm>(
  { form, state, update, translateError }: BoundForm<F>,
  index: number
): ShapeOf<F> extends AnyForm
  ? StateOf<F> extends StateOf<ShapeOf<F>>[]
    ? BoundForm<ShapeOf<F>> | undefined
    : never
  : never {
  const elem = form.shape
  const elemUpdate = useCallback(
    (fn: (prev: StateOf<F>[number]) => StateOf<F>[number]) => {
      update((prevElemStates) =>
        prevElemStates.map((prevElemState: StateOf<F>[number], i: number) =>
          i === index ? fn(prevElemState) : prevElemState
        )
      )
    },
    [index, update]
  )
  const elemSet = useCallback(
    (value: StateOf<F>[number]) => {
      elemUpdate(() => value)
    },
    [elemUpdate]
  )

  return useMemo(
    () =>
      state.length > index
        ? ({
            form: elem,
            state: state[index],
            update: elemUpdate,
            set: elemSet,
            ...validationHelpers(
              () => state[index],
              elem.validate,
              translateError
            )
          } as any)
        : undefined,
    [elem, elemSet, elemUpdate, index, state, translateError]
  )
}

export function useFormElems<F extends AnyForm>({
  form,
  state,
  update,
  translateError
}: BoundForm<F>): ShapeOf<F> extends AnyForm
  ? StateOf<F> extends StateOf<ShapeOf<F>>[]
    ? BoundForm<ShapeOf<F>>[]
    : never
  : never {
  const elem = form.shape
  const len = state.length

  const callbacks = useMemo(
    () =>
      range(len).map((index) => {
        const elemUpdate = (
          fn: (prev: StateOf<F>[number]) => StateOf<F>[number]
        ) => {
          update((prevElemStates) =>
            prevElemStates.map((prevElemState: StateOf<F>[number], i: number) =>
              i === index ? fn(prevElemState) : prevElemState
            )
          )
        }
        const elemSet = (value: StateOf<F>[number]) => elemUpdate(() => value)
        return { elemUpdate, elemSet }
      }),
    [len, update]
  )

  return useMemo(
    () =>
      range(len).map((index) => ({
        form: elem,
        state: state[index],
        update: callbacks[index].elemUpdate,
        set: callbacks[index].elemSet,
        ...validationHelpers(() => state[index], elem.validate, translateError)
      })) as any,
    [callbacks, elem, len, state, translateError]
  )
}

export function useFormUnion<F extends AnyForm>({
  form,
  state,
  update,
  translateError
}: BoundForm<F>): StateOf<F> extends { branch: any }
  ? StateOf<F>['branch'] extends infer K
    ? K extends string // trigger distributive conditional type
      ? ShapeOf<F> extends { [KK in K]: AnyForm }
        ? { branch: K; form: BoundForm<ShapeOf<F>[K]> }
        : never
      : never
    : never
  : never {
  const branchCallbacks = useMemo(
    () =>
      Object.fromEntries(
        Object.keys(form.shape).map((branch) => {
          const elemUpdate = (
            fn: (prev: StateOf<F>['state']) => StateOf<F>['state']
          ) => {
            update(
              (prevState) =>
                (prevState.branch === branch
                  ? { branch, state: fn(prevState.state) }
                  : prevState) as StateOf<F>
            )
          }
          const elemSet = (value: any) => elemUpdate(() => value)
          return [branch, { elemUpdate, elemSet }]
        })
      ),
    [form.shape, update]
  )
  return useMemo(
    () =>
      ({
        branch: state.branch,
        form: {
          form: form.shape[state.branch],
          state: state.state,
          update: branchCallbacks[state.branch].elemUpdate,
          set: branchCallbacks[state.branch].elemSet,
          ...validationHelpers(
            () => state.state,
            form.shape[state.branch].validate,
            translateError
          )
        }
      } as any),
    [branchCallbacks, form.shape, state.branch, state.state, translateError]
  )
}

export function useFormUnionBranch<
  F extends AnyForm,
  K extends keyof ShapeOf<F>
>(
  { form, state, update, translateError }: BoundForm<F>,
  branch: K
): StateOf<F> extends { branch: any }
  ? K extends StateOf<F>['branch']
    ? BoundForm<ShapeOf<F>[K]> | undefined
    : never
  : never {
  const field = form.shape[branch]

  const matches = state.branch === branch
  const fieldState = state.state

  const fieldUpdate = useCallback(
    (fn: (state: StateOf<F>['state']) => StateOf<F>['state']) => {
      update((prev) =>
        prev.branch === branch
          ? ({ branch, state: fn(prev.state) } as StateOf<F>)
          : prev
      )
    },
    [branch, update]
  )

  const fieldSet = useCallback(
    (value: StateOf<F>['state']) => {
      fieldUpdate(() => value)
    },
    [fieldUpdate]
  )

  return useMemo(
    () =>
      matches
        ? ({
            form: field,
            state: fieldState,
            update: fieldUpdate,
            set: fieldSet,
            ...validationHelpers(
              () => fieldState,
              field.validate,
              translateError
            )
          } as any)
        : undefined,
    [field, fieldSet, fieldState, fieldUpdate, matches, translateError]
  )
}

function validationHelpers<Output, Error, State>(
  getState: () => State,
  getValidationResult: (state: State) => ValidationResult<Output, Error>,
  translateError: (error: Exclude<Error, ObjectFieldError>) => string
) {
  return {
    inputInfo: (): InputInfo | undefined => {
      const result = getValidationResult(getState())
      if (result.isValid || result.validationError === ObjectFieldError) {
        return undefined
      }
      return {
        status: 'warning',
        text: translateError(
          result.validationError as Exclude<Error, ObjectFieldError>
        )
      }
    },
    translateError,
    isValid: () => getValidationResult(getState()).isValid,
    validationError: () => {
      const result = getValidationResult(getState())
      return result.isValid ? undefined : result.validationError
    },
    value: () => {
      const result = getValidationResult(getState())
      if (result.isValid) {
        return result.value
      } else {
        throw new Error('Form is invalid')
      }
    }
  }
}

export interface UseBoolean {
  update: (fn: (value: boolean) => boolean) => void
  set: (value: boolean) => void
  toggle: () => void
  on: () => void
  off: () => void
}

export function useBoolean(initialState: boolean): [boolean, UseBoolean] {
  const { state, update, set } = useForm(boolean(), () => initialState, {})
  const toggle = useCallback(() => update((v) => !v), [update])
  const on = useCallback(() => set(true), [set])
  const off = useCallback(() => set(false), [set])
  return [
    state,
    useMemo(
      () => ({ update, set, toggle, on, off }),
      [off, on, set, toggle, update]
    )
  ]
}
