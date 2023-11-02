export const accountLinked = (account_id) => {
  return {
    type: 'ACCOUNT_LINKED',
    payload: account_id,
  };
};

export const accountBidded = (bidded) => {
  return {
    type: 'ACCOUNT_BIDDED',
    payload: bidded,
  };
};
