import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Toast from "../../components/Toast.jsx";

describe("Toast Component (Component Tests)", () => {
  it("renders the message and success icon by default", () => {
    render(<Toast message="Job saved successfully!" type="success" />);

    expect(screen.getByText("Job saved successfully!")).toBeInTheDocument();
    expect(screen.getByText("✓")).toBeInTheDocument();
  });

  it("renders error state correctly", () => {
    render(<Toast message="Failed to upload CV" type="error" />);

    expect(screen.getByText("Failed to upload CV")).toBeInTheDocument();
    expect(screen.getByText("✕")).toBeInTheDocument();
  });

  it("calls onClose when the close button is clicked", () => {
    const handleClose = vi.fn();
    render(
      <Toast
        message="Notification with close button"
        onClose={handleClose}
      />
    );

    const closeButton = screen.getByRole("button", { name: "×" });
    fireEvent.click(closeButton);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
