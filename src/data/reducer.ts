import type { CheckState, ChecklistAction } from "./types";

/**
 * Pure reducer for the checklist checkbox state.
 *
 * Actions:
 * - TOGGLE_TASK: Flip the completion boolean for a task in a day.
 * - HYDRATE: Replace entire state with a persisted snapshot.
 * - RESET_ALL: Clear all completions.
 */
export function checklistReducer(
  state: CheckState,
  action: ChecklistAction,
): CheckState {
  switch (action.type) {
    case "TOGGLE_TASK": {
      const { day, taskId } = action;
      const dayState = state[day] ?? {};
      return {
        ...state,
        [day]: {
          ...dayState,
          [taskId]: !dayState[taskId],
        },
      };
    }

    case "HYDRATE": {
      return action.state;
    }

    case "RESET_ALL": {
      return {};
    }

    default:
      return state;
  }
}
