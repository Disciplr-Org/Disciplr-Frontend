import type { RefObject } from "react";
import { Field } from "./Field";
import { Text } from "./Text";
import {
  DEADLINE_PRESETS,
  getPresetLabel,
  type DeadlinePreset,
} from "../utils/deadlinePresets";
import { formatUsdcInput, parseUsdcInput } from "../utils/usdcInput";
import type {
  CreateVaultErrors,
  CreateVaultMilestoneInput,
} from "../utils/vaultValidation";
import "./CreateVaultSections.css";

export interface MilestoneFormRow extends CreateVaultMilestoneInput {
  id: string;
}

interface AmountDeadlineSectionProps {
  amount: string;
  amountError?: string;
  amountRef: RefObject<HTMLInputElement>;
  balance?: string | null;
  amountExceedsBalance: boolean;
  deadline: string;
  deadlineError?: string;
  deadlineRef: RefObject<HTMLInputElement>;
  selectedPreset: DeadlinePreset | null;
  onAmountChange: (value: string) => void;
  onDeadlineChange: (value: string) => void;
  onPresetSelect: (preset: DeadlinePreset) => void;
}

export function AmountDeadlineSection({
  amount,
  amountError,
  amountRef,
  balance,
  amountExceedsBalance,
  deadline,
  deadlineError,
  deadlineRef,
  selectedPreset,
  onAmountChange,
  onDeadlineChange,
  onPresetSelect,
}: AmountDeadlineSectionProps) {
  return (
    <div className="create-vault-section">
      <Field
        ref={amountRef}
        id="create-vault-amount"
        label="Amount (USDC)"
        type="text"
        value={formatUsdcInput(amount)}
        onChange={(event) => onAmountChange(parseUsdcInput(event.target.value))}
        placeholder="1000"
        error={amountError}
        required
      />
      {amountExceedsBalance && (
        <p role="status" className="create-vault-warning">
          Amount exceeds your available USDC balance ({balance}).
        </p>
      )}
      <div className="create-vault-presets">
        {DEADLINE_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            className={`create-vault-preset${selectedPreset === preset ? " is-active" : ""}`}
            onClick={() => onPresetSelect(preset)}
            aria-pressed={selectedPreset === preset}
            style={{ fontWeight: selectedPreset === preset ? 600 : 400 }}
          >
            {getPresetLabel(preset)}
          </button>
        ))}
      </div>
      <Field
        ref={deadlineRef}
        id="create-vault-deadline"
        label="Deadline (ISO date)"
        type="datetime-local"
        value={deadline}
        onChange={(event) => onDeadlineChange(event.target.value)}
        error={deadlineError}
        required
      />
    </div>
  );
}

interface DestinationsSectionProps {
  successAddress: string;
  failureAddress: string;
  successAddressRef: RefObject<HTMLInputElement>;
  failureAddressRef: RefObject<HTMLInputElement>;
  errors: CreateVaultErrors;
  onSuccessAddressChange: (value: string) => void;
  onFailureAddressChange: (value: string) => void;
}

export function DestinationsSection({
  successAddress,
  failureAddress,
  successAddressRef,
  failureAddressRef,
  errors,
  onSuccessAddressChange,
  onFailureAddressChange,
}: DestinationsSectionProps) {
  return (
    <div className="create-vault-section">
      <Field
        ref={successAddressRef}
        id="create-vault-success-address"
        label="Success destination (Stellar address)"
        type="text"
        value={successAddress}
        onChange={(event) => onSuccessAddressChange(event.target.value)}
        placeholder="G..."
        error={errors.successAddress}
        required
      />
      <Field
        ref={failureAddressRef}
        id="create-vault-failure-address"
        label="Failure destination (Stellar address)"
        type="text"
        value={failureAddress}
        onChange={(event) => onFailureAddressChange(event.target.value)}
        placeholder="G..."
        error={errors.failureAddress}
        required
      />
    </div>
  );
}

interface VerifierSectionProps {
  verifierAddress: string;
  verifierAddressRef: RefObject<HTMLInputElement>;
  error?: string;
  onChange: (value: string) => void;
}

export function VerifierSection({
  verifierAddress,
  verifierAddressRef,
  error,
  onChange,
}: VerifierSectionProps) {
  return (
    <div className="create-vault-section">
      <Field
        ref={verifierAddressRef}
        id="create-vault-verifier-address"
        label="Verifier address"
        type="text"
        value={verifierAddress}
        onChange={(event) => onChange(event.target.value)}
        placeholder="G..."
        error={error}
        required
      />
    </div>
  );
}

interface MilestonesSectionProps {
  milestones: MilestoneFormRow[];
  errors: CreateVaultErrors["milestones"];
  titleRefs: React.MutableRefObject<Record<string, HTMLInputElement | null>>;
  criteriaRefs: React.MutableRefObject<Record<string, HTMLInputElement | null>>;
  onUpdate: (id: string, field: keyof CreateVaultMilestoneInput, value: string) => void;
  onMove: (id: string, direction: "up" | "down") => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
}

export function MilestonesSection({
  milestones,
  errors,
  titleRefs,
  criteriaRefs,
  onUpdate,
  onMove,
  onRemove,
  onAdd,
}: MilestonesSectionProps) {
  return (
    <section className="create-vault-milestones" aria-labelledby="create-vault-milestones-heading">
      <div>
        <Text role="body" as="h2" id="create-vault-milestones-heading">
          Milestones
        </Text>
        <Text role="caption" as="p" className="create-vault-muted">
          Add each delivery checkpoint with clear validation criteria.
        </Text>
      </div>
      {errors?.form && (
        <Text role="caption" as="p" id="create-vault-milestones-error" className="create-vault-error">
          {errors.form}
        </Text>
      )}
      <div className="create-vault-milestone-list">
        {milestones.map((milestone, index) => {
          const rowErrors = errors?.rows?.[index];
          const canMoveUp = index > 0;
          const canMoveDown = index < milestones.length - 1;
          return (
            <fieldset key={milestone.id} className="create-vault-milestone">
              <legend>
                <Text role="caption" as="span">Milestone {index + 1}</Text>
              </legend>
              <Field
                ref={(node) => {
                  titleRefs.current[milestone.id] = node;
                }}
                id={`create-vault-milestone-${index}-title`}
                label={`Milestone ${index + 1} title`}
                type="text"
                value={milestone.title}
                onChange={(event) => onUpdate(milestone.id, "title", event.target.value)}
                placeholder="Design approved"
                error={rowErrors?.title}
                required
              />
              <Field
                ref={(node) => {
                  criteriaRefs.current[milestone.id] = node;
                }}
                id={`create-vault-milestone-${index}-criteria`}
                label={`Milestone ${index + 1} criteria`}
                type="text"
                value={milestone.criteria}
                onChange={(event) => onUpdate(milestone.id, "criteria", event.target.value)}
                placeholder="Signed approval from the verifier"
                error={rowErrors?.criteria}
                required
              />
              <div className="create-vault-milestone-actions">
                <button type="button" onClick={() => onMove(milestone.id, "up")} disabled={!canMoveUp}>
                  Move up
                </button>
                <button type="button" onClick={() => onMove(milestone.id, "down")} disabled={!canMoveDown}>
                  Move down
                </button>
                <button type="button" className="create-vault-remove" onClick={() => onRemove(milestone.id)} aria-label={`Remove milestone ${index + 1}`}>
                  Remove
                </button>
              </div>
            </fieldset>
          );
        })}
      </div>
      <button type="button" className="create-vault-add-milestone" onClick={onAdd}>
        Add milestone
      </button>
    </section>
  );
}
