export const initialState = { habits: [], logs: {}, theme: 'system', lastDeleted: null }

const newId = () => (globalThis.crypto?.randomUUID ? crypto.randomUUID() : `h-${Date.now()}-${Math.random().toString(16).slice(2)}`)

export function reducer(state, action) {
  switch (action.type) {
    case 'ADD_HABIT':
      return { ...state, habits: [...state.habits, { id: newId(), createdAt: action.today, ...action.payload }] }
    case 'UPDATE_HABIT':
      return { ...state, habits: state.habits.map((h) => (h.id === action.id ? { ...h, ...action.payload } : h)) }
    case 'DELETE_HABIT': {
      const habit = state.habits.find((h) => h.id === action.id)
      if (!habit) return state
      const { [action.id]: removedLog, ...logs } = state.logs
      return { ...state, habits: state.habits.filter((h) => h.id !== action.id), logs, lastDeleted: { habit, log: removedLog || {} } }
    }
    case 'UNDO_DELETE': {
      if (!state.lastDeleted) return state
      const { habit, log } = state.lastDeleted
      return { ...state, habits: [...state.habits, habit], logs: { ...state.logs, [habit.id]: log }, lastDeleted: null }
    }
    case 'CLEAR_UNDO':
      return { ...state, lastDeleted: null }
    case 'TOGGLE': {
      const cur = { ...(state.logs[action.id] || {}) }
      if (cur[action.date]) delete cur[action.date]
      else cur[action.date] = true
      return { ...state, logs: { ...state.logs, [action.id]: cur } }
    }
    case 'LOAD': // örnek veri veya içe aktarma (değiştir)
      return { ...state, habits: action.habits, logs: action.logs, lastDeleted: null }
    case 'MERGE': { // içe aktarma (ekle): aynı adlı alışkanlıkların kayıtları birleşir
      const habits = [...state.habits]
      const logs = { ...state.logs }
      for (const h of action.habits) {
        const same = habits.find((x) => x.name.toLowerCase() === h.name.toLowerCase())
        const id = same ? same.id : h.id
        if (!same) habits.push(h)
        logs[id] = { ...(logs[id] || {}), ...(action.logs[h.id] || {}) }
      }
      return { ...state, habits, logs }
    }
    case 'RESET':
      return { ...initialState, theme: state.theme }
    case 'SET_THEME':
      return { ...state, theme: action.theme }
    default:
      return state
  }
}
