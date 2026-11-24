import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useWallet } from "../context/WalletContext";
import {
  hasCreateVaultErrors,
  validateCreateVault,
  type CreateVaultErrors,
  type CreateVaultMilestoneInput,
} from "../utils/vaultValidation";
import { getCreateVaultPrefill } from "../utils/vaultPrefill";
import {
  clearDraft,
  createVaultDraft,
  readDraft,
  writeDraft,
  type CreateVaultDraft,
} from "../utils/createVaultDraft";
import { registerNavigationGuard } from "../utils/navigationGuard";
import type { MilestoneFormRow } from "../components/CreateVaultSections";

const DRAFT_WRITE_DELAY_MS = 500;

function createMilestoneRow(index: number): MilestoneFormRow {
  return {
    id: `milestone-${Date.now()}-${index}`,
    title: index === 0 ? "Milestone 1" : "",
    criteria: index === 0 ? "Default milestone criteria" : "",
  };
}

export function useCreateVaultForm(submissionUncertain = false) {
  const location = useLocation();
  const prefill = getCreateVaultPrefill(location.state);
  const { address } = useWallet();
  const nameRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const deadlineRef = useRef<HTMLInputElement>(null);
  const successAddressRef = useRef<HTMLInputElement>(null);
  const failureAddressRef = useRef<HTMLInputElement>(null);
  const verifierAddressRef = useRef<HTMLInputElement>(null);
  const milestoneTitleRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const milestoneCriteriaRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [name, setName] = useState(prefill?.name ?? "");
  const [amount, setAmount] = useState(prefill?.amount ?? "");
  const [deadline, setDeadline] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<import("../utils/deadlinePresets").DeadlinePreset | null>(null);
  const [successAddress, setSuccessAddress] = useState(prefill?.successAddress ?? "");
  const [failureAddress, setFailureAddress] = useState(prefill?.failureAddress ?? "");
  const [verifierAddress, setVerifierAddress] = useState(prefill?.verifierAddress ?? "");
  const [milestones, setMilestones] = useState<MilestoneFormRow[]>(() => {
    if (prefill?.milestones?.length) {
      return prefill.milestones.map((milestone, index) => ({
        id: `milestone-${Date.now()}-${index}`,
        title: milestone.title,
        criteria: milestone.criteria,
      }));
    }
    return [createMilestoneRow(0)];
  });
  const [errors, setErrors] = useState<CreateVaultErrors>({});
  const [evidenceUrl, setEvidenceUrl] = useState<string | undefined>();
  const [showReview, setShowReview] = useState(false);
  const [draftOffer, setDraftOffer] = useState<CreateVaultDraft | null>(null);
  const draftResolvedRef = useRef(false);

  const baselineMilestones: CreateVaultMilestoneInput[] =
    prefill?.milestones?.length
      ? prefill.milestones
      : [{ title: "Milestone 1", criteria: "Default milestone criteria" }];
  const isDirty =
    name !== (prefill?.name ?? "") ||
    verifierAddress !== (prefill?.verifierAddress ?? "") ||
    amount !== (prefill?.amount ?? "") ||
    deadline !== "" ||
    successAddress !== (prefill?.successAddress ?? "") ||
    failureAddress !== (prefill?.failureAddress ?? "") ||
    evidenceUrl !== undefined ||
    milestones.length !== baselineMilestones.length ||
    milestones.some(
      (milestone, index) =>
        milestone.title !== baselineMilestones[index].title ||
        milestone.criteria !== baselineMilestones[index].criteria,
    );
  const hasUnsavedChanges = isDirty && !submissionUncertain;

  useEffect(() => {
    if (draftResolvedRef.current) return;
    if (prefill) {
      draftResolvedRef.current = true;
      return;
    }
    if (!address) return;
    draftResolvedRef.current = true;
    setDraftOffer(readDraft(address));
  }, [address, prefill]);

  useEffect(() => {
    if (!address || !hasUnsavedChanges) return;
    const timeoutId = window.setTimeout(() => {
      writeDraft(
        address,
        createVaultDraft({
          name,
          verifierAddress,
          amount,
          deadline,
          successAddress,
          failureAddress,
          milestones: milestones.map(({ title, criteria }) => ({ title, criteria })),
          evidenceUrl,
        }),
      );
    }, DRAFT_WRITE_DELAY_MS);
    return () => window.clearTimeout(timeoutId);
  }, [
    address,
    hasUnsavedChanges,
    name,
    verifierAddress,
    amount,
    deadline,
    successAddress,
    failureAddress,
    milestones,
    evidenceUrl,
  ]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
      return "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    return registerNavigationGuard();
  }, [hasUnsavedChanges]);

  const restoreDraft = () => {
    if (!draftOffer) return;
    const restored = draftOffer;
    const restoredName = restored.name ?? name;
    const restoredVerifier = restored.verifierAddress ?? verifierAddress;
    setName(restoredName);
    setVerifierAddress(restoredVerifier);
    setAmount(restored.amount);
    setDeadline(restored.deadline);
    setSuccessAddress(restored.successAddress);
    setFailureAddress(restored.failureAddress);
    setMilestones(
      restored.milestones.map((milestone, index) => ({
        id: `milestone-${Date.now()}-${index}`,
        title: milestone.title,
        criteria: milestone.criteria,
      })),
    );
    setEvidenceUrl(restored.evidenceUrl);
    setErrors(
      validateCreateVault(
        {
          name: restoredName,
          verifierAddress: restoredVerifier,
          amount: restored.amount,
          deadline: restored.deadline,
          successAddress: restored.successAddress,
          failureAddress: restored.failureAddress,
          milestones: restored.milestones,
        },
        new Date(),
        address,
      ),
    );
    setDraftOffer(null);
  };

  const discardDraft = () => {
    clearDraft(address);
    setDraftOffer(null);
  };

  const errorFieldOrder = [
    "name",
    "amount",
    "deadline",
    "successAddress",
    "failureAddress",
    "verifierAddress",
  ] as const;
  const fieldRefs = {
    name: nameRef,
    amount: amountRef,
    deadline: deadlineRef,
    successAddress: successAddressRef,
    failureAddress: failureAddressRef,
    verifierAddress: verifierAddressRef,
  };

  const clearMilestoneErrors = () => {
    setErrors((current) => ({ ...current, milestones: undefined }));
  };

  const updateMilestone = (
    id: string,
    field: keyof CreateVaultMilestoneInput,
    value: string,
  ) => {
    setMilestones((current) =>
      current.map((milestone) =>
        milestone.id === id ? { ...milestone, [field]: value } : milestone,
      ),
    );
    clearMilestoneErrors();
  };

  const addMilestone = () => {
    setMilestones((current) => [...current, createMilestoneRow(current.length)]);
    clearMilestoneErrors();
  };

  const removeMilestone = (id: string) => {
    setMilestones((current) => current.filter((milestone) => milestone.id !== id));
    clearMilestoneErrors();
  };

  const moveMilestone = (id: string, direction: "up" | "down") => {
    setMilestones((current) => {
      const index = current.findIndex((milestone) => milestone.id === id);
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (index < 0 || targetIndex < 0 || targetIndex >= current.length) return current;
      const next = [...current];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
    clearMilestoneErrors();
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors = validateCreateVault(
      {
        name,
        amount,
        deadline,
        successAddress,
        failureAddress,
        verifierAddress,
        milestones,
      },
      new Date(),
      address,
    );
    setErrors(nextErrors);
    if (hasCreateVaultErrors(nextErrors)) {
      const invalidField = errorFieldOrder.find((field) => nextErrors[field]);
      if (invalidField) {
        fieldRefs[invalidField].current?.focus();
      } else {
        const rowIndex = nextErrors.milestones?.rows?.findIndex(Boolean) ?? -1;
        const milestone = milestones[rowIndex];
        const rowErrors = nextErrors.milestones?.rows?.[rowIndex];
        if (rowErrors?.title) milestoneTitleRefs.current[milestone?.id ?? ""]?.focus();
        else if (rowErrors?.criteria) milestoneCriteriaRefs.current[milestone?.id ?? ""]?.focus();
      }
      return;
    }
    setShowReview(true);
  };

  return {
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
    restoreDraft,
    discardDraft,
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
    submit,
  };
}
