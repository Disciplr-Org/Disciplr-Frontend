import type { WalletNetwork } from "../context/WalletContext";
import { AddressDisplay } from "./AddressDisplay";
import { Text } from "./Text";

export interface VaultMetaPanelProps {
  network: WalletNetwork | null | undefined;
  creatorAddress: string;
  verifierAddress?: string;
  successAddress: string;
  failureAddress: string;
  contractAddress: string;
}

function MetaRow({
  label,
  address,
  network,
}: {
  label: string;
  address: string;
  network: WalletNetwork | null | undefined;
}) {
  return (
    <div
      role="row"
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
        padding: "0.2rem 0",
      }}
    >
      <Text
        role="caption"
        as="span"
        style={{ color: "var(--muted)", minWidth: 160 }}
      >
        {label}
      </Text>
      <AddressDisplay address={address} network={network} />
    </div>
  );
}

export function VaultMetaPanel({
  network,
  creatorAddress,
  verifierAddress,
  successAddress,
  failureAddress,
  contractAddress,
}: VaultMetaPanelProps) {
  return (
    <section aria-label="Vault metadata">
      <Text
        role="caption"
        as="div"
        style={{
          color: "var(--muted)",
          marginBottom: "1rem",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        Addresses
      </Text>

      <div
        style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}
        role="table"
      >
        <MetaRow label="Creator" address={creatorAddress} network={network} />
        {verifierAddress ? (
          <MetaRow
            label="Verifier"
            address={verifierAddress}
            network={network}
          />
        ) : null}
        <MetaRow
          label="Success destination"
          address={successAddress}
          network={network}
        />
        <MetaRow
          label="Failure destination"
          address={failureAddress}
          network={network}
        />
        <MetaRow label="Contract" address={contractAddress} network={network} />
      </div>
    </section>
  );
}
