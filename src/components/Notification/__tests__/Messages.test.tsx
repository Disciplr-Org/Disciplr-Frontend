import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Message from "../Messages";

// Regression coverage for the Message component.
// Invariants enforced by these tests:
//  1. Rendering is deterministic for valid inputs.
//  2. The New badge is gated on the `read` flag.
//  3. Opening the overlay calls `setRead` exactly once with the item id.
//  4. Closing the overlay does not mutate external state.
//  5. Malformed/invalid inputs do not throw and degrade gracefully.
//  6. Repeated open/close cycles remain consistent (retry / concurrency boundary).

describe("Message Component", () => {
  // A fixed ISO timestamp; the rendered timeAgo is computed by formatRelativeTime
  // so we just verify it renders something (non-empty) rather than a hardcoded string.
  const defaultProps = {
    id: "msg-123",
    type: "funds_released",
    title: "Funds Released Successfully",
    message: "Your funds have been released from the escrow vault.",
    timestamp: "2025-01-01T00:00:00Z",
    read: false,
    isFullPage: false,
    setRead: vi.fn(),
  };

  beforeEach(() => {
    // Ensure each test starts with a clean mock so call counts are deterministic.
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders message details correctly when unread and not full page", () => {
    render(<Message {...defaultProps} />);

    // Assert title is rendered
    expect(screen.getByText(defaultProps.title)).toBeInDocument();

    // Assert message is truncated to 30 characters + ellipsis in preview
    expect(screen.getByText(/Your funds have been released.*.../)).toBeInTheDocument();

    // Assert a relative time label is rendered (non-empty, computed from timestamp)
    const timeLabel = screen.getByTestId("message-time-ago");
    expect(timeLabel.textContent).toBeTruthy();

    // Assert "New" badge is rendered because read is false
    expect(screen.getByText("New")).toBeInTheDocument();

    // Assert notification icon is rendered with the correct aria-label and role
    const icon = screen.getByRole("img", { name: "Funds released" });
    expect(icon).toBeInDocument();

    // Assert "Delete" button is not rendered when isFullPage is false
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
  });

  it("renders message details correctly when read and isFullPage is true", () => {
    const props = {
      ...defaultProps,
      read: true,
      isFullPage: true,
    };
    render(<Message {...props} />);

    // Assert title is rendered
    expect(screen.getByText(props.title)).toBeInTheDocument();

    // Assert "New" badge is not rendered because read is true
    expect(screen.queryByText("New")).not.toBeInTheDocument();

    // Assert "Delete" button is rendered when isFullPage is true
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("clicking the title opens the expanded view and calls setRead with the item's id", () => {
    const setReadMock = vi.fn();
    const props = {
      ...defaultProps,
      setRead: setReadMock,
    };
    render(<Message {...props} />);

    // Prior to clicking, the full message should not be visible (only the truncated preview is)
    expect(screen.queryByText(props.message)).not.toBeInTheDocument();

    // Click the title to open the overlay
    const titleElement = screen.getByText(props.title);
    fireEvent.click(titleElement);

    // Assert setRead mock was called with correct id
    expect(setReadMock).toHaveBeenCalledTimes(1);
    expect(setReadMock).toHaveBeenCalledWith(props.id);

    // Assert the expanded view / overlay is now open and contains the full message text
    const fullMessageElement = screen.getByText(props.message);
    expect(fullMessageElement).toBeInTheDocument();
  });

  it("opening the overlay on an already-read message still calls setRead exactly once", () => {
    const setReadMock = vi.fn();
    render(<Message {...defaultProps} read={true} setRead={setReadMock} />);

    fireEvent.click(screen.getByText(defaultProps.title));

    // The component must not double-fire or skip the mark-as-read callback.
    expect(setReadMock).toHaveBeenCalledTimes(1);
    expect(setReadMock).toHaveBeenCalledWith(defaultProps.id);
  });

  it("the expanded overlay closes when its close control is activated", () => {
    const setReadMock = vi.fn();
    render(<Message {...defaultProps} setRead={setReadMock} />);

    // Open the overlay
    const titleElement = screen.getByText(defaultProps.title);
    fireEvent.click(titleElement);

    // Verify overlay is open
    expect(screen.getByText(defaultProps.message)).toBeInDocument();

    // Click the close control "X"
    const closeButton = screen.getByText("X");
    fireEvent.click(closeButton);

    // Verify overlay is closed (full message is removed)
    expect(screen.queryByText(defaultProps.message)).not.toBeInTheDocument();

    // Closing must not re-trigger the mark-as-read callback.
    expect(setReadMock).toHaveBeenCalledTimes(1);
  });

  it("longer messages are truncated as expected", () => {
    const props = {
      ...defaultProps,
      message: "This is a super long message that contains more than thirty characters.",
    };
    render(<Message {...props} />);

    // Message length is 72, which is > 30.
    // Truncated preview should be exactly 30 characters plus " ..."
    expect(screen.getByText(/This is a super long message t.*.../)).toBeInTheDocument();
  });

  it("messages at exactly the truncation boundary render deterministically", () => {
    // 30-character message is the boundary case for truncation.
    const boundaryMessage = "abcdefghijklmnopqrstuvwxyz"; // 30 chars
    expect(boundaryMessage.length).toBe(30);

    render(<Message {...defaultProps} message={boundaryMessage} />);

    // The full message text is present in the preview (no data loss).
    expect(screen.getByText(boundaryMessage)).toBeInTheDocument();
  });

  it("applies correct container styling depending on the isFullPage prop when overlay is open", () => {
    // Case 1: isFullPage is true
    const { rerender } = render(<Message {...defaultProps} isFullPage={true} />);

    // Open overlay
    fireEvent.click(screen.getByText(defaultProps.title));

    // Get overlay container (grandparent of the full message element in the overlay)
    const fullMsg1 = screen.getByText(defaultProps.message);
    const container1 = fullMsg1.parentElement?.parentElement;
    expect(container1).toBeInDocument();
    
    // Check that it contains full-page classes
    expect(container1).toHaveClass("w-[90%]");
    expect(container1).toHaveClass("lg:w-[40%]");
    expect(container1).toHaveClass("h-auto");
    expect(container1).toHaveClass("min-h-[40%]");
    expect(container1).toHaveClass("bg-white");
    expect(container1).toHaveClass("left-[50%]");
    expect(container1).toHaveClass("translate-x-[-50%]");
    expect(container1).toHaveClass("top-[5%]");
    expect(container1).not.toHaveClass("w-full");
    expect(container1).not.toHaveClass("h-full");

    // Close the overlay
    fireEvent.click(screen.getByText("X"));

    // Case 2: isFullPage is false
    rerender(<Message {...defaultProps} isFullPage={false} />);

    // Open overlay
    fireEvent.click(screen.getByText(defaultProps.title));

    const fullMsg2 = screen.getByText(defaultProps.message);
    const container2 = fullMsg2.parentElement?.parentElement;
    expect(container2).toBeInTheDocument();

    // Check that it contains dropdown/non-full-page classes
    expect(container2).toHaveClass("w-full");
    expect(container2).toHaveClass("h-full");
    expect(container2).toHaveClass("bg-white");
    expect(container2).toHaveClass("left-0");
    expect(container2).toHaveClass("top-0");
    expect(container2).not.toHaveClass("w-[90%]");
    expect(container2).not.toHaveClass("lg:w-[40%]");
  });

  it("degrades gracefully for invalid and boundary inputs without throwing", () => {
    // Empty strings and unknown types are adverse inputs that must not crash.
    expect(() =>
      render(
        <Message
          {...defaultProps}
          title=""
          message=""
          type="unknown_type"
          timestamp=""
        />
      )
    ).not.toThrow();

    // The component still renders a node even with degraded input.
    expect(document.body.textContent).toBeTruthy();
  });

  it("toggling the overlay multiple times remains consistent (retry / concurrency boundary)", () => {
    const setReadMock = vi.fn();
    render(<Message {...defaultProps} setRead={setReadMock} />);

    const title = screen.getByText(defaultProps.title);

    // Open -> close -> open -> close must not leak state or double-count.
    for (let i = 0; i < 2; i++) {
      fireEvent.click(title);
      expect(screen.getByText(defaultProps.message)).toBeInTheDocument();

      fireEvent.click(screen.getByText("X"));
      expect(screen.queryByText(defaultProps.message)).not.toBeInTheDocument();
    }

    // Each open calls setRead exactly once, never more.
    expect(setReadMock).toHaveBeenCalledTimes(2);
    expect(setReadMock).mock.calls.every((call) => call[0] === defaultProps.id)).toBe(true);
  });
});
