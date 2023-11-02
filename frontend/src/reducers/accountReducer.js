const initialState = {
  account_id: null,
  account_bidded: false,
};

export const accountReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'ACCOUNT_LINKED':
      return {
        ...state,
        account_id: action.payload,
      };
    case 'ACCOUNT_BIDDED':
      return {
        ...state,
        account_bidded: action.payload,
      };
    default:
      return state;
  }
};
