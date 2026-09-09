import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import LiquidButton from "../../components/LiquidButton.jsx";

describe("LiquidButton Component (Component Tests)", () => {
  it("renders with custom children text and handles click", () => {
    const handleClick = vi.fn();
    render(
      <LiquidButton onClick={handleClick}>
        Apply Now
      </LiquidButton>
    );

    const button = screen.getByRole("button", { name: /Apply Now/i });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
