const initialState = {
    account_id: null,
}

export const accountReducer = (state = initialState, action) => {
    switch(action.type) {
        case 'ACCOUNT_LINKED':
            return {
                ...state,
                account_id: action.payload
            }
        default:
            return state
    }
}
