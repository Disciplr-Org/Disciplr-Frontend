import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Text } from "../components/Text";
import { Field } from "../components/Field";
import {
  exceedsBalance,
  hasCreateVaultErrors,
  validateCreateVault,
} from "../utils/vaultValidation";
import { EvidenceUpload } from "../components/EvidenceUpload";
import { CreateVaultReview } from "../components/CreateVaultReview";
import { Modal } from "../components/Modal";
import {
  AmountDeadlineSection,
  DestinationsSection,
  MilestonesSection,
  VerifierSection,
} from "../components/CreateVaultSections";
import { useCreateVaultForm } from "../hooks/useCreateVaultForm";
import { logger } from "../utils/logger";
import { useWallet } from "../context/WalletContext";
import {
  computeFutureDeadline,
  getPresetDays,
  getPresetLabel,
} from "../utils/deadlinePresets";
import { toUtcIso } from "../utils/format";
import {
  createVault,
  CreateIntegrityError,
  findRecentVaultByCreator,
} from "../services/vaultService";
import { ApiError, classifyCreateError, isApiEnabled } from "../services/api";
import { normalizeEvidenceUrl } from "../utils/url";
import { isNetworkMismatch, APP_EXPECTED_NETWORK } from "../utils/networkMismatch";
import { isValidStellarAddress } from "../utils/stellarAddress";
import { useToastStore } from "../Zustand/toastStore";
import type { Vault } from "../types/vault";
import { clearDraft } from "../utils/createVaultDraft";
import {
  deleteUserTemplate,
  loadAllTemplates,
  MAX_USER_TEMPLATES,
  renameUserTemplate,
  saveUserTemplate,
  type VaultTemplate,
} from "../utils/vaultTemplates";

export default function CreateVault() {
  const navigate = useNavigate();
  const { balance, balanceStatus, network } = useWallet();
  const [submissionUncertain, setSubmissionUncertain] = useState(false);
  const {
    address,
    prefill,
    name,
    setName,
    amount,
    setAmount,
    deadline,
    setDeadline,
    selectedPreset,
    setSelectedPreset,
    successAddress,
    setSuccessAddress,
    failureAddress,
    setFailureAddress,
    verifierAddress,
    setVerifierAddress,
    milestones,
    setMilestones,
    errors,
    setErrors,
    evidenceUrl,
    setEvidenceUrl,
    showReview,
    setShowReview,
    draftOffer,
    restoreDraft: handleRestoreDraft,
    discardDraft: handleDiscardDraft,
    nameRef,
    amountRef,
    deadlineRef,
    successAddressRef,
    failureAddressRef,
    verifierAddressRef,
    milestoneTitleRefs,
    milestoneCriteriaRefs,
    updateMilestone,
    addMilestone,
    removeMilestone,
    moveMilestone,
    submit: handleSubmit,
  } = useCreateVaultForm(submissionUncertain);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [validationMessages, setValidationMessages] = useState<string[]>([]);
  const [reconciliationState, setReconciliationState] = useState<
    "checking" | "not-found" | "failed" | "ambiguous" | "disconnected" | null
  >(null);
  const [matchingVaults, setMatchingVaults] = useState<Vault[]>([]);
  const [integrityError, setIntegrityError] = useState<CreateIntegrityError | null>(null);
  const [templates, setTemplates] = useState<VaultTemplate[]>([]);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateNameInput, setTemplateNameInput] = useState("");
  const [renamingTemplateId, setRenamingTemplateId] = useState<string | null>(null);
  const [renameTemplateInput, setRenameTemplateInput] = useState("");
  const addressRef = useRef(address);
  const reconciliationControllerRef = useRef<AbortController | null>(null);
  const uncertainCreateRef = useRef<{
    creator: string;
    name: string;
    amount: number;
    since: number;
  } | null>(null);
  addressRef.current = address;

  useEffect(() => {
    if (!address) reconciliationControllerRef.current?.abort();
    return () => reconciliationControllerRef.current?.abort();
  }, [address]);

  const handleApplyTemplate = (template: VaultTemplate) => {
    const preset = template.deadlinePreset ?? null;
    setAmount(template.amount);
    setDeadline(preset ? computeFutureDeadline(getPresetDays(preset)) : "");
    setSelectedPreset(preset);
    setSuccessAddress(template.successAddress);
    setFailureAddress(template.failureAddress);
    setVerifierAddress(template.verifierAddress);
    setMilestones(
      template.milestones.map((milestone, index) => ({
        id: `milestone-${Date.now()}-${index}`,
        title: milestone.title,
        criteria: milestone.criteria,
      })),
    );
    setErrors(
      validateCreateVault(
        {
          name,
          amount: template.amount,
          deadline: preset ? computeFutureDeadline(getPresetDays(preset)) : "",
          successAddress: template.successAddress,
          failureAddress: template.failureAddress,
          verifierAddress: template.verifierAddress,
          milestones: template.milestones,
        },
        new Date(),
        address,
      ),
    );
    setShowTemplatesModal(false);
  };

  const handleSaveTemplate = (event: React.FormEvent) => {
    event.preventDefault();
    const result = saveUserTemplate(address, templateNameInput, {
      amount,
      deadlinePreset: selectedPreset,
      successAddress,
      failureAddress,
      verifierAddress,
      milestones: milestones.map(({ title, criteria }) => ({ title, criteria })),
    });
    if (!result.ok) {
      setTemplateError(result.error);
      return;
    }
    setTemplates(loadAllTemplates(address));
    setTemplateNameInput("");
    setTemplateError(null);
    setShowSaveTemplateModal(false);
  };

  const handleRenameTemplate = (templateId: string) => {
    const result = renameUserTemplate(address, templateId, renameTemplateInput);
    if (!result.ok) {
      setTemplateError(result.error);
      return;
    }
    setTemplates(loadAllTemplates(address));
    setRenamingTemplateId(null);
    setRenameTemplateInput("");
    setTemplateError(null);
  };

  const handleDeleteTemplate = (templateId: string) => {
    const result = deleteUserTemplate(address, templateId);
    if (!result.ok) {
      setTemplateError(result.error);
      return;
    }
    setTemplates(loadAllTemplates(address));
  };

  const errorFieldOrder: Array<
    "name" | "amount" | "deadline" | "successAddress" | "failureAddress" | "verifierAddress"
  > = ["name", "amount", "deadline", "successAddress", "failureAddress", "verifierAddress"];

  const errorEntries = errorFieldOrder.flatMap((field) =>
    errors[field] ? [{ key: field, message: errors[field] as string }] : [],
  );
  const milestoneErrorEntries = [
    ...(errors.milestones?.form
      ? [{ key: "milestones-form", message: errors.milestones.form }]
      : []),
    ...(errors.milestones?.rows ?? []).flatMap((row, rowIndex) =>
      row
        ? Object.values(row).map((message, errorIndex) => ({
            key: `milestone-${rowIndex}-${errorIndex}`,
            message,
          }))
        : [],
    ),
  ];
  const allErrorEntries = [...errorEntries, ...milestoneErrorEntries];

  const reconcileCreate = async (pendingCreate: {
    creator: string;
    name: string;
    amount: number;
    since: number;
  }) => {
    reconciliationControllerRef.current?.abort();
    const controller = new AbortController();
    reconciliationControllerRef.current = controller;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setReconciliationState("checking");
    setMatchingVaults([]);
    setSubmitError("Checking whether your vault was created...");

    try {
      for (let attempt = 0; attempt < 2; attempt += 1) {
        if (addressRef.current !== pendingCreate.creator) {
          setReconciliationState("disconnected");
          setSubmitError("Your wallet disconnected. Reconnect it, then check again.");
          return;
        }

        const matches = await findRecentVaultByCreator({
          ...pendingCreate,
          signal: controller.signal,
        });

        if (controller.signal.aborted || addressRef.current !== pendingCreate.creator) {
          setReconciliationState("disconnected");
          setSubmitError("Your wallet disconnected. Reconnect it, then check again.");
          return;
        }
        if (matches.length === 1) {
          useToastStore.getState().push({
            message: "Your vault was created.",
            variant: "success",
          });
          setSubmissionUncertain(false);
          // The vault exists, so this wallet's draft is done with.
          clearDraft(pendingCreate.creator);
          navigate(`/vaults/${matches[0].id}`);
          return;
        }
        if (matches.length > 1) {
          setMatchingVaults(matches);
          setReconciliationState("ambiguous");
          setSubmitError(
            "More than one matching vault was found. Choose the vault you created before taking any further action.",
          );
          return;
        }

        if (attempt === 0) {
          await new Promise<void>((resolve, reject) => {
            if (controller.signal.aborted) {
              reject(new DOMException("Reconciliation aborted.", "AbortError"));
              return;
            }
            const timer = window.setTimeout(() => {
              controller.signal.removeEventListener("abort", onAbort);
              resolve();
            }, 250);
            const onAbort = () => {
              window.clearTimeout(timer);
              reject(new DOMException("Reconciliation aborted.", "AbortError"));
            };
            controller.signal.addEventListener("abort", onAbort, { once: true });
          });
        }
      }

      setSubmissionUncertain(false);
      setReconciliationState("not-found");
      setSubmitError("No matching vault was found. You can safely try again.");
    } catch {
      const disconnected =
        controller.signal.aborted || addressRef.current !== pendingCreate.creator;
      logger.error("Vault creation reconciliation failed");
      setReconciliationState(disconnected ? "disconnected" : "failed");
      setSubmitError(
        disconnected
          ? "Your wallet disconnected. Reconnect it, then check again."
          : "We couldn't check whether your vault was created. Check again before retrying.",
      );
    } finally {
      if (reconciliationControllerRef.current === controller) {
        reconciliationControllerRef.current = null;
      }
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleConfirm = async () => {
    if (isSubmittingRef.current || submissionUncertain) return;

    if (!address || !isValidStellarAddress(address)) {
      setSubmitError("Wallet account unavailable. Please reconnect your wallet.");
      return;
    }

    if (!network || isNetworkMismatch(network)) {
      setSubmitError(`Wallet network unavailable or incorrect. Please switch to ${APP_EXPECTED_NETWORK}.`);
      return;
    }

    const nextErrors = validateCreateVault({
      name,
      amount,
      deadline,
      successAddress,
      failureAddress,
      verifierAddress,
      milestones,
    }, new Date(), address);
    if (hasCreateVaultErrors(nextErrors)) {
      setErrors(nextErrors);
      setShowReview(false);
      return;
    }

    if (balanceStatus === 'success' && exceedsBalance(amount, balance)) {
      setSubmitError("Amount exceeds your available USDC balance.");
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setSubmitError(null);
    setValidationMessages([]);
    setReconciliationState(null);
    setMatchingVaults([]);

    const normalizedEvidence = evidenceUrl
      ? normalizeEvidenceUrl(evidenceUrl) ?? undefined
      : undefined;
    const apiEnabled = isApiEnabled();
    const pendingCreate = {
      creator: address,
      name: name.trim(),
      amount: Number(amount),
      since: Date.now(),
    };

    try {
      const newVault = await createVault({
        name: name.trim(),
        amount: Number(amount),
        currency: "USDC",
        deadline: toUtcIso(deadline),
        creatorAddress: address,
        verifierAddress: verifierAddress.trim(),
        successAddress,
        failureAddress,
        milestones: milestones.map(({ title, criteria }, index) => ({
          title,
          description: criteria,
          criteria,
          ...(index === 0 && !apiEnabled && normalizedEvidence
            ? { evidenceUrl: normalizedEvidence }
            : {}),
        })),
      });
      
      if (!newVault || !newVault.id) {
        throw new Error("Malformed response from server.");
      }

      // The vault exists, so this wallet's draft is done with. An unknown
      // outcome (below) keeps it: the user may need to retry after checking.
      clearDraft(address);
      isSubmittingRef.current = false;
      setIsSubmitting(false);
      navigate(`/vaults/${newVault.id}`);
    } catch (err) {
      if (err instanceof CreateIntegrityError) {
        // Post-creation integrity check failed: do not navigate silently.
        // Don't log full addresses in the integrity error.
        logger.error("Vault creation integrity mismatch detected");
        setIntegrityError(err);
        isSubmittingRef.current = false;
        setIsSubmitting(false);
        return;
      }

      if (
        err instanceof ApiError &&
        classifyCreateError(err) === "rejected"
      ) {
        const apiError = err;
        logger.warn("Vault creation was rejected by the API");
        setValidationMessages(
          [apiError.serverError, ...apiError.details].filter(
            (message): message is string => Boolean(message),
          ),
        );
        setSubmitError(
          apiError.details.length > 0 ? null : apiError.serverError ?? "Vault creation was rejected.",
        );
        setSubmissionUncertain(false);
        setReconciliationState(null);
        isSubmittingRef.current = false;
        setIsSubmitting(false);
        return;
      }

      logger.error("Vault creation outcome unknown");
      uncertainCreateRef.current = pendingCreate;
      setSubmissionUncertain(true);
      setReconciliationState("checking");
      await reconcileCreate(pendingCreate);
    }
  };

  const handleBackToEdit = () => {
    setShowReview(false);
    setSubmitError(null);
    setValidationMessages([]);
  };

  const handleCheckAgain = () => {
    if (
      !address ||
      address !== uncertainCreateRef.current?.creator ||
      !uncertainCreateRef.current ||
      isSubmittingRef.current
    ) return;
    void reconcileCreate(uncertainCreateRef.current);
  };

  return (
    <div>
      <Text role="display" as="h1" style={{ marginBottom: "0.5rem" }}>
        Create Vault
      </Text>
      <Text
        role="body"
        as="p"
        style={{ color: "var(--muted)", marginBottom: "2rem" }}
      >
        Lock USDC with a deadline and milestone. Funds release on validation or
        redirect on failure.
      </Text>

      {integrityError ? (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            maxWidth: 540,
            padding: "1.25rem",
            border: "1px solid var(--danger)",
            borderRadius: "var(--radius)",
            background: "color-mix(in srgb, var(--danger) 8%, var(--surface))",
            marginBottom: "1.5rem",
          }}
        >
          <Text role="display" as="h2" style={{ color: "var(--danger)" }}>
            Vault Verification Warning
          </Text>
          <Text role="body" as="p">
            The vault was created on the server, but one or more stored values differ from what you confirmed. Please review the vault details below:
          </Text>
          <ul
            style={{
              margin: 0,
              paddingLeft: "1.25rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            {Object.entries(integrityError.mismatches).map(([field, diff]) => (
              <li key={field} style={{ wordBreak: "break-all" }}>
                <strong>{field}:</strong> expected <code>{diff?.expected}</code>, but server stored <code>{diff?.actual}</code>
              </li>
            ))}
          </ul>
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
            <Link
              to={`/vaults/${integrityError.vault.id}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--accent)",
                color: "var(--bg)",
                padding: "0.6rem 1.25rem",
                borderRadius: "var(--radius)",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Review Vault
            </Link>
            <Link
              to="/vaults"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
                color: "var(--text)",
                border: "1px solid var(--border)",
                padding: "0.6rem 1.25rem",
                borderRadius: "var(--radius)",
                textDecoration: "none",
              }}
            >
              All Vaults
            </Link>
          </div>
        </div>
      ) : showReview ? (
        <CreateVaultReview
          name={name.trim()}
          amount={amount}
          deadline={deadline}
          successAddress={successAddress}
          failureAddress={failureAddress}
          verifierAddress={verifierAddress.trim()}
          milestones={milestones}
          isSubmitting={isSubmitting}
          submissionUncertain={submissionUncertain}
          error={submitError}
          validationMessages={validationMessages}
          reconciliationState={reconciliationState}
          matchingVaults={matchingVaults}
          canCheckAgain={Boolean(address && address === uncertainCreateRef.current?.creator)}
          onBack={handleBackToEdit}
          onConfirm={handleConfirm}
          onCheckAgain={handleCheckAgain}
        />
      ) : (

        <>
          {allErrorEntries.length > 0 && (
            <div
              role="alert"
              aria-live="assertive"
              style={{
                border: "1px solid var(--danger)",
                borderRadius: "var(--radius)",
                padding: "0.75rem",
                background:
                  "color-mix(in srgb, var(--danger) 10%, var(--surface))",
                marginBottom: "1rem",
                maxWidth: 400,
              }}
            >
              <Text
                role="caption"
                as="p"
                style={{ color: "var(--danger)", marginBottom: "0.5rem" }}
              >
                Please fix the highlighted fields before creating the vault.
              </Text>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: "1.25rem",
                  color: "var(--danger)",
                }}
              >
                {allErrorEntries.map(({ key, message }, index) => (
                  <li key={`${key}-${index}`}>{message}</li>
                ))}
              </ul>
            </div>
          )}

          {prefill && (
            <div
              role="status"
              style={{
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                padding: "0.75rem",
                background: "var(--surface)",
                marginBottom: "1rem",
                maxWidth: 400,
              }}
            >
              <Text role="caption" as="p" style={{ margin: 0 }}>
                Duplicating {prefill.sourceVaultName ?? "an existing vault"}.
                Amount and destination addresses are prefilled; choose a fresh
                deadline for this new vault.
              </Text>
            </div>
          )}

          {draftOffer && (
            <div
              role="status"
              data-testid="create-vault-draft-banner"
              style={{
                border: "1px solid var(--accent)",
                borderRadius: "var(--radius)",
                padding: "0.75rem",
                background: "var(--surface)",
                marginBottom: "1rem",
                maxWidth: 400,
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              <Text role="caption" as="p" style={{ margin: 0 }}>
                Restore draft from{" "}
                {new Date(draftOffer.savedAt).toLocaleString()}?
              </Text>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={handleRestoreDraft}
                  style={{
                    padding: "0.5rem 1rem",
                    border: "none",
                    borderRadius: "var(--radius)",
                    background: "var(--accent)",
                    color: "var(--bg)",
                    fontWeight: 600,
                    cursor: "pointer",
                    minHeight: "44px",
                  }}
                >
                  <Text role="caption" as="span">
                    Restore
                  </Text>
                </button>
                <button
                  type="button"
                  onClick={handleDiscardDraft}
                  style={{
                    padding: "0.5rem 1rem",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                    background: "transparent",
                    color: "var(--text)",
                    cursor: "pointer",
                    minHeight: "44px",
                  }}
                >
                  <Text role="caption" as="span">
                    Discard
                  </Text>
                </button>
              </div>
            </div>
          )}

          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              flexWrap: "wrap",
              marginBottom: "1rem",
              maxWidth: 400,
            }}
          >
            <button
              type="button"
              onClick={() => {
                setTemplates(loadAllTemplates(address));
                setTemplateError(null);
                setRenamingTemplateId(null);
                setShowTemplatesModal(true);
              }}
              style={{
                padding: "0.5rem 0.875rem",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                background: "var(--surface)",
                color: "var(--text)",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              Templates
            </button>
            <button
              type="button"
              onClick={() => {
                setTemplateNameInput("");
                setTemplateError(null);
                setShowSaveTemplateModal(true);
              }}
              style={{
                padding: "0.5rem 0.875rem",
                border: "1px solid var(--accent)",
                borderRadius: "var(--radius)",
                background: "transparent",
                color: "var(--accent)",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              Save as template
            </button>
          </div>

          <Modal
            isOpen={showTemplatesModal}
            onClose={() => {
              setShowTemplatesModal(false);
              setRenamingTemplateId(null);
              setTemplateError(null);
            }}
            ariaLabelledBy="vault-templates-modal-title"
          >
            <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
                <Text role="display" as="h2" id="vault-templates-modal-title" style={{ margin: 0, fontSize: "1.15rem" }}>
                  Vault Templates
                </Text>
                <button
                  type="button"
                  onClick={() => {
                    setShowTemplatesModal(false);
                    setRenamingTemplateId(null);
                    setTemplateError(null);
                  }}
                  aria-label="Close templates"
                  style={{
                    padding: "0.25rem 0.6rem",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                    background: "transparent",
                    color: "var(--text)",
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </div>

              {templateError && (
                <div
                  role="alert"
                  style={{
                    border: "1px solid var(--danger)",
                    borderRadius: "var(--radius)",
                    padding: "0.6rem 0.75rem",
                    color: "var(--danger)",
                    fontSize: "0.875rem",
                  }}
                >
                  {templateError}
                </div>
              )}

              {(() => {
                const userTemplates = templates.filter((t) => !t.builtIn);
                const builtInTemplates = templates.filter((t) => t.builtIn);
                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxHeight: "60vh", overflowY: "auto" }}>
                    <section>
                      <Text role="caption" as="h3" style={{ margin: "0 0 0.5rem", color: "var(--muted)" }}>
                        Saved templates ({userTemplates.length} / {MAX_USER_TEMPLATES})
                      </Text>
                      {userTemplates.length === 0 ? (
                        <Text role="caption" as="p" style={{ margin: 0, color: "var(--muted)" }}>
                          No saved templates yet. Use &ldquo;Save as template&rdquo; to store your current configuration.
                        </Text>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          {userTemplates.map((template) => (
                            <div
                              key={template.id}
                              style={{
                                border: "1px solid var(--border)",
                                borderRadius: "var(--radius)",
                                padding: "0.75rem",
                                display: "flex",
                                flexDirection: "column",
                                gap: "0.5rem",
                              }}
                            >
                              {renamingTemplateId === template.id ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                  <Field
                                    id={`rename-template-${template.id}`}
                                    label="New template name"
                                    type="text"
                                    value={renameTemplateInput}
                                    onChange={(e) => setRenameTemplateInput(e.target.value)}
                                    maxLength={80}
                                  />
                                  <div style={{ display: "flex", gap: "0.5rem" }}>
                                    <button
                                      type="button"
                                      onClick={() => handleRenameTemplate(template.id)}
                                      style={{
                                        padding: "0.35rem 0.75rem",
                                        border: "none",
                                        borderRadius: "var(--radius)",
                                        background: "var(--accent)",
                                        color: "var(--bg)",
                                        cursor: "pointer",
                                        fontWeight: 600,
                                      }}
                                    >
                                      Save name
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setRenamingTemplateId(null);
                                        setRenameTemplateInput("");
                                      }}
                                      style={{
                                        padding: "0.35rem 0.75rem",
                                        border: "1px solid var(--border)",
                                        borderRadius: "var(--radius)",
                                        background: "transparent",
                                        color: "var(--text)",
                                        cursor: "pointer",
                                      }}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div>
                                    <Text role="body" as="p" style={{ margin: 0, fontWeight: 600 }}>
                                      {template.name}
                                    </Text>
                                    <Text role="caption" as="p" style={{ margin: 0, color: "var(--muted)" }}>
                                      {template.amount ? `${template.amount} USDC` : "No amount"}
                                      {template.deadlinePreset ? ` · ${getPresetLabel(template.deadlinePreset)}` : ""}
                                      {` · ${template.milestones.length} milestone${template.milestones.length === 1 ? "" : "s"}`}
                                    </Text>
                                  </div>
                                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                                    <button
                                      type="button"
                                      onClick={() => handleApplyTemplate(template)}
                                      style={{
                                        padding: "0.35rem 0.75rem",
                                        border: "none",
                                        borderRadius: "var(--radius)",
                                        background: "var(--accent)",
                                        color: "var(--bg)",
                                        cursor: "pointer",
                                        fontWeight: 600,
                                      }}
                                    >
                                      Apply
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setRenamingTemplateId(template.id);
                                        setRenameTemplateInput(template.name);
                                        setTemplateError(null);
                                      }}
                                      style={{
                                        padding: "0.35rem 0.75rem",
                                        border: "1px solid var(--border)",
                                        borderRadius: "var(--radius)",
                                        background: "transparent",
                                        color: "var(--text)",
                                        cursor: "pointer",
                                      }}
                                    >
                                      Rename
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteTemplate(template.id)}
                                      style={{
                                        padding: "0.35rem 0.75rem",
                                        border: "1px solid var(--danger)",
                                        borderRadius: "var(--radius)",
                                        background: "transparent",
                                        color: "var(--danger)",
                                        cursor: "pointer",
                                      }}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </section>

                    <section>
                      <Text role="caption" as="h3" style={{ margin: "0 0 0.5rem", color: "var(--muted)" }}>
                        Built-in starters (read-only)
                      </Text>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {builtInTemplates.map((template) => (
                          <div
                            key={template.id}
                            style={{
                              border: "1px solid var(--border)",
                              borderRadius: "var(--radius)",
                              padding: "0.75rem",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: "0.75rem",
                            }}
                          >
                            <div>
                              <Text role="body" as="p" style={{ margin: 0, fontWeight: 600 }}>
                                {template.name}
                              </Text>
                              <Text role="caption" as="p" style={{ margin: 0, color: "var(--muted)" }}>
                                {template.amount} USDC
                                {template.deadlinePreset ? ` · ${getPresetLabel(template.deadlinePreset)}` : ""}
                                {` · ${template.milestones.length} milestones`}
                              </Text>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleApplyTemplate(template)}
                              style={{
                                padding: "0.35rem 0.75rem",
                                border: "none",
                                borderRadius: "var(--radius)",
                                background: "var(--accent)",
                                color: "var(--bg)",
                                cursor: "pointer",
                                fontWeight: 600,
                              }}
                            >
                              Apply
                            </button>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                );
              })()}
            </div>
          </Modal>

          <Modal
            isOpen={showSaveTemplateModal}
            onClose={() => {
              setShowSaveTemplateModal(false);
              setTemplateError(null);
            }}
            ariaLabelledBy="save-vault-template-modal-title"
          >
            <form
              onSubmit={handleSaveTemplate}
              style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <Text role="display" as="h2" id="save-vault-template-modal-title" style={{ margin: 0, fontSize: "1.15rem" }}>
                Save as Template
              </Text>
              <Text role="caption" as="p" style={{ margin: 0, color: "var(--muted)" }}>
                Saves amount, deadline preset, destination addresses, verifier, and milestones for reuse. Vault name and exact deadline are not saved.
              </Text>

              {templateError && (
                <div
                  role="alert"
                  style={{
                    border: "1px solid var(--danger)",
                    borderRadius: "var(--radius)",
                    padding: "0.6rem 0.75rem",
                    color: "var(--danger)",
                    fontSize: "0.875rem",
                  }}
                >
                  {templateError}
                </div>
              )}

              <Field
                id="vault-template-name"
                label="Template name"
                type="text"
                value={templateNameInput}
                onChange={(e) => {
                  setTemplateNameInput(e.target.value);
                  setTemplateError(null);
                }}
                placeholder="Weekly dev retainer"
                maxLength={80}
                required
              />

              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowSaveTemplateModal(false);
                    setTemplateError(null);
                  }}
                  style={{
                    padding: "0.5rem 0.875rem",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                    background: "transparent",
                    color: "var(--text)",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "0.5rem 1rem",
                    border: "none",
                    borderRadius: "var(--radius)",
                    background: "var(--accent)",
                    color: "var(--bg)",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Save template
                </button>
              </div>
            </form>
          </Modal>

          <form
            onSubmit={handleSubmit}
            noValidate
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
              maxWidth: 400,
            }}
          >
            <Field
              ref={nameRef}
              id="create-vault-name"
              label="Vault name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrors((current) => ({ ...current, name: undefined }));
              }}
              placeholder="Website redesign"
              maxLength={80}
              error={errors.name}
              required
            />
            <AmountDeadlineSection
              amount={amount}
              amountError={errors.amount}
              amountRef={amountRef}
              balance={balance}
              amountExceedsBalance={balanceStatus === "success" && exceedsBalance(amount, balance)}
              deadline={deadline}
              deadlineError={errors.deadline}
              deadlineRef={deadlineRef}
              selectedPreset={selectedPreset}
              onAmountChange={(value) => {
                setAmount(value);
                setErrors((current) => ({ ...current, amount: undefined }));
              }}
              onDeadlineChange={(value) => {
                setDeadline(value);
                setSelectedPreset(null);
                setErrors((current) => ({ ...current, deadline: undefined }));
              }}
              onPresetSelect={(preset) => {
                setDeadline(computeFutureDeadline(getPresetDays(preset)));
                setSelectedPreset(preset);
                setErrors((current) => ({ ...current, deadline: undefined }));
              }}
            />
            <DestinationsSection
              successAddress={successAddress}
              failureAddress={failureAddress}
              successAddressRef={successAddressRef}
              failureAddressRef={failureAddressRef}
              errors={errors}
              onSuccessAddressChange={(value) => {
                setSuccessAddress(value);
                setErrors((current) => ({ ...current, successAddress: undefined }));
              }}
              onFailureAddressChange={(value) => {
                setFailureAddress(value);
                setErrors((current) => ({ ...current, failureAddress: undefined }));
              }}
            />
            <VerifierSection
              verifierAddress={verifierAddress}
              verifierAddressRef={verifierAddressRef}
              error={errors.verifierAddress}
              onChange={(value) => {
                setVerifierAddress(value);
                setErrors((current) => ({ ...current, verifierAddress: undefined }));
              }}
            />
            <MilestonesSection
              milestones={milestones}
              errors={errors.milestones}
              titleRefs={milestoneTitleRefs}
              criteriaRefs={milestoneCriteriaRefs}
              onUpdate={updateMilestone}
              onMove={moveMilestone}
              onRemove={removeMilestone}
              onAdd={addMilestone}
            />
            <EvidenceUpload value={evidenceUrl ?? ""} onChange={setEvidenceUrl} />
            {isApiEnabled() && (
              <Text
                role="caption"
                as="p"
                data-testid="evidence-api-note"
                style={{ color: "var(--muted)", margin: 0 }}
              >
                Evidence links aren't saved by the API yet
              </Text>
            )}
            <button
              type="submit"
              style={{
                background: "var(--accent)",
                color: "var(--bg)",
                padding: "0.75rem 1.5rem",
                borderRadius: "var(--radius)",
                border: "none",
                fontWeight: 600,
                cursor: "pointer",
                marginTop: "0.5rem",
                minHeight: "44px",
                minWidth: "44px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text role="caption" as="span">
                Create Vault
              </Text>
            </button>
          </form>
        </>
      )}
    </div>
  );
}
