// @ts-check

// Eventually will be importable from '@agoric/zoe-contract-support'
import {
  swap,
  assertIssuerKeywords,
  assertProposalKeywords,
} from '../contractSupport';

import '../../exported';

/**
 * In a covered call, a digital asset's owner sells a call option. A
 * call option is the right to buy the digital asset at a
 * pre-determined price, called the strike price. The call option has
 * an expiry date, when the contract will be cancelled.
 *
 * In this contract, the expiry date is the deadline when the offer
 * escrowing the underlying assets is cancelled. Therefore, the
 * proposal for the underlying assets must have an exit record with
 * the key "afterDeadline".
 *
 * The invitation received by the covered call creator is the call
 * option. It has this additional information in the invitation's
 * value: { expirationDate, timerAuthority, underlyingAsset,
 * strikePrice }
 *
 * The initial proposal should be:
 * {
 *   give: { UnderlyingAsset: assetAmount }, want: { StrikePrice:
 *   priceAmount  }, exit: { afterDeadline: { deadline: time, timer:
 *   timer } },
 * }
 * The result of the initial offer is a seat where the payout will
 * eventually resolve to the strikePrice, and the offerResult is an
 * assayable invitation to buy the underlying asset. Since the
 * contract provides assurance that the underlying asset is available
 * on the specified terms, the invitation itself can be traded as a
 * valuable good.
 *
 * @type {ContractStartFn}
 */
const start = (zcf, _terms) => {
  assertIssuerKeywords(zcf, harden(['UnderlyingAsset', 'StrikePrice']));

  const makeCallOption = sellerSeat => {
    const { want, give, exit } = sellerSeat.getProposal();
    const rejectMsg = `The covered call option is expired.`;

    const exerciseOption = exerciserSeat => {
      return swap(zcf, sellerSeat, exerciserSeat, rejectMsg);
    };

    const exerciseOptionExpected = harden({
      give: { StrikePrice: null },
      want: { UnderlyingAsset: null },
    });

    return zcf.makeInvitation(
      assertProposalKeywords(exerciseOption, exerciseOptionExpected),
      'exerciseOption',
      harden({
        expirationDate: exit.afterDeadline.deadline,
        timerAuthority: exit.afterDeadline.timer,
        underlyingAsset: give.UnderlyingAsset,
        strikePrice: want.StrikePrice,
      }),
    );
  };

  const makeCallOptionExpected = harden({
    give: { UnderlyingAsset: null },
    want: { StrikePrice: null },
    exit: { afterDeadline: null },
  });

  const creatorInvitation = zcf.makeInvitation(
    assertProposalKeywords(makeCallOption, makeCallOptionExpected),
    'makeCallOption',
  );

  return harden({ creatorInvitation });
};

harden(start);
export { start };
