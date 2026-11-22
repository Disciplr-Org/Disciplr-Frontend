import { useParams } from "react-router-dom";
import { useWallet } from "../context/WalletContext";
import { useVaultDetail } from "../hooks/useVaultDetail";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useOnRecovered } from "../hooks/useOnRecovered";
import {
  ErrorView,
  InvalidIdView,
  LoadingView,
  MalformedView,
  NotFoundView,
} from "../components/vault/VaultStateViews";
import { VaultDetailContent } from "../components/vault/VaultDetailContent";

export default function VaultDetail() {
  const { id } = useParams<{ id: string }>();
  const { view, retry } = useVaultDetail(id);
  const { address, network } = useWallet();
  // Page title is "<vault name> · Disciplr" (see useDocumentTitle).
  useDocumentTitle(view.status === "ready" ? view.vault.name : "");

  useOnRecovered(retry);

  switch (view.status) {
    case "loading":
      return <LoadingView />;
    case "invalid-id":
      return <InvalidIdView id={view.id} />;
    case "not-found":
      return <NotFoundView id={view.id} />;
    case "malformed":
      return <MalformedView issues={view.issues} onRetry={retry} />;
    case "error":
      return <ErrorView id={view.id} onRetry={retry} />;
    case "ready":
      return (
        <VaultDetailContent
          vault={view.vault}
          walletAddress={address}
          walletNetwork={network}
          onChanged={retry}
        />
      );
  }
}
