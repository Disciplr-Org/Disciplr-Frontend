import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  MAX_MILESTONES_RENDERED,
  Milestone,
  MilestoneTracker,
} from "../../components/MilestoneTracker";

const milestones: Milestone[] = [
  {
    id: "m1",
    title: "Phase 1 Complete",
    description: "Complete initial development phase",
    criteria: "All unit tests passing, code reviewed",
    status: "validated",
    validatedAt: "2024-02-20T14:30:00Z",
    evidenceUrl: "https://github.com/org/repo/pull/42",
  },
  {
    id: "m2",
    title: "Beta Launch",
    description: "Launch beta version to 100 users",
    criteria: "Beta deployed, 100 active users onboarded",
    status: "pending",
  },
  {
    id: "m3",
    title: "Production Audit",
    description: "Security audit before production release",
    criteria: "Critical findings resolved",
    status: "failed",
  },
];

describe("MilestoneTracker", () => {
  it("renders milestone titles, criteria, and status badges in order", () => {
    render(<MilestoneTracker milestones={milestones} />);

    const listItems = screen.getAllByRole("listitem");
    expect(listItems).toHaveLength(3);
    expect(screen.getByText("Phase 1 Complete")).toBeInTheDocument();
    expect(
      screen.getByText(/All unit tests passing, code reviewed/),
    ).toBeInTheDocument();
    expect(screen.getByText("Validated")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("Failed")).toBeInTheDocument();
  });

  it("marks the first pending milestone as the current step", () => {
    render(<MilestoneTracker milestones={milestones} />);

    const currentStep = screen.getByText("Beta Launch").closest("li");
    const validatedStep = screen.getByText("Phase 1 Complete").closest("li");

    expect(currentStep).toHaveAttribute("aria-current", "step");
    expect(validatedStep).not.toHaveAttribute("aria-current");
  });

  it("renders evidence links and formatted validation timestamps", () => {
    render(<MilestoneTracker milestones={milestones} />);

    expect(screen.getByText(/Validated Feb 20, 2024/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View evidence" })).toHaveAttribute(
      "href",
      "https://github.com/org/repo/pull/42",
    );
  });

  it("handles a single pending milestone", () => {
    render(<MilestoneTracker milestones={[milestones[1]]} />);

    const currentStep = screen.getByText("Beta Launch").closest("li");
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(currentStep).toHaveAttribute("aria-current", "step");
  });

  it("handles an empty milestone list", () => {
    render(<MilestoneTracker milestones={[]} />);

    expect(
      screen.getByText("No milestones have been defined for this vault."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("renders the empty message with aria-live polite and correct class", () => {
    render(<MilestoneTracker milestones={[]} />);

    const emptyMessage = screen.getByText(
      "No milestones have been defined for this vault.",
    );
    expect(emptyMessage).toHaveAttribute("aria-live", "polite");
    expect(emptyMessage).toHaveClass("milestone-tracker-empty");
  });

  it("assigns the correct CSS class per milestone status", () => {
    render(<MilestoneTracker milestones={milestones} />);

    const steps = screen.getAllByRole("listitem");
    expect(steps[0]).toHaveClass("is-validated");
    expect(steps[1]).toHaveClass("is-pending");
    expect(steps[2]).toHaveClass("is-failed");
  });

  it("shows formatted validatedAt only for milestones that have it", () => {
    render(<MilestoneTracker milestones={milestones} />);

    const validatedTexts = screen.getAllByText(/Validated Feb 20, 2024/);
    expect(validatedTexts).toHaveLength(1);

    const pendingStep = screen.getByText("Beta Launch").closest("li")!;
    expect(
      pendingStep.querySelector(".milestone-tracker-validated-at"),
    ).toBeNull();

    const failedStep = screen.getByText("Production Audit").closest("li")!;
    expect(
      failedStep.querySelector(".milestone-tracker-validated-at"),
    ).toBeNull();
  });

  it("renders evidence link only for milestones that have evidenceUrl", () => {
    render(<MilestoneTracker milestones={milestones} />);

    const evidenceLinks = screen.getAllByRole("link", {
      name: "View evidence",
    });
    expect(evidenceLinks).toHaveLength(1);
    expect(evidenceLinks[0]).toHaveAttribute(
      "href",
      "https://github.com/org/repo/pull/42",
    );

    const pendingStep = screen.getByText("Beta Launch").closest("li")!;
    expect(pendingStep.querySelector("a")).toBeNull();

    const failedStep = screen.getByText("Production Audit").closest("li")!;
    expect(failedStep.querySelector("a")).toBeNull();
  });

  it("renders '[Invalid Link]' text for unsafe evidenceUrl (javascript: scheme)", () => {
    const unsafeMilestones: Milestone[] = [
      {
        id: "m1",
        title: "Unsafe JS",
        description: "Test milestone",
        criteria: "Test",
        status: "validated",
        validatedAt: "2024-02-20T14:30:00Z",
        evidenceUrl: "javascript:alert('xss')",
      },
    ];

    render(<MilestoneTracker milestones={unsafeMilestones} />);

    expect(screen.getByText("[Invalid Link]")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "View evidence" })).not.toBeInTheDocument();
  });

  it("renders '[Invalid Link]' text for unsafe evidenceUrl (data: scheme)", () => {
    const unsafeMilestones: Milestone[] = [
      {
        id: "m1",
        title: "Unsafe Data",
        description: "Test milestone",
        criteria: "Test",
        status: "validated",
        validatedAt: "2024-02-20T14:30:00Z",
        evidenceUrl: "data:text/html,<script>alert('xss')</script>",
      },
    ];

    render(<MilestoneTracker milestones={unsafeMilestones} />);

    expect(screen.getByText("[Invalid Link]")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "View evidence" })).not.toBeInTheDocument();
  });

  it("renders '[Invalid Link]' text for URLs with embedded credentials", () => {
    const unsafeMilestones: Milestone[] = [
      {
        id: "m1",
        title: "Credential Leak",
        description: "Test milestone",
        criteria: "Test",
        status: "validated",
        validatedAt: "2024-02-20T14:30:00Z",
        evidenceUrl: "https://user:pass@example.com/evidence",
      },
    ];

    render(<MilestoneTracker milestones={unsafeMilestones} />);

    expect(screen.getByText("[Invalid Link]")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "View evidence" })).not.toBeInTheDocument();
  });

  it("renders working link for safe HTTPS URLs", () => {
    const safeMilestones: Milestone[] = [
      {
        id: "m1",
        title: "Safe Evidence",
        description: "Test milestone",
        criteria: "Test",
        status: "validated",
        validatedAt: "2024-02-20T14:30:00Z",
        evidenceUrl: "https://github.com/example/repo/pull/123",
      },
    ];

    render(<MilestoneTracker milestones={safeMilestones} />);

    const link = screen.getByRole("link", { name: "View evidence" });
    expect(link).toHaveAttribute("href", "https://github.com/example/repo/pull/123");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders working link for safe HTTP URLs", () => {
    const safeMilestones: Milestone[] = [
      {
        id: "m1",
        title: "Safe HTTP",
        description: "Test milestone",
        criteria: "Test",
        status: "validated",
        validatedAt: "2024-02-20T14:30:00Z",
        evidenceUrl: "http://example.com/evidence",
      },
    ];

    render(<MilestoneTracker milestones={safeMilestones} />);

    const link = screen.getByRole("link", { name: "View evidence" });
    expect(link).toHaveAttribute("href", "http://example.com/evidence");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("caps the number of milestones rendered and shows a truncation notice", () => {
    const manyMilestones: Milestone[] = Array.from(
      { length: MAX_MILESTONES_RENDERED + 5 },
      (_, i) => ({
        id: `m${i}`,
        title: `Milestone ${i}`,
        description: "Description",
        criteria: "Criteria",
        status: "pending" as const,
      }),
    );

    render(<MilestoneTracker milestones={manyMilestones} />);

    const listItems = screen.getAllByRole("listitem");
    // MAX_MILESTONES_RENDERED rendered + 1 truncation notice
    expect(listItems).toHaveLength(MAX_MILESTONES_RENDERED + 1);
    expect(
      screen.getByText(/5 additional milestone\(s\) not shown\./),
    ).toBeInTheDocument();
  });

  it("truncates over-long title, description, and criteria text", () => {
    const longMilestones: Milestone[] = [
      {
        id: "m1",
        title: "T".repeat(300),
        description: "D".repeat(600),
        criteria: "C".repeat(600),
        status: "pending",
      },
    ];

    render(<MilestoneTracker milestones={longMilestones} />);

    // Title truncated to 200 chars with ellipsis
    expect(screen.getByText(/^T{199}\u2026$/)).toBeInTheDocument();
    // Description truncated to 500 chars with ellipsis
    expect(screen.getByText(/^D{499}\u2026$/)).toBeInTheDocument();
    // Criteria truncated to 500 chars with ellipsis
    expect(screen.getByText(/^C{499}\u2026$/)).toBeInTheDocument();
  });

  it("logs a warning when a validated milestone is missing validatedAt", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const invalidMilestones: Milestone[] = [
      {
        id: "m1",
        title: "No Timestamp",
        description: "Test",
        criteria: "Test",
        status: "validated",
      },
    ];

    render(<MilestoneTracker milestones={invalidMilestones} />);

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("[MilestoneTracker] milestone invariant violation"),
      expect.objectContaining({
        milestoneId: "m1",
        violations: expect.arrayContaining(["validated-missing-validatedAt"]),
      }),
    );
    warnSpy.mockRestore();
  });

  it("logs a warning when a pending milestone carries validatedAt", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const invalidMilestones: Milestone[] = [
      {
        id: "m1",
        title: "Unexpected Timestamp",
        description: "Test",
        criteria: "Test",
        status: "pending",
        validatedAt: "2024-02-20T14:30:00Z",
      },
    ];

    render(<MilestoneTracker milestones={invalidMilestones} />);

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("[MilestoneTracker] milestone invariant violation"),
      expect.objectContaining({
        milestoneId: "m1",
        violations: expect.arrayContaining(["non-validated-has-validatedAt"]),
      }),
    );
    warnSpy.mockRestore();
  });
});
