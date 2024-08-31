// This hook detects changes to the user's wallet, and updates the state accordingly,
// avoiding any conflicts with existing state if the user changes wallet
import {useAppStore} from "@/app/providers";
import {useWallet} from "@solana/wallet-adapter-react";
import {deriveStateAddress} from "@/lib/util";
import {StateAddress} from "@/lib/constants";
import {useEffect} from "react";

export const useStateNormaliser = () => {
  const wallet = useWallet();
  const [adminMode, solanaStateAddress, setSolanaStateAddress] = useAppStore(state => ([
    state.adminMode,
    state.solanaStateAddress,
    state.setSolanaStateAddress
  ]));
  const currentWalletAddress = wallet?.publicKey;
  const derivedSolanaState = currentWalletAddress ? deriveStateAddress(currentWalletAddress) : undefined;

  // detect if the user's wallet derives the solana state address
  const userStateSelected = derivedSolanaState?.toBase58() === solanaStateAddress;

  // detect if the selected solana state is one of the admin states
  const adminStateSelected = !!solanaStateAddress && Object.values(StateAddress).includes(solanaStateAddress);

  // if the user's wallet is connected,
  // an admin state is not selected,
  // and the user's wallet does not derive the state address,
  // reset the state address to the derived state address
  useEffect(() => {
    if (currentWalletAddress && !adminMode && !userStateSelected) {
      console.log("Resetting state address", {
        currentWalletAddress: currentWalletAddress.toBase58(),
        adminMode,
        adminStateSelected,
        userStateSelected,
        solanaStateAddress,
        derivedSolanaState: derivedSolanaState?.toBase58()
      });
      setSolanaStateAddress(derivedSolanaState?.toBase58());
    }
  }, [userStateSelected, adminStateSelected]);



}